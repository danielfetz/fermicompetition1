'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GRADE_LEVELS, COUNTRIES, SCHOOL_YEARS } from '@/lib/constants'

type Props = {
  classId: string
  initialName: string
  initialSchool: string | null
  initialGrade: string | null
  initialCountry: string | null
  initialSchoolYear: string | null
  onClose: () => void
}

export default function EditClassModal({
  classId,
  initialName,
  initialSchool,
  initialGrade,
  initialCountry,
  initialSchoolYear,
  onClose,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [school, setSchool] = useState(initialSchool || '')
  const [grade, setGrade] = useState(initialGrade || '')
  const [country, setCountry] = useState(initialCountry || '')
  const [schoolYear, setSchoolYear] = useState(initialSchoolYear || '2025-26')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/classes/${classId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        school_name: school,
        grade_level: grade,
        country,
        school_year: schoolYear,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Error' }))
      setError(body.error || 'Failed to update class')
      return
    }

    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-eel">Edit Class</h2>
            <button
              onClick={onClose}
              className="p-2 text-wolf hover:text-eel hover:bg-snow rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="edit-name">Class Name *</label>
              <input
                id="edit-name"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="edit-school">School Name</label>
              <input
                id="edit-school"
                className="input"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="e.g., Lincoln High School"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="edit-grade">Grade Level</label>
              <select
                id="edit-grade"
                className="input"
                value={grade}
                onChange={e => setGrade(e.target.value)}
              >
                <option value="">Select grade level...</option>
                {GRADE_LEVELS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="edit-country">Country</label>
              <select
                id="edit-country"
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
              <label className="label" htmlFor="edit-school-year">School Year</label>
              <select
                id="edit-school-year"
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
                onClick={onClose}
                className="btn btn-outline flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary flex-1"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
