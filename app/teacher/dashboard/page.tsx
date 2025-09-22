import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/teacher/login')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, num_students, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Your Classes</h1>
        <Link href="/teacher/new-class" className="btn btn-primary">New class</Link>
      </div>
      <div className="grid gap-4">
        {classes?.length ? classes.map(c => (
          <Link key={c.id} href={`/teacher/class/${c.id}`} className="card flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="text-gray-600">{c.num_students} students</p>
            </div>
            <span className="text-duolingo-blue">Manage →</span>
          </Link>
        )) : (
          <div className="text-gray-600">No classes yet. Create your first one.</div>
        )}
      </div>
    </div>
  )
}

