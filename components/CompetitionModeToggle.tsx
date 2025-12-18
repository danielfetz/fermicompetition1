'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Props = {
  classId: string
  defaultMode?: 'mock' | 'real'
  realUnlocked?: boolean
}

export default function CompetitionModeToggle({ classId, defaultMode = 'mock', realUnlocked = false }: Props) {
  const [mode, setMode] = useState<'mock' | 'real'>(defaultMode)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(realUnlocked)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleRealClick = () => {
    if (unlocked) {
      setMode('real')
      setShowCodeInput(false)
    } else {
      setShowCodeInput(true)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('claim_code', { p_code: code.trim().toUpperCase() })

      if (rpcError) throw rpcError

      if (data?.success) {
        setUnlocked(true)
        setMode('real')
        setShowCodeInput(false)
        // Reload to reflect changes
        window.location.reload()
      } else {
        setError(data?.error || 'Invalid code')
      }
    } catch (err) {
      setError('Failed to verify code')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center bg-swan rounded-full p-1">
        <button
          onClick={() => {
            setMode('mock')
            setShowCodeInput(false)
          }}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            mode === 'mock'
              ? 'bg-duo-green text-white shadow-duo-green'
              : 'text-wolf hover:text-eel'
          }`}
        >
          Mock
        </button>
        <button
          onClick={handleRealClick}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            mode === 'real'
              ? 'bg-duo-blue text-white shadow-duo-blue'
              : unlocked
                ? 'text-wolf hover:text-eel'
                : 'text-hare hover:text-wolf'
          }`}
        >
          Real
          {!unlocked && <span className="ml-1 text-xs opacity-75">🔒</span>}
        </button>
      </div>

      {/* Code Input Popup */}
      {showCodeInput && !unlocked && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-swan p-4 z-50 w-72">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-eel text-sm">Enter Competition Code</h4>
            <button
              onClick={() => setShowCodeInput(false)}
              className="text-wolf hover:text-eel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleCodeSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TEACH001"
              className="input w-full mb-2 font-mono text-center tracking-wider"
              autoFocus
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-duo-red text-xs mb-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="btn btn-primary w-full text-sm"
            >
              {isSubmitting ? 'Verifying...' : 'Unlock Real Competition'}
            </button>
          </form>
          <p className="text-xs text-wolf mt-2 text-center">
            Get a code from your competition coordinator
          </p>
        </div>
      )}
    </div>
  )
}
