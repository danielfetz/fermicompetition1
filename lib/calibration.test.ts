import { describe, it, expect } from 'vitest'
import {
  logGamma,
  betaIncomplete,
  betaCDF,
  assessBucketCalibration,
  assessAllBuckets,
  CONFIDENCE_RANGES,
  BUCKET_MIN_SAMPLES,
  type CalibrationDataPoint,
} from './calibration'

describe('logGamma', () => {
  it('returns Infinity for x <= 0', () => {
    expect(logGamma(0)).toBe(Infinity)
    expect(logGamma(-1)).toBe(Infinity)
    expect(logGamma(-0.5)).toBe(Infinity)
  })

  it('computes log(Γ(n)) = log((n-1)!) for positive integers', () => {
    // Γ(1) = 0! = 1, so log(Γ(1)) = 0
    expect(logGamma(1)).toBeCloseTo(0, 5)

    // Γ(2) = 1! = 1, so log(Γ(2)) = 0
    expect(logGamma(2)).toBeCloseTo(0, 5)

    // Γ(3) = 2! = 2, so log(Γ(3)) = log(2) ≈ 0.693
    expect(logGamma(3)).toBeCloseTo(Math.log(2), 5)

    // Γ(4) = 3! = 6, so log(Γ(4)) = log(6) ≈ 1.792
    expect(logGamma(4)).toBeCloseTo(Math.log(6), 5)

    // Γ(5) = 4! = 24, so log(Γ(5)) = log(24) ≈ 3.178
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 5)

    // Γ(6) = 5! = 120
    expect(logGamma(6)).toBeCloseTo(Math.log(120), 5)
  })

  it('handles fractional values (reflection formula)', () => {
    // Γ(0.5) = √π ≈ 1.7724538509
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 4)
  })

  it('handles values near 0.5 correctly', () => {
    // Values slightly below and above 0.5
    expect(logGamma(0.4)).toBeCloseTo(0.7966, 2)
    expect(logGamma(0.6)).toBeCloseTo(0.3982, 2)
  })
})

describe('betaIncomplete', () => {
  it('returns 0 when x = 0', () => {
    expect(betaIncomplete(2, 3, 0)).toBe(0)
    expect(betaIncomplete(5, 5, 0)).toBe(0)
  })

  it('returns 1 when x = 1', () => {
    expect(betaIncomplete(2, 3, 1)).toBe(1)
    expect(betaIncomplete(5, 5, 1)).toBe(1)
  })

  it('returns 0.5 for symmetric Beta(a,a) at x=0.5', () => {
    expect(betaIncomplete(1, 1, 0.5)).toBeCloseTo(0.5, 5)
    expect(betaIncomplete(2, 2, 0.5)).toBeCloseTo(0.5, 5)
    expect(betaIncomplete(5, 5, 0.5)).toBeCloseTo(0.5, 5)
    expect(betaIncomplete(10, 10, 0.5)).toBeCloseTo(0.5, 5)
  })

  it('handles uniform distribution Beta(1,1) correctly', () => {
    // Beta(1,1) is uniform, so CDF = x
    expect(betaIncomplete(1, 1, 0.25)).toBeCloseTo(0.25, 5)
    expect(betaIncomplete(1, 1, 0.5)).toBeCloseTo(0.5, 5)
    expect(betaIncomplete(1, 1, 0.75)).toBeCloseTo(0.75, 5)
  })

  it('uses symmetry correctly', () => {
    // I_x(a,b) = 1 - I_{1-x}(b,a)
    const a = 3, b = 5, x = 0.7
    const direct = betaIncomplete(a, b, x)
    const symmetric = 1 - betaIncomplete(b, a, 1 - x)
    expect(direct).toBeCloseTo(symmetric, 8)
  })
})

describe('betaCDF', () => {
  it('returns 0 for x <= 0', () => {
    expect(betaCDF(2, 3, 0)).toBe(0)
    expect(betaCDF(2, 3, -0.1)).toBe(0)
    expect(betaCDF(2, 3, -1)).toBe(0)
  })

  it('returns 1 for x >= 1', () => {
    expect(betaCDF(2, 3, 1)).toBe(1)
    expect(betaCDF(2, 3, 1.1)).toBe(1)
    expect(betaCDF(2, 3, 2)).toBe(1)
  })

  it('delegates to betaIncomplete for 0 < x < 1', () => {
    expect(betaCDF(3, 4, 0.5)).toBeCloseTo(betaIncomplete(3, 4, 0.5), 10)
  })
})

