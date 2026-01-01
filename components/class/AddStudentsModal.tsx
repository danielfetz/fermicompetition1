'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CompetitionMode, StudentCredential } from '@/types/class'

type Props = {
  classId: string
  mode: CompetitionMode
  onClose: () => void
}

export default function AddStudentsModal({ classId, mode, onClose }: Props) {
  const router = useRouter()
  const [count, setCount] = useState(10)
  const [names, setNames] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StudentCredential[] | null>(null)
  const [copied, setCopied] = useState(false)

  function resetForm() {
    setCount(10)
    setNames('')
    setError(null)
    setResult(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (count < 1 || count > 200) {
      setError('Please enter a number between 1 and 200.')
      return
    }

    setLoading(true)
    setError(null)

    const parsedNames = names
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0)

    const res = await fetch(`/api/classes/${classId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, competition_mode: mode, names: parsedNames }),
    })

    setLoading(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Error' }))
      setError(body.error || 'Failed to generate credentials.')
      return
    }

    const data = await res.json()
    setResult(data.credentials)
    router.refresh()
  }

  function copyCredentials() {
    if (!result) return
    const text = result.map(r => `${r.username}\t${r.password}\t${r.full_name || ''}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadCredentials() {
    if (!result) return
    const csv = 'Username,Password,Name\n' + result.map(r => `${r.username},${r.password},${r.full_name || ''}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-credentials-${mode}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-eel">
              {result ? 'Credentials Generated!' : 'Add Students'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-wolf hover:text-eel hover:bg-snow rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {result ? (
            <div className="space-y-4">
              <p className="text-wolf text-center">
                {result.length} student accounts are ready.
              </p>

              <div className="bg-duo-yellow/10 border border-duo-yellow rounded-lg p-3">
                <p className="text-sm text-eel">
                  <strong>Note:</strong> These passwords are for <strong>{mode === 'real' ? 'Official Competition' : 'Practice'}</strong> mode only.
                  Passwords for the other mode are different — use the mode toggle to view them.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={copyCredentials} className="btn btn-secondary btn-sm">
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy All
                    </>
                  )}
                </button>
                <button onClick={downloadCredentials} className="btn btn-outline btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-snow sticky top-0">
                    <tr className="text-left">
                      <th className="py-2 px-3 font-bold text-wolf text-xs">#</th>
                      <th className="py-2 px-3 font-bold text-wolf text-xs">Username</th>
                      <th className="py-2 px-3 font-bold text-wolf text-xs">Password</th>
                      <th className="py-2 px-3 font-bold text-wolf text-xs">Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-swan">
                    {result.map((r, i) => (
                      <tr key={i} className="hover:bg-snow">
                        <td className="py-2 px-3 text-wolf">{i + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-duo-blue text-xs">{r.username}</td>
                        <td className="py-2 px-3 font-mono text-eel text-xs">{r.password}</td>
                        <td className="py-2 px-3 text-eel text-xs">{r.full_name || <span className="text-hare">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="btn btn-outline flex-1">
                  Add More
                </button>
                <button onClick={onClose} className="btn btn-primary flex-1">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label" htmlFor="add-count">How many students?</label>
                <input
                  id="add-count"
                  type="number"
                  min={1}
                  max={200}
                  className="input"
                  value={count}
                  onChange={e => setCount(parseInt(e.target.value || '0'))}
                  required
                />
                <p className="text-sm text-wolf mt-1">Enter a number between 1 and 200</p>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="add-names">Student names (optional)</label>
                <textarea
                  id="add-names"
                  className="input min-h-[80px]"
                  value={names}
                  onChange={e => setNames(e.target.value)}
                  placeholder="Daniel M, Fred T, Michael G"
                />
                <p className="text-sm text-wolf mt-1">Enter names separated by commas</p>
              </div>

              {error && (
                <div className="bg-duo-red/10 border-2 border-duo-red rounded-duo p-3">
                  <p className="text-duo-red-dark text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading || count < 1}
                >
                  {loading ? 'Generating...' : `Add ${count} Students`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
