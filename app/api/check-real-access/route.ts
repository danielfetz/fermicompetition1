import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ unlocked: false, reason: 'not_authenticated' })
  }

  const { data: profile, error } = await supabase
    .from('teacher_profiles')
    .select('real_competition_unlocked, master_code_id, teacher_code_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error checking real access:', error)
    return NextResponse.json({ unlocked: false, reason: 'error', error: error.message })
  }

  // User has access if they have real_competition_unlocked OR a master_code_id OR teacher_code_id
  const hasAccess = !!(
    profile?.real_competition_unlocked ||
    profile?.master_code_id ||
    profile?.teacher_code_id
  )

  return NextResponse.json({
    unlocked: hasAccess,
    hasProfile: !!profile,
    hasMasterCode: !!profile?.master_code_id,
    hasTeacherCode: !!profile?.teacher_code_id,
    realCompetitionUnlocked: !!profile?.real_competition_unlocked
  })
}
