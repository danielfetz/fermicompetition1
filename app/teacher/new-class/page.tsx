"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClassSchema } from '@/lib/validators'
import { supabase } from '@/lib/supabaseClient'

export default function NewClass() {
  const [name, setName] = useState('')
  const [num, setNum] = useState<number>(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = createClassSchema.safeParse({ name, num_students: num })
    if (!parsed.success) {
      setError('Please check inputs.')
      return
    }
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('classes')
      .insert({ name, num_students: num, teacher_id: user.id })
      .select('id')
      .single()
    setLoading(false)
    if (error) setError(error.message)
    else router.push(`/teacher/class/${data!.id}`)
  }

  return (
    <div className="max-w-md mx-auto card space-y-4">
      <h1 className="text-2xl font-bold">Create Class</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded-lg p-2" placeholder="Class name" value={name} onChange={e=>setName(e.target.value)} />
        <div>
          <label className="block text-sm text-gray-600 mb-1">Number of students</label>
          <input type="number" min={1} max={200} className="w-full border rounded-lg p-2" value={num} onChange={e=>setNum(parseInt(e.target.value||'0'))} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading? 'Creating...':'Create class'}</button>
      </form>
    </div>
  )
}

