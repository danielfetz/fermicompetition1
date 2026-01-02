'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has a valid session from the reset link
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
      setSessionChecked(true)
    }
    checkSession()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  // Loading state while checking session
  if (!sessionChecked) {
    return (
      <div className="max-w-md mx-auto card text-center py-8">
        <p className="text-wolf">Loading...</p>
      </div>
    )
  }

  // No valid session - show error
  if (!hasSession) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <FermiMascot mood="thinking" size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-eel">Invalid or Expired Link</h1>
          <p className="text-wolf">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>

        <div className="text-center space-y-3">
          <Link href="/teacher/forgot-password" className="btn btn-primary">
            Request New Link
          </Link>
          <div>
            <Link href="/teacher/login" className="btn btn-ghost btn-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <FermiMascot mood="celebrating" size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold text-eel">Password Updated!</h1>
          <p className="text-wolf">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
        </div>

        <div className="card-success">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-duo-green rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-duo-green-dark">Success!</p>
              <p className="text-sm text-wolf mt-1">
                Your account is now secured with your new password.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/teacher/login" className="btn btn-secondary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="encouraging" size="md" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">Set New Password</h1>
          <p className="text-wolf">Choose a strong password for your account</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="At least 6 characters"
              value={password}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              className={`input ${error && error.includes('match') ? 'input-error' : ''}`}
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center">
        <Link href="/teacher/login" className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Login
        </Link>
      </div>
    </div>
  )
}
