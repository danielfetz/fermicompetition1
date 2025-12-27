'use client'

type CalibrationDataPoint = {
  confidence: number
  expectedAccuracy: number
  actualAccuracy: number | null
  count: number
}

type CalibrationStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

type DetailedCalibrationStatus =
  | 'decisive-overconfidence'
  | 'very-strong-overconfidence'
  | 'strong-overconfidence'
  | 'moderate-overconfidence'
  | 'decisive-underconfidence'
  | 'very-strong-underconfidence'
  | 'strong-underconfidence'
  | 'moderate-underconfidence'
  | 'good-calibration'
  | 'no-miscalibration-evidence'
  | 'insufficient-data'

type BucketStatus = {
  confidence: number
  status: CalibrationStatus
  detailedStatus?: DetailedCalibrationStatus
  probBelow?: number
  probAbove?: number
  probInRange?: number
}

interface CalibrationCurveProps {
  data: CalibrationDataPoint[]
  status: CalibrationStatus
  bucketStatuses?: BucketStatus[]
}

const CONFIDENCE_LABELS: Record<number, string> = {
  10: '0-20%',
  30: '20-40%',
  50: '40-60%',
  70: '60-80%',
  90: '80-100%'
}

// Human-readable labels for detailed status
const DETAILED_STATUS_LABELS: Record<DetailedCalibrationStatus, { label: string; strength: string }> = {
  'decisive-overconfidence': { label: 'decisively overconfident', strength: 'decisive' },
  'very-strong-overconfidence': { label: 'very strongly overconfident', strength: 'very strong' },
  'strong-overconfidence': { label: 'strongly overconfident', strength: 'strong' },
  'moderate-overconfidence': { label: 'moderately overconfident', strength: 'moderate' },
  'decisive-underconfidence': { label: 'decisively underconfident', strength: 'decisive' },
  'very-strong-underconfidence': { label: 'very strongly underconfident', strength: 'very strong' },
  'strong-underconfidence': { label: 'strongly underconfident', strength: 'strong' },
  'moderate-underconfidence': { label: 'moderately underconfident', strength: 'moderate' },
  'good-calibration': { label: 'good calibration', strength: 'good' },
  'no-miscalibration-evidence': { label: 'no miscalibration evidence', strength: '' },
  'insufficient-data': { label: 'insufficient data', strength: '' }
}

export default function CalibrationCurve({ data, status, bucketStatuses }: CalibrationCurveProps) {
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

  // Generate detailed bucket feedback with gradations
  const getBucketFeedback = (): { overconfident: string[]; underconfident: string[]; wellCalibrated: string[] } => {
    const result = { overconfident: [] as string[], underconfident: [] as string[], wellCalibrated: [] as string[] }
    if (!bucketStatuses || bucketStatuses.length === 0) return result

    for (const b of bucketStatuses) {
      const label = CONFIDENCE_LABELS[b.confidence]
      const detailedInfo = b.detailedStatus ? DETAILED_STATUS_LABELS[b.detailedStatus] : null

      if (b.status === 'overconfident' && detailedInfo) {
        result.overconfident.push(`${label} (${detailedInfo.strength})`)
      } else if (b.status === 'underconfident' && detailedInfo) {
        result.underconfident.push(`${label} (${detailedInfo.strength})`)
      } else if (b.status === 'well-calibrated' && detailedInfo) {
        result.wellCalibrated.push(`${label}`)
      }
    }

    return result
  }

  const bucketFeedback = getBucketFeedback()

  // Build detailed description
  const buildDescription = (): string => {
    const parts: string[] = []

    if (bucketFeedback.overconfident.length > 0) {
      parts.push(`Overconfident at: ${bucketFeedback.overconfident.join(', ')}`)
    }
    if (bucketFeedback.underconfident.length > 0) {
      parts.push(`Underconfident at: ${bucketFeedback.underconfident.join(', ')}`)
    }
    if (bucketFeedback.wellCalibrated.length > 0 && status !== 'well-calibrated') {
      parts.push(`Well-calibrated at: ${bucketFeedback.wellCalibrated.join(', ')}`)
    }

    return parts.join('. ')
  }

  const bucketDetails = buildDescription()

  const statusConfig: Record<CalibrationStatus, { label: string; color: string; baseDescription: string }> = {
    'well-calibrated': {
      label: 'Well Calibrated',
      color: 'text-duo-green',
      baseDescription: 'Your confidence levels closely match your actual accuracy.'
    },
    'overconfident': {
      label: 'Overconfident',
      color: 'text-duo-red',
      baseDescription: 'You tend to be more confident than your accuracy warrants.'
    },
    'underconfident': {
      label: 'Underconfident',
      color: 'text-duo-blue',
      baseDescription: 'You\'re actually more accurate than your confidence suggests.'
    },
    'insufficient-data': {
      label: 'Insufficient Data',
      color: 'text-wolf',
      baseDescription: 'Not enough answers at different confidence levels to determine calibration.'
    }
  }

  const currentStatus = statusConfig[status]
  const fullDescription = bucketDetails
    ? `${currentStatus.baseDescription} ${bucketDetails}.`
    : currentStatus.baseDescription

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="flex justify-center">
        <svg width={width} height={height} className="font-sans">
          {/* Grid lines */}
          {[0, 20, 40, 60, 80, 100].map(tick => (
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
          {fullDescription}
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
