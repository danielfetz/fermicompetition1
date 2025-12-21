import { z } from 'zod'

export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  num_students: z.number().int().min(1).max(200)
})

export const generateStudentsSchema = z.object({
  count: z.number().int().min(1).max(500).optional(),
  prefix: z.string().min(2).max(12).optional()
})

export const studentLoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(3).max(100)
})

export const upsertAnswerSchema = z.object({
  question_id: z.string().min(1), // Just require non-empty string, not strict UUID
  value: z.number(), // Allow any number
  confidence_pct: z.number().int().min(10).max(90) // More permissive: any int 10-90
})

export const upsertAnswersSchema = z.object({
  answers: z.array(upsertAnswerSchema).min(0).max(50), // Allow empty array and more questions
  submit: z.boolean().optional(), // Only mark exam as complete when true
  token: z.string().optional() // Token can be passed in body for sendBeacon
})

