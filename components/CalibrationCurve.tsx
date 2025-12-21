'use client'

type CalibrationDataPoint = {
  confidence: number
  expectedAccuracy: number
  actualAccuracy: number | null
  count: number
}

type CalibrationStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

interface CalibrationCurveProps {
  data: CalibrationDataPoint[]
  status: CalibrationStatus
}

const CONFIDENCE_LABELS: Record<number, string> = {
  10: '0-20%',
  30: '20-40%',
  50: '40-60%',
  70: '60-80%',
  90: '80-100%'
}

export default function CalibrationCurve({ data, status }: CalibrationCurveProps) {
  // Chart dimensions
  const width = 300
  const height = 220
  const padding = { top: 20, right: 20, bottom: 40, left: 45 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Scale functions
  const xScale = (value: number) => padding.left + (value / 100) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - (value / 100) * chartHeight

  // Build the perfect calibration line path
  const perfectLinePath = `M ${xScale(0)} ${yScale(0)} L ${xScale(100)} ${yScale(100)}`

  // Build the actual calibration line path (only points with data)
  const dataPoints = data.filter(d => d.actualAccuracy !== null)
  const actualLinePath = dataPoints.length >= 2
    ? dataPoints.map((d, i) => {
        const x = xScale(d.confidence)
        const y = yScale(d.actualAccuracy!)
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      }).join(' ')
    : null

  const statusConfig: Record<CalibrationStatus, { label: string; color: string; description: string }> = {
    'well-calibrated': {
      label: 'Well Calibrated',
      color: 'text-duo-green',
      description: 'Your confidence levels closely match your actual accuracy. Great calibration!'
    },
    'overconfident': {
      label: 'Overconfident',
      color: 'text-duo-red',
      description: 'You tend to be more confident than your accuracy warrants. Consider being more conservative with high confidence ratings.'
    },
    'underconfident': {
      label: 'Underconfident',
      color: 'text-duo-blue',
      description: 'You\'re actually more accurate than your confidence suggests. You can trust your estimates more!'
    },
    'insufficient-data': {
      label: 'Insufficient Data',
      color: 'text-wolf',
      description: 'Not enough answers at different confidence levels to determine calibration.'
    }
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="flex justify-center">
        <svg width={width} height={height} className="font-sans">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(tick => (
            <g key={tick}>
              {/* Horizontal grid lines */}
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={width - padding.right}
                y2={yScale(tick)}
                stroke="#e4e4e4"
                strokeDasharray="3,3"
              />
              {/* Y-axis labels */}
              <text
                x={padding.left - 8}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-wolf"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Perfect calibration line (diagonal) */}
          <path
            d={perfectLinePath}
            fill="none"
            stroke="#e4e4e4"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
          <text
            x={xScale(85)}
            y={yScale(92)}
            className="text-[10px] fill-wolf"
          >
            Perfect
          </text>

          {/* Actual calibration line */}
          {actualLinePath && (
            <path
              d={actualLinePath}
              fill="none"
              stroke="#58cc02"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => {
            if (d.actualAccuracy === null) return null
            const x = xScale(d.confidence)
            const y = yScale(d.actualAccuracy)
            return (
              <g key={i}>
                {/* Outer circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="white"
                  stroke="#58cc02"
                  strokeWidth="3"
                />
                {/* Count label */}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[9px] fill-eel font-bold"
                >
                  {d.count}
                </text>
              </g>
            )
          })}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={xScale(d.confidence)}
              y={height - 10}
              textAnchor="middle"
              className="text-[10px] fill-wolf"
            >
              {CONFIDENCE_LABELS[d.confidence]}
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 0}
            textAnchor="middle"
            className="text-xs fill-eel font-semibold"
          >
            Confidence Selected
          </text>
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${height / 2})`}
            className="text-xs fill-eel font-semibold"
          >
            Actual Accuracy
          </text>
        </svg>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        <div className={`font-bold text-lg ${currentStatus.color}`}>
          {currentStatus.label}
        </div>
        <p className="text-sm text-wolf">
          {currentStatus.description}
        </p>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs text-wolf">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-swan border-dashed border-t-2 border-swan"></div>
          <span>Perfect calibration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-duo-green rounded"></div>
          <span>Your calibration</span>
        </div>
      </div>
    </div>
  )
}
