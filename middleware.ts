import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Placeholder-URL die im Docker-Build verwendet wird, solange keine Config existiert */
const PLACEHOLDER_URL = 'https://not-configured.supabase.co'

/**
 * Liest Supabase-Credentials aus:
 * 1. Env-Vars (lokal / wenn via .env gesetzt)
 * 2. Cookies `bs_url` + `bs_key` (nach Setup-Wizard gesetzt)
 */
function getSupabaseCredentials(request: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // Echte Env-Var (kein Placeholder)?
  if (envUrl && envUrl !== PLACEHOLDER_URL && !envUrl.includes('not-configured')) {
    return { url: envUrl, key: envKey }
  }

  // Setup-Wizard-Cookies (gesetzt von /api/setup)
  return {
    url: request.cookies.get('bs_url')?.value ?? '',
    key: request.cookies.get('bs_key')?.value ?? '',
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Setup-Routen sind IMMER zugänglich (auch ohne Config)
  if (pathname.startsWith('/setup') || pathname.startsWith('/api/setup')) {
    return NextResponse.next()
  }

  const { url, key } = getSupabaseCredentials(request)

  // App noch nicht eingerichtet → zum Setup-Wizard
  if (!url || !key) {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // ── Normaler Supabase-Auth-Flow ──────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            options as Parameters<typeof supabaseResponse.cookies.set>[2]
          )
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!user && !isAuthRoute) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/login'
    return NextResponse.redirect(redirect)
  }

  if (user && isAuthRoute) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/'
    return NextResponse.redirect(redirect)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
