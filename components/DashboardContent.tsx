'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'
import CoordinatorSection from '@/components/CoordinatorSection'
import { supabase } from '@/lib/supabaseClient'

const GRADE_LEVELS = [
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12-13', label: '12th/13th Grade' },
  { value: 'university', label: 'University' },
]

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Ireland', 'New Zealand',
  'India', 'Singapore', 'Hong Kong', 'Japan', 'South Korea', 'China', 'Taiwan',
  'Brazil', 'Mexico', 'Argentina', 'Spain', 'Italy', 'Portugal', 'Poland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Czech Republic', 'Hungary',
  'South Africa', 'Nigeria', 'Kenya', 'Israel', 'United Arab Emirates',
  'Saudi Arabia', 'Turkey', 'Russia', 'Ukraine', 'Indonesia', 'Malaysia',
  'Thailand', 'Vietnam', 'Philippines', 'Pakistan', 'Bangladesh', 'Other'
]

const SCHOOL_YEARS = [
  '2024-25',
  '2025-26',
  '2026-27',
  '2027-28',
]

type ClassData = {
  id: string
  name: string
  num_students: number
  school_name: string | null
  created_at: string
}

type Props = {
  classes: ClassData[]
  isCoordinator: boolean
  hasCode: boolean
  masterCodeId?: string | null
  masterCodeName?: string | null
  userId: string
}

export default function DashboardContent({
  classes,
  isCoordinator,
  hasCode,
  masterCodeId,
  masterCodeName,
  userId
}: Props) {
  const router = useRouter()
  const [showNewClassModal, setShowNewClassModal] = useState(false)

  // New class form state
  const [name, setName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [country, setCountry] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025-26')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setName('')
    setSchoolName('')
    setGradeLevel('')
    setCountry('')
    setSchoolYear('2025-26')
    setError(null)
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a class name.')
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('classes')
      .insert({
        name,
        num_students: 0,
        teacher_id: userId,
        school_name: schoolName || null,
        grade_level: gradeLevel || null,
        country: country || null,
        school_year: schoolYear
      })
      .select('id')
      .single()

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
    } else {
      setShowNewClassModal(false)
      resetForm()
      router.push(`/teacher/class/${data!.id}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-eel">Your Classes</h1>
          <p className="text-wolf">Manage your Fermi competitions</p>
        </div>
        <button onClick={() => setShowNewClassModal(true)} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Class
        </button>
      </div>

      {/* Coordinator Section - Only shown for master code holders */}
      {isCoordinator && masterCodeId && (
        <CoordinatorSection
          masterCodeId={masterCodeId}
          masterCodeName={masterCodeName || undefined}
        />
      )}

      {/* Classes Grid */}
      {classes?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {classes.map(c => (
            <Link key={c.id} href={`/teacher/class/${c.id}`} className="card-interactive block group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-eel truncate group-hover:text-duo-blue transition-colors">
                    {c.name}
                  </h2>
                  {c.school_name && (
                    <p className="text-sm text-wolf truncate">{c.school_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-blue">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {c.num_students} students
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-wolf group-hover:text-duo-blue transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-4 pt-4 border-t border-swan">
                <div className="flex items-center gap-2 text-sm text-wolf">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-4">
            <FermiMascot mood="encouraging" size="md" />
          </div>
          <h3 className="text-xl font-bold text-eel mb-2">No Classes Yet</h3>
          <p className="text-wolf mb-6">
            Create your first class to start the Fermi Competition with your students!
          </p>
          <button onClick={() => setShowNewClassModal(true)} className="btn btn-primary">
            Create Your First Class
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {classes && classes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-value text-duo-blue">{classes.length}</div>
            <div className="stat-label">Classes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-duo-green">
              {classes.reduce((sum, c) => sum + c.num_students, 0)}
            </div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-duo-yellow-dark">25</div>
            <div className="stat-label">Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-duo-purple">40</div>
            <div className="stat-label">Minutes</div>
          </div>
        </div>
      )}

      {/* Code Status & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-swan">
        {hasCode ? (
          <div className="flex items-center gap-2 text-sm text-duo-green">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isCoordinator ? 'Coordinator Code Active' : 'Competition Code Active'}
          </div>
        ) : (
          <Link href="/teacher/enter-code" className="btn btn-ghost !text-duo-green">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Enter Code
          </Link>
        )}
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="btn btn-ghost !text-wolf">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </form>
      </div>

      {/* New Class Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 !mt-0">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-eel">Create New Class</h2>
                <button
                  onClick={() => { setShowNewClassModal(false); resetForm() }}
                  className="p-2 text-wolf hover:text-eel hover:bg-snow rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="form-group">
                  <label className="label" htmlFor="new-class-name">Class Name *</label>
                  <input
                    id="new-class-name"
                    className="input"
                    placeholder="e.g., Physics 101, Grade 8 Science"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="new-class-school">School Name</label>
                  <input
                    id="new-class-school"
                    className="input"
                    placeholder="e.g., Lincoln High School"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="new-class-grade">Grade Level</label>
                  <select
                    id="new-class-grade"
                    className="input"
                    value={gradeLevel}
                    onChange={e => setGradeLevel(e.target.value)}
                  >
                    <option value="">Select grade level...</option>
                    {GRADE_LEVELS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="new-class-country">Country</label>
                  <select
                    id="new-class-country"
                    className="input"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="new-class-year">School Year</label>
                  <select
                    id="new-class-year"
                    className="input"
                    value={schoolYear}
                    onChange={e => setSchoolYear(e.target.value)}
                  >
                    {SCHOOL_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-duo-red/10 border-2 border-duo-red rounded-duo p-3">
                    <p className="text-duo-red-dark text-sm font-semibold">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowNewClassModal(false); resetForm() }}
                    className="btn btn-outline flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={loading || !name.trim()}
                  >
                    {loading ? 'Creating...' : 'Create Class'}
                  </button>
                </div>
              </form>

              {/* Info */}
              <div className="mt-4 pt-4 border-t border-swan">
                <div className="flex gap-3 text-sm">
                  <svg className="w-5 h-5 text-duo-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-wolf">
                    After creating your class, you&apos;ll be able to generate unique login credentials for each student.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
