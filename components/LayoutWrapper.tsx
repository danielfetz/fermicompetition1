'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface LayoutWrapperProps {
  children: React.ReactNode
  isTeacherLoggedIn: boolean
}

export default function LayoutWrapper({ children, isTeacherLoggedIn }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isExamRoute = pathname?.startsWith('/student/exam/')
  const isHomePage = pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isExamRoute) {
    // Exam mode: minimal layout with just the content
    return <>{children}</>
  }

  const navLinks = [
    { href: '/#faq', label: 'FAQ' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#about-fermi', label: 'About Fermi' },
  ]

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isHomePage && navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-wolf font-semibold hover:text-eel transition-colors"
              >
                {link.label}
              </a>
            ))}
            {isTeacherLoggedIn ? (
              <Link
                href="/teacher/dashboard"
                className="btn btn-primary btn-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/teacher"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-wolf hover:text-eel transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-swan bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
              {isHomePage && navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-wolf font-semibold hover:text-eel transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-swan pt-3 mt-1">
                {isTeacherLoggedIn ? (
                  <Link
                    href="/teacher/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/teacher"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary w-full"
                    >
                      I&apos;m a Teacher
                    </Link>
                    <Link
                      href="/student/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-outline w-full"
                    >
                      I&apos;m a Student
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
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
          <Link href="/leaderboard" className="text-duo-blue font-semibold hover:underline inline-flex items-center gap-1 mt-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Leaderboard
          </Link>
        </div>
      </footer>
    </>
  )
}
