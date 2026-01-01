import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteStudentButton from '@/components/DeleteStudentButton'
import CalibrationAccordion from '@/components/CalibrationAccordion'
import StudentAnswersForm from '@/components/StudentAnswersForm'

type Params = { params: { id: string, studentId: string } }

type FermiQuestion = {
  id: string
  prompt: string
  correct_value: number
}

type ClassQuestion = {
  id: string
  order: number
  fermi_questions: FermiQuestion | FermiQuestion[] | null
}

// Helper to extract fermi question from either single object or array
function getFermiQuestion(fq: FermiQuestion | FermiQuestion[] | null): FermiQuestion | null {
  if (!fq) return null
  if (Array.isArray(fq)) return fq[0] || null
  return fq
}

// Calculate orders of magnitude difference from correct answer
// Green threshold: log10(2) ≈ 0.30103 orders of magnitude = factor of 2 (same as "correct" threshold)
const LOG10_2 = Math.log10(2) // ≈ 0.30103

function getOrdersOfMagnitude(answer: number | null | undefined, correct: number | null | undefined): { value: number; label: string; color: string } | null {
  if (answer == null || correct == null || correct === 0 || answer === 0) return null
  const ordersDiff = Math.abs(Math.log10(answer) - Math.log10(correct))
  let color = 'text-duo-red'
  let label = ''
  if (ordersDiff <= LOG10_2 + 0.0001) {
    // Within factor of 2 - considered "correct" (small epsilon for floating point)
    color = 'text-duo-green'
    label = ordersDiff < 0.1 ? '< 0.1 orders of magnitude' : `${ordersDiff.toFixed(2)} orders of magnitude`
  } else if (ordersDiff < 1) {
    color = 'text-duo-yellow-dark'
    label = `${ordersDiff.toFixed(2)} orders of magnitude`
  } else {
    color = 'text-duo-red'
    label = `${ordersDiff.toFixed(1)} orders of magnitude`
  }
  return { value: ordersDiff, label, color }
}

// Check if answer is correct (within factor of 2)
function isCorrect(answer: number | null | undefined, correct: number | null | undefined): boolean {
  if (answer == null || correct == null) return false
  return answer >= correct * 0.5 && answer <= correct * 2.0
}

// Confidence bucket ranges
const CONFIDENCE_RANGES: Record<number, { lower: number; upper: number }> = {
  10: { lower: 0, upper: 20 },
  30: { lower: 20, upper: 40 },
  50: { lower: 40, upper: 60 },
  70: { lower: 60, upper: 80 },
  90: { lower: 80, upper: 100 }
}

// Bucket-specific minimum sample sizes
const BUCKET_MIN_SAMPLES: Record<number, number> = {
  10: 2, 30: 3, 50: 4, 70: 3, 90: 2
}

// Detailed calibration status
type DetailedStatus =
  | 'decisive-overconfidence' | 'very-strong-overconfidence' | 'strong-overconfidence' | 'moderate-overconfidence'
  | 'decisive-underconfidence' | 'very-strong-underconfidence' | 'strong-underconfidence' | 'moderate-underconfidence'
  | 'good-calibration' | 'slight-good-calibration' | 'no-miscalibration-evidence' | 'insufficient-data'

type SimpleStatus = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'

type BucketAssessment = {
  confidence: number
  status: SimpleStatus
  detailedStatus: DetailedStatus
  correct: number
  total: number
  actualPct: number | null
}

// Stirling's approximation for log-gamma
function logGamma(x: number): number {
  if (x <= 0) return Infinity
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  x -= 1
  const coefficients = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953]
  let sum = 1.000000000190015
  for (let i = 0; i < 6; i++) sum += coefficients[i] / (x + i + 1)
  const t = x + 5.5
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum)
}

