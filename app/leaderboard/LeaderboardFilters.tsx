'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Props = {
  gradeLevels: { value: string; label: string }[]
  countries: string[]
  schoolYears: string[]
  currentGrade: string
  currentCountry: string
  currentSchoolYear: string
}

export default function LeaderboardFilters({ gradeLevels, countries, schoolYears, currentGrade, currentCountry, currentSchoolYear }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/leaderboard?${params.toString()}`)
  }

  function clearFilters() {
    router.push('/leaderboard?year=2025-26')
  }

  const hasFilters = currentGrade || currentCountry || (currentSchoolYear && currentSchoolYear !== '2025-26')

  return (
    <div className="card mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[120px]">
          <label className="label" htmlFor="year-filter">School Year</label>
          <select
            id="year-filter"
            className="input"
            value={currentSchoolYear}
            onChange={e => updateFilter('year', e.target.value)}
          >
            {schoolYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="label" htmlFor="grade-filter">Grade Level</label>
          <select
            id="grade-filter"
            className="input"
            value={currentGrade}
            onChange={e => updateFilter('grade', e.target.value)}
          >
            <option value="">All grades</option>
            {gradeLevels.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="label" htmlFor="country-filter">Country</label>
          <select
            id="country-filter"
            className="input"
            value={currentCountry}
            onChange={e => updateFilter('country', e.target.value)}
          >
            <option value="">All countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-outline btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
