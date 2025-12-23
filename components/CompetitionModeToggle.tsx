'use client'

import { useState } from 'react'

type CompetitionMode = 'mock' | 'real'

type Props = {
  classId: string
  defaultMode?: CompetitionMode
  realUnlocked?: boolean
  onModeChange?: (mode: CompetitionMode) => void
}

export default function CompetitionModeToggle({
  classId,
  defaultMode = 'mock',
  realUnlocked = false,
  onModeChange
}: Props) {
  const [mode, setMode] = useState<CompetitionMode>(defaultMode)

  const handleModeChange = (newMode: CompetitionMode) => {
    setMode(newMode)
    onModeChange?.(newMode)
  }

  return (
    <div className="flex items-center bg-white rounded-full p-1 border-2 border-swan">
      <button
        onClick={() => handleModeChange('mock')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
          mode === 'mock'
            ? 'bg-duo-green text-white'
            : 'text-wolf hover:text-eel'
        }`}
      >
        Practice
      </button>
      <button
        onClick={() => handleModeChange('real')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
          mode === 'real'
            ? 'bg-duo-blue text-white'
            : 'text-wolf hover:text-eel'
        }`}
      >
        Official (soon)
      </button>
    </div>
  )
}
