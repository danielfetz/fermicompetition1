import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'
import { verifyPassword } from '@/lib/password'
import { signStudentToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
  }

  const supa = createSupabaseServiceRole()

  // Find student by username (case insensitive)
  const { data: student } = await supa
    .from('students')
    .select('id, class_id, password_hash, full_name, first_login_at, has_completed_exam')
    .ilike('username', username.toLowerCase().trim())
    .maybeSingle()

  if (!student) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // Verify password
  const ok = await verifyPassword(password, student.password_hash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // Check if student has already completed the exam
  if (student.has_completed_exam) {
    return NextResponse.json({ error: 'You have already completed the challenge' }, { status: 400 })
  }

  // Update first_login_at if this is the first login
  if (!student.first_login_at) {
    await supa
      .from('students')
      .update({ first_login_at: new Date().toISOString() })
      .eq('id', student.id)
  }

  // Sign JWT token
  const token = signStudentToken({
    studentId: student.id,
    classId: student.class_id,
    role: 'student'
  })

  return NextResponse.json({
    token,
    classId: student.class_id,
    needsName: !student.full_name
  })
}
