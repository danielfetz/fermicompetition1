import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'
import { generateStudentCredentials } from '@/lib/password'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { count = 10 } = await req.json().catch(() => ({}))

  // Validate count
  if (count < 1 || count > 200) {
    return NextResponse.json({ error: 'Count must be between 1 and 200' }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceRole()

  // Check class exists and belongs to teacher
  const { data: cls, error: cErr } = await service
    .from('classes')
    .select('id, teacher_id, num_students')
    .eq('id', params.id)
    .single()
  if (cErr || !cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  if (cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Generate fun scientist-themed credentials
  const generatedCredentials = await generateStudentCredentials(count)

  const credentials: { username: string; password: string }[] = []
  const rows: {
    class_id: string
    username: string
    password_hash: string
    plain_password: string
  }[] = []

  for (const cred of generatedCredentials) {
    credentials.push({ username: cred.username, password: cred.plainPassword })
    rows.push({
      class_id: cls.id,
      username: cred.username,
      password_hash: cred.passwordHash,
      plain_password: cred.plainPassword
    })
  }

  // Insert students
  const { error: insertErr } = await service
    .from('students')
    .insert(rows)

  if (insertErr) {
    console.error('Insert error:', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 400 })
  }

  // Seed the class with default Fermi questions if not already done
  await service.rpc('seed_class_questions', { p_class_id: cls.id })

  return NextResponse.json({ credentials })
}
