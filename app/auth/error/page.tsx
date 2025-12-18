"use client"
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('message') || 'An authentication error occurred'

  return (
    <div className="max-w-md mx-auto card text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-duo-red/10 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-duo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold mb-4 text-eel">Authentication Error</h1>
      <p className="text-duo-red-dark mb-6">{error}</p>
      <div className="space-y-3">
        <Link href="/teacher/login" className="btn btn-primary w-full">
          Try Logging In
        </Link>
        <Link href="/teacher/signup" className="btn btn-secondary w-full">
          Create Account
        </Link>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto card text-center py-8">
        <h1 className="text-xl font-bold mb-4 text-eel">Loading...</h1>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
