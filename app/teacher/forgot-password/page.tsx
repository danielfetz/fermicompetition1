'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <FermiMascot mood="happy" size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold text-eel">Check Your Email!</h1>
          <p className="text-wolf">
            We&apos;ve sent a password reset link to <span className="font-semibold text-eel">{email}</span>.
            Click the link in the email to reset your password.
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
              <p className="font-semibold text-duo-green-dark">Email Sent</p>
              <p className="text-sm text-wolf mt-1">
                The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/teacher/login" className="btn btn-secondary">
            Back to Login
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
          <h1 className="text-2xl font-extrabold text-eel">Reset Password</h1>
          <p className="text-wolf">Enter your email to receive a reset link</p>
        </div>
      </div>

      {/* Form */}
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
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center space-y-3">
        <p className="text-wolf">
          Remember your password?{' '}
          <Link href="/teacher/login" className="text-duo-blue font-semibold hover:underline">
            Log in
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
