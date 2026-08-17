import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const competitionId = params.id
  if (!competitionId) {
    return NextResponse.json({ error: 'Missing competition id' }, { status: 400 })
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.competition_name = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.shortDescription !== undefined) updates.short_description = body.shortDescription
  if (body.category !== undefined) updates.category = body.category
  if (body.scope !== undefined) updates.scope = body.scope
  if (body.mode !== undefined) updates.mode = body.mode
  if (body.organizer !== undefined) updates.organizer = body.organizer
  if (body.organizerEmail !== undefined) updates.organizer_email = body.organizerEmail
  if (body.prizePool !== undefined) updates.total_prize_amount = body.prizePool
  if (body.teamSizeMin !== undefined) updates.team_size_min = body.teamSizeMin
  if (body.teamSizeMax !== undefined) updates.team_size_max = body.teamSizeMax
  if (body.registrationUrl !== undefined) updates.website_url = body.registrationUrl
  else if (body.websiteUrl !== undefined) updates.website_url = body.websiteUrl
  if (body.registrationLink !== undefined) updates.registration_link = body.registrationLink
  if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags)
  if (body.registrationDeadline !== undefined) updates.reg_deadline = body.registrationDeadline || null
  if (body.startDate !== undefined) updates.r1_date = body.startDate || null
  if (body.endDate !== undefined) updates.r2_date = body.endDate || null
  if (body.eligibility !== undefined) {
    updates.eligible_year = ((body.eligibility as Record<string, unknown>)?.yearOfStudy as string[])?.[0] || ''
  }
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('competition_dashboard')
    .update(updates)
    .eq('id', competitionId)

  if (error) {
    console.error('Supabase update competition error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const competitionId = params.id
  if (!competitionId) {
    return NextResponse.json({ error: 'Missing competition id' }, { status: 400 })
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { error } = await supabase
    .from('competition_dashboard')
    .delete()
    .eq('id', competitionId)

  if (error) {
    console.error('Supabase delete competition error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}