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

  // Get the student's username and class_id to sync across all modes/years
  const { data: student } = await supa
    .from('students')
    .select('username, class_id')
    .eq('id', payload.studentId)
    .single()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Update full_name for ALL students with the same username in this class
  // (across all school years and competition modes)
  const { error } = await supa
    .from('students')
    .update({ full_name })
    .eq('class_id', student.class_id)
    .eq('username', student.username)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

