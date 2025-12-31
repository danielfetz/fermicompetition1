import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import ClassContent from '@/components/ClassContent'

type Params = { params: { id: string }; searchParams: { mode?: string } }

export default async function ClassDetail({ params, searchParams }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Use service role to bypass RLS - we've already verified the user above
  const service = createSupabaseServiceRole()

  // Fetch teacher profile to check if real competition is unlocked
  // Master code holders (coordinators) and teacher code holders have access
  const { data: profile } = await service
    .from('teacher_profiles')
    .select('real_competition_unlocked, master_code_id, teacher_code_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Real is unlocked if they have real_competition_unlocked OR master_code_id OR teacher_code_id
  const realUnlocked = !!(profile?.real_competition_unlocked || profile?.master_code_id || profile?.teacher_code_id)

  const { data: cls } = await service
    .from('classes')
    .select('id, name, num_students, school_name, grade_level, country, school_year, teacher_id')
    .eq('id', params.id)
    .maybeSingle()

  // Check class exists, belongs to current user, and is not the system guest class
  if (!cls || cls.teacher_id !== user.id || cls.name === '__guest_class__') return notFound()

  // Fetch students for the current school year
  // Only include real mode students if teacher has access
  const schoolYear = cls.school_year || '2025-26'
  const { data: allStudents } = await service
    .from('students')
    .select('id, username, full_name, has_completed_exam, plain_password, competition_mode')
    .eq('class_id', cls.id)
    .eq('school_year', schoolYear)
    .order('username')

  // Filter out real mode credentials if teacher doesn't have access
  const students = (allStudents || []).map(s => {
    if (s.competition_mode === 'real' && !realUnlocked) {
      return { ...s, plain_password: null }
    }
    return s
  })

  // Check if students exist from the most recent previous school year (for auto-generation)
  const { data: mostRecentPrevYear } = await service
    .from('students')
    .select('school_year')
    .eq('class_id', cls.id)
    .eq('competition_mode', 'mock')
    .neq('school_year', schoolYear)
    .order('school_year', { ascending: false })
    .limit(1)

  const hasPreviousYearStudents = (mostRecentPrevYear?.length || 0) > 0

  // Fetch scores for the current school year
  const { data: scores } = await service
    .from('student_scores')
    .select('student_id, correct_count, total_answered, score_percentage, competition_mode, confidence_points')
    .eq('class_id', cls.id)
    .eq('school_year', schoolYear)

  const initialMode = (searchParams.mode === 'real' ? 'real' : 'mock') as 'mock' | 'real'

  return (
    <ClassContent
      classId={cls.id}
      className={cls.name}
      schoolName={cls.school_name}
      gradeLevel={cls.grade_level}
      country={cls.country}
      schoolYear={cls.school_year}
      numStudents={cls.num_students}
      students={students || []}
      scores={scores || []}
      realUnlocked={realUnlocked}
      initialMode={initialMode}
      hasPreviousYearStudents={hasPreviousYearStudents}
    />
  )
}
