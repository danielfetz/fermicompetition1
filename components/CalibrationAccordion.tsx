'use client'

import { useState } from 'react'

type DetailedStatus =
  | 'decisive-overconfidence' | 'very-strong-overconfidence' | 'strong-overconfidence' | 'moderate-overconfidence'
  | 'decisive-underconfidence' | 'very-strong-underconfidence' | 'strong-underconfidence' | 'moderate-underconfidence'
  | 'good-calibration' | 'slight-good-calibration' | 'no-miscalibration-evidence' | 'insufficient-data'

type BucketAssessment = {
  confidence: number
  detailedStatus: DetailedStatus
  correct: number
  total: number
  actualPct: number | null
}

type Props = {
  correctCount: number
  totalAnswered: number
  points: number
  buckets: BucketAssessment[]
}

// Get display info for detailed status (phrasing matches student results page)
function getStatusDisplay(status: DetailedStatus): { label: string; color: string; bgColor: string } {
  const displays: Record<DetailedStatus, { label: string; color: string; bgColor: string }> = {
    'decisive-overconfidence': { label: 'Decisive evidence for overconfidence', color: 'text-duo-red', bgColor: 'bg-duo-red/20' },
    'very-strong-overconfidence': { label: 'Very strong evidence for overconfidence', color: 'text-duo-red', bgColor: 'bg-duo-red/15' },
    'strong-overconfidence': { label: 'Strong evidence for overconfidence', color: 'text-duo-red', bgColor: 'bg-duo-red/10' },
    'moderate-overconfidence': { label: 'Substantial evidence for overconfidence', color: 'text-duo-orange', bgColor: 'bg-duo-orange/10' },
    'decisive-underconfidence': { label: 'Decisive evidence for underconfidence', color: 'text-duo-blue', bgColor: 'bg-duo-blue/20' },
    'very-strong-underconfidence': { label: 'Very strong evidence for underconfidence', color: 'text-duo-blue', bgColor: 'bg-duo-blue/15' },
    'strong-underconfidence': { label: 'Strong evidence for underconfidence', color: 'text-duo-blue', bgColor: 'bg-duo-blue/10' },
    'moderate-underconfidence': { label: 'Substantial evidence for underconfidence', color: 'text-duo-blue-dark', bgColor: 'bg-duo-blue/5' },
    'good-calibration': { label: 'Evidence for good calibration', color: 'text-duo-green', bgColor: 'bg-duo-green/10' },
    'slight-good-calibration': { label: 'Some evidence for good calibration', color: 'text-duo-green', bgColor: 'bg-duo-green/5' },
    'no-miscalibration-evidence': { label: 'No evidence of miscalibration', color: 'text-wolf', bgColor: 'bg-swan/30' },
    'insufficient-data': { label: 'Insufficient data', color: 'text-hare', bgColor: 'bg-swan/20' }
  }
  return displays[status]
}

// Map confidence values to display ranges
function getConfidenceLabel(value: number): string {
  switch (value) {
    case 10: return '0-20%'
    case 30: return '20-40%'
    case 50: return '40-60%'
    case 70: return '60-80%'
    case 90: return '80-100%'
    default: return `${value}%`
  }
}

export default function CalibrationAccordion({ correctCount, totalAnswered, points, buckets }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const bucketsWithData = buckets.filter(b => b.total > 0)

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-eel">Calibration Assessment</h2>
          <svg
            className={`w-5 h-5 text-wolf transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-eel">{correctCount}/{totalAnswered}</div>
            <div className="text-xs text-wolf">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-duo-green">{points}</div>
            <div className="text-xs text-wolf">Points</div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-swan">
          {bucketsWithData.length > 0 ? (
            <div className="space-y-2">
              {bucketsWithData.map(bucket => {
                const display = getStatusDisplay(bucket.detailedStatus)
                return (
                  <div key={bucket.confidence} className={`flex items-center justify-between p-3 rounded-lg ${display.bgColor}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-eel w-16">{getConfidenceLabel(bucket.confidence)}</div>
                      <div className={`text-sm font-medium ${display.color}`}>{display.label}</div>
                    </div>
                    <div className="text-sm text-wolf">
                      {bucket.correct}/{bucket.total} correct ({bucket.actualPct}%)
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-wolf">No answers yet to assess calibration.</p>
          )}
        </div>
      )}
    </div>
  )
}
