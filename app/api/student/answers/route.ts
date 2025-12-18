import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { upsertAnswersSchema } from '@/lib/validators'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const payload = verifyStudentToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = upsertAnswersSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

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
  }

  return NextResponse.json({ ok: true })
}
