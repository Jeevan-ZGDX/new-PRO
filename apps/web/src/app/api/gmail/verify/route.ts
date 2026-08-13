import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { getValidAccessToken } from '@/lib/gmail-tokens'

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me'

async function searchEmails(accessToken: string, query: string, maxResults = 20) {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!response.ok) {
    throw new Error('Failed to search emails')
  }

  return response.json()
}

async function getEmailDetails(accessToken: string, messageId: string) {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!response.ok) {
    throw new Error('Failed to get email details')
  }

  return response.json()
}

function extractEmailContent(payload: any): { text: string; html: string; headers: Record<string, string> } {
  const headers: Record<string, string> = {}
  payload.headers?.forEach((h: any) => {
    headers[h.name.toLowerCase()] = h.value
  })

  let text = ''
  let html = ''

  function extractParts(part: any) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += Buffer.from(part.body.data, 'base64').toString('utf-8')
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html += Buffer.from(part.body.data, 'base64').toString('utf-8')
    } else if (part.parts) {
      part.parts.forEach(extractParts)
    }
  }

  extractParts(payload)

  return { text, html, headers }
}

function isRegistrationConfirmation(email: any, competitionId: string, organizerEmail: string): boolean {
  const { text, html, headers } = email
  const content = `${text} ${html}`.toLowerCase()
  const from = (headers.from || '').toLowerCase()
  const subject = (headers.subject || '').toLowerCase()

  const isFromOrganizer = organizerEmail && from.includes(organizerEmail.toLowerCase())
  const hasConfirmationKeywords = /confirm|registration|registered|participat|thank you for registering|welcome to/.test(content)
  const hasCompetitionRef = competitionId && (content.includes(competitionId) || subject.includes(competitionId))

  return (isFromOrganizer || hasConfirmationKeywords) && (hasCompetitionRef || hasConfirmationKeywords)
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const competitionId = searchParams.get('competitionId')
  const userEmail = searchParams.get('userEmail')

  if (!competitionId || !userEmail) {
    return NextResponse.json({ error: 'Missing competitionId or userEmail' }, { status: 400 })
  }

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { data: competition } = await supabase
      .from('competition_dashboard')
      .select('organizer_email, competition_name')
      .eq('id', competitionId)
      .single()

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    const token = await getValidAccessToken(userEmail)
    const accessToken = token.accessToken
    if (!accessToken) {
      return NextResponse.json({ error: 'No valid Gmail access token' }, { status: 401 })
    }

    const query = `from:${competition.organizer_email} (registration OR confirm OR registered OR participate) newer_than:30d`
    const searchResult = await searchEmails(accessToken, query, 20)

    let verified = false
    let matchedMessageId = ''
    let matchedThreadId = ''

    if (searchResult.messages && searchResult.messages.length > 0) {
      for (const msg of searchResult.messages) {
        const emailDetails = await getEmailDetails(accessToken, msg.id)
        const emailContent = extractEmailContent(emailDetails.payload)

        if (isRegistrationConfirmation(emailContent, competitionId, competition.organizer_email)) {
          verified = true
          matchedMessageId = msg.id
          matchedThreadId = emailDetails.threadId
          break
        }
      }
    }

    if (verified) {
      const { data: studentData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .eq('email', userEmail)
        .single()

      if (studentData) {
        await supabase.from('student_competitions').upsert({
          student_id: studentData.user_id,
          student_email: userEmail,
          student_name: studentData.full_name || userEmail.split('@')[0],
          competition_id: competitionId,
          competition_name: competition.competition_name,
          verification_status: 'verified',
          verification_method: 'gmail_auto',
          gmail_message_id: matchedMessageId,
          gmail_thread_id: matchedThreadId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'student_email,competition_id',
          ignoreDuplicates: false,
        })
      }
    }

    return NextResponse.json({
      verified,
      messageId: matchedMessageId,
      threadId: matchedThreadId,
      competition: competition.competition_name,
    })

  } catch (err) {
    console.error('Gmail verification error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const competitionId = searchParams.get('competitionId')
  const userEmail = searchParams.get('userEmail')

  if (!competitionId || !userEmail) {
    return NextResponse.json({ error: 'Missing competitionId or userEmail' }, { status: 400 })
  }

  try {
    if (!supabase) {
      return NextResponse.json({ verified: false, status: 'pending' })
    }

    const { data: verification } = await supabase
      .from('student_competitions')
      .select('verification_status, verified_at, verification_method')
      .eq('competition_id', competitionId)
      .eq('student_email', userEmail)
      .single()

    return NextResponse.json({
      verified: verification?.verification_status === 'verified',
      status: verification?.verification_status || 'pending',
      verifiedAt: verification?.verified_at,
      method: verification?.verification_method,
    })
  } catch {
    return NextResponse.json({ verified: false, status: 'pending' })
  }
}