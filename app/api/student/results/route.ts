import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'
import {
  assessAllBuckets,
  type CalibrationDataPoint,
} from '@/lib/calibration'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const payload = verifyStudentToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const supa = createSupabaseServiceRole()

  // Get student scores from the view
  const { data: scoreData, error: scoreError } = await supa
    .from('student_scores')
    .select('confidence_points, correct_count, total_answered, score_percentage')
    .eq('student_id', payload.studentId)
    .single()

  if (scoreError) {
    console.error('Error fetching score:', scoreError)
    return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 })
  }

  // Get detailed answer data for calibration calculation and question details
  // We need to know for each answer: confidence_pct, value, and question details
  const { data: answers, error: answersError } = await supa
    .from('answers')
    .select(`
      confidence_pct,
      value,
      class_question:class_questions!inner (
        order,
        fermi_question:fermi_questions!inner (
          prompt,
          correct_value
        )
      )
    `)
    .eq('student_id', payload.studentId)

  if (answersError) {
    console.error('Error fetching answers:', answersError)
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
  }

  // Calculate calibration data with Bayesian assessment per bucket
  // Group answers by confidence level and calculate accuracy for each
  const confidenceLevels = [10, 30, 50, 70, 90] as const
  const calibrationData = confidenceLevels.map(level => {
    const answersAtLevel = answers?.filter(a => a.confidence_pct === level) || []
    const totalAtLevel = answersAtLevel.length

    if (totalAtLevel === 0) {
      return {
        confidence: level,
        expectedAccuracy: level, // midpoint of range (10 = 0-20%, so 10%)
        actualAccuracy: null,
        count: 0,
        correctCount: 0
      }
    }

    // Check if each answer was correct (within factor of 2: between half and double)
    const correctAtLevel = answersAtLevel.filter(a => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const classQuestion = a.class_question as any
      const correctValue = classQuestion?.fermi_question?.correct_value as number | null
      if (correctValue === null || correctValue === undefined) return false
      return a.value >= correctValue * 0.5 && a.value <= correctValue * 2.0
    }).length

    return {
      confidence: level,
      expectedAccuracy: level,
      actualAccuracy: Math.round((correctAtLevel / totalAtLevel) * 100),
      count: totalAtLevel,
      correctCount: correctAtLevel
    }
  })

  // Assess calibration per bucket using Bayesian Beta Distribution
  const bucketStatuses = assessAllBuckets(calibrationData as CalibrationDataPoint[])

  // Build questions array with details for the accordion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (answers || []).map((a: any) => {
    const classQuestion = a.class_question
    const correctValue = classQuestion?.fermi_question?.correct_value as number | null
    const isCorrect = correctValue !== null && correctValue !== undefined
      ? a.value >= correctValue * 0.5 && a.value <= correctValue * 2.0
      : null

    // Calculate orders of magnitude difference (log10 ratio)
    let ordersDiff: number | null = null
    if (correctValue !== null && correctValue !== undefined && correctValue > 0 && a.value > 0) {
      ordersDiff = Math.round((Math.log10(a.value) - Math.log10(correctValue)) * 10) / 10
    }

    return {
      order: classQuestion?.order || 0,
      prompt: classQuestion?.fermi_question?.prompt || '',
      studentAnswer: a.value,
      confidence: a.confidence_pct,
      correctAnswer: correctValue,
      isCorrect,
      ordersDiff
    }
  }).sort((a: { order: number }, b: { order: number }) => a.order - b.order)

  return NextResponse.json({
    score: {
      confidencePoints: scoreData?.confidence_points || 250,
      correctCount: scoreData?.correct_count || 0,
      totalAnswered: scoreData?.total_answered || 0,
      scorePercentage: scoreData?.score_percentage || 0
    },
    calibration: {
      data: calibrationData,
      bucketStatuses
    },
    questions
  })
}