describe('CONFIDENCE_RANGES', () => {
  it('defines correct ranges for all confidence levels', () => {
    expect(CONFIDENCE_RANGES[10]).toEqual({ lower: 0, upper: 20 })
    expect(CONFIDENCE_RANGES[30]).toEqual({ lower: 20, upper: 40 })
    expect(CONFIDENCE_RANGES[50]).toEqual({ lower: 40, upper: 60 })
    expect(CONFIDENCE_RANGES[70]).toEqual({ lower: 60, upper: 80 })
    expect(CONFIDENCE_RANGES[90]).toEqual({ lower: 80, upper: 100 })
  })
})

describe('BUCKET_MIN_SAMPLES', () => {
  it('requires fewer samples at edge buckets', () => {
    // Edge buckets (10, 90) need only 2 samples
    expect(BUCKET_MIN_SAMPLES[10]).toBe(2)
    expect(BUCKET_MIN_SAMPLES[90]).toBe(2)

    // Middle bucket needs most samples
    expect(BUCKET_MIN_SAMPLES[50]).toBe(4)

    // Near-middle buckets need 3
    expect(BUCKET_MIN_SAMPLES[30]).toBe(3)
    expect(BUCKET_MIN_SAMPLES[70]).toBe(3)
  })
})

describe('assessBucketCalibration', () => {
  describe('insufficient data', () => {
    it('returns insufficient-data when below minimum samples', () => {
      // 50% bucket needs 4 samples
      const result = assessBucketCalibration(2, 3, 50)
      expect(result.status).toBe('insufficient-data')
      expect(result.detailedStatus).toBe('insufficient-data')
    })

    it('returns insufficient-data for invalid confidence level', () => {
      const result = assessBucketCalibration(5, 10, 15) // 15 is not a valid level
      expect(result.status).toBe('insufficient-data')
    })

    it('accepts minimum samples at edge buckets', () => {
      // 90% bucket needs only 2 samples
      const result = assessBucketCalibration(2, 2, 90)
      expect(result.status).not.toBe('insufficient-data')
    })
  })

  describe('overconfidence detection', () => {
    it('detects decisive overconfidence (>99%)', () => {
      // At 90% confidence level (80-100% range), if student got 0/10 correct
      // Beta(1, 11) posterior - almost certainly below 80%
      const result = assessBucketCalibration(0, 10, 90)
      expect(result.status).toBe('overconfident')
      expect(result.detailedStatus).toBe('decisive-overconfidence')
      expect(result.probBelow).toBeGreaterThan(0.99)
    })

    it('detects very-strong overconfidence (>97%)', () => {
      // At 70% confidence level, if student got 1/8 correct
      const result = assessBucketCalibration(1, 8, 70)
      expect(result.status).toBe('overconfident')
      expect(['decisive-overconfidence', 'very-strong-overconfidence']).toContain(result.detailedStatus)
    })

    it('detects moderate overconfidence (>75%)', () => {
      // At 70% confidence level (60-80% range), 2/6 correct = 33%
      const result = assessBucketCalibration(2, 6, 70)
      expect(result.status).toBe('overconfident')
    })
  })

  describe('underconfidence detection', () => {
    it('detects decisive underconfidence (>99%)', () => {
      // At 10% confidence level (0-20% range), if student got 10/10 correct
      // Beta(11, 1) posterior - almost certainly above 20%
      const result = assessBucketCalibration(10, 10, 10)
      expect(result.status).toBe('underconfident')
      expect(result.detailedStatus).toBe('decisive-underconfidence')
      expect(result.probAbove).toBeGreaterThan(0.99)
    })

    it('detects strong underconfidence', () => {
      // At 30% confidence level (20-40% range), 8/10 correct = 80%
      const result = assessBucketCalibration(8, 10, 30)
      expect(result.status).toBe('underconfident')
    })
  })

  describe('well-calibrated detection', () => {
    it('detects good calibration when accuracy matches confidence', () => {
      // At 50% confidence level (40-60% range), 5/10 correct = 50%
      const result = assessBucketCalibration(5, 10, 50)
      expect(result.status).toBe('well-calibrated')
    })

    it('returns well-calibrated when evidence is inconclusive', () => {
      // At 50% confidence level, 4/8 correct - should be well-calibrated
      const result = assessBucketCalibration(4, 8, 50)
      expect(result.status).toBe('well-calibrated')
    })

    it('handles perfect calibration at 90% level', () => {
      // 9/10 correct at 90% confidence = well calibrated
      const result = assessBucketCalibration(9, 10, 90)
      expect(result.status).toBe('well-calibrated')
    })
  })

  describe('probability calculations', () => {
    it('probabilities sum to approximately 1', () => {
      const result = assessBucketCalibration(5, 10, 50)
      const sum = result.probBelow + result.probInRange + result.probAbove
      expect(sum).toBeCloseTo(1, 5)
    })

    it('returns valid probabilities in [0, 1]', () => {
      const testCases = [
        { successes: 0, total: 10, level: 90 },
        { successes: 10, total: 10, level: 10 },
        { successes: 5, total: 10, level: 50 },
        { successes: 3, total: 5, level: 70 },
      ]

      for (const tc of testCases) {
        const result = assessBucketCalibration(tc.successes, tc.total, tc.level)
        expect(result.probBelow).toBeGreaterThanOrEqual(0)
        expect(result.probBelow).toBeLessThanOrEqual(1)
        expect(result.probAbove).toBeGreaterThanOrEqual(0)
        expect(result.probAbove).toBeLessThanOrEqual(1)
        expect(result.probInRange).toBeGreaterThanOrEqual(0)
        expect(result.probInRange).toBeLessThanOrEqual(1)
      }
    })
  })
})

