import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const ALLOWED_EMAILS = new Set(['hod@citchennai.net', 'admin@citchennai.net'])
const ALLOWED_ROLES = new Set(['hod', 'admin', 'super_admin'])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email: rawEmail, newPassword, confirmPassword } = body

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      )
    }

    const cleanEmail = rawEmail.trim().toLowerCase()

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirm password do not match.' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Database service is not configured on the server.' },
        { status: 500 }
      )
    }

    // 1. Fetch user from Supabase auth to check existence & role
    const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (listErr) {
      console.error('Failed to list users:', listErr.message)
    }

    const existingUser = (usersData?.users || []).find(
      (u) => u.email?.toLowerCase() === cleanEmail
    )

    let userRole = (existingUser?.user_metadata?.role as string) || ''
    let userName = (existingUser?.user_metadata?.name as string) || ''

    if (existingUser && !userRole) {
      try {
        const { data: profile } = await admin
          .from('user_profiles')
          .select('role, full_name')
          .eq('user_id', existingUser.id)
          .single()
        if (profile?.role) {
          userRole = profile.role
          userName = profile.full_name || userName
        }
      } catch {
        // Fall through
      }
    }

    // Determine authorization: strictly HOD or Admin
    const isDirectAllowedEmail = ALLOWED_EMAILS.has(cleanEmail)
    const isAllowedRole =
      isDirectAllowedEmail || (userRole ? ALLOWED_ROLES.has(userRole.toLowerCase()) : false)

    if (!isAllowedRole) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Password reset is only available for HOD and Admin accounts. Please return to the Sign In page.',
          redirectSignIn: true,
        },
        { status: 403 }
      )
    }

    const assignedRole =
      userRole || (cleanEmail === 'hod@citchennai.net' ? 'hod' : 'super_admin')
    const assignedName =
      userName || (cleanEmail === 'hod@citchennai.net' ? 'Head of Department' : 'System Admin')

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        password: newPassword,
        user_metadata: {
          ...existingUser.user_metadata,
          role: assignedRole,
          name: assignedName,
          department: existingUser.user_metadata?.department || 'CSE',
        },
      })

      if (updateErr) {
        return NextResponse.json(
          { success: false, error: `Failed to update password: ${updateErr.message}` },
          { status: 500 }
        )
      }
    } else {
      // If user doesn't exist yet, create them with the new password
      const { data: createData, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          role: assignedRole,
          name: assignedName,
          department: 'CSE',
        },
      })

      if (createErr || !createData.user) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create user account: ${createErr?.message || 'Unknown error'}`,
          },
          { status: 500 }
        )
      }

      userId = createData.user.id
    }

    // 2. Sync to user_profiles table
    try {
      await admin
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            email: cleanEmail,
            full_name: assignedName,
            role: assignedRole,
            department: 'CSE',
          },
          { onConflict: 'user_id' }
        )
    } catch (profileErr) {
      console.warn('user_profiles sync warning:', profileErr)
    }

    // 3. Log audit event
    try {
      await admin.from('audit_logs').insert({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        user: cleanEmail,
        action: 'PASSWORD_RESET',
        resource: 'auth',
        details: `Password reset successfully completed for ${cleanEmail}`,
      })
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated.',
    })
  } catch (err: any) {
    console.error('Error in forgot-password handler:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
