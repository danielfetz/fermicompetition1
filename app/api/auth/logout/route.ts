import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  await supabase.auth.signOut()

  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL('/', origin))
}
