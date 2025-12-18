import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabaseServer'

export const metadata: Metadata = {
  title: 'Fermi Challenge',
  description: 'A Duolingo-style app for Fermi estimation competitions',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const isTeacherLoggedIn = !!user

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-nunito bg-snow text-eel min-h-screen">
        {/* Header */}
        <header className="bg-white border-b-2 border-swan sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-duo-green rounded-xl flex items-center justify-center shadow-duo-green group-hover:scale-105 transition-transform">
                <span className="text-white font-extrabold text-lg">F</span>
              </div>
              <span className="text-xl font-extrabold text-eel hidden sm:block">
                Fermi<span className="text-duo-green">Challenge</span>
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
            <p className="font-semibold">Fermi Challenge</p>
            <p className="mt-1">Estimation skills for curious minds</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
