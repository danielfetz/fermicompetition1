'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface LayoutWrapperProps {
  children: React.ReactNode
  isTeacherLoggedIn: boolean
}

export default function LayoutWrapper({ children, isTeacherLoggedIn }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isExamRoute = pathname?.startsWith('/student/exam/')
  const isHomePage = pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  async function playAsGuest() {
    setGuestLoading(true)
    const res = await fetch('/api/student/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const { token, classId } = await res.json()
      localStorage.setItem('studentToken', token)
      router.push(`/student/exam/${classId}`)
    }
    setGuestLoading(false)
  }

  if (isExamRoute) {
    // Exam mode: minimal layout with just the content
    return <>{children}</>
  }

  const navLinks = [
    { href: '/#faq', label: 'FAQ' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#about-fermi', label: 'Enrico Fermi' },
    { href: '/#pedagogical-value', label: 'Why It Matters' },
  ]

  // Normal layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      {/* Try as Guest Banner - Homepage only */}
      {isHomePage && (
        <>
          {/* Mobile layout */}
          <div className="flex gap-3 items-center sm:hidden bg-duo-blue/5 border-0" style={{ padding: '20px' }}>
            <div className="flex-1">
              <h3 className="font-bold text-eel">Want to try it out first?</h3>
              <p className="text-wolf mt-1" style={{ fontSize: '0.9375rem', lineHeight: '1.25rem' }}>
                Play a demo, no login required.
              </p>
            </div>
            <button onClick={playAsGuest} disabled={guestLoading} className="btn btn-secondary">
              {guestLoading ? '...' : 'Try it'}
            </button>
          </div>
          {/* Desktop layout */}
          <div className="hidden sm:flex gap-4 items-center bg-duo-blue/5 border-0" style={{ margin: '0 12px', padding: '20px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <div className="flex gap-4 items-center flex-1">
              <div className="flex-shrink-0 w-12 h-12 bg-duo-blue/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-eel">Want to try it out first?</h3>
                <p className="text-wolf" style={{ fontSize: '0.9375rem', lineHeight: '1.25rem' }}>
                  Play a demo with 25 fun test questions - no login required.
                </p>
              </div>
            </div>
            <button onClick={playAsGuest} disabled={guestLoading} className="btn btn-secondary">
              {guestLoading ? 'Starting...' : 'Try it out'}
            </button>
          </div>
        </>
      )}

      {/* Header */}
      <header className="bg-white border-b-2 border-swan sticky top-0 z-50 h-[70px]">
        <div className="mx-auto h-full flex items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold text-duo-green">
              Fermi Competition
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            {isHomePage && navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-bold uppercase px-3 hover:text-eel transition-colors"
                style={{ color: '#a2a2a2', letterSpacing: '1px' }}
              >
                {link.label}
              </a>
            ))}
            {isHomePage && (
              <div
                className="relative"
                onMouseEnter={() => setMoreDropdownOpen(true)}
                onMouseLeave={() => setMoreDropdownOpen(false)}
              >
                <button
                  className="text-sm font-bold uppercase pl-3 pr-0 hover:text-eel transition-colors flex items-center gap-1"
                  style={{ color: '#a2a2a2', letterSpacing: '1px' }}
                >
                  More
                  <svg
                    className={`w-4 h-4 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {moreDropdownOpen && (
                  <div className="absolute top-full right-0 pt-2">
                    <div className="bg-white border-2 border-swan rounded-lg py-2 min-w-[160px]">
                      <Link
                        href="/leaderboard"
                        className="block px-4 py-2 text-sm font-bold uppercase hover:text-eel transition-colors"
                        style={{ color: '#a2a2a2', letterSpacing: '1px' }}
                      >
                        Leaderboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isHomePage && isTeacherLoggedIn && (
              <Link
                href="/teacher/dashboard"
                className="btn btn-primary btn-sm ml-4"
              >
                Dashboard
              </Link>
            )}
            {!isHomePage && (
              isTeacherLoggedIn ? (
                <Link
                  href="/teacher/dashboard"
                  className="btn btn-primary btn-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/teacher"
                    className="btn btn-primary btn-sm"
                  >
                    I&apos;m a Teacher
                  </Link>
                  <Link
                    href="/student/login"
                    className="btn btn-outline btn-sm"
                  >
                    I&apos;m a Student
                  </Link>
                </div>
              )
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
                  className="text-sm font-bold uppercase py-2 hover:text-eel transition-colors"
                  style={{ color: '#a2a2a2', letterSpacing: '1px' }}
                >
                  {link.label}
                </a>
              ))}
              {isHomePage && (
                <Link
                  href="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-bold uppercase py-2 hover:text-eel transition-colors"
                  style={{ color: '#a2a2a2', letterSpacing: '1px' }}
                >
                  Leaderboard
                </Link>
              )}
              {isHomePage && isTeacherLoggedIn && (
                <div className="border-t border-swan pt-3 mt-1">
                  <Link
                    href="/teacher/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
              {!isHomePage && (
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
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
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
    </div>
  )
}
