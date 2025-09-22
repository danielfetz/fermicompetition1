import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'

type Params = { params: { id: string } }

export default async function ClassQuestions({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: cls }, { data: q }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('id', params.id).maybeSingle(),
    supabase.from('questions').select('id, prompt, correct_value, order').eq('class_id', params.id).order('order')
  ])
  if (!cls) return notFound()
  const questions = q && q.length ? q : Array.from({ length: 10 }, (_, i) => ({ id: '', prompt: '', correct_value: null as number | null, order: i + 1 }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Questions for {cls.name}</h1>
      <form action={`/api/teacher/class/${cls.id}/questions`} method="post" className="space-y-3">
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="card">
              <div className="text-gray-500 text-xs mb-1">Question {i+1}</div>
              <input type="hidden" name={`order_${i+1}`} value={i+1} />
              <div className="space-y-2">
                <input name={`prompt_${i+1}`} defaultValue={q.prompt || ''} className="w-full border rounded p-2" placeholder="Prompt" />
                <input name={`correct_${i+1}`} defaultValue={q.correct_value ?? ''} className="w-48 border rounded p-2" placeholder="Correct value (optional)" type="number" step="any" />
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary">Save Questions</button>
      </form>
    </div>
  )
}

