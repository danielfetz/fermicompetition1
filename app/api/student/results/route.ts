import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentToken } from '@/lib/jwt'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

// Beta function approximation using Stirling's approximation for log-gamma
function logGamma(x: number): number {
  if (x <= 0) return Infinity
  if (x < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  // Stirling's approximation
  x -= 1
  const coefficients = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.001208650973866179, -0.000005395239384953
  ]
  let sum = 1.000000000190015
  for (let i = 0; i < 6; i++) {
    sum += coefficients[i] / (x + i + 1)
  }
  const t = x + 5.5
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum)
}

// Regularized incomplete beta function using continued fraction
function betaIncomplete(a: number, b: number, x: number): number {
  if (x === 0) return 0
  if (x === 1) return 1

  // Use symmetry for better convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betaIncomplete(b, a, 1 - x)
  }

  // Continued fraction (Lentz's algorithm)
  const maxIterations = 200
  const epsilon = 1e-10

  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a

  let f = 1, c = 1, d = 0

  for (let m = 0; m <= maxIterations; m++) {
    let numerator: number
    if (m === 0) {
      numerator = 1
    } else if (m % 2 === 0) {
      const k = m / 2
      numerator = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k))
    } else {
      const k = (m - 1) / 2
      numerator = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1))
    }

    d = 1 + numerator * d
    if (Math.abs(d) < epsilon) d = epsilon
    d = 1 / d

    c = 1 + numerator / c
    if (Math.abs(c) < epsilon) c = epsilon

    const delta = c * d
    f *= delta

    if (Math.abs(delta - 1) < epsilon) break
  }

  return front * (f - 1)
}

// Beta CDF: P(X <= x) where X ~ Beta(a, b)
function betaCDF(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return betaIncomplete(a, b, x)
}

// Bayesian calibration assessment for a single bucket
// Returns: 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'
function assessBucketCalibration(
  successes: number,
  total: number,
  expectedAccuracy: number
): { status: 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data', evidence: number } {
  if (total < 1) {
    return { status: 'insufficient-data', evidence: 0 }
  }

  const failures = total - successes
  // Posterior: Beta(1 + successes, 1 + failures) with uniform prior Beta(1,1)
  const alpha = 1 + successes
  const beta = 1 + failures

  // Expected accuracy as a proportion (0-1)
  const expected = expectedAccuracy / 100

  // Calculate posterior probability that true accuracy is below expected (overconfident)
  const probBelow = betaCDF(alpha, beta, expected)
  // Probability that true accuracy is above expected (underconfident)
  const probAbove = 1 - probBelow

  // Threshold for strong evidence (80% posterior probability)
  const threshold = 0.80

  if (probBelow > threshold) {
    // Strong evidence that true accuracy is below expected -> overconfident
    return { status: 'overconfident', evidence: probBelow }
  } else if (probAbove > threshold) {
    // Strong evidence that true accuracy is above expected -> underconfident
    return { status: 'underconfident', evidence: probAbove }
  } else {
    // No strong evidence either way -> well-calibrated
    return { status: 'well-calibrated', evidence: Math.max(probBelow, probAbove) }
  }
}

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

  // Determine overall calibration status using Bayesian Beta Distribution per bucket
  let calibrationStatus: 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

  const bucketsWithData = calibrationData.filter(d => d.count >= 1)
  const totalAnswersInBuckets = bucketsWithData.reduce((sum, d) => sum + d.count, 0)

  // Store per-bucket assessments for detailed feedback
  const bucketStatuses: { confidence: number; status: 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data' }[] = []

  if (bucketsWithData.length < 1 || totalAnswersInBuckets < 3) {
    calibrationStatus = 'insufficient-data'
  } else {
    // Assess each bucket independently using Bayesian Beta Distribution
    const bucketAssessments = bucketsWithData.map(bucket => {
      const assessment = assessBucketCalibration(
        bucket.correctCount,
        bucket.count,
        bucket.expectedAccuracy
      )
      // Store the bucket status for detailed feedback
      bucketStatuses.push({
        confidence: bucket.confidence,
        status: assessment.status
      })
      return {
        ...assessment,
        confidence: bucket.confidence,
        weight: bucket.count // Weight by number of answers in bucket
      }
    })

    // Aggregate bucket assessments using weighted voting
    let overconfidentWeight = 0
    let underconfidentWeight = 0
    let wellCalibratedWeight = 0
    let totalWeight = 0

    for (const assessment of bucketAssessments) {
      totalWeight += assessment.weight
      if (assessment.status === 'overconfident') {
        overconfidentWeight += assessment.weight * assessment.evidence
      } else if (assessment.status === 'underconfident') {
        underconfidentWeight += assessment.weight * assessment.evidence
      } else if (assessment.status === 'well-calibrated') {
        wellCalibratedWeight += assessment.weight
      }
    }

    // Normalize weights
    const normalizedOverconfident = overconfidentWeight / totalWeight
    const normalizedUnderconfident = underconfidentWeight / totalWeight
    const normalizedWellCalibrated = wellCalibratedWeight / totalWeight

    // Determine overall status based on strongest signal
    // Threshold: need at least 40% of weighted evidence to declare overconfident/underconfident
    const threshold = 0.40

    if (normalizedOverconfident > threshold && normalizedOverconfident > normalizedUnderconfident) {
      calibrationStatus = 'overconfident'
    } else if (normalizedUnderconfident > threshold && normalizedUnderconfident > normalizedOverconfident) {
      calibrationStatus = 'underconfident'
    } else {
      calibrationStatus = 'well-calibrated'
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
      status: calibrationStatus,
      bucketStatuses // Per-bucket calibration assessment
    }
  })
}
