"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Completing sign-in...')

  useEffect(() => {
    const url = new URL(window.location.href)
    const error = url.hash.includes('error=') || url.searchParams.get('error')
    if (error) {
      const errDesc = url.hash.match(/error_description=([^&]+)/)?.[1] || url.searchParams.get('error_description') || 'Authentication error'
      setMessage(decodeURIComponent(errDesc))
      return
    }
    // Exchange code/hash for a session (works for email links and oauth)
    supabase.auth.exchangeCodeForSession().then(({ error }) => {
      if (error) {
        setMessage(error.message)
        return
      }
      setMessage('Success! Redirecting...')
      router.replace('/teacher/dashboard')
    })
  }, [router])

  return (
    <div className="max-w-md mx-auto card text-center">
      <h1 className="text-xl font-bold mb-2">Auth</h1>
      <p className="text-gray-700">{message}</p>
    </div>
  )
}
