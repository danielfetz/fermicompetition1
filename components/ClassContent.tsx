'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CompetitionModeToggle from './CompetitionModeToggle'
import OfficialCompetitionCodeEntry from './OfficialCompetitionCodeEntry'

type Student = {
  id: string
  username: string
  full_name: string | null
  has_completed_exam: boolean
  plain_password: string | null
  competition_mode?: 'mock' | 'real'
}

type Score = {
  student_id: string
  correct_count: number
  total_answered: number
  score_percentage: number
  competition_mode?: 'mock' | 'real'
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
  initialMode?: 'mock' | 'real'
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
  const [mode, setMode] = useState<'mock' | 'real'>(initialMode)
  const [realUnlocked, setRealUnlocked] = useState(initialRealUnlocked)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [copied, setCopied] = useState(false)

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

  // Filter students and scores by current mode
  const filteredStudents = students.filter(s => (s.competition_mode || 'mock') === mode)
  const filteredScores = scores.filter(sc => (sc.competition_mode || 'mock') === mode)

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
          {(mode === 'mock' || realUnlocked) && (
            <Link className="btn btn-primary" href={`/teacher/class/${classId}/generate?mode=${mode}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Generate Credentials
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
              <div className="stat-value text-duo-purple">{mode === 'real' ? 15 : 10}</div>
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
                          const text = filteredStudents.map(s => `${s.username}\t${s.plain_password || ''}`).join('\n')
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
                          const csv = 'Username,Password\n' + filteredStudents.map(s => `${s.username},${s.plain_password || ''}`).join('\n')
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
                      <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">Username</th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Password</th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Full Name</th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Status</th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Accuracy</th>
                      <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Points</th>
                      <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-swan">
                    {filteredStudents.map(s => {
                      const score = filteredScores.find(x => x.student_id === s.id)
                      const correct = score?.correct_count ?? 0
                      const total = score?.total_answered ?? 0
                      const maxQuestions = mode === 'real' ? 15 : 10

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
                                <span className={`font-bold ${correct >= maxQuestions/2 ? 'text-duo-green' : correct >= maxQuestions/3 ? 'text-duo-yellow-dark' : 'text-duo-red'}`}>
                                  {correct}/{maxQuestions}
                                </span>
                                <div className="w-16 h-2 bg-swan rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${correct >= maxQuestions/2 ? 'bg-duo-green' : correct >= maxQuestions/3 ? 'bg-duo-yellow' : 'bg-duo-red'}`}
                                    style={{ width: `${(correct / maxQuestions) * 100}%` }}
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
                <h3 className="text-lg font-bold text-eel mb-2">
                  No {mode === 'real' ? 'Official Competition ' : ''}Students Yet
                </h3>
                <p className="text-wolf mb-4">
                  {mode === 'real'
                    ? 'Generate new credentials for the official competition. These are separate from mock credentials.'
                    : 'Generate credentials for your students to get started.'}
                </p>
                <Link href={`/teacher/class/${classId}/generate?mode=${mode}`} className="btn btn-primary">
                  Generate {mode === 'real' ? 'Official ' : ''}Credentials
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
