'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Student, Score, CompetitionMode } from '@/types/class'

type SortColumn = 'username' | 'full_name' | 'status' | 'accuracy' | 'points'
type SortDirection = 'asc' | 'desc'

type Props = {
  classId: string
  students: Student[]
  scores: Score[]
  mode: CompetitionMode
  onAddStudents: () => void
  hasPreviousYearStudents?: boolean
  schoolYear?: string | null
  onGenerateFromPreviousYear?: () => void
  autoGenError?: string | null
  onRetryGenerate?: () => void
}

function SortIcon({ column, currentColumn, direction }: {
  column: SortColumn
  currentColumn: SortColumn
  direction: SortDirection
}) {
  return (
    <svg
      className={`w-4 h-4 inline ml-1 ${currentColumn === column ? 'text-duo-blue' : 'text-hare'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {currentColumn === column && direction === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      )}
    </svg>
  )
}

export default function StudentTable({
  classId,
  students,
  scores,
  mode,
  onAddStudents,
  hasPreviousYearStudents = false,
  schoolYear,
  onGenerateFromPreviousYear,
  autoGenError,
  onRetryGenerate,
}: Props) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('username')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [copied, setCopied] = useState(false)

  const scoreMap = new Map(scores.map(sc => [sc.student_id, sc]))

  const sortedStudents = [...students].sort((a, b) => {
    const scoreA = scoreMap.get(a.id)
    const scoreB = scoreMap.get(b.id)
    let comparison = 0

    switch (sortColumn) {
      case 'username':
        comparison = a.username.localeCompare(b.username)
        break
      case 'full_name':
        if (!a.full_name && !b.full_name) return 0
        if (!a.full_name) return 1
        if (!b.full_name) return -1
        comparison = a.full_name.localeCompare(b.full_name)
        break
      case 'status':
        comparison = (a.has_completed_exam ? 1 : 0) - (b.has_completed_exam ? 1 : 0)
        break
      case 'accuracy':
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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const copyAllCredentials = () => {
    const text = students.map(s => `${s.username}\t${s.plain_password || ''}\t${s.full_name || ''}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCSV = () => {
    const csv = 'Username,Password,Name\n' + students.map(s => `${s.username},${s.plain_password || ''},${s.full_name || ''}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-credentials-${mode}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (students.length === 0) {
    if (hasPreviousYearStudents) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-duo-blue/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          {autoGenError ? (
            <>
              <h3 className="text-lg font-bold text-duo-red mb-2">Error Generating Credentials</h3>
              <p className="text-wolf mb-4">{autoGenError}</p>
              <button onClick={onRetryGenerate} className="btn btn-primary">
                Try Again
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-eel mb-2">New School Year</h3>
              <p className="text-wolf mb-2">
                This class has students from previous school years.
              </p>
              <p className="text-sm text-hare mb-6 max-w-md mx-auto">
                You can generate credentials for <strong>{schoolYear}</strong> using the same usernames and names from previous years. Each student will get a new password.
              </p>
              <button onClick={onGenerateFromPreviousYear} className="btn btn-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate from Previous Years
              </button>
            </>
          )}
        </div>
      )
    }

    return (
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
            <button onClick={onRetryGenerate} className="btn btn-primary">
              Try Again
            </button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-eel mb-2">No Students Yet</h3>
            <p className="text-wolf mb-4">
              Add students to get started. Credentials will auto-generate for the other mode using the same usernames.
            </p>
            <button onClick={onAddStudents} className="btn btn-primary">
              Add Students
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-eel">Students</h2>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button onClick={copyAllCredentials} className="icon-btn">
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
            <button onClick={downloadCSV} className="icon-btn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-semibold text-white bg-eel rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Download as CSV
            </span>
          </div>
          <span className="badge badge-blue">{students.length} generated</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b-2 border-swan">
              <th
                className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none"
                onClick={() => handleSort('username')}
              >
                Username<SortIcon column="username" currentColumn={sortColumn} direction={sortDirection} />
              </th>
              <th className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs">Password</th>
              <th
                className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none"
                onClick={() => handleSort('full_name')}
              >
                Full Name<SortIcon column="full_name" currentColumn={sortColumn} direction={sortDirection} />
              </th>
              <th
                className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none"
                onClick={() => handleSort('status')}
              >
                Status<SortIcon column="status" currentColumn={sortColumn} direction={sortDirection} />
              </th>
              <th
                className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none"
                onClick={() => handleSort('accuracy')}
              >
                Accuracy<SortIcon column="accuracy" currentColumn={sortColumn} direction={sortDirection} />
              </th>
              <th
                className="py-3 px-4 font-bold text-wolf uppercase tracking-wide text-xs cursor-pointer hover:text-eel select-none"
                onClick={() => handleSort('points')}
              >
                Points<SortIcon column="points" currentColumn={sortColumn} direction={sortDirection} />
              </th>
              <th className="py-3 px-6 font-bold text-wolf uppercase tracking-wide text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-swan">
            {sortedStudents.map(student => {
              const score = scoreMap.get(student.id)
              const correct = score?.correct_count ?? 0
              const total = score?.total_answered ?? 0

              return (
                <tr key={student.id} className="hover:bg-snow transition-colors">
                  <td className="py-3 px-6">
                    <span className="font-mono font-semibold text-eel">{student.username}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-wolf">{student.plain_password || '••••••••'}</span>
                  </td>
                  <td className="py-3 px-4">
                    {student.full_name ? (
                      <span className="text-eel">{student.full_name}</span>
                    ) : (
                      <span className="text-hare italic">Not set</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {student.has_completed_exam ? (
                      <span className="badge badge-green">Completed</span>
                    ) : (
                      <span className="badge badge-yellow">Pending</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {total > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${correct >= total / 2 ? 'text-duo-green' : correct >= total / 3 ? 'text-duo-yellow-dark' : 'text-duo-red'}`}>
                          {correct}/{total}
                        </span>
                        <div className="w-16 h-2 bg-swan rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${correct >= total / 2 ? 'bg-duo-green' : correct >= total / 3 ? 'bg-duo-yellow' : 'bg-duo-red'}`}
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
                      href={`/teacher/class/${classId}/student/${student.id}?mode=${mode}`}
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
    </>
  )
}
