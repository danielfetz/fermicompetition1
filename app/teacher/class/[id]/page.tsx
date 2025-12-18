import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import ClassContent from '@/components/ClassContent'

type Params = { params: { id: string } }

export default async function ClassDetail({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch teacher profile to check if real competition is unlocked
  // Master code holders (coordinators) automatically have access
  const { data: profile } = await supabase
    .from('teacher_profiles')
    .select('real_competition_unlocked, master_code_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Real is unlocked if they have real_competition_unlocked OR they're a coordinator (has master_code_id)
  const realUnlocked = !!(profile?.real_competition_unlocked || profile?.master_code_id)

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, num_students, school_name')
    .eq('id', params.id)
    .maybeSingle()

  if (!cls) return notFound()

  const { data: students } = await supabase
    .from('students')
    .select('id, username, full_name, has_completed_exam, plain_password')
    .eq('class_id', cls.id)
    .order('username')

  const { data: scores } = await supabase
    .from('student_scores')
    .select('student_id, correct_count, total_answered, score_percentage')
    .eq('class_id', cls.id)

  return (
    <ClassContent
      classId={cls.id}
      className={cls.name}
      schoolName={cls.school_name}
      students={students || []}
      scores={scores || []}
      realUnlocked={realUnlocked}
    />
  )
}
