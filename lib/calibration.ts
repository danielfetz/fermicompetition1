/**
 * Bayesian calibration assessment for Fermi estimation confidence levels.
 *
 * Uses Beta distribution to model uncertainty about a student's true accuracy
 * at each confidence level, then calculates posterior probabilities that their
 * accuracy falls within, below, or above the expected range.
 */

// Beta function approximation using Stirling's approximation for log-gamma
export function logGamma(x: number): number {
  if (x <= 0) return Infinity
  if (x < 0.5) {
    // Reflection formula: Γ(x)Γ(1-x) = π/sin(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  // Stirling's approximation with Lanczos coefficients
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

// Regularized incomplete beta function using continued fraction (Lentz's algorithm)
export function betaIncomplete(a: number, b: number, x: number): number {
  if (x === 0) return 0
  if (x === 1) return 1

  // Use symmetry for better convergence: I_x(a,b) = 1 - I_{1-x}(b,a)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betaIncomplete(b, a, 1 - x)
  }

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
export function betaCDF(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return betaIncomplete(a, b, x)
}

// Confidence bucket ranges (the actual ranges users select)
export const CONFIDENCE_RANGES: Record<number, { lower: number; upper: number }> = {
  10: { lower: 0, upper: 20 },
  30: { lower: 20, upper: 40 },
  50: { lower: 40, upper: 60 },
  70: { lower: 60, upper: 80 },
  90: { lower: 80, upper: 100 }
}

// Bucket-specific minimum sample sizes for reliable assessment
// Edge buckets (0-20%, 80-100%) need fewer samples since they're at extremes
export const BUCKET_MIN_SAMPLES: Record<number, number> = {
  10: 2,  // 0-20%: n=2 minimum
  30: 3,  // 20-40%: n=3 minimum
  50: 4,  // 40-60%: n=4 minimum
  70: 3,  // 60-80%: n=3 minimum
  90: 2   // 80-100%: n=2 minimum
}

// Detailed calibration status with gradations
export type DetailedCalibrationStatus =
  | 'decisive-overconfidence'
  | 'very-strong-overconfidence'
  | 'strong-overconfidence'
  | 'moderate-overconfidence'
  | 'slight-overconfidence'
  | 'decisive-underconfidence'
  | 'very-strong-underconfidence'
  | 'strong-underconfidence'
  | 'moderate-underconfidence'
  | 'slight-underconfidence'
  | 'good-calibration'
  | 'slight-good-calibration'
  | 'no-miscalibration-evidence'
  | 'insufficient-data'

// Simplified status for overall assessment
export type SimpleCalibrationStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

export interface BucketAssessment {
  status: SimpleCalibrationStatus
  detailedStatus: DetailedCalibrationStatus
  probBelow: number
  probAbove: number
  probInRange: number
}

/**
 * Bayesian calibration assessment for a single confidence bucket.
 *
 * Uses Beta(1 + successes, 1 + failures) posterior with uniform prior.
 * Priority order: overconfidence → underconfidence → well-calibrated → insufficient-data
 *
 * @param successes Number of correct answers at this confidence level
 * @param total Total answers at this confidence level
 * @param confidenceLevel The confidence level (10, 30, 50, 70, or 90)
 */
export function assessBucketCalibration(
  successes: number,
  total: number,
  confidenceLevel: number
): BucketAssessment {
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

  // Priority 3: Check well-calibrated (P(accuracy ∈ range) > 75%)
  if (probInRange > 0.75) {
    return { status: 'well-calibrated', detailedStatus: 'good-calibration', probBelow, probAbove, probInRange }
  }

  // Priority 4: Slight tendency towards good calibration
  if (probInRange > 0.50) {
    return { status: 'well-calibrated', detailedStatus: 'slight-good-calibration', probBelow, probAbove, probInRange }
  }

  // Priority 5: Fallback - no strong evidence either way
  return { status: 'well-calibrated', detailedStatus: 'no-miscalibration-evidence', probBelow, probAbove, probInRange }
}

export interface CalibrationDataPoint {
  confidence: number
  expectedAccuracy: number
  actualAccuracy: number | null
  count: number
  correctCount: number
}

export interface BucketStatusEntry {
  confidence: number
  status: SimpleCalibrationStatus
  detailedStatus: DetailedCalibrationStatus
  probBelow: number
  probAbove: number
  probInRange: number
}

/**
 * Aggregate multiple bucket assessments into an overall calibration status.
 *
 * Uses weighted voting where each bucket's vote is proportional to:
 * - Number of answers in that bucket
 * - Strength of evidence (probability)
 *
 * @param buckets Array of calibration data points
 * @returns Overall status and per-bucket assessments
 */
export function assessOverallCalibration(
  buckets: CalibrationDataPoint[]
): {
  status: SimpleCalibrationStatus
  bucketStatuses: BucketStatusEntry[]
} {
  const bucketsWithData = buckets.filter(d => d.count >= 1)
  const totalAnswersInBuckets = bucketsWithData.reduce((sum, d) => sum + d.count, 0)
  const bucketStatuses: BucketStatusEntry[] = []

  if (bucketsWithData.length < 1 || totalAnswersInBuckets < 3) {
    return { status: 'insufficient-data', bucketStatuses }
  }

  // Assess each bucket independently
  const bucketAssessments = bucketsWithData.map(bucket => {
    const assessment = assessBucketCalibration(
      bucket.correctCount,
      bucket.count,
      bucket.confidence
    )
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
      weight: bucket.count
    }
  })

  // Aggregate using weighted voting
  let overconfidentWeight = 0
  let underconfidentWeight = 0
  let totalWeight = 0

  for (const assessment of bucketAssessments) {
    totalWeight += assessment.weight
    if (assessment.status === 'overconfident') {
      overconfidentWeight += assessment.weight * assessment.probBelow
    } else if (assessment.status === 'underconfident') {
      underconfidentWeight += assessment.weight * assessment.probAbove
    }
  }

  // Normalize and determine overall status
  const normalizedOverconfident = overconfidentWeight / totalWeight
  const normalizedUnderconfident = underconfidentWeight / totalWeight
  const threshold = 0.40

  let status: SimpleCalibrationStatus
  if (normalizedOverconfident > threshold && normalizedOverconfident > normalizedUnderconfident) {
    status = 'overconfident'
  } else if (normalizedUnderconfident > threshold && normalizedUnderconfident > normalizedOverconfident) {
    status = 'underconfident'
  } else {
    status = 'well-calibrated'
  }

  return { status, bucketStatuses }
}
