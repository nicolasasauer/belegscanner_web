import NextAuth from 'next-auth'
import authConfig from './auth.config'
import { type NextRequest, NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Setup- und Auth-Routen + alle API-Routen immer direkt durchlassen.
  // API-Routen verwalten ihre eigene Auth (NextAuth-Session ODER Bearer-Token
  // für die Mobile-App). Kein Redirect auf /setup oder /login.
  if (
    pathname.startsWith('/setup') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // Prüfen ob Setup abgeschlossen (Cookie gesetzt durch POST /api/setup)
  const isSetupDone = req.cookies.get('bs_setup')?.value === '1'
  if (!isSetupDone) {
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  const isLoggedIn  = !!req.auth?.user
  const isAuthRoute = pathname.startsWith('/login')

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
