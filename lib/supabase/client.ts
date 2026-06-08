import { createBrowserClient } from '@supabase/ssr'

/**
 * Liest Supabase-Credentials aus window.__BSCONFIG__ (injiziert durch app/layout.tsx).
 * Fällt auf Env-Vars zurück (lokale Entwicklung ohne Docker).
 */
function getCredentials() {
  if (typeof window !== 'undefined') {
    const cfg = (window as { __BSCONFIG__?: { supabaseUrl?: string; supabaseAnonKey?: string } }).__BSCONFIG__
    if (cfg?.supabaseUrl && cfg?.supabaseAnonKey) {
      return { url: cfg.supabaseUrl, key: cfg.supabaseAnonKey }
    }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  }
}

export function createClient() {
  const { url, key } = getCredentials()
  return createBrowserClient(url, key)
}
