import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest, { params }: { params: { studentId: string } }) {
  const supa = createSupabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/teacher/login', req.url))

  const form = await req.formData()
  const class_id = String(form.get('class_id'))
  const mode = String(form.get('mode') || 'mock')

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

  // Update full name - allow clearing (set to null if empty)
  const full_name_raw = form.get('full_name')
  if (full_name_raw !== null) {
    const full_name = String(full_name_raw).trim() || null

    // First get the student's username to sync across all modes/years
    const { data: student } = await service
      .from('students')
      .select('username, class_id')
      .eq('id', params.studentId)
      .single()

    if (student) {
      // Update full_name for ALL students with the same username in this class
      // (across all school years and competition modes)
      const { error: nameErr } = await service
        .from('students')
        .update({ full_name })
        .eq('class_id', student.class_id)
        .eq('username', student.username)

      if (nameErr) return NextResponse.json({ error: nameErr.message }, { status: 400 })
    }
  }

  // Upsert answers using correct conflict key
  if (rows.length > 0) {
    const { error } = await service.from('answers').upsert(rows, { onConflict: 'student_id,class_question_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(new URL(`/teacher/class/${class_id}?mode=${mode}`, req.url))
}
