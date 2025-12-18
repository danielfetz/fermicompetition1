import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'
import { verifyStudentToken } from '@/lib/jwt'

type FermiQuestion = {
  id: string
  prompt: string
  hint: string | null
  difficulty: number
  category: string
}

type ClassQuestionRaw = {
  id: string
  order: number
  competition_mode: string
  fermi_questions: FermiQuestion | FermiQuestion[] | null
}

// Helper to extract fermi question from either single object or array
function getFermiQuestion(fq: FermiQuestion | FermiQuestion[] | null): FermiQuestion | null {
  if (!fq) return null
  if (Array.isArray(fq)) return fq[0] || null
  return fq
}

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const supa = createSupabaseServiceRole()

  // Get student's competition mode from token if provided
  let competitionMode: 'mock' | 'real' = 'mock'
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

  if (token) {
    const payload = verifyStudentToken(token)
    if (payload) {
      // Get student's competition mode
      const { data: student } = await supa
        .from('students')
        .select('competition_mode')
        .eq('id', payload.studentId)
        .single()

      if (student?.competition_mode) {
        competitionMode = student.competition_mode as 'mock' | 'real'
      }
    }
  }

  // Get questions through class_questions join to fermi_questions, filtered by competition_mode
  const { data: classQuestions, error } = await supa
    .from('class_questions')
    .select(`
      id,
      order,
      competition_mode,
      fermi_questions (
        id,
        prompt,
        hint,
        difficulty,
        category
      )
    `)
    .eq('class_id', classId)
    .eq('competition_mode', competitionMode)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // If no questions found for this class and mode, try to seed them first
  if (!classQuestions || classQuestions.length === 0) {
    // Seed questions for this class and competition mode
    await supa.rpc('seed_class_questions', { p_class_id: classId, p_mode: competitionMode })

    // Try fetching again with competition mode filter
    const { data: seededQuestions, error: seededError } = await supa
      .from('class_questions')
      .select(`
        id,
        order,
        competition_mode,
        fermi_questions (
          id,
          prompt,
          hint,
          difficulty,
          category
        )
      `)
      .eq('class_id', classId)
      .eq('competition_mode', competitionMode)
      .order('order', { ascending: true })

    if (seededError) {
      return NextResponse.json({ error: seededError.message }, { status: 400 })
    }

    const questions = ((seededQuestions || []) as ClassQuestionRaw[]).map(cq => {
      const fq = getFermiQuestion(cq.fermi_questions)
      return {
        id: cq.id,
        prompt: fq?.prompt || '',
        hint: fq?.hint,
        order: cq.order
      }
    })

    return NextResponse.json({ questions })
  }

  // Format the response
  const questions = ((classQuestions || []) as ClassQuestionRaw[]).map(cq => {
    const fq = getFermiQuestion(cq.fermi_questions)
    return {
      id: cq.id,
      prompt: fq?.prompt || '',
      hint: fq?.hint,
      order: cq.order
    }
  })

  return NextResponse.json({ questions })
}
