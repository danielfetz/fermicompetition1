"use client"
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { generateStudentsSchema } from '@/lib/validators'

export default function GenerateStudents() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [count, setCount] = useState<number>(10)
  const [prefix, setPrefix] = useState<string>('student-')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ username: string, password: string }[] | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = generateStudentsSchema.safeParse({ count, prefix })
    if (!parsed.success) { setError('Invalid input.'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await fetch(`/api/classes/${params.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, prefix })
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(()=>({ error: 'Error' }))
      setError(body.error || 'Failed to generate.')
      return
    }
    const data = await res.json()
    setResult(data.credentials)
  }

  return (
    <div className="max-w-lg mx-auto card space-y-4">
      <h1 className="text-2xl font-bold">Generate Student Credentials</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Count</label>
          <input type="number" min={1} max={500} className="w-full border rounded-lg p-2" value={count} onChange={e=>setCount(parseInt(e.target.value||'0'))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Username prefix</label>
          <input className="w-full border rounded-lg p-2" value={prefix} onChange={e=>setPrefix(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading? 'Generating...' : 'Generate'}</button>
      </form>
      {result && (
        <div className="space-y-2">
          <h2 className="font-semibold">Credentials</h2>
          <div className="bg-gray-50 border rounded p-3 text-sm overflow-auto">
            {result.map((r, i) => (
              <div key={i} className="flex gap-4 font-mono"><span>{r.username}</span><span>{r.password}</span></div>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={()=>router.push(`/teacher/class/${params.id}`)}>Done</button>
        </div>
      )}
    </div>
  )
}

