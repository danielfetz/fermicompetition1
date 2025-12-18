'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FermiMascot from '@/components/FermiMascot'

export default function StudentProfileClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const classId = sp.get('classId')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('studentToken')
    if (!token) router.push('/student/login')
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (name.trim().length < 2) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)
    setError(null)
    const token = localStorage.getItem('studentToken')
    const res = await fetch('/api/student/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ full_name: name.trim() })
    })
    setLoading(false)
    if (!res.ok) {
      setError('Failed to save name. Please try again.')
      return
    }
    router.push(`/student/exam/${classId}`)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="happy" size="lg" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">One More Thing!</h1>
          <p className="text-wolf">Tell us your name so your teacher knows who you are</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="fullName">Your Full Name</label>
            <input
              id="fullName"
              type="text"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="e.g., John Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
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
                Saving...
              </span>
            ) : (
              <>
                Continue to Challenge
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-duo-green"></div>
        <div className="w-3 h-3 rounded-full bg-duo-green"></div>
        <div className="w-3 h-3 rounded-full bg-swan"></div>
      </div>
      <p className="text-center text-sm text-wolf">Step 2 of 3: Enter your name</p>
    </div>
  )
}
