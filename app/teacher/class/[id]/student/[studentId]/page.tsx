import { createSupabaseServer } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteStudentButton from '@/components/DeleteStudentButton'

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
function getOrdersOfMagnitude(answer: number | null | undefined, correct: number | null | undefined): { value: number; label: string; color: string } | null {
  if (answer == null || correct == null || correct === 0 || answer === 0) return null
  const ordersDiff = Math.abs(Math.log10(answer) - Math.log10(correct))
  let color = 'text-duo-red'
  let label = ''
  if (ordersDiff < 0.1) {
    color = 'text-duo-green'
    label = '< 0.1 orders of magnitude'
  } else if (ordersDiff < 0.5) {
    color = 'text-duo-green'
    label = `${ordersDiff.toFixed(1)} orders of magnitude`
  } else if (ordersDiff < 1) {
    color = 'text-duo-yellow-dark'
    label = `${ordersDiff.toFixed(1)} orders of magnitude`
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

// Calculate calibration status
function calculateCalibration(
  questions: ClassQuestion[],
  answerMap: Map<string, { value: number | null; confidence_pct: number }>
): { status: 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data'; correctCount: number; totalAnswered: number } {
  const buckets: Record<number, { correct: number; total: number }> = {
    10: { correct: 0, total: 0 },
    30: { correct: 0, total: 0 },
    50: { correct: 0, total: 0 },
    70: { correct: 0, total: 0 },
    90: { correct: 0, total: 0 }
  }

  let correctCount = 0
  let totalAnswered = 0

  for (const cq of questions) {
    const fq = getFermiQuestion(cq.fermi_questions)
    const a = answerMap.get(cq.id)
    if (!a || a.value == null || !fq) continue

    totalAnswered++
    const conf = a.confidence_pct as 10 | 30 | 50 | 70 | 90
    const correct = isCorrect(a.value, fq.correct_value)
    if (correct) correctCount++

    if (buckets[conf]) {
      buckets[conf].total++
      if (correct) buckets[conf].correct++
    }
  }

  if (totalAnswered < 3) {
    return { status: 'insufficient-data', correctCount, totalAnswered }
  }

  // Simple heuristic: compare expected vs actual accuracy across buckets
  let overconfidentScore = 0
  let underconfidentScore = 0
  let totalWeight = 0

  const expectedAccuracy: Record<number, number> = { 10: 0.1, 30: 0.3, 50: 0.5, 70: 0.7, 90: 0.9 }

  for (const [conf, data] of Object.entries(buckets)) {
    if (data.total === 0) continue
    const expected = expectedAccuracy[Number(conf)]
    const actual = data.correct / data.total
    const diff = expected - actual // positive = overconfident

    totalWeight += data.total
    if (diff > 0.15) overconfidentScore += data.total * diff
    else if (diff < -0.15) underconfidentScore += data.total * Math.abs(diff)
  }

  if (totalWeight === 0) return { status: 'insufficient-data', correctCount, totalAnswered }

  const normalizedOver = overconfidentScore / totalWeight
  const normalizedUnder = underconfidentScore / totalWeight

  if (normalizedOver > 0.1 && normalizedOver > normalizedUnder) {
    return { status: 'overconfident', correctCount, totalAnswered }
  } else if (normalizedUnder > 0.1 && normalizedUnder > normalizedOver) {
    return { status: 'underconfident', correctCount, totalAnswered }
  }
  return { status: 'well-calibrated', correctCount, totalAnswered }
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

  // Now fetch questions filtered by the student's mode, and their answers
  const [{ data: classQuestions }, { data: answers }] = await Promise.all([
    supabase.from('class_questions').select(`
      id,
      order,
      fermi_questions (
        id,
        prompt,
        correct_value
      )
    `).eq('class_id', params.id).eq('competition_mode', studentMode).order('order'),
    supabase.from('answers').select('class_question_id, value, confidence_pct').eq('student_id', params.studentId)
  ])

  // Cast to proper type
  const questions = (classQuestions || []) as ClassQuestion[]
  const answerMap = new Map(answers?.map(a => [a.class_question_id, a]))

  // Calculate calibration
  const calibration = calculateCalibration(questions, answerMap as Map<string, { value: number | null; confidence_pct: number }>)

  // Get calibration display info
  const calibrationInfo = {
    'well-calibrated': {
      label: 'Well-Calibrated',
      color: 'text-duo-green',
      bgColor: 'bg-duo-green/10 border-duo-green/30',
      icon: '✓',
      description: 'Confidence levels match accuracy well'
    },
    'overconfident': {
      label: 'Overconfident',
      color: 'text-duo-red',
      bgColor: 'bg-duo-red/10 border-duo-red/30',
      icon: '↑',
      description: 'Confidence tends to be higher than actual accuracy'
    },
    'underconfident': {
      label: 'Underconfident',
      color: 'text-duo-blue',
      bgColor: 'bg-duo-blue/10 border-duo-blue/30',
      icon: '↓',
      description: 'Confidence tends to be lower than actual accuracy'
    },
    'insufficient-data': {
      label: 'Insufficient Data',
      color: 'text-wolf',
      bgColor: 'bg-swan/50 border-swan',
      icon: '?',
      description: 'Not enough answers to determine calibration'
    }
  }[calibration.status]

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

      {/* Calibration Summary Card */}
      {calibration.totalAnswered > 0 && (
        <div className={`card ${calibrationInfo.bgColor}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${calibrationInfo.color} bg-white`}>
                {calibrationInfo.icon}
              </div>
              <div>
                <h3 className={`font-bold ${calibrationInfo.color}`}>{calibrationInfo.label}</h3>
                <p className="text-sm text-wolf">{calibrationInfo.description}</p>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-eel">{calibration.correctCount}/{calibration.totalAnswered}</div>
                <div className="text-xs text-wolf">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-eel">{Math.round((calibration.correctCount / calibration.totalAnswered) * 100)}%</div>
                <div className="text-xs text-wolf">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <form action={`/api/teacher/student/${student.id}/answers`} method="post" className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 w-28">Full name</label>
            <input name="full_name" defaultValue={student.full_name ?? ''} className="input flex-1" placeholder="Full name" />
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Question</th>
                <th className="py-2 pr-4">Answer</th>
                <th className="py-2 pr-4">Confidence</th>
                <th className="py-2">Correct</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((cq, i) => {
                const fq = getFermiQuestion(cq.fermi_questions)
                const a = answerMap.get(cq.id)
                return (
                  <tr key={cq.id} className="border-t align-top">
                    <td className="py-2 pr-4">{i+1}</td>
                    <td className="py-2 pr-4 max-w-xl">{fq?.prompt || 'Unknown question'}</td>
                    <td className="py-2 pr-4">
                      <input
                        name={`value_${cq.id}`}
                        defaultValue={a?.value ?? ''}
                        className="input w-full min-w-[120px] sm:w-40 py-2 px-3"
                        type="number"
                        step="any"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <select name={`conf_${cq.id}`} defaultValue={a?.confidence_pct ?? 50} className="select py-2 px-3 w-full min-w-[110px] sm:w-32">
                        {[10,30,50,70,90].map(c => <option key={c} value={c}>{getConfidenceLabel(c)}</option>)}
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="font-mono text-wolf">{fq?.correct_value ?? '—'}</div>
                      {(() => {
                        const diff = getOrdersOfMagnitude(a?.value, fq?.correct_value)
                        return diff ? (
                          <div className={`text-xs mt-0.5 ${diff.color}`}>
                            {diff.label}
                          </div>
                        ) : null
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <input type="hidden" name="class_id" value={params.id} />
          <input type="hidden" name="mode" value={studentMode} />
          <div className="flex items-center gap-4">
            <button className="btn btn-primary">Save Changes</button>
            <span className="text-sm text-wolf">Remember to save before leaving</span>
          </div>
        </form>
      </div>

      {/* Delete Student Section */}
      <div className="card border-duo-red/30 bg-duo-red/5">
        <h3 className="font-bold text-eel mb-2">Danger Zone</h3>
        <p className="text-sm text-wolf mb-4">
          Permanently delete this student and all their answers. This action cannot be undone.
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
