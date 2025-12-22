'use client'

type ConfidenceLevel = 10 | 30 | 50 | 70 | 90

interface ConfidenceSelectorProps {
  value: ConfidenceLevel
  onChange: (value: ConfidenceLevel) => void
  disabled?: boolean
}

const CONFIDENCE_LEVELS: { value: ConfidenceLevel; label: string; emoji: string }[] = [
  { value: 10, label: '0-20%', emoji: '😰' },
  { value: 30, label: '20-40%', emoji: '😐' },
  { value: 50, label: '40-60%', emoji: '🤔' },
  { value: 70, label: '60-80%', emoji: '😊' },
  { value: 90, label: '80-100%', emoji: '😎' },
]

export default function ConfidenceSelector({
  value,
  onChange,
  disabled = false,
}: ConfidenceSelectorProps) {
  return (
    <div>
      <label className="label !mb-4 flex items-center gap-2">
        How confident are you?
        <span className="group relative">
          <svg className="w-4 h-4 text-wolf cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-eel text-white text-xs font-normal normal-case tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-56">
            Higher confidence = more points if correct, but also more lost if wrong
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        {CONFIDENCE_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level.value)}
            className={`confidence-btn ${
              value === level.value ? `selected selected-${level.value}` : ''
            }`}
          >
            <div className="text-lg">{level.emoji}</div>
            <div className="text-sm">{level.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
