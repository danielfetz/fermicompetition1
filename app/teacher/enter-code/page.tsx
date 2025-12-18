'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function EnterCodePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ message: string; isCoordinator?: boolean } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsSubmitting(true)
    setError('')
    setSuccess(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('claim_code', {
        p_code: code.trim().toUpperCase()
      })

      if (rpcError) throw rpcError

      if (data?.success) {
        setSuccess({
          message: data.message,
          isCoordinator: data.is_coordinator
        })
        // Redirect after a brief delay
        setTimeout(() => {
          router.push('/teacher/dashboard')
          router.refresh()
        }, 2000)
      } else {
        setError(data?.error || 'Invalid code')
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/teacher/dashboard"
        className="text-sm text-duo-blue hover:underline mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-blue/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-eel mb-2">Enter Competition Code</h1>
          <p className="text-wolf">
            Enter your code to unlock the real competition and additional features.
          </p>
        </div>

        {success ? (
          <div className="bg-duo-green/10 border border-duo-green rounded-xl p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-duo-green mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-duo-green mb-1">
              {success.isCoordinator ? 'Coordinator Access Granted!' : 'Code Activated!'}
            </h3>
            <p className="text-wolf text-sm">
              {success.isCoordinator
                ? 'You now have coordinator privileges. Redirecting...'
                : 'Real competition is now unlocked. Redirecting...'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-bold text-eel mb-1">
                Competition Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., TEACH001 or MASTER001"
                className="input w-full font-mono text-center text-lg tracking-wider"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-wolf mt-1">
                Codes are case-insensitive
              </p>
            </div>

            {error && (
              <div className="bg-duo-red/10 border border-duo-red rounded-lg p-3">
                <p className="text-duo-red text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                'Activate Code'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-swan">
          <h4 className="font-bold text-eel text-sm mb-2">What codes do:</h4>
          <ul className="space-y-2 text-sm text-wolf">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-duo-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong className="text-eel">Teacher Code:</strong> Unlocks real competition mode</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-duo-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong className="text-eel">Master Code:</strong> Coordinator access to manage teachers and codes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
