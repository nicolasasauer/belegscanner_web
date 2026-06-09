/**
 * Auth-Helper für Mobile-API-Zugriffe.
 *
 * Strategie (in Reihenfolge):
 * 1. NextAuth-Session (Browser-Login)
 * 2. Bearer-Token aus Authorization-Header → prüft gegen MOBILE_API_TOKEN
 *    Falls Token gültig: gibt den User mit MOBILE_USER_ID zurück,
 *    oder den ersten User in der DB (Single-User-Annahme).
 *
 * Verwendung in Route-Handlern:
 *   const user = await resolveApiUser(request)
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import type { NextRequest } from 'next/server'

export async function resolveApiUser(
  request: NextRequest
): Promise<{ id: string } | null> {
  // 1. NextAuth-Session (Browser)
  const session = await auth()
  if (session?.user?.id) return { id: session.user.id }

  // 2. Bearer-Token (Mobile-App)
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const mobileToken = process.env.MOBILE_API_TOKEN

  if (!token || !mobileToken || token !== mobileToken) return null

  // Token korrekt — User bestimmen
  const mobileUserId = process.env.MOBILE_USER_ID
  if (mobileUserId) return { id: mobileUserId }

  // Fallback: ersten User in der DB verwenden (Single-User-App)
  const user = db.select({ id: users.id }).from(users).limit(1).get()
  return user ? { id: user.id } : null
}
