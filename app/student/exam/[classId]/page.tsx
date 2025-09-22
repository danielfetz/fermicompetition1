"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Question = { id: string; prompt: string }
type Answer = { question_id: string; value: number; confidence_pct: 10|30|50|70|90 }

const CONFIDENCES: Answer['confidence_pct'][] = [10,30,50,70,90]

export default function StudentExam() {
  const { classId } = useParams<{ classId: string }>()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [deadline, setDeadline] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load questions and set 40 min timer
  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('studentToken')
      if (!token) { router.push('/student/login'); return }
      const res = await fetch(`/api/questions?classId=${classId}`)
      if (!res.ok) { setError('Failed to load questions'); return }
      const data = await res.json()
      setQuestions(data.questions)
      if (!deadline) setDeadline(Date.now() + 40 * 60 * 1000)
    }
    init()
  }, [classId])

  const timeLeft = useMemo(() => {
    if (deadline === null) return '—'
    const ms = Math.max(0, deadline - Date.now())
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2,'0')}`
  }, [deadline, Date.now()])

  useEffect(() => {
    if (!deadline) return
    const id = setInterval(() => {
      if (Date.now() >= deadline) submit()
    }, 1000)
    return () => clearInterval(id)
  }, [deadline])

  function updateAnswer(qid: string, value: string) {
    setAnswers(prev => ({
      ...prev,
      [qid]: { ...(prev[qid] || { question_id: qid, value: 0, confidence_pct: 50 }), value: Number(value) }
    }))
  }
  function updateConfidence(qid: string, pct: number) {
    setAnswers(prev => ({
      ...prev,
      [qid]: { ...(prev[qid] || { question_id: qid, value: 0, confidence_pct: 50 }), confidence_pct: pct as any }
    }))
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const token = localStorage.getItem('studentToken')
    const payload = { answers: Object.values(answers).slice(0, 10) }
    const res = await fetch(`/api/student/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    setSubmitting(false)
    if (!res.ok) { setError('Submit failed'); return }
    router.push(`/student/done`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Fermi Questions</h1>
        <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">Time left: {timeLeft}</div>
      </div>
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-gray-500 text-xs">Question {idx+1}</div>
                <div className="font-semibold">{q.prompt}</div>
              </div>
              <div className="flex gap-2 items-center">
                <input type="number" className="border rounded-lg p-2 w-40" placeholder="Your estimate" onChange={e=>updateAnswer(q.id, e.target.value)} />
                <select className="border rounded-lg p-2" onChange={e=>updateConfidence(q.id, Number(e.target.value))}>
                  {CONFIDENCES.map(c => <option key={c} value={c}>{c}%</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button className="btn btn-secondary" onClick={submit} disabled={submitting}>Submit answers</button>
      </div>
    </div>
  )
}

