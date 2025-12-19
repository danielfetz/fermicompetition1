import './globals.css'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabaseServer'
import LayoutWrapper from '@/components/LayoutWrapper'

export const metadata: Metadata = {
  title: 'Fermi Competition',
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
      <body className="font-nunito text-eel min-h-screen">
        <LayoutWrapper isTeacherLoggedIn={isTeacherLoggedIn}>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}
