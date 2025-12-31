'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClassSchema } from '@/lib/validators'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

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

export default function NewClass() {
  const [name, setName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [country, setCountry] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025-26')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = createClassSchema.safeParse({ name })
    if (!parsed.success) {
      setError('Please check your inputs.')
      return
    }
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name,
        num_students: 0,
        teacher_id: user.id,
        school_name: schoolName || null,
        grade_level: gradeLevel || null,
        country: country || null,
        school_year: schoolYear
      })
      .select('id')
      .single()
    setLoading(false)
    if (error) setError(error.message)
    else {
      router.push(`/teacher/class/${data!.id}`)
      router.refresh()
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="happy" size="md" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-eel">Create a New Class</h1>
          <p className="text-wolf">Set up your class for the Fermi Competition</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="form-group">
            <label className="label" htmlFor="name">Class Name *</label>
            <input
              id="name"
              className="input"
              placeholder="e.g., Physics 101, Grade 8 Science"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="school">School Name (Optional)</label>
            <input
              id="school"
              className="input"
              placeholder="e.g., Lincoln High School"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="grade">Grade Level *</label>
            <select
              id="grade"
              className="input"
              value={gradeLevel}
              onChange={e => setGradeLevel(e.target.value)}
              required
            >
              <option value="">Select grade level...</option>
              {GRADE_LEVELS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="country">Country *</label>
            <select
              id="country"
              className="input"
              value={country}
              onChange={e => setCountry(e.target.value)}
              required
            >
              <option value="">Select country...</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="school-year">School Year *</label>
            <select
              id="school-year"
              className="input"
              value={schoolYear}
              onChange={e => setSchoolYear(e.target.value)}
              required
            >
              {SCHOOL_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Class'
            )}
          </button>
        </form>
      </div>

      {/* Info Card */}
      <div className="card bg-duo-blue/5 border-duo-blue/20">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-duo-blue/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-eel">What happens next?</h3>
            <p className="text-sm text-wolf mt-1">
              After creating your class, you&apos;ll be able to generate unique login
              credentials for each student with fun scientist-themed usernames!
            </p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link href="/teacher/dashboard" className="btn btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
