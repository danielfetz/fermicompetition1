'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Timer from '@/components/Timer'
import ConfidenceSelector from '@/components/ConfidenceSelector'

type Question = { id: string; prompt: string; hint?: string }
type ConfidenceLevel = 10 | 30 | 50 | 70 | 90
type Answer = { question_id: string; value: number; confidence_pct: ConfidenceLevel }

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
      // Truncate to 2 decimal places (don't round up to avoid showing incorrect values)
      const truncated = Math.floor(value * 100) / 100
      const formatted = truncated.toFixed(2).replace(/\.?0+$/, '')
      return `${sign}${formatted} ${unit.name}`
    }
  }

  // For numbers less than 1000, just return the number
  return num.toString()
}

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
  const [seenHints, setSeenHints] = useState<Set<string>>(() => {
    // Load seen hints from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`seenHints_${classId}`)
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch {
          return new Set()
        }
      }
    }
    return new Set()
  })
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
          // If session creation failed for another reason, set a fallback deadline (70 minutes)
          setDeadline(Date.now() + 70 * 60 * 1000)
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

  // Check for halftime to unlock hints (35 minutes into a 70-minute exam)
  useEffect(() => {
    if (!deadline || hintsUnlocked) return

    const checkHalftime = () => {
      const now = Date.now()
      const halfwayPoint = deadline - 35 * 60 * 1000 // 35 minutes before deadline (halftime)
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

  // Mark current question's hint as seen when viewing it after hints unlock
  useEffect(() => {
    const current = questions[currentIndex]
    if (hintsUnlocked && current?.hint) {
      setSeenHints(prev => new Set([...prev, current.id]))
    }
  }, [hintsUnlocked, questions, currentIndex])

  // Persist seenHints to localStorage
  useEffect(() => {
    if (seenHints.size > 0) {
      localStorage.setItem(`seenHints_${classId}`, JSON.stringify([...seenHints]))
    }
  }, [seenHints, classId])

  // Save on page unload and warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save answers
      if (Object.keys(answers).length > 0) {
        const token = localStorage.getItem('studentToken')
        if (token) {
          // Use sendBeacon for reliable save on unload - include token in body since headers aren't supported
          const payload = JSON.stringify({ answers: Object.values(answers), token })
          navigator.sendBeacon('/api/student/answers', new Blob([payload], { type: 'application/json' }))
        }
      }
      // Show browser confirmation dialog
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [answers])

  // Intercept browser back button
  useEffect(() => {
    // Push a state so we can intercept back navigation
    window.history.pushState({ examPage: true }, '')

    const handlePopState = () => {
      if (confirm('Are you sure you want to leave? Your progress has been saved, but time is still running out!')) {
        // Actually go back
        window.history.back()
      } else {
        // Stay on page - push state again
        window.history.pushState({ examPage: true }, '')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Redirect to results if user returns to tab after time expired
  useEffect(() => {
    if (!deadline) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() > deadline) {
        router.push('/student/done')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [deadline, router])

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
      // If time has expired, still go to results - answers were already auto-saved
      if (errorData.error === 'Exam time has expired') {
        router.push('/student/done')
        return
      }
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
    const numValue = parseFloat(value)
    // Store 0 when empty so it saves to Supabase
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        question_id: currentQuestion.id,
        value: isNaN(numValue) ? 0 : numValue,
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
    if (q && answers[q.id] && answers[q.id].value !== 0) {
      setInputValue(answers[q.id].value.toString())
    } else {
      setInputValue('')
    }

    // Mark hint as seen if hints are unlocked and question has a hint
    if (hintsUnlocked && q?.hint) {
      setSeenHints(prev => new Set([...prev, q.id]))
    }

    // Focus input after state updates and move cursor to end
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const len = inputRef.current.value.length
        inputRef.current.setSelectionRange(len, len)
      }
    }, 0)
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

  const handleClose = () => {
    if (confirm('Are you sure you want to leave? Your progress has been saved, but time is still running out!')) {
      router.push('/student/login')
    }
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirm('Are you sure you want to leave? Your progress has been saved, but time is still running out!')) {
      router.push('/')
    }
  }

  const handleSubmitClick = () => {
    if (!hintsUnlocked) {
      if (!confirm('Hints have not been revealed yet! Are you sure you want to submit before halftime?')) {
        return
      }
    } else {
      if (!confirm('Are you sure you want to submit your answers? You will not be able to make changes after submitting.')) {
        return
      }
    }
    submit()
  }

  if (loading || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
        <div className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-duo-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wolf">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Exam Header */}
      <header className="bg-white border-b-2 border-swan sticky top-0 z-50 h-[70px]">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <a href="/" onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-duo-green rounded-xl flex items-center justify-center sm:hidden">
              <span className="text-white font-extrabold text-lg">F</span>
            </div>
            <span className="text-xl font-extrabold text-duo-green hidden sm:block">
              Fermi Competition
            </span>
          </a>
          <div className="flex items-center gap-3">
            <Timer deadline={deadline} onTimeUp={handleTimeUp} urgentThreshold={5} />
            <button
              onClick={handleClose}
              className="icon-btn"
              title="Exit competition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6 pb-28">
          {/* Question Navigation Dots */}
          <div className="flex flex-wrap justify-center gap-2">
            {questions.map((q, idx) => {
              const hasUnseenHint = hintsUnlocked && q.hint && !seenHints.has(q.id)
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(idx)}
                  className={`relative w-8 h-8 rounded-full font-bold text-sm transition-all ${
                    idx === currentIndex
                      ? 'bg-duo-blue text-white scale-110'
                      : answers[q.id]?.value
                        ? 'bg-duo-green text-white'
                        : 'bg-white text-wolf border-2 border-swan hover:border-hare'
                  }`}
                >
                  {idx + 1}
                  {hasUnseenHint && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-duo-red rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Current Question Card */}
          {currentQuestion && (
            <div className="question-card fade-in-up">
              <div className="mb-6">
                <p className="question-text">{currentQuestion.prompt}</p>
                {hintsUnlocked && currentQuestion.hint && (
                  <div className="mt-4 card bg-duo-yellow/5 border-duo-yellow/20">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-duo-yellow/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-duo-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-duo-yellow-dark">Hint</h3>
                        <p className="text-wolf mt-1" style={{ fontSize: '0.9375rem', lineHeight: '1.25rem' }}>{currentQuestion.hint}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Answer Input */}
                <div className="form-group">
                  <label className="label !flex items-center justify-between" htmlFor="answer">
                    <span className="flex items-center gap-2">
                      Your Estimate
                      <span className="group relative">
                        <svg className="w-4 h-4 text-wolf cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-eel text-white text-xs font-normal normal-case tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48 text-center">
                          Your answer is correct if within a factor of 2 (half to double the actual answer)
                        </span>
                      </span>
                    </span>
                    {inputValue && parseFloat(inputValue) ? (
                      <span className="text-duo-blue font-semibold normal-case tracking-normal">{formatNumberReadable(parseFloat(inputValue))}</span>
                    ) : null}
                  </label>
                  <input
                    ref={inputRef}
                    id="answer"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input font-bold text-center"
                    style={{ fontSize: '1.0675rem' }}
                    placeholder="Enter a number"
                    value={inputValue}
                    onChange={e => {
                      // Allow only digits
                      const val = e.target.value
                      if (val === '' || /^\d+$/.test(val)) {
                        updateAnswer(val)
                      }
                    }}
                    autoFocus
                  />
                </div>

                {/* Confidence Selector */}
                <ConfidenceSelector
                  value={answers[currentQuestion.id]?.confidence_pct || 50}
                  onChange={updateConfidence}
                />

                {/* Dynamic Info Section */}
                <div className="mt-6 pt-4 border-t border-swan">
                  <div className="flex gap-3 text-sm">
                    <svg className="w-5 h-5 text-duo-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {answers[currentQuestion.id]?.value ? (() => {
                      const estimate = answers[currentQuestion.id].value
                      const confidence = answers[currentQuestion.id]?.confidence_pct || 50
                      const lowRange = Math.ceil(estimate * 0.5)
                      const highRange = Math.floor(estimate * 2)
                      const correctPoints = { 10: 3, 30: 7, 50: 10, 70: 12, 90: 13 }[confidence] ?? 10
                      const wrongPoints = { 10: 0, 30: 1, 50: 3, 70: 6, 90: 10 }[confidence] ?? 3
                      const confidenceLabel = { 10: '0-20%', 30: '20-40%', 50: '40-60%', 70: '60-80%', 90: '80-100%' }[confidence] ?? '40-60%'
                      return (
                        <p className="text-wolf">
                          With your current estimate at {confidenceLabel} confidence, you&apos;ll earn <span className="font-semibold text-duo-green">+{correctPoints}</span> points if the correct answer is anywhere from {formatNumberReadable(lowRange)} to {formatNumberReadable(highRange)}, or lose <span className="font-semibold text-duo-red">{wrongPoints > 0 ? `-${wrongPoints}` : '0'}</span> if outside that range.
                        </p>
                      )
                    })() : (
                      <p className="text-wolf">
                        Hints unlock at halftime (35 min). Use the new information to update your estimates, find the balance between overreacting and underreacting!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-duo-red/10 border-2 border-duo-red rounded-duo p-4 text-center">
              <p className="text-duo-red-dark font-semibold">{error}</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-swan">
        <div className="max-w-2xl mx-auto px-4 pt-6 flex items-center justify-between" style={{ paddingBottom: '1.625rem' }}>
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
              onClick={handleSubmitClick}
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
      </div>
    </>
  )
}
