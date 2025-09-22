import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ')? auth.slice(7): null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  const payload = verifyStudentToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  const { full_name } = await req.json().catch(()=>({}))
  if (!full_name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const supa = createSupabaseServiceRole()
  const { error } = await supa.from('students').update({ full_name }).eq('id', payload.studentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

