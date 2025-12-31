/**
 * Types for class-related data structures.
 */

export type CompetitionMode = 'mock' | 'real'

export type Student = {
  id: string
  username: string
  full_name: string | null
  has_completed_exam: boolean
  plain_password: string | null
  competition_mode?: string
}

export type Score = {
  student_id: string
  correct_count: number
  total_answered: number
  score_percentage: number
  competition_mode?: string
  confidence_points?: number
}

export type StudentCredential = {
  username: string
  password: string
  full_name?: string
}
