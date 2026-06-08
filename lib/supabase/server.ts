import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRuntimeConfig } from '@/lib/config/runtime'

export async function createClient() {
  const cookieStore = await cookies()
  const cfg = await getRuntimeConfig()

  const url = cfg.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = cfg.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        } catch {
          // Server Component — ignored
        }
      },
    },
  })
}
