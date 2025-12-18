import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Use placeholder values during build time if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      }
    }
  )
}

export function createSupabaseServiceRole() {
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    { cookies: { get() { return undefined } } }
  )
}

