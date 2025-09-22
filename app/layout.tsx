import './globals.css'
import { Nunito } from 'next/font/google'
import type { Metadata } from 'next'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

export const metadata: Metadata = {
  title: 'Fermi Competition',
  description: 'Duolingo-style app for Fermi competition',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito bg-gray-50 text-gray-900 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  )
}

