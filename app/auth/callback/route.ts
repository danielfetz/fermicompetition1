import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// Use placeholder values during build time if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  const cookieStore = cookies()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch {
            // Ignore errors in route handlers
          }
        },
      },
    }
  )

  // Handle PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback error (code):', error.message)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
    }
    return NextResponse.redirect(`${origin}/teacher/dashboard`)
  }

  // Handle token hash (email confirmation via OTP)
  if (token_hash) {
    const otpType = type === 'signup' ? 'email' : (type || 'email')
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType as any,
    })
    if (error) {
      console.error('Auth callback error (token_hash):', error.message)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
    }
    return NextResponse.redirect(`${origin}/teacher/dashboard`)
  }

  // No valid auth parameters
  return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('No valid authentication parameters found')}`)
}
