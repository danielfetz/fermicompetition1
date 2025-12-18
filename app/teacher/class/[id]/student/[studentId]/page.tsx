import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Params = { params: { id: string, studentId: string }; searchParams: { mode?: string } }

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

// Calculate percentage difference from correct answer
function getPercentageDiff(answer: number | null | undefined, correct: number | null | undefined): { value: number; label: string; color: string } | null {
  if (answer == null || correct == null || correct === 0) return null
  const diff = Math.abs((answer - correct) / correct) * 100
  let color = 'text-duo-red'
  if (diff <= 10) color = 'text-duo-green'
  else if (diff <= 25) color = 'text-duo-green-dark'
  else if (diff <= 50) color = 'text-duo-yellow-dark'
  else if (diff <= 100) color = 'text-duo-orange'
  return { value: diff, label: diff <= 1 ? '<1%' : `${Math.round(diff)}%`, color }
}

export default async function EditStudent({ params, searchParams }: Params) {
  const mode = searchParams.mode === 'real' ? 'real' : 'mock'
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: student }, { data: classQuestions }, { data: answers }] = await Promise.all([
    supabase.from('students').select('id, full_name, username, class_id').eq('id', params.studentId).single(),
    supabase.from('class_questions').select(`
      id,
      order,
      fermi_questions (
        id,
        prompt,
        correct_value
      )
    `).eq('class_id', params.id).order('order'),
    supabase.from('answers').select('class_question_id, value, confidence_pct').eq('student_id', params.studentId)
  ])

  if (!student) return notFound()

  // Cast to proper type
  const questions = (classQuestions || []) as ClassQuestion[]
  const answerMap = new Map(answers?.map(a => [a.class_question_id, a]))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/class/${params.id}?mode=${mode}`} className="text-sm font-semibold text-duo-blue hover:underline mb-2 inline-flex items-center gap-1">
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
                        className="input w-32 py-1 px-2"
                        type="number"
                        step="any"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <select name={`conf_${cq.id}`} defaultValue={a?.confidence_pct ?? 50} className="select py-1 px-2 w-24">
                        {[10,30,50,70,90].map(c => <option key={c} value={c}>{c}%</option>)}
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="font-mono text-wolf">{fq?.correct_value ?? '—'}</div>
                      {(() => {
                        const diff = getPercentageDiff(a?.value, fq?.correct_value)
                        return diff ? (
                          <div className={`text-xs mt-0.5 ${diff.color}`}>
                            {diff.label} off
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
          <input type="hidden" name="mode" value={mode} />
          <div className="flex items-center gap-4">
            <button className="btn btn-primary">Save Changes</button>
            <span className="text-sm text-wolf">Remember to save before leaving</span>
          </div>
        </form>
      </div>
    </div>
  )
}
