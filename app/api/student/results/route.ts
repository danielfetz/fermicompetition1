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

// Confidence bucket ranges (the actual ranges users select)
const CONFIDENCE_RANGES: Record<number, { lower: number; upper: number }> = {
  10: { lower: 0, upper: 20 },
  30: { lower: 20, upper: 40 },
  50: { lower: 40, upper: 60 },
  70: { lower: 60, upper: 80 },
  90: { lower: 80, upper: 100 }
}

// Bucket-specific minimum sample sizes for reliable assessment
// Edge buckets (0-20%, 80-100%) need fewer samples since they're at extremes
const BUCKET_MIN_SAMPLES: Record<number, number> = {
  10: 2,  // 0-20%: n=2 minimum
  30: 3,  // 20-40%: n=3 minimum
  50: 4,  // 40-60%: n=4 minimum
  70: 3,  // 60-80%: n=3 minimum
  90: 2   // 80-100%: n=2 minimum
}

// Detailed calibration status with gradations
type DetailedCalibrationStatus =
  | 'decisive-overconfidence'
  | 'very-strong-overconfidence'
  | 'strong-overconfidence'
  | 'moderate-overconfidence'
  | 'decisive-underconfidence'
  | 'very-strong-underconfidence'
  | 'strong-underconfidence'
  | 'moderate-underconfidence'
  | 'good-calibration'
  | 'no-miscalibration-evidence'
  | 'insufficient-data'

// Simplified status for overall assessment
type SimpleCalibrationStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

// Bayesian calibration assessment for a single bucket with gradations
// Priority order: overconfidence → underconfidence → well-calibrated → insufficient-data
function assessBucketCalibration(
  successes: number,
  total: number,
  confidenceLevel: number
): {
  status: SimpleCalibrationStatus
  detailedStatus: DetailedCalibrationStatus
  probBelow: number
  probAbove: number
  probInRange: number
} {
  const range = CONFIDENCE_RANGES[confidenceLevel]
  const minSamples = BUCKET_MIN_SAMPLES[confidenceLevel] || 3

  // Check minimum sample size for this bucket
  if (total < minSamples || !range) {
    return {
      status: 'insufficient-data',
      detailedStatus: 'insufficient-data',
      probBelow: 0,
      probAbove: 0,
      probInRange: 0
    }
  }

  const failures = total - successes
  // Posterior: Beta(1 + successes, 1 + failures) with uniform prior Beta(1,1)
  const alpha = 1 + successes
  const beta = 1 + failures

  // Convert range to proportions (0-1)
  const lower = range.lower / 100
  const upper = range.upper / 100

  // Calculate posterior probabilities
  const probBelow = betaCDF(alpha, beta, lower)     // P(accuracy < lower)
  const probBelowUpper = betaCDF(alpha, beta, upper) // P(accuracy <= upper)
  const probInRange = probBelowUpper - probBelow    // P(accuracy ∈ [lower, upper])
  const probAbove = 1 - probBelowUpper              // P(accuracy > upper)

  // Priority 1: Check overconfidence (P(accuracy < lower bound))
  // Thresholds: >99% decisive, >97% very strong, >91% strong, >75% moderate
  if (probBelow > 0.99) {
    return { status: 'overconfident', detailedStatus: 'decisive-overconfidence', probBelow, probAbove, probInRange }
  }
  if (probBelow > 0.97) {
    return { status: 'overconfident', detailedStatus: 'very-strong-overconfidence', probBelow, probAbove, probInRange }
  }
  if (probBelow > 0.91) {
    return { status: 'overconfident', detailedStatus: 'strong-overconfidence', probBelow, probAbove, probInRange }
  }
  if (probBelow > 0.75) {
    return { status: 'overconfident', detailedStatus: 'moderate-overconfidence', probBelow, probAbove, probInRange }
  }

  // Priority 2: Check underconfidence (P(accuracy > upper bound))
  // Same thresholds as overconfidence
  if (probAbove > 0.99) {
    return { status: 'underconfident', detailedStatus: 'decisive-underconfidence', probBelow, probAbove, probInRange }
  }
  if (probAbove > 0.97) {
    return { status: 'underconfident', detailedStatus: 'very-strong-underconfidence', probBelow, probAbove, probInRange }
  }
  if (probAbove > 0.91) {
    return { status: 'underconfident', detailedStatus: 'strong-underconfidence', probBelow, probAbove, probInRange }
  }
  if (probAbove > 0.75) {
    return { status: 'underconfident', detailedStatus: 'moderate-underconfidence', probBelow, probAbove, probInRange }
  }

  // Priority 3: Check well-calibrated (P(accuracy ∈ range))
  // At this point we know P(below) < 75% AND P(above) < 75%
  if (probInRange > 0.75) {
    // Good calibration support
    return { status: 'well-calibrated', detailedStatus: 'good-calibration', probBelow, probAbove, probInRange }
  }
  if (probInRange > 0.50) {
    // No evidence of miscalibration
    return { status: 'well-calibrated', detailedStatus: 'no-miscalibration-evidence', probBelow, probAbove, probInRange }
  }

  // Priority 4: Fallback - insufficient evidence to judge
  // P(below) < 75%, P(above) < 75%, P(in range) <= 50%
  return { status: 'insufficient-data', detailedStatus: 'insufficient-data', probBelow, probAbove, probInRange }
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
  let calibrationStatus: SimpleCalibrationStatus

  const bucketsWithData = calibrationData.filter(d => d.count >= 1)
  const totalAnswersInBuckets = bucketsWithData.reduce((sum, d) => sum + d.count, 0)

  // Store per-bucket assessments for detailed feedback
  type BucketStatusEntry = {
    confidence: number
    status: SimpleCalibrationStatus
    detailedStatus: DetailedCalibrationStatus
    probBelow: number
    probAbove: number
    probInRange: number
  }
  const bucketStatuses: BucketStatusEntry[] = []

  if (bucketsWithData.length < 1 || totalAnswersInBuckets < 3) {
    calibrationStatus = 'insufficient-data'
  } else {
    // Assess each bucket independently using Bayesian Beta Distribution
    const bucketAssessments = bucketsWithData.map(bucket => {
      const assessment = assessBucketCalibration(
        bucket.correctCount,
        bucket.count,
        bucket.confidence
      )
      // Store the bucket status for detailed feedback
      bucketStatuses.push({
        confidence: bucket.confidence,
        status: assessment.status,
        detailedStatus: assessment.detailedStatus,
        probBelow: Math.round(assessment.probBelow * 100),
        probAbove: Math.round(assessment.probAbove * 100),
        probInRange: Math.round(assessment.probInRange * 100)
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
        // Use probBelow as evidence strength for overconfidence
        overconfidentWeight += assessment.weight * assessment.probBelow
      } else if (assessment.status === 'underconfident') {
        // Use probAbove as evidence strength for underconfidence
        underconfidentWeight += assessment.weight * assessment.probAbove
      } else if (assessment.status === 'well-calibrated') {
        wellCalibratedWeight += assessment.weight * assessment.probInRange
      }
    }

    // Normalize weights
    const normalizedOverconfident = overconfidentWeight / totalWeight
    const normalizedUnderconfident = underconfidentWeight / totalWeight

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
