import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { upsertAnswersSchema } from '@/lib/validators'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ')? auth.slice(7): null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  const payload = verifyStudentToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await req.json().catch(()=>null)
  const parsed = upsertAnswersSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const supa = createSupabaseServiceRole()
  const rows = parsed.data.answers.map(a => ({
    class_id: payload.classId,
    student_id: payload.studentId,
    question_id: a.question_id,
    value: a.value,
    confidence_pct: a.confidence_pct
  }))

  const { error } = await supa.from('answers').upsert(rows, { onConflict: 'student_id,question_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

