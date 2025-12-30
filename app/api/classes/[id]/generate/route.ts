import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'
import { generateStudentCredentials, generateReadablePassword, hashPassword } from '@/lib/password'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { count = 10, competition_mode = 'mock', names = [] } = await req.json().catch(() => ({}))

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
    .select('id, teacher_id, num_students, school_year')
    .eq('id', params.id)
    .single()
  if (cErr || !cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  if (cls.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const schoolYear = cls.school_year || '2025-26'

  const credentials: { username: string; password: string; full_name?: string }[] = []
  const rows: {
    class_id: string
    username: string
    password_hash: string
    plain_password: string
    competition_mode: string
    school_year: string
    full_name?: string
  }[] = []
  const otherModeRows: {
    class_id: string
    username: string
    password_hash: string
    plain_password: string
    competition_mode: string
    school_year: string
    full_name?: string
  }[] = []

  const otherMode = competition_mode === 'real' ? 'mock' : 'real'

  // Check if students already exist for current school year
  const { count: currentYearCount } = await service
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', cls.id)
    .eq('school_year', schoolYear)

  // Check if students exist from previous school years (to reuse usernames/names)
  const { data: previousYearStudents } = await service
    .from('students')
    .select('username, full_name')
    .eq('class_id', cls.id)
    .eq('competition_mode', 'mock') // Only get one mode to avoid duplicates
    .neq('school_year', schoolYear)
    .order('username')

  // Get unique students from previous years (by username)
  const previousStudentsMap = new Map<string, string | null>()
  if (previousYearStudents) {
    for (const s of previousYearStudents) {
      if (!previousStudentsMap.has(s.username)) {
        previousStudentsMap.set(s.username, s.full_name)
      }
    }
  }

  // If no students exist for current year but previous year students exist, reuse them
  if (currentYearCount === 0 && previousStudentsMap.size > 0) {
    // Reuse usernames/names from previous years with new passwords
    for (const [username, fullName] of previousStudentsMap) {
      const plainPassword = generateReadablePassword(8)
      const passwordHash = await hashPassword(plainPassword)

      credentials.push({ username, password: plainPassword, full_name: fullName || undefined })
      rows.push({
        class_id: cls.id,
        username,
        password_hash: passwordHash,
        plain_password: plainPassword,
        competition_mode: competition_mode,
        school_year: schoolYear,
        full_name: fullName || undefined
      })

      // Also create student in the other mode with a different password
      const otherPlainPassword = generateReadablePassword(8)
      const otherPasswordHash = await hashPassword(otherPlainPassword)
      otherModeRows.push({
        class_id: cls.id,
        username,
        password_hash: otherPasswordHash,
        plain_password: otherPlainPassword,
        competition_mode: otherMode,
        school_year: schoolYear,
        full_name: fullName || undefined
      })
    }
  } else {
    // Generate new credentials (either first time or adding more to existing year)

    // Validate count is provided
    if (count < 1 || count > 200) {
      return NextResponse.json({ error: 'Count must be between 1 and 200' }, { status: 400 })
    }

    // Efficiently get max numbers for each base username pattern
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
        school_year: schoolYear,
        full_name: fullName
      })

      // Also create student in the other mode with a different password
      const otherPlainPassword = generateReadablePassword(8)
      const otherPasswordHash = await hashPassword(otherPlainPassword)
      otherModeRows.push({
        class_id: cls.id,
        username: cred.username,
        password_hash: otherPasswordHash,
        plain_password: otherPlainPassword,
        competition_mode: otherMode,
        school_year: schoolYear,
        full_name: fullName
      })
    }
  }

  // Insert students for the requested mode
  const { error: insertErr } = await service
    .from('students')
    .insert(rows)

  if (insertErr) {
    console.error('Insert error:', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 400 })
  }

  // Insert students for the other mode too
  const { error: otherInsertErr } = await service
    .from('students')
    .insert(otherModeRows)

  if (otherInsertErr) {
    console.error('Other mode insert error:', otherInsertErr)
    // Don't fail the request, but log it - main mode was successful
  }

  // Update class num_students to reflect unique student count for this school year (count only one mode since both have same students)
  const { count: totalStudents } = await service
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', cls.id)
    .eq('competition_mode', 'mock')
    .eq('school_year', schoolYear)

  await service
    .from('classes')
    .update({ num_students: totalStudents || 0 })
    .eq('id', cls.id)

  // Seed the class with questions for both competition modes and current school year
  await service.rpc('seed_class_questions', { p_class_id: cls.id, p_mode: competition_mode, p_school_year: schoolYear })
  await service.rpc('seed_class_questions', { p_class_id: cls.id, p_mode: otherMode, p_school_year: schoolYear })

  // Include info about whether students were reused from previous year
  const reusedFromPreviousYear = currentYearCount === 0 && previousStudentsMap.size > 0

  return NextResponse.json({
    credentials,
    competition_mode,
    reused_from_previous_year: reusedFromPreviousYear,
    student_count: credentials.length
  })
}
