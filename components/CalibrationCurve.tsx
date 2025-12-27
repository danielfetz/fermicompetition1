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
  | 'slight-overconfidence'
  | 'decisive-underconfidence'
  | 'very-strong-underconfidence'
  | 'strong-underconfidence'
  | 'moderate-underconfidence'
  | 'slight-underconfidence'
  | 'good-calibration'
  | 'slight-good-calibration'
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

// Human-readable descriptions for detailed status (full sentences)
const DETAILED_STATUS_DESCRIPTIONS: Record<DetailedCalibrationStatus, string> = {
  'decisive-overconfidence': 'there is decisive evidence for overconfidence',
  'very-strong-overconfidence': 'there is very strong evidence for overconfidence',
  'strong-overconfidence': 'there is strong evidence for overconfidence',
  'moderate-overconfidence': 'there is substantial evidence for overconfidence',
  'slight-overconfidence': 'there is a slight tendency towards overconfidence',
  'decisive-underconfidence': 'there is decisive evidence for underconfidence',
  'very-strong-underconfidence': 'there is very strong evidence for underconfidence',
  'strong-underconfidence': 'there is strong evidence for underconfidence',
  'moderate-underconfidence': 'there is substantial evidence for underconfidence',
  'slight-underconfidence': 'there is a slight tendency towards underconfidence',
  'good-calibration': 'good calibration is supported',
  'slight-good-calibration': 'there is a slight tendency towards good calibration',
  'no-miscalibration-evidence': 'we don\'t have enough evidence to confirm good calibration, but we also found no evidence of miscalibration',
  'insufficient-data': 'there is insufficient evidence to judge'
}

export default function CalibrationCurve({ data, status, bucketStatuses }: CalibrationCurveProps) {
  // Chart dimensions - increased bottom padding for axis label spacing
  const width = 300
  const height = 240
  const padding = { top: 20, right: 20, bottom: 55, left: 50 }
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

  // Generate per-bucket verdict descriptions as full sentences
  const generateBucketVerdicts = (): string => {
    if (!bucketStatuses || bucketStatuses.length === 0) {
      return 'Not enough data to assess calibration.'
    }

    // Sort by confidence level for consistent ordering
    const sortedBuckets = [...bucketStatuses].sort((a, b) => a.confidence - b.confidence)

    const sentences: string[] = []

    for (const bucket of sortedBuckets) {
      const label = CONFIDENCE_LABELS[bucket.confidence]
      if (bucket.detailedStatus) {
        const description = DETAILED_STATUS_DESCRIPTIONS[bucket.detailedStatus]
        // Capitalize first letter of the description for a proper sentence
        const capitalizedDesc = description.charAt(0).toUpperCase() + description.slice(1)
        sentences.push(`At ${label}, ${description}.`)
      }
    }

    if (sentences.length === 0) {
      return 'Not enough data to assess calibration.'
    }

    return sentences.join(' ')
  }

  const bucketVerdicts = generateBucketVerdicts()

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

          {/* X-axis tick labels (bucket percentages) */}
          {data.map((d, i) => (
            <text
              key={i}
              x={xScale(d.confidence)}
              y={padding.top + chartHeight + 18}
              textAnchor="middle"
              className="text-[10px] fill-wolf"
            >
              {CONFIDENCE_LABELS[d.confidence]}
            </text>
          ))}

          {/* Axis title labels */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            className="text-xs fill-eel font-semibold"
          >
            Confidence Selected
          </text>
          <text
            x={14}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${padding.top + chartHeight / 2})`}
            className="text-xs fill-eel font-semibold"
          >
            Actual Accuracy
          </text>
        </svg>
      </div>

      {/* Per-bucket verdicts */}
      <div className="text-center">
        <p className="text-sm text-wolf leading-relaxed">
          {bucketVerdicts}
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
