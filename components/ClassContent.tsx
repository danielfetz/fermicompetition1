'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CompetitionModeToggle from './CompetitionModeToggle'
import OfficialCompetitionCodeEntry from './OfficialCompetitionCodeEntry'
import CompetitionCountdown, { isCompetitionStarted } from './CompetitionCountdown'

type CompetitionMode = 'mock' | 'real'

type Student = {
  id: string
  username: string
  full_name: string | null
  has_completed_exam: boolean
  plain_password: string | null
  competition_mode?: string
}

type Score = {
  student_id: string
  correct_count: number
  total_answered: number
  score_percentage: number
  competition_mode?: string
  confidence_points?: number
}

type Props = {
  classId: string
  className: string
  schoolName: string | null
  numStudents: number
  students: Student[]
  scores: Score[]
  realUnlocked: boolean
  initialMode?: CompetitionMode
}

export default function ClassContent({
  classId,
  className,
  schoolName,
  numStudents,
  students,
  scores,
  realUnlocked: initialRealUnlocked,
  initialMode = 'mock'
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<CompetitionMode>(initialMode)
  const [realUnlocked, setRealUnlocked] = useState(initialRealUnlocked)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [competitionStarted, setCompetitionStarted] = useState(false)
  const [sortColumn, setSortColumn] = useState<'username' | 'full_name' | 'status' | 'accuracy' | 'points'>('username')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [autoGenError, setAutoGenError] = useState<string | null>(null)

  // Check access client-side on mount using API endpoint for reliability
  useEffect(() => {
    async function checkRealAccess() {
      if (realUnlocked) return // Already unlocked

      setCheckingAccess(true)
      try {
        const res = await fetch('/api/check-real-access')
        if (res.ok) {
          const data = await res.json()
          if (data.unlocked) {
            setRealUnlocked(true)
          }
        }
      } catch (err) {
        console.error('Error checking access:', err)
      }
      setCheckingAccess(false)
    }

    checkRealAccess()
  }, [realUnlocked])

  // Check if competition has started (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setCompetitionStarted(isCompetitionStarted())
    // Check every minute in case the page is open when competition starts
    const timer = setInterval(() => {
      setCompetitionStarted(isCompetitionStarted())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Filter students by mode
  const mockStudents = students.filter(s => (s.competition_mode || 'mock') === 'mock')
  const realStudents = students.filter(s => (s.competition_mode || 'mock') === 'real')
  const filteredStudents = mode === 'real' ? realStudents : mockStudents
  const filteredScores = scores.filter(sc => (sc.competition_mode || 'mock') === mode)

  // Auto-generate credentials when viewing a mode that has no students
  // but the OTHER mode has students (bidirectional)
  const autoGenerateCredentials = useCallback(async (targetMode: 'mock' | 'real') => {
    if (autoGenerating) return

    setAutoGenerating(true)
    setAutoGenError(null)

    try {
      const res = await fetch(`/api/classes/${classId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_mode: targetMode })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Error' }))
        setAutoGenError(body.error || 'Failed to generate credentials.')
      } else {
        // Refresh the page to get new students
        router.refresh()
      }
    } catch (err) {
      setAutoGenError('Failed to generate credentials.')
    }

    setAutoGenerating(false)
  }, [classId, autoGenerating, router])

  useEffect(() => {
    // Auto-generate for real mode: when real is unlocked, competition started, mock students exist but no real
    if (
      mode === 'real' &&
      realUnlocked &&
      competitionStarted &&
      mockStudents.length > 0 &&
      realStudents.length === 0 &&
      !autoGenerating &&
      !autoGenError
    ) {
      autoGenerateCredentials('real')
    }
    // Auto-generate for mock mode: when real students exist but no mock
    else if (
      mode === 'mock' &&
      realStudents.length > 0 &&
      mockStudents.length === 0 &&
      !autoGenerating &&
      !autoGenError
    ) {
      autoGenerateCredentials('mock')
    }
  }, [mode, realUnlocked, competitionStarted, mockStudents.length, realStudents.length, autoGenerating, autoGenError, autoGenerateCredentials])

  // Create a map for quick score lookup
  const scoreMap = new Map(filteredScores.map(sc => [sc.student_id, sc]))

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const scoreA = scoreMap.get(a.id)
    const scoreB = scoreMap.get(b.id)
    let comparison = 0

    switch (sortColumn) {
      case 'username':
        comparison = a.username.localeCompare(b.username)
        break
      case 'full_name':
        // Put students without names at the end (regardless of sort direction)
        if (!a.full_name && !b.full_name) return 0
        if (!a.full_name) return 1  // a goes after b
        if (!b.full_name) return -1 // b goes after a
        comparison = a.full_name.localeCompare(b.full_name)
        break
      case 'status':
        comparison = (a.has_completed_exam ? 1 : 0) - (b.has_completed_exam ? 1 : 0)
        break
      case 'accuracy':
        // Put students without answers at the end (regardless of sort direction)
        const hasAccA = scoreA?.total_answered && scoreA.total_answered > 0
        const hasAccB = scoreB?.total_answered && scoreB.total_answered > 0
        if (!hasAccA && !hasAccB) return 0
        if (!hasAccA) return 1
        if (!hasAccB) return -1
        comparison = (scoreA!.correct_count / scoreA!.total_answered) - (scoreB!.correct_count / scoreB!.total_answered)
        break
      case 'points':
        const ptsA = scoreA?.confidence_points ?? 250
        const ptsB = scoreB?.confidence_points ?? 250
        comparison = ptsA - ptsB
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ column }: { column: typeof sortColumn }) => (
    <svg className={`w-4 h-4 inline ml-1 ${sortColumn === column ? 'text-duo-blue' : 'text-hare'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {sortColumn === column && sortDirection === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      )}
    </svg>
  )

  const studentsGenerated = filteredStudents.length
  const studentsCompleted = filteredStudents.filter(s => s.has_completed_exam).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <Link href="/teacher/dashboard" className="text-sm font-semibold text-duo-blue hover:underline mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-eel">{className}</h1>
          {schoolName && <p className="text-wolf">{schoolName}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CompetitionModeToggle
            classId={classId}
            defaultMode={initialMode}
            realUnlocked={realUnlocked}
            onModeChange={setMode}
          />
          {(mode === 'mock' || (mode === 'real' && realUnlocked && competitionStarted)) && (
            <Link className="btn btn-primary" href={`/teacher/class/${classId}/generate?mode=${mode}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Students
            </Link>
          )}
        </div>
      </div>

      {/* Show loading state while checking access */}
      {mode === 'real' && !realUnlocked && checkingAccess ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-duo-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">Checking access...</p>
        </div>
      ) : mode === 'real' && !realUnlocked ? (
        <OfficialCompetitionCodeEntry onSuccess={() => setRealUnlocked(true)} />
      ) : mode === 'real' && !competitionStarted ? (
        <CompetitionCountdown />
      ) : autoGenerating ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-duo-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">Generating {mode === 'real' ? 'official' : 'practice'} competition credentials...</p>
          <p className="text-sm text-hare mt-2">Using same usernames with new passwords</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-value text-duo-blue">{studentsGenerated}</div>
              <div className="stat-label">Generated</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-duo-green">{studentsCompleted}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-duo-yellow-dark">{studentsGenerated - studentsCompleted}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-duo-purple">25</div>
              <div className="stat-label">Questions</div>
            </div>
          </div>

          {/* Students Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-eel">Students</h2>
              <div className="flex items-center gap-2">
                {filteredStudents.length > 0 && (
                  <>
                    <div className="relative group">
                      <button
                        onClick={() => {
                          const text = filteredStudents.map(s => `${s.username}\t${s.plain_password || ''}\t${s.full_name || ''}`).join('\n')
                          navigator.clipboard.writeText(text)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="icon-btn"
                      >
                        {copied ? (
                          <svg className="w-5 h-5 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-semibold text-white bg-eel rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {copied ? 'Copied!' : 'Copy all credentials'}
                      </span>
                    </div>
                    <div className="relative group">
                      <button
                        onClick={() => {
                          const csv = 'Username,Password,Name\n' + filteredStudents.map(s => `${s.username},${s.plain_password || ''},${s.full_name || ''}`).join('\n')
                          const blob = new Blob([csv], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `student-credentials-${mode}.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="icon-btn"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-semibold text-white bg-eel rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Download as CSV
                      </span>
                    </div>
                  </>
                )}
                <span className="badge badge-blue">{studentsGenerated} generated</span>
              </div>
            </div>

            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-swan">
                      <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none" onClick={() => handleSort('username')}>
                        Username<SortIcon column="username" />
                      </th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Password</th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none" onClick={() => handleSort('full_name')}>
                        Full Name<SortIcon column="full_name" />
                      </th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none" onClick={() => handleSort('status')}>
                        Status<SortIcon column="status" />
                      </th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none" onClick={() => handleSort('accuracy')}>
                        Accuracy<SortIcon column="accuracy" />
                      </th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none" onClick={() => handleSort('points')}>
                        Points<SortIcon column="points" />
                      </th>
                      <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-swan">
                    {sortedStudents.map(s => {
                      const score = scoreMap.get(s.id)
                      const correct = score?.correct_count ?? 0
                      const total = score?.total_answered ?? 0
                      const maxQuestions = 25

                      return (
                        <tr key={s.id} className="hover:bg-snow transition-colors">
                          <td className="py-3 px-6">
                            <span className="font-mono font-semibold text-eel">{s.username}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-wolf">{s.plain_password || '••••••••'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {s.full_name ? (
                              <span className="text-eel">{s.full_name}</span>
                            ) : (
                              <span className="text-hare italic">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {s.has_completed_exam ? (
                              <span className="badge badge-green">Completed</span>
                            ) : (
                              <span className="badge badge-yellow">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {total > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${correct >= total/2 ? 'text-duo-green' : correct >= total/3 ? 'text-duo-yellow-dark' : 'text-duo-red'}`}>
                                  {correct}/{total}
                                </span>
                                <div className="w-16 h-2 bg-swan rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${correct >= total/2 ? 'bg-duo-green' : correct >= total/3 ? 'bg-duo-yellow' : 'bg-duo-red'}`}
                                    style={{ width: `${(correct / total) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-hare">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {total > 0 ? (
                              <span className={`font-bold ${(score?.confidence_points ?? 250) >= 250 ? 'text-duo-green' : (score?.confidence_points ?? 250) >= 200 ? 'text-duo-yellow-dark' : 'text-duo-red'}`}>
                                {score?.confidence_points ?? 250}
                              </span>
                            ) : (
                              <span className="text-hare">250</span>
                            )}
                          </td>
                          <td className="py-3 px-6">
                            <Link
                              href={`/teacher/class/${classId}/student/${s.id}?mode=${mode}`}
                              className="text-duo-blue font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              View/Edit
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-swan rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-wolf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                {autoGenError ? (
                  <>
                    <h3 className="text-lg font-bold text-duo-red mb-2">Error Generating Credentials</h3>
                    <p className="text-wolf mb-4">{autoGenError}</p>
                    <button onClick={() => { setAutoGenError(null); autoGenerateCredentials(mode); }} className="btn btn-primary">
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-eel mb-2">No Students Yet</h3>
                    <p className="text-wolf mb-4">
                      Add students to get started. Credentials will auto-generate for the other mode using the same usernames.
                    </p>
                    <Link href={`/teacher/class/${classId}/generate?mode=${mode}`} className="btn btn-primary">
                      Add Students
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