// Regularized incomplete beta function
function betaIncomplete(a: number, b: number, x: number): number {
  if (x === 0) return 0
  if (x === 1) return 1
  if (x > (a + 1) / (a + b + 2)) return 1 - betaIncomplete(b, a, 1 - x)
  const maxIterations = 200, epsilon = 1e-10
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a
  let f = 1, c = 1, d = 0
  for (let m = 0; m <= maxIterations; m++) {
    let numerator: number
    if (m === 0) numerator = 1
    else if (m % 2 === 0) { const k = m / 2; numerator = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k)) }
    else { const k = (m - 1) / 2; numerator = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1)) }
    d = 1 + numerator * d; if (Math.abs(d) < epsilon) d = epsilon; d = 1 / d
    c = 1 + numerator / c; if (Math.abs(c) < epsilon) c = epsilon
    const delta = c * d; f *= delta
    if (Math.abs(delta - 1) < epsilon) break
  }
  return front * (f - 1)
}

function betaCDF(a: number, b: number, x: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1
  return betaIncomplete(a, b, x)
}

// Bayesian calibration assessment for a single bucket
function assessBucket(successes: number, total: number, confidenceLevel: number): { status: SimpleStatus; detailedStatus: DetailedStatus } {
  const range = CONFIDENCE_RANGES[confidenceLevel]
  const minSamples = BUCKET_MIN_SAMPLES[confidenceLevel] || 3
  if (total < minSamples || !range) return { status: 'insufficient-data', detailedStatus: 'insufficient-data' }

  const alpha = 1 + successes, beta = 1 + (total - successes)
  const lower = range.lower / 100, upper = range.upper / 100
  const probBelow = betaCDF(alpha, beta, lower)
  const probBelowUpper = betaCDF(alpha, beta, upper)
  const probInRange = probBelowUpper - probBelow
  const probAbove = 1 - probBelowUpper

  // Overconfidence check
  if (probBelow > 0.99) return { status: 'overconfident', detailedStatus: 'decisive-overconfidence' }
  if (probBelow > 0.97) return { status: 'overconfident', detailedStatus: 'very-strong-overconfidence' }
  if (probBelow > 0.91) return { status: 'overconfident', detailedStatus: 'strong-overconfidence' }
  if (probBelow > 0.75) return { status: 'overconfident', detailedStatus: 'moderate-overconfidence' }

  // Underconfidence check
  if (probAbove > 0.99) return { status: 'underconfident', detailedStatus: 'decisive-underconfidence' }
  if (probAbove > 0.97) return { status: 'underconfident', detailedStatus: 'very-strong-underconfidence' }
  if (probAbove > 0.91) return { status: 'underconfident', detailedStatus: 'strong-underconfidence' }
  if (probAbove > 0.75) return { status: 'underconfident', detailedStatus: 'moderate-underconfidence' }

  // Well-calibrated check
  if (probInRange > 0.75) return { status: 'well-calibrated', detailedStatus: 'good-calibration' }
  if (probInRange > 0.50) return { status: 'well-calibrated', detailedStatus: 'slight-good-calibration' }
  return { status: 'well-calibrated', detailedStatus: 'no-miscalibration-evidence' }
}

// Calculate calibration with per-bucket Bayesian assessment
function calculateCalibration(
  questions: ClassQuestion[],
  answerMap: Map<string, { value: number | null; confidence_pct: number }>
): { correctCount: number; totalAnswered: number; buckets: BucketAssessment[] } {
  const buckets: Record<number, { correct: number; total: number }> = {
    10: { correct: 0, total: 0 }, 30: { correct: 0, total: 0 }, 50: { correct: 0, total: 0 },
    70: { correct: 0, total: 0 }, 90: { correct: 0, total: 0 }
  }
  let correctCount = 0, totalAnswered = 0

  for (const cq of questions) {
    const fq = getFermiQuestion(cq.fermi_questions)
    const a = answerMap.get(cq.id)
    if (!a || a.value == null || !fq) continue
    totalAnswered++
    const conf = a.confidence_pct as 10 | 30 | 50 | 70 | 90
    const correct = isCorrect(a.value, fq.correct_value)
    if (correct) correctCount++
    if (buckets[conf]) { buckets[conf].total++; if (correct) buckets[conf].correct++ }
  }

  const bucketAssessments: BucketAssessment[] = [10, 30, 50, 70, 90].map(conf => {
    const data = buckets[conf]
    const assessment = assessBucket(data.correct, data.total, conf)
    return {
      confidence: conf,
      status: assessment.status,
      detailedStatus: assessment.detailedStatus,
      correct: data.correct,
      total: data.total,
      actualPct: data.total > 0 ? Math.round((data.correct / data.total) * 100) : null
    }
  })

  return { correctCount, totalAnswered, buckets: bucketAssessments }
}

