import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabaseServer'
import DashboardContent from '@/components/DashboardContent'

export default async function Dashboard() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/teacher/login')

  // Fetch teacher profile with error handling
  const { data: profile, error: profileError } = await supabase
    .from('teacher_profiles')
    .select('*, master_codes(*), teacher_codes(*)')
    .eq('user_id', user.id)
    .maybeSingle()

  // Log any profile fetch errors for debugging
  if (profileError) {
    console.error('Error fetching teacher profile:', profileError)
  }

  const isCoordinator = !!profile?.master_code_id
  const hasCode = !!(profile?.teacher_code_id || profile?.master_code_id)

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, num_students, school_name, created_at')
    .neq('name', '__guest_class__')  // Exclude the system guest class
    .order('created_at', { ascending: false })

  return (
    <DashboardContent
      classes={classes || []}
      isCoordinator={isCoordinator}
      hasCode={hasCode}
      masterCodeId={profile?.master_code_id}
      masterCodeName={profile?.master_codes?.name}
      userId={user.id}
      userEmail={user.email}
    />
  )
}
