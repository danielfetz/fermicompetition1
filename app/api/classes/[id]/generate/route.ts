import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'
import { generateUsername, generateReadablePassword, hashPassword } from '@/lib/password'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { count = 10, prefix = 'student-' } = await req.json().catch(() => ({}))
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceRole()
  const { data: cls, error: cErr } = await service
    .from('classes')
    .select('id, teacher_id, num_students')
    .eq('id', params.id)
    .single()
  if (cErr || !cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  if (cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const credentials: { username: string; password: string }[] = []
  const rows: { class_id: string; username: string; password_hash: string }[] = []

  for (let i = 0; i < count; i++) {
    const username = generateUsername(prefix, i)
    const password = generateReadablePassword(8)
    const password_hash = await hashPassword(password)
    credentials.push({ username, password })
    rows.push({ class_id: cls.id, username, password_hash })
  }

  const { error: insertErr } = await service
    .from('students')
    .insert(rows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })

  return NextResponse.json({ credentials })
}

