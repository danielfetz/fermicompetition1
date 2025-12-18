import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

type FermiQuestion = {
  id: string
  prompt: string
  hint: string | null
  difficulty: number
  category: string
}

type ClassQuestion = {
  id: string
  order: number
  fermi_questions: FermiQuestion | null
}

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const supa = createSupabaseServiceRole()

  // Get questions through class_questions join to fermi_questions
  const { data: classQuestions, error } = await supa
    .from('class_questions')
    .select(`
      id,
      order,
      fermi_questions (
        id,
        prompt,
        hint,
        difficulty,
        category
      )
    `)
    .eq('class_id', classId)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // If no questions found for this class, try to seed them first
  if (!classQuestions || classQuestions.length === 0) {
    // Seed default questions for this class
    await supa.rpc('seed_class_questions', { p_class_id: classId })

    // Try fetching again
    const { data: seededQuestions, error: seededError } = await supa
      .from('class_questions')
      .select(`
        id,
        order,
        fermi_questions (
          id,
          prompt,
          hint,
          difficulty,
          category
        )
      `)
      .eq('class_id', classId)
      .order('order', { ascending: true })

    if (seededError) {
      return NextResponse.json({ error: seededError.message }, { status: 400 })
    }

    const questions = (seededQuestions as ClassQuestion[] || []).map(cq => ({
      id: cq.id,
      prompt: cq.fermi_questions?.prompt || '',
      hint: cq.fermi_questions?.hint,
      order: cq.order
    }))

    return NextResponse.json({ questions })
  }

  // Format the response
  const questions = (classQuestions as ClassQuestion[]).map(cq => ({
    id: cq.id,
    prompt: cq.fermi_questions?.prompt || '',
    hint: cq.fermi_questions?.hint,
    order: cq.order
  }))

  return NextResponse.json({ questions })
}
