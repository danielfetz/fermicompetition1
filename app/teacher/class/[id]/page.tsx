import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CompetitionModeToggle from '@/components/CompetitionModeToggle'

type Params = { params: { id: string } }

export default async function ClassDetail({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch teacher profile to check if real competition is unlocked
  const { data: profile } = await supabase
    .from('teacher_profiles')
    .select('real_competition_unlocked')
    .eq('user_id', user.id)
    .maybeSingle()

  const realUnlocked = profile?.real_competition_unlocked ?? false

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

  const studentsGenerated = students?.length || 0
  const studentsCompleted = students?.filter(s => s.has_completed_exam).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <Link href="/teacher/dashboard" className="text-sm text-duo-blue hover:underline mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-eel">{cls.name}</h1>
          {cls.school_name && <p className="text-wolf">{cls.school_name}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CompetitionModeToggle classId={cls.id} realUnlocked={realUnlocked} />
          <Link className="btn btn-primary" href={`/teacher/class/${cls.id}/generate`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Generate Credentials
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-value text-duo-blue">{studentsGenerated}</div>
          <div className="stat-label">Generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-duo-green">{studentsCompleted}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-duo-yellow-dark">{cls.num_students - studentsGenerated}</div>
          <div className="stat-label">Remaining</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-duo-purple">10</div>
          <div className="stat-label">Questions</div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-eel">Students</h2>
          <span className="badge badge-blue">{studentsGenerated} / {cls.num_students}</span>
        </div>

        {students && students.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b-2 border-swan">
                  <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">Username</th>
                  <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Password</th>
                  <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Full Name</th>
                  <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Status</th>
                  <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Score</th>
                  <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-swan">
                {students.map(s => {
                  const score = scores?.find(x => x.student_id === s.id)
                  const correct = score?.correct_count ?? 0
                  const total = score?.total_answered ?? 0

                  return (
                    <tr key={s.id} className="hover:bg-snow transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-mono font-semibold text-eel">{s.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-wolf">{s.plain_password || '••••••••'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {s.full_name ? (
                          <span className="text-eel">{s.full_name}</span>
                        ) : (
                          <span className="text-hare italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.has_completed_exam ? (
                          <span className="badge badge-green">Completed</span>
                        ) : (
                          <span className="badge badge-yellow">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {total > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${correct >= 5 ? 'text-duo-green' : correct >= 3 ? 'text-duo-yellow-dark' : 'text-duo-red'}`}>
                              {correct}/10
                            </span>
                            <div className="w-16 h-2 bg-swan rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${correct >= 5 ? 'bg-duo-green' : correct >= 3 ? 'bg-duo-yellow' : 'bg-duo-red'}`}
                                style={{ width: `${(correct / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-hare">—</span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <Link
                          href={`/teacher/class/${cls.id}/student/${s.id}`}
                          className="text-duo-blue font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          View/Edit
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-swan rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-wolf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-eel mb-2">No Students Yet</h3>
            <p className="text-wolf mb-4">
              Generate credentials for your students to get started.
            </p>
            <Link href={`/teacher/class/${cls.id}/generate`} className="btn btn-primary">
              Generate Credentials
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
