export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET() {
  let dbStatus = 'not_configured'

  if (supabase) {
    try {
      const { error } = await supabase.from('competition_dashboard').select('id').limit(1)
      dbStatus = error ? 'error' : 'connected'
    } catch {
      dbStatus = 'error'
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbStatus,
  })
}