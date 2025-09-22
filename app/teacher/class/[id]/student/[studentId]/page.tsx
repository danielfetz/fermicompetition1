import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'

type Params = { params: { id: string, studentId: string } }

export default async function EditStudent({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: student }, { data: questions }, { data: answers }] = await Promise.all([
    supabase.from('students').select('id, full_name, username, class_id').eq('id', params.studentId).single(),
    supabase.from('questions').select('id, prompt, correct_value, order').eq('class_id', params.id).order('order'),
    supabase.from('answers').select('question_id, value, confidence_pct').eq('student_id', params.studentId)
  ])

  if (!student) return notFound()
  const answerMap = new Map(answers?.map(a => [a.question_id, a]))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Edit {student.username}</h1>
      <div className="card overflow-x-auto">
        <form action={`/api/teacher/student/${student.id}/answers`} method="post" className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 w-28">Full name</label>
            <input name="full_name" defaultValue={student.full_name ?? ''} className="border rounded p-2 flex-1" placeholder="Full name" />
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
              {questions?.map((q, i) => {
                const a = answerMap.get(q.id)
                return (
                  <tr key={q.id} className="border-t align-top">
                    <td className="py-2 pr-4">{i+1}</td>
                    <td className="py-2 pr-4 max-w-xl">{q.prompt}</td>
                    <td className="py-2 pr-4"><input name={`value_${q.id}`} defaultValue={a?.value ?? ''} className="border rounded p-1 w-32" type="number" /></td>
                    <td className="py-2 pr-4">
                      <select name={`conf_${q.id}`} defaultValue={a?.confidence_pct ?? 50} className="border rounded p-1">
                        {[10,30,50,70,90].map(c => <option key={c} value={c}>{c}%</option>)}
                      </select>
                    </td>
                    <td className="py-2">{q.correct_value ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <input type="hidden" name="class_id" value={params.id} />
          <button className="btn btn-primary" formAction={`/api/teacher/student/${student.id}/answers`}>Save</button>
        </form>
      </div>
    </div>
  )
}

