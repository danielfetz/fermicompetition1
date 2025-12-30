import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'
import { generateStudentCredentials, parseUsername } from '@/lib/password'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { count = 10, competition_mode = 'mock', names = [] } = await req.json().catch(() => ({}))

  // Validate count
  if (count < 1 || count > 200) {
    return NextResponse.json({ error: 'Count must be between 1 and 200' }, { status: 400 })
  }

  // Validate competition_mode
  if (competition_mode !== 'mock' && competition_mode !== 'real') {
    return NextResponse.json({ error: 'Invalid competition mode' }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceRole()

  // For official competition mode, check if teacher has it unlocked
  // Use service role to bypass RLS - we've already verified the user above
  if (competition_mode === 'real') {
    const { data: profile } = await service
      .from('teacher_profiles')
      .select('real_competition_unlocked, master_code_id, teacher_code_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // User has access if they have real_competition_unlocked OR master_code_id OR teacher_code_id
    const hasAccess = !!(profile?.real_competition_unlocked || profile?.master_code_id || profile?.teacher_code_id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Official competition not unlocked' }, { status: 403 })
    }
  }

  // Check class exists and belongs to teacher
  const { data: cls, error: cErr } = await service
    .from('classes')
    .select('id, teacher_id, num_students')
    .eq('id', params.id)
    .single()
  if (cErr || !cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  if (cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Efficiently get max numbers for each base username pattern
  // Uses a database function that aggregates on the server side
  const { data: maxNumbers } = await service.rpc('get_username_max_numbers')

  // Build map of base -> max number
  const existingMaxNumbers = new Map<string, number>()
  if (maxNumbers) {
    for (const row of maxNumbers as { base: string; max_num: number }[]) {
      existingMaxNumbers.set(row.base, row.max_num)
    }
  }

  // Generate fun scientist-themed credentials with globally unique usernames
  const generatedCredentials = await generateStudentCredentials(count, existingMaxNumbers)

  const credentials: { username: string; password: string; full_name?: string }[] = []
  const rows: {
    class_id: string
    username: string
    password_hash: string
    plain_password: string
    competition_mode: string
    full_name?: string
  }[] = []

  // Parse names array (ensure it's an array of strings)
  const namesList: string[] = Array.isArray(names) ? names.filter((n: unknown) => typeof n === 'string' && n.trim()) : []

  for (let i = 0; i < generatedCredentials.length; i++) {
    const cred = generatedCredentials[i]
    const fullName = namesList[i] || undefined
    credentials.push({ username: cred.username, password: cred.plainPassword, full_name: fullName })
    rows.push({
      class_id: cls.id,
      username: cred.username,
      password_hash: cred.passwordHash,
      plain_password: cred.plainPassword,
      competition_mode: competition_mode,
      full_name: fullName
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

  // Seed the class with questions for this competition mode if not already done
  await service.rpc('seed_class_questions', { p_class_id: cls.id, p_mode: competition_mode })

  return NextResponse.json({ credentials, competition_mode })
}
