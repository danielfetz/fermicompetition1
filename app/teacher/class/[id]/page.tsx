import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Params = { params: { id: string } }

export default async function ClassDetail({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, num_students')
    .eq('id', params.id)
    .maybeSingle()

  if (!cls) return notFound()

  const { data: students } = await supabase
    .from('students')
    .select('id, username, full_name')
    .eq('class_id', cls.id)
    .order('username')

  const { data: scores } = await supabase
    .from('student_scores')
    .select('student_id, correct_count')
    .eq('class_id', cls.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{cls.name}</h1>
          <p className="text-gray-600">{students?.length || 0} / {cls.num_students} students</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-secondary" href={`/teacher/class/${cls.id}/questions`}>Edit questions</Link>
          <Link className="btn btn-primary" href={`/teacher/class/${cls.id}/generate`}>Generate credentials</Link>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Full name</th>
              <th className="py-2 pr-4">Correct</th>
              <th className="py-2">Edit answers</th>
            </tr>
          </thead>
          <tbody>
            {students?.map(s => {
              const sc = scores?.find(x => x.student_id === s.id)?.correct_count ?? 0
              return (
              <tr key={s.id} className="border-t">
                <td className="py-2 pr-4 font-mono">{s.username}</td>
                <td className="py-2 pr-4">{s.full_name ?? '—'}</td>
                <td className="py-2 pr-4">{sc}</td>
                <td className="py-2"><Link className="text-duolingo-blue" href={`/teacher/class/${cls.id}/student/${s.id}`}>Open</Link></td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

