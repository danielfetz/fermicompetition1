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

type CalibrationStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

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
  }
}

export default function Done() {
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

          {/* Calibration Curve */}
          <div className="card">
            <h2 className="font-bold text-eel mb-4">Your Calibration</h2>
            <p className="text-sm text-wolf mb-4">
              How well did your confidence match your accuracy?
            </p>
            <CalibrationCurve
              data={results.calibration.data}
              status={results.calibration.status}
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
