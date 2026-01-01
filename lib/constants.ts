/**
 * Shared constants used across the application.
 */

export const GRADE_LEVELS = [
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
] as const

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Ireland', 'New Zealand',
  'India', 'Singapore', 'Hong Kong', 'Japan', 'South Korea', 'China', 'Taiwan',
  'Brazil', 'Mexico', 'Argentina', 'Spain', 'Italy', 'Portugal', 'Poland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Czech Republic', 'Hungary',
  'South Africa', 'Nigeria', 'Kenya', 'Israel', 'United Arab Emirates',
  'Saudi Arabia', 'Turkey', 'Russia', 'Ukraine', 'Indonesia', 'Malaysia',
  'Thailand', 'Vietnam', 'Philippines', 'Pakistan', 'Bangladesh', 'Other'
] as const

export const SCHOOL_YEARS = [
  '2024-25',
  '2025-26',
  '2026-27',
  '2027-28',
] as const

export type GradeLevel = typeof GRADE_LEVELS[number]['value']
export type Country = typeof COUNTRIES[number]
export type SchoolYear = typeof SCHOOL_YEARS[number]

/**
 * Get the display label for a grade level value.
 */
export function getGradeLabel(value: string): string {
  return GRADE_LEVELS.find(g => g.value === value)?.label || value
}
