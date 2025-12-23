'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function GenerateStudents() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') as 'mock' | 'real' | 'guest') || 'mock'

  const [count, setCount] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ username: string; password: string }[] | null>(null)
  const [copied, setCopied] = useState(false)

  const isReal = mode === 'real'
  const isGuest = mode === 'guest'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (count < 1 || count > 200) {
      setError('Please enter a number between 1 and 200.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await fetch(`/api/classes/${params.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, competition_mode: mode })
    })

    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Error' }))
      setError(body.error || 'Failed to generate credentials.')
      return
    }
    const data = await res.json()
    setResult(data.credentials)
  }

  function copyToClipboard() {
    if (!result) return
    const text = result.map(r => `${r.username}\t${r.password}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadCSV() {
    if (!result) return
    const csv = 'Username,Password\n' + result.map(r => `${r.username},${r.password}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-credentials-${mode}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <FermiMascot mood="celebrating" size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-eel">
              {isReal ? 'Official Competition ' : isGuest ? 'Guest Test ' : ''}Credentials Generated!
            </h1>
            <p className="text-wolf">
              {result.length} {isGuest ? 'guest' : 'student'} accounts are ready for the {isReal ? 'official' : isGuest ? 'guest test' : 'mock'} competition.
            </p>
          </div>
          {isReal && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-duo-blue/10 rounded-full">
              <span className="badge badge-blue">Official Competition</span>
              <span className="text-sm text-duo-blue font-semibold">25 official questions</span>
            </div>
          )}
          {isGuest && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-duo-purple/10 rounded-full">
              <span className="badge bg-duo-purple text-white">Guest Test</span>
              <span className="text-sm text-duo-purple font-semibold">25 fun test questions</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={copyToClipboard} className="btn btn-secondary">
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </>
            )}
          </button>
          <button onClick={downloadCSV} className="btn btn-outline">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
        </div>

        {/* Credentials Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-eel">Student Credentials</h2>
            <span className={`badge ${isReal ? 'badge-blue' : isGuest ? 'bg-duo-purple text-white' : 'badge-green'}`}>
              {result.length} {isGuest ? 'guests' : 'students'}
            </span>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b-2 border-swan">
                  <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">#</th>
                  <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Username</th>
                  <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-swan">
                {result.map((r, i) => (
                  <tr key={i} className="hover:bg-snow">
                    <td className="py-3 px-6 text-wolf">{i + 1}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-duo-blue">{r.username}</td>
                    <td className="py-3 px-4 font-mono text-eel">{r.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tip Card */}
        <div className={`card ${isReal ? 'bg-duo-blue/10 border-duo-blue/30' : isGuest ? 'bg-duo-purple/10 border-duo-purple/30' : 'bg-duo-yellow/10 border-duo-yellow/30'}`}>
          <div className="flex gap-3">
            <div className={`flex-shrink-0 w-10 h-10 ${isReal ? 'bg-duo-blue/30' : isGuest ? 'bg-duo-purple/30' : 'bg-duo-yellow/30'} rounded-full flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${isReal ? 'text-duo-blue' : isGuest ? 'text-duo-purple' : 'text-duo-yellow-dark'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${isReal ? 'text-duo-blue' : isGuest ? 'text-duo-purple' : 'text-duo-yellow-dark'}`}>
                {isReal ? 'Official Competition Mode' : isGuest ? 'Guest Test Mode' : 'Pro Tip'}
              </h3>
              <p className="text-sm text-eel mt-1">
                {isReal
                  ? 'These credentials are for the official competition with 25 official questions. Students cannot use mock credentials for the official competition.'
                  : isGuest
                  ? 'These credentials are for guests (parents, prospective students) to try out the system with 25 fun test questions. Great for demos and preparation!'
                  : 'Students will enter their full name when they first log in. The fun scientist-themed usernames make credentials easy to distribute!'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-center">
          <button onClick={() => setResult(null)} className="btn btn-outline">
            Generate More
          </button>
          <button onClick={() => {
            router.push(`/teacher/class/${params.id}?mode=${mode}`)
            router.refresh() // Force refetch of server component data
          }} className="btn btn-primary">
            View Class
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="happy" size="md" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">
            Generate {isReal ? 'Official Competition ' : isGuest ? 'Guest Test ' : ''}Credentials
          </h1>
          <p className="text-wolf">
            {isReal
              ? 'Create credentials for the official Fermi Competition with 25 official questions.'
              : isGuest
              ? 'Create guest credentials for parents or students to try out the system with fun test questions!'
              : 'Create unique login credentials for your students with fun scientist-themed usernames!'}
          </p>
        </div>
        {isReal && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-duo-blue/10 rounded-full">
            <span className="badge badge-blue">Official Competition</span>
          </div>
        )}
        {isGuest && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-duo-purple/10 rounded-full">
            <span className="badge bg-duo-purple text-white">Guest Test</span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="form-group">
            <label className="label" htmlFor="count">How many students?</label>
            <input
              id="count"
              type="number"
              min={1}
              max={200}
              className="input"
              value={count}
              onChange={e => setCount(parseInt(e.target.value || '0'))}
              required
            />
            <p className="text-sm text-wolf mt-1">
              Enter a number between 1 and 200
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

          <button className={`btn ${isReal ? 'btn-secondary' : isGuest ? 'bg-duo-purple hover:bg-duo-purple/90 text-white border-0' : 'btn-primary'} w-full`} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate {count} {isReal ? 'Official ' : isGuest ? 'Guest ' : ''}Credentials
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Card */}
      <div className={`card ${isReal ? 'bg-duo-blue/5 border-duo-blue/20' : isGuest ? 'bg-duo-purple/5 border-duo-purple/20' : 'bg-duo-green/5 border-duo-green/20'}`}>
        <h3 className="font-bold text-eel mb-3">
          {isReal ? 'Official Competition Info:' : isGuest ? 'Guest Test Info:' : 'What you\'ll get:'}
        </h3>
        <ul className="space-y-2">
          {isReal ? (
            <>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                25 official Fermi estimation questions
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Separate credentials from mock competition
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Results tracked separately for ranking
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                70-minute timed examination
              </li>
            </>
          ) : isGuest ? (
            <>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                25 fun, accessible test questions
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Perfect for parents and prospective students
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Different questions from practice &amp; official
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Great for demos and preparation
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fun usernames like &quot;cosmicfermi01&quot; or &quot;quantumeinstein02&quot;
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure, easy-to-type passwords
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Students enter their name on first login
              </li>
              <li className="flex items-start gap-2 text-sm text-wolf">
                <svg className="w-5 h-5 text-duo-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copy or download as CSV to share
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <button onClick={() => {
          router.push(`/teacher/class/${params.id}?mode=${mode}`)
          router.refresh()
        }} className="btn btn-ghost btn-sm font-semibold text-duo-blue">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Class
        </button>
      </div>
    </div>
  )
}
