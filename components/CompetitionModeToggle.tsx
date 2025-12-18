'use client'

import { useState } from 'react'

type Props = {
  classId: string
  defaultMode?: 'mock' | 'real'
  realUnlocked?: boolean
  onModeChange?: (mode: 'mock' | 'real') => void
}

export default function CompetitionModeToggle({
  classId,
  defaultMode = 'mock',
  realUnlocked = false,
  onModeChange
}: Props) {
  const [mode, setMode] = useState<'mock' | 'real'>(defaultMode)

  const handleModeChange = (newMode: 'mock' | 'real') => {
    setMode(newMode)
    onModeChange?.(newMode)
  }

  return (
    <div className="flex items-center bg-swan rounded-full p-1">
      <button
        onClick={() => handleModeChange('mock')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
          mode === 'mock'
            ? 'bg-duo-green text-white shadow-duo-green'
            : 'text-wolf hover:text-eel'
        }`}
      >
        Mock
      </button>
      <button
        onClick={() => handleModeChange('real')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
          mode === 'real'
            ? 'bg-duo-blue text-white shadow-duo-blue'
            : 'text-wolf hover:text-eel'
        }`}
      >
        Official
        {!realUnlocked && <span className="ml-1 text-xs opacity-75">🔒</span>}
      </button>
    </div>
  )
}