// Map confidence values to display ranges
function getConfidenceLabel(value: number): string {
  switch (value) {
    case 10: return '0-20%'
    case 30: return '20-40%'
    case 50: return '40-60%'
    case 70: return '60-80%'
    case 90: return '80-100%'
    default: return `${value}%`
  }
}

export default async function EditStudent({ params }: Params) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // First get the student to determine their competition mode
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, username, class_id, competition_mode')
    .eq('id', params.studentId)
    .single()

  if (!student) return notFound()

  // Get the student's competition mode (default to mock)
  const studentMode = student.competition_mode || 'mock'

  // Get the class's school_year
  const { data: classData } = await supabase
    .from('classes')
    .select('school_year')
    .eq('id', params.id)
    .single()

  const schoolYear = classData?.school_year || '2025-26'

  // Fetch questions, answers, and student score in parallel
  const [{ data: classQuestions }, { data: answers }, { data: scoreData }] = await Promise.all([
    supabase.from('class_questions').select(`
      id,
      order,
      fermi_questions (
        id,
        prompt,
        correct_value
      )
    `).eq('class_id', params.id).eq('competition_mode', studentMode).eq('school_year', schoolYear).order('order'),
    supabase.from('answers').select('class_question_id, value, confidence_pct').eq('student_id', params.studentId),
    supabase.from('student_scores').select('confidence_points').eq('student_id', params.studentId).maybeSingle()
  ])

  // Cast to proper type
  const questions = (classQuestions || []) as ClassQuestion[]
  const answerMap = new Map(answers?.map(a => [a.class_question_id, a]))
  const points = scoreData?.confidence_points ?? 250

  // Calculate calibration with per-bucket Bayesian assessment
  const calibration = calculateCalibration(questions, answerMap as Map<string, { value: number | null; confidence_pct: number }>)

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/class/${params.id}?mode=${studentMode}`} className="text-sm font-semibold text-duo-blue hover:underline mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Class Overview
        </Link>
        <h1 className="text-2xl font-extrabold">Edit {student.full_name || student.username}</h1>
      </div>

      {/* Calibration Summary Card (Accordion) */}
      {calibration.totalAnswered > 0 && (
        <CalibrationAccordion
          correctCount={calibration.correctCount}
          totalAnswered={calibration.totalAnswered}
          points={points}
          buckets={calibration.buckets}
        />
      )}

      <div className="card overflow-x-auto">
        <StudentAnswersForm
          studentId={student.id}
          classId={params.id}
          mode={studentMode}
          fullName={student.full_name}
          questions={questions.map(cq => ({
            id: cq.id,
            order: cq.order,
            fermi_questions: getFermiQuestion(cq.fermi_questions)
          }))}
          answers={answers?.map(a => ({
            class_question_id: a.class_question_id,
            value: a.value,
            confidence_pct: a.confidence_pct
          })) || []}
        />
      </div>

      {/* Delete Student Section */}
      <div className="card border-duo-red/30 bg-duo-red/5">
        <h3 className="font-bold text-eel mb-2">Danger Zone</h3>
        <p className="text-sm text-wolf mb-4">
          Permanently delete this student and all their answers across all competition modes and school years. This action cannot be undone.
        </p>
        <DeleteStudentButton
          studentId={student.id}
          classId={params.id}
          mode={studentMode}
        />
      </div>
    </div>
  )
}
