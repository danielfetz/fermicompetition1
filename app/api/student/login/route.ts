import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'
import { verifyPassword } from '@/lib/password'
import { signStudentToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 })
  const supa = createSupabaseServiceRole()
  const { data: student } = await supa.from('students')
    .select('id, class_id, password_hash, full_name')
    .eq('username', username)
    .maybeSingle()
  if (!student) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await verifyPassword(password, student.password_hash)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = signStudentToken({ studentId: student.id, classId: student.class_id, role: 'student' })
  return NextResponse.json({ token, classId: student.class_id, needsName: !student.full_name })
}

