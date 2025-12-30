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

  // Verify the class belongs to this teacher
  const { data: cls } = await service.from('classes').select('id, teacher_id').eq('id', class_id).single()
  if (!cls || cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify the student belongs to this class
  const { data: student } = await service.from('students').select('id, class_id').eq('id', params.studentId).single()
  if (!student || student.class_id !== class_id) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Delete all answers for this student first (due to foreign key constraints)
  await service.from('answers').delete().eq('student_id', params.studentId)

  // Delete the student
  const { error } = await service.from('students').delete().eq('id', params.studentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.redirect(new URL(`/teacher/class/${class_id}?mode=${mode}`, req.url))
}
