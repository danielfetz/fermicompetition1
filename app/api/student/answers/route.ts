import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { upsertAnswersSchema } from '@/lib/validators'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  // Try to get token from Authorization header first, then from body (for sendBeacon)
  const auth = req.headers.get('authorization')
  let token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

  const body = await req.json().catch(() => null)

  // If no token in header, check body (for sendBeacon which can't send headers)
  if (!token && body?.token) {
    token = body.token
  }

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const payload = verifyStudentToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const parsed = upsertAnswersSchema.safeParse(body)
  if (!parsed.success) {
    console.error('Validation error:', parsed.error.errors)
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.errors }, { status: 400 })
  }

  const supa = createSupabaseServiceRole()

  // Get the student's competition mode
  const { data: student } = await supa
    .from('students')
    .select('competition_mode')
    .eq('id', payload.studentId)
    .single()

  const competitionMode = student?.competition_mode || 'mock'

  // Check if the exam session has expired
  const { data: session } = await supa
    .from('student_exam_sessions')
    .select('ends_at, submitted_at')
    .eq('student_id', payload.studentId)
    .eq('competition_mode', competitionMode)
    .single()

  if (session) {
    // If already submitted, reject new answers
    if (session.submitted_at) {
      return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 })
    }

    // If deadline has passed, reject new answers (with 1 minute grace period for network latency)
    const deadline = new Date(session.ends_at).getTime()
    const gracePeriod = 60 * 1000 // 1 minute
    if (Date.now() > deadline + gracePeriod) {
      // If this is a final submit request, allow it so student can see results
      // Just don't save any new answers since time has expired
      if (parsed.data.submit) {
        await supa
          .from('students')
          .update({ has_completed_exam: true })
          .eq('id', payload.studentId)

        await supa
          .from('student_exam_sessions')
          .update({ submitted_at: new Date().toISOString() })
          .eq('student_id', payload.studentId)
          .eq('competition_mode', competitionMode)

        return NextResponse.json({ ok: true, timeExpired: true })
      }
      return NextResponse.json({ error: 'Exam time has expired' }, { status: 400 })
    }
  }

  // Separate answers to upsert vs delete (value 0 means delete)
  const toUpsert = parsed.data.answers.filter(a => a.value !== 0)
  const toDelete = parsed.data.answers.filter(a => a.value === 0)

  // Delete answers with value 0
  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(a => a.question_id)
    await supa
      .from('answers')
      .delete()
      .eq('student_id', payload.studentId)
      .in('class_question_id', deleteIds)
  }

  // Map answers - now using class_question_id (the id passed from questions API)
  const rows = toUpsert.map(a => ({
    student_id: payload.studentId,
    class_question_id: a.question_id, // This is actually the class_question ID
    value: a.value,
    confidence_pct: a.confidence_pct,
    competition_mode: competitionMode
  }))

  // Upsert answers (only if there are any)
  let error = null
  if (rows.length > 0) {
    const result = await supa
      .from('answers')
      .upsert(rows, { onConflict: 'student_id,class_question_id,competition_mode' })
    error = result.error
  }

  if (error) {
    console.error('Error saving answers:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

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
      .eq('competition_mode', competitionMode)
  }

  return NextResponse.json({ ok: true })
}
