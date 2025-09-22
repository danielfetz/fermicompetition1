import Link from 'next/link'

export default function Home() {
  return (
    <main className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold">Fermi Competition</h1>
        <p className="text-gray-600">Run a classroom Fermi estimation challenge.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">Teachers</h2>
          <p className="text-gray-600 mb-4">Create classes, generate student credentials, and track results.</p>
          <Link className="btn btn-primary inline-block" href="/teacher">Go to Teacher Portal</Link>
        </div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">Students</h2>
          <p className="text-gray-600 mb-4">Answer 10 Fermi questions within 40 minutes.</p>
          <Link className="btn btn-secondary inline-block" href="/student/login">Start as Student</Link>
        </div>
      </div>
    </main>
  )
}

