'use client'

import { useState } from 'react'

type Props = {
  classId: string
  defaultMode?: 'mock' | 'real'
}

export default function CompetitionModeToggle({ classId, defaultMode = 'mock' }: Props) {
  const [mode, setMode] = useState<'mock' | 'real'>(defaultMode)

  return (
    <div className="flex items-center bg-swan rounded-full p-1">
      <button
        onClick={() => setMode('mock')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
          mode === 'mock'
            ? 'bg-duo-green text-white shadow-duo-green'
            : 'text-wolf hover:text-eel'
        }`}
      >
        Mock
      </button>
      <button
        onClick={() => setMode('real')}
        disabled
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
          mode === 'real'
            ? 'bg-duo-blue text-white shadow-duo-blue'
            : 'text-hare cursor-not-allowed'
        }`}
        title="Coming soon"
      >
        Real
        <span className="ml-1 text-xs opacity-75">(Soon)</span>
      </button>
    </div>
  )
}
