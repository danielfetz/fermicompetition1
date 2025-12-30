import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Params = { params: { id: string, studentId: string } }

type FermiQuestion = {
  id: string
  prompt: string
  correct_value: number
}

type ClassQuestion = {
  id: string
  order: number
  fermi_questions: FermiQuestion | FermiQuestion[] | null
}

// Helper to extract fermi question from either single object or array
function getFermiQuestion(fq: FermiQuestion | FermiQuestion[] | null): FermiQuestion | null {
  if (!fq) return null
  if (Array.isArray(fq)) return fq[0] || null
  return fq
}

// Calculate orders of magnitude difference from correct answer
function getOrdersOfMagnitude(answer: number | null | undefined, correct: number | null | undefined): { value: number; label: string; color: string } | null {
  if (answer == null || correct == null || correct === 0 || answer === 0) return null
  const ordersDiff = Math.abs(Math.log10(answer) - Math.log10(correct))
  let color = 'text-duo-red'
  let label = ''
  if (ordersDiff < 0.1) {
    color = 'text-duo-green'
    label = 'spot on'
  } else if (ordersDiff < 0.5) {
    color = 'text-duo-green'
    label = `${ordersDiff.toFixed(1)} orders`
  } else if (ordersDiff < 1) {
    color = 'text-duo-yellow-dark'
    label = `${ordersDiff.toFixed(1)} orders`
  } else {
    color = 'text-duo-red'
    label = `${ordersDiff.toFixed(1)} orders`
  }
  return { value: ordersDiff, label, color }
}

// Map confidence values to display ranges
function getConfidenceLabel(value: number): string {
  switch (value) {
    case 10: return '0-20%'
    case 30: return '20-40%'
    case 50: return '40-60%'
    case 70: return '60-80%'
    case 90: return '80-100%'
    default: return `${value}%`
  }
}

export default async function EditStudent({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // First get the student to determine their competition mode
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, username, class_id, competition_mode')
    .eq('id', params.studentId)
    .single()

  if (!student) return notFound()

  // Get the student's competition mode (default to mock)
  const studentMode = student.competition_mode || 'mock'

  // Now fetch questions filtered by the student's mode, and their answers
  const [{ data: classQuestions }, { data: answers }] = await Promise.all([
    supabase.from('class_questions').select(`
      id,
      order,
      fermi_questions (
        id,
        prompt,
        correct_value
      )
    `).eq('class_id', params.id).eq('competition_mode', studentMode).order('order'),
    supabase.from('answers').select('class_question_id, value, confidence_pct').eq('student_id', params.studentId)
  ])

  // Cast to proper type
  const questions = (classQuestions || []) as ClassQuestion[]
  const answerMap = new Map(answers?.map(a => [a.class_question_id, a]))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/class/${params.id}?mode=${studentMode}`} className="text-sm font-semibold text-duo-blue hover:underline mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Class Overview
        </Link>
        <h1 className="text-2xl font-extrabold">Edit {student.full_name || student.username}</h1>
      </div>
      <div className="card overflow-x-auto">
        <form action={`/api/teacher/student/${student.id}/answers`} method="post" className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 w-28">Full name</label>
            <input name="full_name" defaultValue={student.full_name ?? ''} className="input flex-1" placeholder="Full name" />
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Question</th>
                <th className="py-2 pr-4">Answer</th>
                <th className="py-2 pr-4">Confidence</th>
                <th className="py-2">Correct</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((cq, i) => {
                const fq = getFermiQuestion(cq.fermi_questions)
                const a = answerMap.get(cq.id)
                return (
                  <tr key={cq.id} className="border-t align-top">
                    <td className="py-2 pr-4">{i+1}</td>
                    <td className="py-2 pr-4 max-w-xl">{fq?.prompt || 'Unknown question'}</td>
                    <td className="py-2 pr-4">
                      <input
                        name={`value_${cq.id}`}
                        defaultValue={a?.value ?? ''}
                        className="input w-full min-w-[120px] sm:w-40 py-2 px-3"
                        type="number"
                        step="any"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <select name={`conf_${cq.id}`} defaultValue={a?.confidence_pct ?? 50} className="select py-1 px-2 w-28">
                        {[10,30,50,70,90].map(c => <option key={c} value={c}>{getConfidenceLabel(c)}</option>)}
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="font-mono text-wolf">{fq?.correct_value ?? '—'}</div>
                      {(() => {
                        const diff = getOrdersOfMagnitude(a?.value, fq?.correct_value)
                        return diff ? (
                          <div className={`text-xs mt-0.5 ${diff.color}`}>
                            {diff.label}
                          </div>
                        ) : null
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <input type="hidden" name="class_id" value={params.id} />
          <input type="hidden" name="mode" value={studentMode} />
          <div className="flex items-center gap-4">
            <button className="btn btn-primary">Save Changes</button>
            <span className="text-sm text-wolf">Remember to save before leaving</span>
          </div>
        </form>
      </div>

      {/* Delete Student Section */}
      <div className="card border-duo-red/30 bg-duo-red/5">
        <h3 className="font-bold text-eel mb-2">Danger Zone</h3>
        <p className="text-sm text-wolf mb-4">
          Permanently delete this student and all their answers. This action cannot be undone.
        </p>
        <form action={`/api/teacher/student/${student.id}/delete`} method="post">
          <input type="hidden" name="class_id" value={params.id} />
          <input type="hidden" name="mode" value={studentMode} />
          <button
            type="submit"
            className="btn bg-duo-red text-white hover:bg-duo-red-dark"
            onClick={(e) => {
              if (!confirm('Are you sure you want to delete this student? This cannot be undone.')) {
                e.preventDefault()
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Student
          </button>
        </form>
      </div>
    </div>
  )
}
