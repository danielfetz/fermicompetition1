'use client'

type Props = {
  studentId: string
  classId: string
  mode: string
}

export default function DeleteStudentButton({ studentId, classId, mode }: Props) {
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this student? This cannot be undone.')) {
      return
    }

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
      alert('Failed to delete student')
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="btn bg-duo-red text-white hover:bg-duo-red-dark"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete Student
    </button>
  )
}
