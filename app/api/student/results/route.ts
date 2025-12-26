import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

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

  // Get detailed answer data for calibration calculation
  // We need to know for each answer: confidence_pct and whether it was correct
  const { data: answers, error: answersError } = await supa
    .from('answers')
    .select(`
      confidence_pct,
      value,
      class_question:class_questions!inner (
        fermi_question:fermi_questions!inner (
          correct_value
        )
      )
    `)
    .eq('student_id', payload.studentId)

  if (answersError) {
    console.error('Error fetching answers:', answersError)
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
  }

  // Calculate calibration data
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
        count: 0
      }
    }

    // Check if each answer was correct (within factor of 2 of correct value)
    const correctAtLevel = answersAtLevel.filter(a => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const classQuestion = a.class_question as any
      const correctValue = classQuestion?.fermi_question?.correct_value as number | null
      if (correctValue === null || correctValue === undefined) return false
      return a.value >= correctValue * 0.5 && a.value <= correctValue * 2
    }).length

    return {
      confidence: level,
      expectedAccuracy: level,
      actualAccuracy: Math.round((correctAtLevel / totalAtLevel) * 100),
      count: totalAtLevel
    }
  })

  // Determine overall calibration status
  let calibrationStatus: 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

  const dataPoints = calibrationData.filter(d => d.actualAccuracy !== null && d.count >= 1)
  if (dataPoints.length < 2) {
    calibrationStatus = 'insufficient-data'
  } else {
    // Calculate average deviation from perfect calibration
    const totalDeviation = dataPoints.reduce((sum, d) => {
      return sum + ((d.actualAccuracy || 0) - d.expectedAccuracy)
    }, 0)
    const avgDeviation = totalDeviation / dataPoints.length

    if (Math.abs(avgDeviation) < 10) {
      calibrationStatus = 'well-calibrated'
    } else if (avgDeviation < 0) {
      calibrationStatus = 'overconfident'
    } else {
      calibrationStatus = 'underconfident'
    }
  }

  return NextResponse.json({
    score: {
      confidencePoints: scoreData?.confidence_points || 250,
      correctCount: scoreData?.correct_count || 0,
      totalAnswered: scoreData?.total_answered || 0,
      scorePercentage: scoreData?.score_percentage || 0
    },
    calibration: {
      data: calibrationData,
      status: calibrationStatus
    }
  })
}
