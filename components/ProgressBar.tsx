'use client'

interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
  variant?: 'default' | 'xp'
  animate?: boolean
  className?: string
}

export default function ProgressBar({
  current,
  total,
  showLabel = true,
  variant = 'default',
  animate = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100))

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-wolf">Progress</span>
          <span className="text-eel">
            {current}/{total}
          </span>
        </div>
      )}
      <div className={`progress-bar ${variant === 'xp' ? 'progress-xp' : ''}`}>
        <div
          className={`progress-fill ${animate ? 'progress-fill-animated' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
