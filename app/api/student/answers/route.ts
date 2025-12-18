import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { upsertAnswersSchema } from '@/lib/validators'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  console.log('=== ANSWERS API DEBUG START ===')

  // Try to get token from Authorization header first, then from body (for sendBeacon)
  const auth = req.headers.get('authorization')
  let token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  console.log('Auth header present:', !!auth, 'Token from header:', !!token)

  let body: unknown = null
  let bodyParseError: string | null = null
  try {
    body = await req.json()
    console.log('Body parsed successfully:', JSON.stringify(body, null, 2))
  } catch (e) {
    bodyParseError = e instanceof Error ? e.message : 'Unknown parse error'
    console.error('Body parse error:', bodyParseError)
  }

  // If no token in header, check body (for sendBeacon which can't send headers)
  if (!token && body && typeof body === 'object' && 'token' in body) {
    token = (body as { token?: string }).token || null
    console.log('Token from body:', !!token)
  }

  if (!token) {
    console.log('No token found - returning 401')
    return NextResponse.json({ error: 'Missing token', debug: { authHeader: !!auth, bodyParsed: !!body } }, { status: 401 })
  }

  const payload = verifyStudentToken(token)
  if (!payload) {
    console.log('Token verification failed - returning 401')
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  console.log('Token verified for student:', payload.studentId)

  const parsed = upsertAnswersSchema.safeParse(body)
  if (!parsed.success) {
    console.error('Validation error:', JSON.stringify(parsed.error.errors, null, 2))
    console.error('Body was:', JSON.stringify(body, null, 2))
    return NextResponse.json({
      error: 'Invalid payload',
      details: parsed.error.errors,
      receivedBody: body,
      bodyParseError
    }, { status: 400 })
  }
  console.log('Validation passed, answers count:', parsed.data.answers.length)

  const supa = createSupabaseServiceRole()

  // Map answers - now using class_question_id (the id passed from questions API)
  const rows = parsed.data.answers.map(a => ({
    student_id: payload.studentId,
    class_question_id: a.question_id, // This is actually the class_question ID
    value: a.value,
    confidence_pct: a.confidence_pct
  }))

  // Upsert answers
  const { error } = await supa
    .from('answers')
    .upsert(rows, { onConflict: 'student_id,class_question_id' })

  if (error) {
    console.error('Database error saving answers:', JSON.stringify(error, null, 2))
    console.error('Rows attempted:', JSON.stringify(rows, null, 2))
    return NextResponse.json({ error: error.message, dbError: error, rowsAttempted: rows }, { status: 400 })
  }
  console.log('Answers saved successfully')

  // Only mark exam as complete when explicitly submitting (not auto-save)
  if (parsed.data.submit) {
    await supa
      .from('students')
      .update({ has_completed_exam: true })
      .eq('id', payload.studentId)

    // Also mark the session as submitted
    await supa
      .from('student_exam_sessions')
      .update({ submitted_at: new Date().toISOString() })
      .eq('student_id', payload.studentId)
  }

  console.log('=== ANSWERS API DEBUG END - SUCCESS ===')
  return NextResponse.json({ ok: true, savedCount: rows.length })
}
