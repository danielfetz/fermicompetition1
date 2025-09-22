import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supa = createSupabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await req.formData()
  const service = createSupabaseServiceRole()
  const { data: cls } = await service.from('classes').select('id, teacher_id').eq('id', params.id).single()
  if (!cls || cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const items: { order: number; prompt: string; correct_value: number | null }[] = []
  for (let i = 1; i <= 10; i++) {
    const prompt = String(form.get(`prompt_${i}`) || '')
    const order = Number(form.get(`order_${i}`) || i)
    const corrVal = form.get(`correct_${i}`)
    const correct_value = corrVal ? Number(corrVal) : null
    items.push({ order, prompt, correct_value })
  }

  // upsert questions by class+order
  for (const it of items) {
    if (!it.prompt) continue
    const { error } = await service.from('questions').upsert({
      class_id: params.id,
      prompt: it.prompt,
      correct_value: it.correct_value,
      order: it.order
    }, { onConflict: 'class_id,order' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.redirect(new URL(`/teacher/class/${params.id}`, req.url))
}

