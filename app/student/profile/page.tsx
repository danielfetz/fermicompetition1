import { Suspense } from 'react'
import StudentProfileClient from './profile-client'

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto card">Loading…</div>}>
      <StudentProfileClient />
    </Suspense>
  )
}
