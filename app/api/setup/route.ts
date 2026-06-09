import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getRuntimeConfig, saveRuntimeConfig, isSetupComplete } from '@/lib/config/runtime'

const setupSchema = z.object({
  // Konto (nur beim ersten Setup)
  email:    z.string().email('Ungültige E-Mail').optional(),
  password: z.string().min(8, 'Passwort muss mind. 8 Zeichen haben').optional(),
  // KI-Einstellungen
  aiProvider: z.string().default('ollama'),
  aiModel:    z.string().default('llava'),
  aiBaseUrl:  z.string().default('http://ollama:11434'),
  aiApiKey:   z.string().default(''),
})

/** GET /api/setup — gibt Status zurück */
export async function GET() {
  const configured = await isSetupComplete()
  const cfg        = await getRuntimeConfig()

  const userCount = db.select().from(users).all().length

  return NextResponse.json({
    configured,
    hasUsers: userCount > 0,
    aiProvider:  cfg.aiProvider,
    aiModel:     cfg.aiModel,
    aiBaseUrl:   cfg.aiBaseUrl,
    hasAiApiKey: !!cfg.aiApiKey,
  })
}

/** POST /api/setup — erstellt ersten Nutzer + speichert AI-Config */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })

  const parsed = setupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, password, ...aiConfig } = parsed.data

  // Ersten Nutzer anlegen (nur wenn noch keiner existiert)
  const existingUsers = db.select().from(users).all()
  if (existingUsers.length === 0) {
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort für den ersten Nutzer erforderlich' },
        { status: 400 }
      )
    }
    const existing = db.select().from(users).where(eq(users.email, email)).get()
    if (existing) {
      return NextResponse.json({ error: 'E-Mail bereits vergeben' }, { status: 409 })
    }
    const hashed = await bcrypt.hash(password, 12)
    db.insert(users).values({ id: crypto.randomUUID(), email, password: hashed }).run()
  }

  // KI-Config speichern
  await saveRuntimeConfig(aiConfig)

  const response = NextResponse.json({ success: true })

  // Setup-Cookie setzen → Middleware lässt durch
  response.cookies.set('bs_setup', '1', {
    path:    '/',
    maxAge:  60 * 60 * 24 * 365, // 1 Jahr
    sameSite: 'lax',
    httpOnly: true,
    secure:  process.env.NODE_ENV === 'production',
  })

  return response
}
