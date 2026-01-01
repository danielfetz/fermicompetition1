'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

function TeacherLoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for error from auth callback
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else window.location.href = '/teacher/dashboard' // Hard redirect to refresh server components
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="happy" size="md" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">Welcome Back!</h1>
          <p className="text-wolf">Log in to manage your classes</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="teacher@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button className="btn btn-secondary w-full" disabled={loading || googleLoading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-hare"></div>
          <span className="text-wolf text-sm">or</span>
          <div className="flex-1 h-px bg-hare"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="btn btn-ghost w-full flex items-center justify-center gap-2 border-2 border-hare hover:border-wolf"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="text-center space-y-3">
        <p className="text-wolf">
          Don&apos;t have an account?{' '}
          <Link href="/teacher/signup" className="text-duo-blue font-semibold hover:underline">
            Sign up
          </Link>
        </p>
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

export default function TeacherLogin() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto card text-center py-8">
        <p className="text-wolf">Loading...</p>
      </div>
    }>
      <TeacherLoginContent />
    </Suspense>
  )
}
