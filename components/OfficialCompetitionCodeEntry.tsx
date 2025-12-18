'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Props = {
  onSuccess?: () => void
}

export default function OfficialCompetitionCodeEntry({ onSuccess }: Props) {
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('claim_code', {
        p_code: code.trim().toUpperCase()
      })

      if (rpcError) throw rpcError

      if (data?.success) {
        // Call onSuccess callback if provided, otherwise reload
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.reload()
        }
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
    <div className="card text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-duo-blue/10 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 className="text-2xl font-extrabold text-eel mb-2">Official Competition Locked</h3>
        <p className="text-wolf mb-6">
          Enter your competition code to unlock the official Fermi Competition and access official questions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., TEACH001)"
              className="input w-full font-mono text-center text-lg tracking-wider"
              disabled={isSubmitting}
              autoFocus
            />
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
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Unlock Official Competition
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-swan">
          <h4 className="font-bold text-eel text-sm mb-3">How to get a code:</h4>
          <div className="grid gap-3 text-left">
            <div className="flex items-start gap-3 p-3 bg-snow rounded-lg">
              <div className="w-8 h-8 rounded-full bg-duo-green/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-duo-green">1</span>
              </div>
              <div>
                <p className="font-semibold text-eel text-sm">Teacher Code</p>
                <p className="text-wolf text-xs">Contact your school coordinator for a teacher code</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-snow rounded-lg">
              <div className="w-8 h-8 rounded-full bg-duo-purple/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-duo-purple">2</span>
              </div>
              <div>
                <p className="font-semibold text-eel text-sm">Coordinator Code</p>
                <p className="text-wolf text-xs">School coordinators receive master codes to manage their teachers</p>
              </div>
            </div>
          </div>
          <p className="text-wolf text-xs mt-4">
            Interested in participating with your class in the official competition (expected spring 2026)?{' '}
            Contact <a href="mailto:daniel@fermi.org" className="text-duo-blue hover:underline font-semibold">daniel@fermi.org</a> for an access code.
          </p>
        </div>
      </div>
    </div>
  )
}
