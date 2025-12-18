import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest, { params }: { params: { studentId: string } }) {
  const supa = createSupabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/teacher/login', req.url))

  const form = await req.formData()
  const class_id = String(form.get('class_id'))

  const service = createSupabaseServiceRole()
  const { data: cls } = await service.from('classes').select('id, teacher_id').eq('id', class_id).single()
  if (!cls || cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Parse form entries - now using class_question_id
  const entries: { class_question_id: string, value: number | null, confidence_pct: number | null }[] = []
  for (const [k, v] of form.entries()) {
    if (k.startsWith('value_')) {
      const cqid = k.slice('value_'.length)
      const val = v ? Number(v) : null
      const conf = Number(form.get(`conf_${cqid}`) || 50)
      entries.push({ class_question_id: cqid, value: val, confidence_pct: conf })
    }
  }

  // Build rows for upsert using class_question_id
  const rows = entries.filter(e => e.value !== null).map(e => ({
    student_id: params.studentId,
    class_question_id: e.class_question_id,
    value: e.value as number,
    confidence_pct: e.confidence_pct as 10|30|50|70|90,
    is_teacher_override: true,
  }))

  // Update full name if provided
  const full_name = String(form.get('full_name') || '')
  if (full_name) {
    const { error: nameErr } = await service.from('students').update({ full_name }).eq('id', params.studentId)
    if (nameErr) return NextResponse.json({ error: nameErr.message }, { status: 400 })
  }

  // Upsert answers using correct conflict key
  if (rows.length > 0) {
    const { error } = await service.from('answers').upsert(rows, { onConflict: 'student_id,class_question_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(new URL(`/teacher/class/${class_id}`, req.url))
}
