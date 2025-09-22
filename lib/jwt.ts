import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export type StudentTokenPayload = {
  studentId: string
  classId: string
  role: 'student'
}

export function signStudentToken(payload: StudentTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

export function verifyStudentToken(token: string): StudentTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as StudentTokenPayload
  } catch {
    return null
  }
}

