import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, competitionId, verificationCode, registrationLink } = await request.json()

    if (!userId || !email || !competitionId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 })
    }

    const { data: existingRegistration } = await supabase
      .from('student_competitions')
      .select('*')
      .eq('student_email', email)
      .eq('competition_id', competitionId)
      .single()

    if (existingRegistration) {
      return NextResponse.json({ success: false, error: 'Already registered' }, { status: 409 })
    }

    const { data: newRegistration, error: insertError } = await supabase
      .from('student_competitions')
      .insert({
        student_id: userId,
        student_email: email,
        student_name: email.split('@')[0],
        competition_id: competitionId,
        competition_name: '',
        registration_link: registrationLink || '',
        verification_status: verificationCode && verificationCode.trim() !== '' ? 'verified' : 'pending',
        verification_method: verificationCode && verificationCode.trim() !== '' ? 'manual_input' : 'manual',
        verified_at: verificationCode && verificationCode.trim() !== '' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Registration insertion error:', insertError)
      return NextResponse.json({ success: false, error: 'Failed to create registration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, registration: newRegistration })
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { registrationId, status, verificationCode, cancellation_reason } = await request.json()

    if (!registrationId) {
      return NextResponse.json({ success: false, error: 'Registration ID required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.verification_status = status
    }

    if (verificationCode !== undefined) {
      if (verificationCode && verificationCode.trim() !== '') {
        updateData.verification_status = 'verified'
        updateData.verification_method = 'manual_input'
        updateData.verified_at = new Date().toISOString()
      }
    }

    if (cancellation_reason !== undefined) {
      updateData.verification_status = 'rejected'
    }

    const { data: updatedRegistration, error: updateError } = await supabase
      .from('student_competitions')
      .update(updateData)
      .eq('id', registrationId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update registration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, registration: updatedRegistration })
  } catch (error) {
    console.error('Registration update API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}