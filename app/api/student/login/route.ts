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

  // Find all students with this username (may have entries for both mock and real modes)
  const { data: students } = await supa
    .from('students')
    .select('id, class_id, password_hash, full_name, first_login_at, has_completed_exam, competition_mode')
    .ilike('username', username.toLowerCase().trim())

  if (!students || students.length === 0) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // Try to find a student whose password matches
  let matchedStudent = null
  for (const student of students) {
    const ok = await verifyPassword(password, student.password_hash)
    if (ok) {
      matchedStudent = student
      break
    }
  }

  if (!matchedStudent) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // Update first_login_at if this is the first login
  if (!matchedStudent.first_login_at) {
    await supa
      .from('students')
      .update({ first_login_at: new Date().toISOString() })
      .eq('id', matchedStudent.id)
  }

  // Sign JWT token
  const token = signStudentToken({
    studentId: matchedStudent.id,
    classId: matchedStudent.class_id,
    role: 'student'
  })

  return NextResponse.json({
    token,
    classId: matchedStudent.class_id,
    needsName: !matchedStudent.full_name,
    hasCompleted: matchedStudent.has_completed_exam,
    competitionMode: matchedStudent.competition_mode
  })
}
