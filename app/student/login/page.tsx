'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function StudentLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.toLowerCase().trim(), password })
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Error' }))
      setError(body.error || 'Login failed')
      return
    }
    const { token, classId, needsName } = await res.json()
    localStorage.setItem('studentToken', token)
    if (needsName) router.push(`/student/profile?classId=${classId}`)
    else router.push(`/student/exam/${classId}`)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="encouraging" size="lg" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">Welcome, Scientist!</h1>
          <p className="text-wolf">Enter your credentials to start the Fermi Competition</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="e.g., cosmicfermi01"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="bg-duo-red/10 border-2 border-duo-red rounded-duo p-3 animate-shake">
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
                Signing in...
              </span>
            ) : (
              'Start Challenge'
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
            <h3 className="font-bold text-eel">Need your credentials?</h3>
            <p className="text-sm text-wolf mt-1">
              Ask your teacher for your username and password.
              They look something like &quot;cosmicfermi01&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link href="/" className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
