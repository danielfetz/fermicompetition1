'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Timer from '@/components/Timer'
import ProgressBar from '@/components/ProgressBar'
import ConfidenceSelector from '@/components/ConfidenceSelector'

type Question = { id: string; prompt: string; hint?: string }
type ConfidenceLevel = 10 | 30 | 50 | 70 | 90
type Answer = { question_id: string; value: number; confidence_pct: ConfidenceLevel }

export default function StudentExam() {
  const { classId } = useParams<{ classId: string }>()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [deadline, setDeadline] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hintsUnlocked, setHintsUnlocked] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // Load questions, session, and existing answers
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      const token = localStorage.getItem('studentToken')
      if (!token) {
        router.push('/student/login')
        return
      }

      try {
        // Fetch questions and session in parallel
        const [questionsRes, sessionRes] = await Promise.all([
          fetch(`/api/questions?classId=${classId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/student/session', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (!questionsRes.ok) {
          setError('Failed to load questions')
          setLoading(false)
          return
        }

        const questionsData = await questionsRes.json()
        setQuestions(questionsData.questions)

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()

          // Set deadline from session
          const endsAt = new Date(sessionData.session.endsAt).getTime()
          setDeadline(endsAt)

          // Load existing answers
          if (sessionData.answers && Object.keys(sessionData.answers).length > 0) {
            const loadedAnswers: Record<string, Answer> = {}
            for (const [questionId, answerData] of Object.entries(sessionData.answers)) {
              const data = answerData as { value: number; confidence_pct: number }
              loadedAnswers[questionId] = {
                question_id: questionId,
                value: data.value,
                confidence_pct: data.confidence_pct as ConfidenceLevel
              }
            }
            setAnswers(loadedAnswers)

            // Set input value for first question if it has an answer
            const firstQuestion = questionsData.questions[0]
            if (firstQuestion && loadedAnswers[firstQuestion.id]) {
              setInputValue(loadedAnswers[firstQuestion.id].value.toString())
            }
          }
        } else {
          const sessionError = await sessionRes.json()
          if (sessionError.error === 'Exam already completed' || sessionError.error === 'Exam already submitted') {
            router.push('/student/done')
            return
          }
          // If session creation failed for another reason, set a fallback deadline
          setDeadline(Date.now() + 40 * 60 * 1000)
        }
      } catch (err) {
        console.error('Error initializing exam:', err)
        setError('Failed to initialize exam')
      }

      setLoading(false)
    }

    init()
  }, [classId, router])

  // Auto-save answers periodically
  const saveAnswers = useCallback(async () => {
    const token = localStorage.getItem('studentToken')
    if (!token || Object.keys(answers).length === 0) return

    const payload = { answers: Object.values(answers) }
    try {
      await fetch('/api/student/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [answers])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveAnswers()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [answers, saveAnswers])

  // Check for halftime to unlock hints (20 minutes into a 40-minute exam)
  useEffect(() => {
    if (!deadline || hintsUnlocked) return

    const checkHalftime = () => {
      const now = Date.now()
      const halfwayPoint = deadline - 20 * 60 * 1000 // 20 minutes before deadline
      if (now >= halfwayPoint) {
        setHintsUnlocked(true)
      }
    }

    // Check immediately
    checkHalftime()

    // Then check every second
    const interval = setInterval(checkHalftime, 1000)
    return () => clearInterval(interval)
  }, [deadline, hintsUnlocked])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(answers).length > 0) {
        const token = localStorage.getItem('studentToken')
        if (token) {
          // Use sendBeacon for reliable save on unload - include token in body since headers aren't supported
          const payload = JSON.stringify({ answers: Object.values(answers), token })
          navigator.sendBeacon('/api/student/answers', new Blob([payload], { type: 'application/json' }))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [answers])

  // Save when answers change (debounced)
  useEffect(() => {
    if (Object.keys(answers).length === 0) return

    const timeout = setTimeout(() => {
      saveAnswers()
    }, 2000) // Save 2 seconds after last change

    return () => clearTimeout(timeout)
  }, [answers, saveAnswers])

  const submit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const token = localStorage.getItem('studentToken')
    const payload = { answers: Object.values(answers), submit: true }
    console.log('Submitting payload:', JSON.stringify(payload, null, 2))
    const res = await fetch('/api/student/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    setSubmitting(false)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Submit error:', errorData)
      setError(`Submit failed: ${errorData.error || 'Unknown error'}${errorData.details ? ' - ' + JSON.stringify(errorData.details) : ''}`)
      return
    }
    router.push('/student/done')
  }, [submitting, answers, router])

  const handleTimeUp = useCallback(() => {
    submit()
  }, [submit])

  const currentQuestion = questions[currentIndex]

  function updateAnswer(value: string) {
    setInputValue(value)
    if (!currentQuestion) return
    const numValue = parseFloat(value) || 0
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        question_id: currentQuestion.id,
        value: numValue,
        confidence_pct: prev[currentQuestion.id]?.confidence_pct || 50
      }
    }))
  }

  function updateConfidence(pct: ConfidenceLevel) {
    if (!currentQuestion) return
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id] || { question_id: currentQuestion.id, value: 0, confidence_pct: 50 },
        confidence_pct: pct
      }
    }))
  }

  function goToQuestion(index: number) {
    // Save current answer before switching
    saveAnswers()

    setCurrentIndex(index)
    const q = questions[index]
    if (q && answers[q.id]) {
      setInputValue(answers[q.id].value.toString())
    } else {
      setInputValue('')
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k].value !== 0).length

  if (loading || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-duo-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with Timer and Progress */}
      <div className="sticky top-16 z-40 bg-white pt-2 pb-4 -mx-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                saveAnswers()
                if (confirm('Are you sure you want to leave? Your progress has been saved.')) {
                  router.push('/student/login')
                }
              }}
              className="icon-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="font-bold text-eel">Fermi Competition</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer deadline={deadline} onTimeUp={handleTimeUp} urgentThreshold={5} />
            {!hintsUnlocked && (
              <span className="text-xs text-wolf hidden sm:inline">Hints at halftime</span>
            )}
          </div>
        </div>
        <ProgressBar current={answeredCount} total={questions.length} />
      </div>

      {/* Question Navigation Dots */}
      <div className="flex flex-wrap justify-center gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => goToQuestion(idx)}
            className={`w-8 h-8 rounded-full font-bold text-sm transition-all ${
              idx === currentIndex
                ? 'bg-duo-blue text-white scale-110'
                : answers[q.id]?.value
                  ? 'bg-duo-green text-white'
                  : 'bg-swan text-wolf hover:bg-hare'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Current Question Card */}
      {currentQuestion && (
        <div className="question-card fade-in-up">
          <div className="flex items-start gap-4 mb-6">
            <div className="question-number">{currentIndex + 1}</div>
            <div className="flex-1">
              <p className="question-text">{currentQuestion.prompt}</p>
              {hintsUnlocked && currentQuestion.hint && (
                <div className="mt-3 p-3 bg-duo-yellow/10 rounded-duo border border-duo-yellow/30">
                  <p className="text-xs text-duo-yellow-dark font-semibold mb-1">Hint unlocked at halftime!</p>
                  <p className="text-sm text-eel">{currentQuestion.hint}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Answer Input */}
            <div className="form-group">
              <label className="label" htmlFor="answer">Your Estimate</label>
              <input
                id="answer"
                type="number"
                className="input text-xl font-bold text-center"
                placeholder="Enter a number"
                value={inputValue}
                onChange={e => updateAnswer(e.target.value)}
                autoFocus
              />
              <p className="text-sm text-wolf text-center mt-2">
                Enter your best estimate as a number
              </p>
            </div>

            {/* Confidence Selector */}
            <ConfidenceSelector
              value={answers[currentQuestion.id]?.confidence_pct || 50}
              onChange={updateConfidence}
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="btn btn-outline"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={submit}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit All
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button onClick={nextQuestion} className="btn btn-secondary">
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-duo-red/10 border-2 border-duo-red rounded-duo p-4 text-center">
          <p className="text-duo-red-dark font-semibold">{error}</p>
        </div>
      )}

      {/* Summary Footer */}
      <div className="card bg-gradient-to-br from-duo-green/5 to-duo-blue/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-wolf">Progress</p>
            <p className="text-lg font-bold text-eel">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
          <div className="flex gap-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`w-2 h-8 rounded-full ${
                  answers[q.id]?.value ? 'bg-duo-green' : 'bg-swan'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
