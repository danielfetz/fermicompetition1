"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Completing sign-in...')

  useEffect(() => {
    const url = new URL(window.location.href)
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : ''
    const hashParams = new URLSearchParams(hash)
    const searchParams = url.searchParams

    const urlError = hashParams.get('error') || searchParams.get('error')
    if (urlError) {
      const errDesc = hashParams.get('error_description') || searchParams.get('error_description') || 'Authentication error'
      setMessage(decodeURIComponent(errDesc))
      return
    }

    async function run() {
      // 1) Implicit flow: access_token in hash
      const access_token = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) { setMessage(error.message); return }
        setMessage('Success! Redirecting...')
        router.replace('/teacher/dashboard')
        return
      }

      // 2) Token hash flow (recommended for PKCE email links)
      const token_hash = searchParams.get('token_hash') || searchParams.get('token')
      if (token_hash) {
        // Map legacy type "signup" to "email"
        const rawType = searchParams.get('type') || 'email'
        const type = rawType === 'signup' ? 'email' : rawType
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
        if (error) { setMessage(error.message); return }
        setMessage('Success! Redirecting...')
        router.replace('/teacher/dashboard')
        return
      }

      // 3) PKCE code flow (OAuth or email if configured to use code)
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) { setMessage(error.message); return }
        setMessage('Success! Redirecting...')
        router.replace('/teacher/dashboard')
        return
      }

      setMessage('No auth parameters found in URL.')
    }

    run()
  }, [router])

  return (
    <div className="max-w-md mx-auto card text-center">
      <h1 className="text-xl font-bold mb-2">Auth</h1>
      <p className="text-gray-700">{message}</p>
    </div>
  )
}

