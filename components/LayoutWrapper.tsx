'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface LayoutWrapperProps {
  children: React.ReactNode
  isTeacherLoggedIn: boolean
}

export default function LayoutWrapper({ children, isTeacherLoggedIn }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isExamRoute = pathname?.startsWith('/student/exam/')

  if (isExamRoute) {
    // Exam mode: minimal layout with just the content
    return <>{children}</>
  }

  // Normal layout with header and footer
  return (
    <>
      {/* Header */}
      <header className="bg-white border-b-2 border-swan sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-duo-green rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform sm:hidden">
              <span className="text-white font-extrabold text-lg">F</span>
            </div>
            <span className="text-xl font-extrabold text-duo-green hidden sm:block">
              Fermi Competition
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {isTeacherLoggedIn ? (
              <Link
                href="/teacher/dashboard"
                className="btn btn-primary btn-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/teacher"
                  className="btn btn-ghost btn-sm"
                >
                  Teachers
                </Link>
                <Link
                  href="/student/login"
                  className="btn btn-primary btn-sm"
                >
                  Student Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-swan mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-wolf text-sm">
          <p className="font-semibold">Fermi Competition</p>
          <p className="mt-1">Estimation skills for curious minds</p>
        </div>
      </footer>
    </>
  )
}
