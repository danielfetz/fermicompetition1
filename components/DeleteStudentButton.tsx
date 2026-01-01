'use client'

import { useState } from 'react'

type Props = {
  studentId: string
  classId: string
  mode: string
}

export default function DeleteStudentButton({ studentId, classId, mode }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this student? This will remove the student across all competition modes and school years. This cannot be undone.')) {
      return
    }

    setLoading(true)

    const form = new FormData()
    form.append('class_id', classId)
    form.append('mode', mode)

    const res = await fetch(`/api/teacher/student/${studentId}/delete`, {
      method: 'POST',
      body: form
    })

    if (res.redirected) {
      window.location.href = res.url
    } else if (!res.ok) {
      setLoading(false)
      alert('Failed to delete student')
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="btn bg-duo-red text-white hover:bg-duo-red-dark disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Deleting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Student
        </>
      )}
    </button>
  )
}
