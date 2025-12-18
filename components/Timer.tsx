'use client'

import { useEffect, useState, useCallback } from 'react'

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

  const formatTime = useCallback((ms: number) => {
    if (ms <= 0) return '00:00'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (deadline === null) return

    const updateTimer = () => {
      const ms = deadline - Date.now()
      if (ms <= 0) {
        setTimeLeft('00:00')
        setIsUrgent(true)
        onTimeUp?.()
        return false
      }
      setTimeLeft(formatTime(ms))
      setIsUrgent(ms <= urgentThreshold * 60 * 1000)
      return true
    }

    // Initial update
    if (!updateTimer()) return

    const interval = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [deadline, onTimeUp, urgentThreshold, formatTime])

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
