'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface TimerProps {
  deadline: number | null
  onTimeUp?: () => void
  urgentThreshold?: number // minutes
}

export default function Timer({
  deadline,
  onTimeUp,
  urgentThreshold = 5,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('--:--')
  const [isUrgent, setIsUrgent] = useState(false)
  const onTimeUpRef = useRef(onTimeUp)
  const hasTriggeredRef = useRef(false)

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  const formatTime = useCallback((ms: number) => {
    if (ms <= 0) return '00:00'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (deadline === null) return

    // Reset the triggered flag when deadline changes
    hasTriggeredRef.current = false

    const updateTimer = () => {
      const ms = deadline - Date.now()
      if (ms <= 0) {
        setTimeLeft('00:00')
        setIsUrgent(true)
        // Only trigger once
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          onTimeUpRef.current?.()
        }
        return false
      }
      setTimeLeft(formatTime(ms))
      setIsUrgent(ms <= urgentThreshold * 60 * 1000)
      return true
    }

    // Handle page becoming visible again - check timer immediately
    // This fixes mobile browsers where setInterval is throttled/paused in background
    // We use multiple events to cover different browser behaviors:
    // - visibilitychange: standard API, works on most browsers
    // - pageshow: more reliable on iOS Safari when returning from another app
    // - focus: catches additional app switching scenarios
    const handleResume = () => {
      updateTimer()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleResume()
      }
    }

    const handlePageShow = () => {
      // Always check on pageshow - covers iOS Safari app switching
      handleResume()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleResume)

    // Initial update
    if (!updateTimer()) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleResume)
      return
    }

    const interval = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleResume)
    }
  }, [deadline, urgentThreshold, formatTime])

  return (
    <div className={`timer ${isUrgent ? 'timer-urgent' : ''}`}>
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{timeLeft}</span>
    </div>
  )
}
