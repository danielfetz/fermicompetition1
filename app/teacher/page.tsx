import Link from 'next/link'
import FermiMascot from '@/components/FermiMascot'

export default function TeacherLanding() {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <FermiMascot mood="encouraging" size="md" />
        </div>
        <h1 className="text-3xl font-extrabold text-eel">Teacher Portal</h1>
        <p className="text-wolf">
          Create classes, generate student credentials, and track your students&apos; progress in the Fermi Competition.
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        <Link href="/teacher/signup" className="card-interactive block group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-duo-green/10 rounded-xl flex items-center justify-center group-hover:bg-duo-green/20 transition-colors">
              <svg className="w-6 h-6 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-eel">Create Account</h2>
              <p className="text-sm text-wolf">New to Fermi Competition? Sign up now!</p>
            </div>
            <svg className="w-5 h-5 text-wolf group-hover:text-duo-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/teacher/login" className="card-interactive block group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-duo-blue/10 rounded-xl flex items-center justify-center group-hover:bg-duo-blue/20 transition-colors">
              <svg className="w-6 h-6 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-eel">Log In</h2>
              <p className="text-sm text-wolf">Already have an account? Welcome back!</p>
            </div>
            <svg className="w-5 h-5 text-wolf group-hover:text-duo-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="card bg-gradient-to-br from-duo-green/5 to-duo-blue/5">
        <h3 className="font-bold text-eel mb-4">What You Can Do:</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-green rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-wolf">Register multiple classes for the competition</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-green rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-wolf">Generate fun scientist-themed usernames</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-green rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-wolf">View and override student answers</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-duo-green rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-wolf">Track scores with automatic grading</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
