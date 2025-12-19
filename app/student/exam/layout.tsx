'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleClose = () => {
    if (confirm('Are you sure you want to leave? Your progress has been saved.')) {
      router.push('/student/login')
    }
  }

  return (
    <>
      {/* Exam Header */}
      <header className="bg-white border-b-2 border-swan sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-duo-green rounded-xl flex items-center justify-center sm:hidden">
              <span className="text-white font-extrabold text-lg">F</span>
            </div>
            <span className="text-xl font-extrabold text-duo-green hidden sm:block">
              Fermi Competition
            </span>
          </Link>
          <button
            onClick={handleClose}
            className="icon-btn"
            title="Exit competition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </>
  )
}
