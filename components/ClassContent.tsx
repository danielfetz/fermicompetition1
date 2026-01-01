'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CompetitionModeToggle from './CompetitionModeToggle'
import OfficialCompetitionCodeEntry from './OfficialCompetitionCodeEntry'
import CompetitionCountdown, { isCompetitionStarted } from './CompetitionCountdown'
import { ClassStats, StudentTable, EditClassModal, AddStudentsModal } from './class'
import { getGradeLabel } from '@/lib/constants'
import type { Student, Score, CompetitionMode } from '@/types/class'

type Props = {
  classId: string
  className: string
  schoolName: string | null
  gradeLevel: string | null
  country: string | null
  schoolYear: string | null
  numStudents: number
  students: Student[]
  scores: Score[]
  realUnlocked: boolean
  initialMode?: CompetitionMode
  hasPreviousYearStudents?: boolean
}

export default function ClassContent({
  classId,
  className,
  schoolName,
  gradeLevel,
  country,
  schoolYear,
  numStudents,
  students,
  scores,
  realUnlocked: initialRealUnlocked,
  initialMode = 'mock',
  hasPreviousYearStudents = false
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<CompetitionMode>(initialMode)
  const [realUnlocked, setRealUnlocked] = useState(initialRealUnlocked)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [competitionStarted, setCompetitionStarted] = useState(false)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [autoGenError, setAutoGenError] = useState<string | null>(null)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false)

  // Guard to prevent duplicate auto-generation
  const autoGenAttemptedRef = useRef(false)
  const prevSchoolYearRef = useRef(schoolYear)

  // Filter students by mode
  const mockStudents = students.filter(s => (s.competition_mode || 'mock') === 'mock')
  const realStudents = students.filter(s => (s.competition_mode || 'mock') === 'real')
  const filteredStudents = mode === 'real' ? realStudents : mockStudents
  const filteredScores = scores.filter(sc => (sc.competition_mode || 'mock') === mode)

  const studentsGenerated = filteredStudents.length
  const studentsCompleted = filteredStudents.filter(s => s.has_completed_exam).length

  // Check access client-side on mount
  useEffect(() => {
    async function checkRealAccess() {
      if (realUnlocked) return

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

  // Check if competition has started
  useEffect(() => {
    setCompetitionStarted(isCompetitionStarted())
    const timer = setInterval(() => {
      setCompetitionStarted(isCompetitionStarted())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Auto-generate credentials
  const autoGenerateCredentials = useCallback(async (targetMode: CompetitionMode) => {
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
        router.refresh()
      }
    } catch {
      setAutoGenError('Failed to generate credentials.')
    }

    setAutoGenerating(false)
  }, [classId, autoGenerating, router])

  // Reset auto-gen guard when school year changes
  useEffect(() => {
    if (prevSchoolYearRef.current !== schoolYear) {
      autoGenAttemptedRef.current = false
      prevSchoolYearRef.current = schoolYear
    }
  }, [schoolYear])

  // Auto-generate for mode switching
  useEffect(() => {
    if (autoGenAttemptedRef.current) return

    if (
      mode === 'real' &&
      realUnlocked &&
      competitionStarted &&
      mockStudents.length > 0 &&
      realStudents.length === 0 &&
      !autoGenerating &&
      !autoGenError
    ) {
      autoGenAttemptedRef.current = true
      autoGenerateCredentials('real')
    } else if (
      mode === 'mock' &&
      realStudents.length > 0 &&
      mockStudents.length === 0 &&
      !autoGenerating &&
      !autoGenError
    ) {
      autoGenAttemptedRef.current = true
      autoGenerateCredentials('mock')
    }
  }, [mode, realUnlocked, competitionStarted, mockStudents.length, realStudents.length, autoGenerating, autoGenError, autoGenerateCredentials])

  const handleGenerateFromPreviousYear = () => {
    autoGenAttemptedRef.current = true
    autoGenerateCredentials('mock')
  }

  const handleRetryGenerate = () => {
    setAutoGenError(null)
    autoGenAttemptedRef.current = false
    autoGenerateCredentials(mode)
  }

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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-eel">{className}</h1>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 text-wolf hover:text-duo-blue hover:bg-duo-blue/10 rounded-lg transition-colors"
              title="Edit class details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-wolf mt-1">
            {schoolName && <span>{schoolName}</span>}
            {schoolName && (gradeLevel || country || schoolYear) && <span>•</span>}
            {gradeLevel && <span>{getGradeLabel(gradeLevel)}</span>}
            {gradeLevel && (country || schoolYear) && <span>•</span>}
            {country && <span>{country}</span>}
            {country && schoolYear && <span>•</span>}
            {schoolYear && <span className="font-semibold text-duo-blue">{schoolYear}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CompetitionModeToggle
            classId={classId}
            defaultMode={initialMode}
            realUnlocked={realUnlocked}
            onModeChange={setMode}
          />
          {(mode === 'mock' || (mode === 'real' && realUnlocked && competitionStarted)) && (
            <button className="btn btn-primary" onClick={() => setShowAddStudentsModal(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Students
            </button>
          )}
        </div>
      </div>

      {/* Content based on state */}
      {mode === 'real' && !realUnlocked && checkingAccess ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-duo-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">Checking access...</p>
        </div>
      ) : mode === 'real' && !realUnlocked ? (
        <OfficialCompetitionCodeEntry onSuccess={() => {
          setRealUnlocked(true)
          router.refresh()
        }} />
      ) : mode === 'real' && !competitionStarted ? (
        <CompetitionCountdown />
      ) : autoGenerating ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-duo-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">
            {students.length === 0 && hasPreviousYearStudents
              ? `Generating credentials for ${schoolYear || 'new school year'}...`
              : `Generating ${mode === 'real' ? 'official' : 'practice'} competition credentials...`
            }
          </p>
          <p className="text-sm text-hare mt-2">
            {students.length === 0 && hasPreviousYearStudents
              ? 'Reusing usernames and names from previous year with new passwords'
              : 'Using same usernames with new passwords'
            }
          </p>
        </div>
      ) : (
        <>
          <ClassStats generated={studentsGenerated} completed={studentsCompleted} />

          <div className="card">
            <StudentTable
              classId={classId}
              students={filteredStudents}
              scores={filteredScores}
              mode={mode}
              onAddStudents={() => setShowAddStudentsModal(true)}
              hasPreviousYearStudents={hasPreviousYearStudents}
              schoolYear={schoolYear}
              onGenerateFromPreviousYear={handleGenerateFromPreviousYear}
              autoGenError={autoGenError}
              onRetryGenerate={handleRetryGenerate}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {showEditModal && (
        <EditClassModal
          classId={classId}
          initialName={className}
          initialSchool={schoolName}
          initialGrade={gradeLevel}
          initialCountry={country}
          initialSchoolYear={schoolYear}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAddStudentsModal && (
        <AddStudentsModal
          classId={classId}
          mode={mode}
          onClose={() => setShowAddStudentsModal(false)}
        />
      )}
    </div>
  )
}
