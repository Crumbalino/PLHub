import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _browserClient: SupabaseClient | null = null

// Browser/server-side read client (anon key)
export function getSupabase(): SupabaseClient {
  if (_browserClient) return _browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  _browserClient = createClient(url, key)
  return _browserClient
}

// Named export alias kept for convenience in server components
export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) =>
    getSupabase().from(...args),
}

// Server/admin client (service role key for writes in cron routes)
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
