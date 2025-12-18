import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

// GET: Fetch or create exam session and return deadline + existing answers
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const payload = verifyStudentToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const supa = createSupabaseServiceRole()

  // Check if student has already completed the exam
  const { data: student } = await supa
    .from('students')
    .select('has_completed_exam')
    .eq('id', payload.studentId)
    .single()

  if (student?.has_completed_exam) {
    return NextResponse.json({ error: 'Exam already completed' }, { status: 400 })
  }

  const competitionMode = payload.competitionMode || 'mock'

  // Try to get existing session for this mode
  let { data: session } = await supa
    .from('student_exam_sessions')
    .select('id, started_at, ends_at, submitted_at')
    .eq('student_id', payload.studentId)
    .eq('competition_mode', competitionMode)
    .single()

  // If no session exists, create one
  if (!session) {
    const now = new Date()
    const endsAt = new Date(now.getTime() + 40 * 60 * 1000) // 40 minutes from now

    const { data: newSession, error } = await supa
      .from('student_exam_sessions')
      .insert({
        student_id: payload.studentId,
        class_id: payload.classId,
        competition_mode: competitionMode,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString()
      })
      .select('id, started_at, ends_at, submitted_at')
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: 'Failed to create exam session' }, { status: 500 })
    }
    session = newSession
  }

  // Check if session has already been submitted
  if (session.submitted_at) {
    return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 })
  }

  // Get existing answers for this student and mode
  const { data: answers } = await supa
    .from('answers')
    .select('class_question_id, value, confidence_pct')
    .eq('student_id', payload.studentId)
    .eq('competition_mode', competitionMode)

  // Format answers as a map for easy lookup on client
  const answersMap: Record<string, { value: number; confidence_pct: number }> = {}
  if (answers) {
    for (const a of answers) {
      answersMap[a.class_question_id] = {
        value: a.value,
        confidence_pct: a.confidence_pct
      }
    }
  }

  return NextResponse.json({
    session: {
      id: session.id,
      startedAt: session.started_at,
      endsAt: session.ends_at
    },
    answers: answersMap
  })
}
