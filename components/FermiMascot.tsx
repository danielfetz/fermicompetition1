'use client'

import { useState, useEffect } from 'react'

type MascotMood = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'neutral'

interface FermiMascotProps {
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg'
  message?: string
  showMessage?: boolean
  animate?: boolean
}

const MASCOT_COLORS = {
  body: '#58CC02',
  belly: '#89E219',
  eyes: '#FFFFFF',
  pupils: '#4B4B4B',
  cheeks: '#FF9600',
}

export default function FermiMascot({
  mood = 'happy',
  size = 'md',
  message,
  showMessage = true,
  animate = true,
}: FermiMascotProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (animate) {
      const interval = setInterval(() => {
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 500)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [animate])

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy':
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClasses[size]} ${isAnimating ? 'animate-wiggle' : ''}`}>
            {/* Body */}
            <ellipse cx="50" cy="55" rx="35" ry="40" fill={MASCOT_COLORS.body} />
            {/* Belly */}
            <ellipse cx="50" cy="65" rx="22" ry="25" fill={MASCOT_COLORS.belly} />
            {/* Left Eye */}
            <ellipse cx="35" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="37" cy="40" r="5" fill={MASCOT_COLORS.pupils} />
            <circle cx="39" cy="38" r="2" fill="#FFFFFF" />
            {/* Right Eye */}
            <ellipse cx="65" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="67" cy="40" r="5" fill={MASCOT_COLORS.pupils} />
            <circle cx="69" cy="38" r="2" fill="#FFFFFF" />
            {/* Happy Mouth */}
            <path d="M 35 60 Q 50 75 65 60" stroke={MASCOT_COLORS.pupils} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Cheeks */}
            <circle cx="25" cy="55" r="5" fill={MASCOT_COLORS.cheeks} opacity="0.5" />
            <circle cx="75" cy="55" r="5" fill={MASCOT_COLORS.cheeks} opacity="0.5" />
            {/* Atom Symbol on Belly */}
            <ellipse cx="50" cy="65" rx="8" ry="3" fill="none" stroke={MASCOT_COLORS.body} strokeWidth="1.5" />
            <ellipse cx="50" cy="65" rx="8" ry="3" fill="none" stroke={MASCOT_COLORS.body} strokeWidth="1.5" transform="rotate(60 50 65)" />
            <ellipse cx="50" cy="65" rx="8" ry="3" fill="none" stroke={MASCOT_COLORS.body} strokeWidth="1.5" transform="rotate(-60 50 65)" />
            <circle cx="50" cy="65" r="2" fill={MASCOT_COLORS.body} />
          </svg>
        )
      case 'thinking':
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Body */}
            <ellipse cx="50" cy="55" rx="35" ry="40" fill={MASCOT_COLORS.body} />
            {/* Belly */}
            <ellipse cx="50" cy="65" rx="22" ry="25" fill={MASCOT_COLORS.belly} />
            {/* Left Eye (looking up) */}
            <ellipse cx="35" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="35" cy="36" r="5" fill={MASCOT_COLORS.pupils} />
            {/* Right Eye (looking up) */}
            <ellipse cx="65" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="65" cy="36" r="5" fill={MASCOT_COLORS.pupils} />
            {/* Thinking Mouth */}
            <ellipse cx="50" cy="62" rx="5" ry="3" fill={MASCOT_COLORS.pupils} />
            {/* Thought bubble hints */}
            <circle cx="80" cy="25" r="3" fill="#E5E5E5" />
            <circle cx="88" cy="15" r="5" fill="#E5E5E5" />
          </svg>
        )
      case 'celebrating':
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClasses[size]} ${isAnimating ? 'animate-bounce-in' : ''}`}>
            {/* Body */}
            <ellipse cx="50" cy="55" rx="35" ry="40" fill={MASCOT_COLORS.body} />
            {/* Belly */}
            <ellipse cx="50" cy="65" rx="22" ry="25" fill={MASCOT_COLORS.belly} />
            {/* Left Eye (happy closed) */}
            <path d="M 25 40 Q 35 32 45 40" stroke={MASCOT_COLORS.pupils} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Right Eye (happy closed) */}
            <path d="M 55 40 Q 65 32 75 40" stroke={MASCOT_COLORS.pupils} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Big Smile */}
            <path d="M 30 55 Q 50 80 70 55" stroke={MASCOT_COLORS.pupils} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Stars */}
            <text x="10" y="20" fontSize="12">⭐</text>
            <text x="80" y="15" fontSize="10">✨</text>
            <text x="85" y="35" fontSize="8">⭐</text>
          </svg>
        )
      case 'encouraging':
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Body */}
            <ellipse cx="50" cy="55" rx="35" ry="40" fill={MASCOT_COLORS.body} />
            {/* Belly */}
            <ellipse cx="50" cy="65" rx="22" ry="25" fill={MASCOT_COLORS.belly} />
            {/* Left Eye (winking) */}
            <path d="M 25 40 Q 35 35 45 40" stroke={MASCOT_COLORS.pupils} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Right Eye */}
            <ellipse cx="65" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="67" cy="40" r="5" fill={MASCOT_COLORS.pupils} />
            <circle cx="69" cy="38" r="2" fill="#FFFFFF" />
            {/* Smile */}
            <path d="M 35 58 Q 50 70 65 58" stroke={MASCOT_COLORS.pupils} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Thumbs up indication */}
            <text x="75" y="85" fontSize="16">👍</text>
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 100 100" className={sizeClasses[size]}>
            {/* Body */}
            <ellipse cx="50" cy="55" rx="35" ry="40" fill={MASCOT_COLORS.body} />
            {/* Belly */}
            <ellipse cx="50" cy="65" rx="22" ry="25" fill={MASCOT_COLORS.belly} />
            {/* Eyes */}
            <ellipse cx="35" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="37" cy="40" r="5" fill={MASCOT_COLORS.pupils} />
            <ellipse cx="65" cy="40" rx="10" ry="12" fill={MASCOT_COLORS.eyes} />
            <circle cx="67" cy="40" r="5" fill={MASCOT_COLORS.pupils} />
            {/* Neutral Mouth */}
            <line x1="40" y1="60" x2="60" y2="60" stroke={MASCOT_COLORS.pupils} strokeWidth="3" strokeLinecap="round" />
          </svg>
        )
    }
  }

  return (
    <div className="mascot inline-flex flex-col items-center">
      {getMoodEmoji()}
      {showMessage && message && (
        <div className="mt-2 bg-white rounded-duo-lg p-3 shadow-card border-2 border-swan max-w-xs text-center">
          <p className="text-sm font-semibold text-eel">{message}</p>
        </div>
      )}
    </div>
  )
}
