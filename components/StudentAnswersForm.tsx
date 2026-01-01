'use client'

import { useState } from 'react'

type ClassQuestion = {
  id: string
  order: number
  fermi_questions: {
    id: string
    prompt: string
    correct_value: number
  } | null
}

type Answer = {
  class_question_id: string
  value: number | null
  confidence_pct: number
}

type Props = {
  studentId: string
  classId: string
  mode: string
  fullName: string | null
  questions: ClassQuestion[]
  answers: Answer[]
}

// Calculate orders of magnitude difference from correct answer
const LOG10_2 = Math.log10(2)

function getOrdersOfMagnitude(answer: number | null | undefined, correct: number | null | undefined): { value: number; label: string; color: string } | null {
  if (answer == null || correct == null || correct === 0 || answer === 0) return null
  const ordersDiff = Math.abs(Math.log10(answer) - Math.log10(correct))
  let color = 'text-duo-red'
  let label = ''
  if (ordersDiff <= LOG10_2 + 0.0001) {
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

export default function StudentAnswersForm({ studentId, classId, mode, fullName, questions, answers }: Props) {
  const [loading, setLoading] = useState(false)
  const answerMap = new Map(answers.map(a => [a.class_question_id, a]))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('class_id', classId)
    formData.append('mode', mode)

    const res = await fetch(`/api/teacher/student/${studentId}/answers`, {
      method: 'POST',
      body: formData
    })

    if (res.redirected) {
      window.location.href = res.url
    } else if (!res.ok) {
      setLoading(false)
      alert('Failed to save changes')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-28">Full name</label>
        <input name="full_name" defaultValue={fullName ?? ''} className="input flex-1" placeholder="Full name" />
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
            const fq = cq.fermi_questions
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
                  <select name={`conf_${cq.id}`} defaultValue={a?.confidence_pct ?? 50} className="input select py-2 px-3 w-full min-w-[110px] sm:w-32">
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
      <div className="flex items-center gap-4">
        <button className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
        <span className="text-sm text-wolf">Remember to save before leaving</span>
      </div>
    </form>
  )
}
