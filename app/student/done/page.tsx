'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'
import CalibrationCurve from '@/components/CalibrationCurve'

type CalibrationDataPoint = {
  confidence: number
  expectedAccuracy: number
  actualAccuracy: number | null
  count: number
}

type QuestionResult = {
  order: number
  prompt: string
  studentAnswer: number
  confidence: number
  correctAnswer: number | null
  isCorrect: boolean | null
  ordersDiff: number | null
}

type CalibrationStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

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
  | 'slight-good-calibration'
  | 'no-miscalibration-evidence'
  | 'insufficient-data'

type BucketStatus = {
  confidence: number
  status: CalibrationStatus
  detailedStatus: DetailedCalibrationStatus
  probBelow: number
  probAbove: number
  probInRange: number
}

type Results = {
  score: {
    confidencePoints: number
    correctCount: number
    totalAnswered: number
    scorePercentage: number
  }
  calibration: {
    data: CalibrationDataPoint[]
    status: CalibrationStatus
    bucketStatuses?: BucketStatus[]
  }
  questions: QuestionResult[]
}

// Format large numbers into human-readable strings
function formatNumberReadable(num: number): string {
  if (num === 0) return '0'
  if (isNaN(num)) return ''

  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  const units = [
    { value: 1e18, name: 'quintillion' },
    { value: 1e15, name: 'quadrillion' },
    { value: 1e12, name: 'trillion' },
    { value: 1e9, name: 'billion' },
    { value: 1e6, name: 'million' },
    { value: 1e3, name: 'thousand' },
  ]

  for (const unit of units) {
    if (absNum >= unit.value) {
      const value = absNum / unit.value
      const truncated = Math.floor(value * 100) / 100
      const formatted = truncated.toFixed(2).replace(/\.?0+$/, '')
      return `${sign}${formatted} ${unit.name}`
    }
  }

  return num.toLocaleString()
}

export default function Done() {
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionsOpen, setQuestionsOpen] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      const token = localStorage.getItem('studentToken')
      if (!token) {
        setError('No session found')
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/student/results', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to load results')
          setLoading(false)
          return
        }

        const data = await res.json()
        setResults(data)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('Failed to load results')
      }

      setLoading(false)
    }

    fetchResults()
  }, [])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-8 text-center">
        <div className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-duo-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">Loading your results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      {/* Celebration */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="celebrating" size="lg" />
        </div>
        <h1 className="text-3xl font-extrabold text-eel">Competition Complete!</h1>
        <p className="text-lg text-wolf">
          Great job! Here are your results.
        </p>
      </div>

      {error ? (
        <div className="card bg-duo-red/10 border-duo-red/30">
          <p className="text-duo-red-dark">{error}</p>
        </div>
      ) : results && (
        <>
          {/* Score Card */}
          <div className="card">
            <h2 className="font-bold text-eel mb-4">Your Score</h2>
            <div className="flex justify-center items-center mb-4">
              <div className="text-5xl font-extrabold text-duo-green">
                {results.score.confidencePoints}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-snow rounded-duo p-3">
                <div className="text-2xl font-bold text-eel">
                  {results.score.correctCount}/{results.score.totalAnswered}
                </div>
                <div className="text-xs text-wolf">Correct Answers</div>
              </div>
              <div className="bg-snow rounded-duo p-3">
                <div className="text-2xl font-bold text-eel">
                  {results.score.scorePercentage}%
                </div>
                <div className="text-xs text-wolf">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Questions Accordion */}
          <div className="card">
            <button
              onClick={() => setQuestionsOpen(!questionsOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="font-bold text-eel">Your Answers</h2>
              <svg
                className={`w-5 h-5 text-wolf transition-transform ${questionsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {questionsOpen && (
              <div className="mt-4 space-y-3">
                {results.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-duo border-2 text-left ${
                      q.isCorrect === true
                        ? 'bg-duo-green/10 border-duo-green/30'
                        : q.isCorrect === false
                        ? 'bg-duo-red/10 border-duo-red/30'
                        : 'bg-snow border-swan'
                    }`}
                  >
                    <p className="text-sm font-medium text-eel mb-2">
                      {idx + 1}. {q.prompt}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-wolf">Your answer: </span>
                        <span className="font-semibold text-eel">{formatNumberReadable(q.studentAnswer)}</span>
                      </div>
                      <div>
                        <span className="text-wolf">Confidence: </span>
                        <span className="font-semibold text-eel">
                          {q.confidence === 10 ? '0-20%' : q.confidence === 30 ? '20-40%' : q.confidence === 50 ? '40-60%' : q.confidence === 70 ? '60-80%' : '80-100%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-wolf">Correct answer: </span>
                        <span className="font-semibold text-eel">
                          {q.correctAnswer !== null ? formatNumberReadable(q.correctAnswer) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-wolf">Difference: </span>
                        <span className={`font-semibold ${q.isCorrect ? 'text-duo-green' : 'text-duo-red'}`}>
                          {q.ordersDiff !== null
                            ? `${q.ordersDiff > 0 ? '+' : ''}${q.ordersDiff} orders`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calibration Curve */}
          <div className="card">
            <h2 className="font-bold text-eel mb-4">Your Calibration</h2>
            <p className="text-sm text-wolf mb-4">
              How well did your confidence match your accuracy?
            </p>
            <CalibrationCurve
              data={results.calibration.data}
              bucketStatuses={results.calibration.bucketStatuses}
            />
          </div>

          {/* Point System Explanation */}
          <div className="card bg-duo-blue/10 border-duo-blue/30">
            <div className="flex items-start gap-3 text-left">
              <div className="flex-shrink-0 text-2xl">📊</div>
              <div>
                <h3 className="font-bold text-duo-blue-dark">How Points Work</h3>
                <p className="text-sm text-eel mt-1">
                  You start with 250 points. Correct answers earn more points at higher confidence levels,
                  but wrong answers at high confidence cost you points. The best strategy is to be well-calibrated:
                  confident when you&apos;re likely right, and less confident when uncertain.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fun Fact */}
      <div className="card bg-duo-yellow/10 border-duo-yellow/30">
        <div className="flex items-start gap-3 text-left">
          <div className="flex-shrink-0 text-2xl">💡</div>
          <div>
            <h3 className="font-bold text-duo-yellow-dark">Fun Fact</h3>
            <p className="text-sm text-eel mt-1">
              Enrico Fermi was known for making remarkably accurate estimations
              using only simple reasoning. He famously estimated the yield of the
              first atomic bomb by dropping pieces of paper!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-4">
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="flex justify-center gap-2 pt-4">
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>⭐</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🏆</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</span>
        <span className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>⭐</span>
      </div>
    </div>
  )
}
