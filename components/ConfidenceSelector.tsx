'use client'

type ConfidenceLevel = 10 | 30 | 50 | 70 | 90

interface ConfidenceSelectorProps {
  value: ConfidenceLevel
  onChange: (value: ConfidenceLevel) => void
  disabled?: boolean
}

const CONFIDENCE_LEVELS: { value: ConfidenceLevel; label: string; emoji: string }[] = [
  { value: 10, label: '0-20%', emoji: '😰' },
  { value: 30, label: '20-40%', emoji: '🤔' },
  { value: 50, label: '40-60%', emoji: '😐' },
  { value: 70, label: '60-80%', emoji: '😊' },
  { value: 90, label: '80-100%', emoji: '😎' },
]

export default function ConfidenceSelector({
  value,
  onChange,
  disabled = false,
}: ConfidenceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="label">How confident are you?</label>
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
