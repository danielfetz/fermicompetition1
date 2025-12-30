'use client'

import { useState, useEffect } from 'react'

// Competition date: March 5, 2026 at midnight
const COMPETITION_DATE = new Date('2026-03-05T00:00:00')

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(): TimeLeft | null {
  const now = new Date()
  const difference = COMPETITION_DATE.getTime() - now.getTime()

  if (difference <= 0) {
    return null // Competition has started
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  }
}

export function isCompetitionStarted(): boolean {
  return new Date() >= COMPETITION_DATE
}

export default function CompetitionCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Don't render anything until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <div className="card text-center py-12">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-swan rounded mx-auto mb-4"></div>
          <div className="h-24 w-96 bg-swan rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (timeLeft === null) {
    return null // Competition has started, don't show countdown
  }

  return (
    <div className="card text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 bg-duo-blue rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-2xl font-extrabold text-eel mb-2">Official Competition Coming Soon</h2>
      <p className="text-wolf mb-8">Competition questions will be available to view once the countdown ends</p>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 max-w-sm sm:max-w-none mx-auto">
        <div className="bg-snow rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px]">
          <div className="text-2xl sm:text-3xl font-extrabold text-duo-blue">{timeLeft.days}</div>
          <div className="text-xs font-semibold text-wolf uppercase tracking-wide">Days</div>
        </div>
        <div className="bg-snow rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px]">
          <div className="text-2xl sm:text-3xl font-extrabold text-duo-blue">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs font-semibold text-wolf uppercase tracking-wide">Hours</div>
        </div>
        <div className="bg-snow rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px]">
          <div className="text-2xl sm:text-3xl font-extrabold text-duo-blue">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs font-semibold text-wolf uppercase tracking-wide">Minutes</div>
        </div>
        <div className="bg-snow rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px]">
          <div className="text-2xl sm:text-3xl font-extrabold text-duo-blue">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs font-semibold text-wolf uppercase tracking-wide">Seconds</div>
        </div>
      </div>

      <p className="text-sm text-wolf">
        Provisional Competition Date: <span className="font-semibold text-eel">March 5, 2026</span>
      </p>
      <p className="text-xs text-hare mt-1">
        Date subject to change
      </p>
    </div>
  )
}
