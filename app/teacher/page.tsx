import Link from 'next/link'

export default function TeacherLanding() {
  return (
    <main className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold">Teacher Portal</h1>
        <p className="text-gray-600">Sign up or log in to manage classes.</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Link href="/teacher/signup" className="btn btn-primary text-center">Sign up</Link>
        <Link href="/teacher/login" className="btn btn-secondary text-center">Log in</Link>
      </div>
    </main>
  )
}

