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
  value: z.number().finite(), // Allow any finite number (including negative for edge cases)
  confidence_pct: z.union([
    z.literal(10),
    z.literal(30),
    z.literal(50),
    z.literal(70),
    z.literal(90)
  ])
})

export const upsertAnswersSchema = z.object({
  answers: z.array(upsertAnswerSchema).min(1).max(20), // Support up to 20 questions (mock: 10, official: 15)
  submit: z.boolean().optional(), // Only mark exam as complete when true
  token: z.string().optional() // Token can be passed in body for sendBeacon
})

