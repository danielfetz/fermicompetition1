'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClassSchema } from '@/lib/validators'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function NewClass() {
  const [name, setName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [num, setNum] = useState<number>(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = createClassSchema.safeParse({ name, num_students: num })
    if (!parsed.success) {
      setError('Please check your inputs.')
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
      .insert({
        name,
        num_students: num,
        teacher_id: user.id,
        school_name: schoolName || null
      })
      .select('id')
      .single()
    setLoading(false)
    if (error) setError(error.message)
    else {
      router.push(`/teacher/class/${data!.id}`)
      router.refresh()
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="happy" size="md" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">Create a New Class</h1>
          <p className="text-wolf">Set up your class for the Fermi Competition</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="form-group">
            <label className="label" htmlFor="name">Class Name *</label>
            <input
              id="name"
              className="input"
              placeholder="e.g., Physics 101, Grade 8 Science"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="school">School Name (Optional)</label>
            <input
              id="school"
              className="input"
              placeholder="e.g., Lincoln High School"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="numStudents">Number of Students *</label>
            <input
              id="numStudents"
              type="number"
              min={1}
              max={200}
              className="input"
              value={num}
              onChange={e => setNum(parseInt(e.target.value || '0'))}
              required
            />
            <p className="text-sm text-wolf mt-1">
              How many students will participate? (1-200)
            </p>
          </div>

          {error && (
            <div className="bg-duo-red/10 border-2 border-duo-red rounded-duo p-3">
              <p className="text-duo-red-dark text-sm font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Class'
            )}
          </button>
        </form>
      </div>

      {/* Info Card */}
      <div className="card bg-duo-blue/5 border-duo-blue/20">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-duo-blue/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-eel">What happens next?</h3>
            <p className="text-sm text-wolf mt-1">
              After creating your class, you&apos;ll be able to generate unique login
              credentials for each student with fun scientist-themed usernames!
            </p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link href="/teacher/dashboard" className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
