import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'
import CoordinatorSection from '@/components/CoordinatorSection'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-eel">Your Classes</h1>
          <p className="text-wolf">Manage your Fermi competitions</p>
        </div>
        <Link href="/teacher/new-class" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Class
        </Link>
      </div>

      {/* Coordinator Section - Only shown for master code holders */}
      {isCoordinator && (
        <CoordinatorSection
          masterCodeId={profile.master_code_id!}
          masterCodeName={profile.master_codes?.name}
        />
      )}

      {/* Classes Grid */}
      {classes?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {classes.map(c => (
            <Link key={c.id} href={`/teacher/class/${c.id}`} className="card-interactive block group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-eel truncate group-hover:text-duo-blue transition-colors">
                    {c.name}
                  </h2>
                  {c.school_name && (
                    <p className="text-sm text-wolf truncate">{c.school_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-blue">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {c.num_students} students
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-wolf group-hover:text-duo-blue transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-4 pt-4 border-t border-swan">
                <div className="flex items-center gap-2 text-sm text-wolf">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-4">
            <FermiMascot mood="encouraging" size="md" />
          </div>
          <h3 className="text-xl font-bold text-eel mb-2">No Classes Yet</h3>
          <p className="text-wolf mb-6">
            Create your first class to start the Fermi Competition with your students!
          </p>
          <Link href="/teacher/new-class" className="btn btn-primary">
            Create Your First Class
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      {classes && classes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-value text-duo-blue">{classes.length}</div>
            <div className="stat-label">Classes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-duo-green">
              {classes.reduce((sum, c) => sum + c.num_students, 0)}
            </div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-duo-yellow-dark">10</div>
            <div className="stat-label">Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-duo-purple">40</div>
            <div className="stat-label">Minutes</div>
          </div>
        </div>
      )}

      {/* Code Status & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-swan">
        {hasCode ? (
          <div className="flex items-center gap-2 text-sm text-duo-green">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isCoordinator ? 'Coordinator Code Active' : 'Competition Code Active'}
          </div>
        ) : (
          <Link href="/teacher/enter-code" className="btn btn-ghost !text-duo-green">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Enter Code
          </Link>
        )}
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="btn btn-ghost !text-wolf">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </form>
      </div>
    </div>
  )
}