describe('assessAllBuckets', () => {
  const makeDataPoint = (
    confidence: number,
    count: number,
    correctCount: number
  ): CalibrationDataPoint => ({
    confidence,
    expectedAccuracy: confidence,
    actualAccuracy: count > 0 ? Math.round((correctCount / count) * 100) : null,
    count,
    correctCount,
  })

  it('returns empty array when no buckets have data', () => {
    const data = [
      makeDataPoint(10, 0, 0),
      makeDataPoint(50, 0, 0),
      makeDataPoint(90, 0, 0),
    ]
    const result = assessAllBuckets(data)
    expect(result).toHaveLength(0)
  })

  it('returns per-bucket assessment details', () => {
    const data = [
      makeDataPoint(50, 10, 5),
      makeDataPoint(90, 10, 2),
    ]
    const result = assessAllBuckets(data)

    expect(result).toHaveLength(2)
    expect(result[0].confidence).toBe(50)
    expect(result[1].confidence).toBe(90)

    // Check that probabilities are percentages (0-100)
    for (const bucket of result) {
      expect(bucket.probBelow).toBeGreaterThanOrEqual(0)
      expect(bucket.probBelow).toBeLessThanOrEqual(100)
      expect(bucket.probAbove).toBeGreaterThanOrEqual(0)
      expect(bucket.probAbove).toBeLessThanOrEqual(100)
      expect(bucket.probInRange).toBeGreaterThanOrEqual(0)
      expect(bucket.probInRange).toBeLessThanOrEqual(100)
    }
  })

  it('skips buckets with no data', () => {
    const data = [
      makeDataPoint(30, 0, 0),   // No data
      makeDataPoint(50, 10, 5),  // Has data
      makeDataPoint(70, 0, 0),   // No data
    ]
    const result = assessAllBuckets(data)

    expect(result).toHaveLength(1)
    expect(result[0].confidence).toBe(50)
  })

  it('correctly identifies overconfident bucket', () => {
    const data = [
      makeDataPoint(90, 10, 1),  // Claims 90%, gets 10% - overconfident
    ]
    const result = assessAllBuckets(data)

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('overconfident')
  })

  it('correctly identifies underconfident bucket', () => {
    const data = [
      makeDataPoint(10, 10, 9),  // Claims 10%, gets 90% - underconfident
    ]
    const result = assessAllBuckets(data)

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('underconfident')
  })

  it('correctly identifies well-calibrated bucket', () => {
    const data = [
      makeDataPoint(50, 10, 5),  // Claims 50%, gets 50% - well calibrated
    ]
    const result = assessAllBuckets(data)

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('well-calibrated')
  })
})
