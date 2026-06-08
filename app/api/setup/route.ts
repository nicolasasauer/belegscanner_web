import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRuntimeConfig, saveRuntimeConfig, isSetupComplete } from '@/lib/config/runtime'

const setupSchema = z.object({
  supabaseUrl:     z.string().url('Muss eine gültige URL sein (https://...)'),
  supabaseAnonKey: z.string().min(10, 'Anon-Key zu kurz'),
  aiProvider: z.string().default('ollama'),
  aiModel:    z.string().default('llava'),
  aiBaseUrl:  z.string().default('http://ollama:11434'),
  aiApiKey:   z.string().default(''),
})

/** GET /api/setup — gibt aktuellen Status zurück (ohne Secrets) */
export async function GET() {
  const configured = await isSetupComplete()
  const cfg = await getRuntimeConfig()
  return NextResponse.json({
    configured,
    aiProvider: cfg.aiProvider,
    aiModel:    cfg.aiModel,
    aiBaseUrl:  cfg.aiBaseUrl,
    hasSupabaseUrl:  !!cfg.supabaseUrl && cfg.supabaseUrl !== 'https://not-configured.supabase.co',
    hasAiApiKey: !!cfg.aiApiKey,
  })
}

/** POST /api/setup — speichert Config + setzt Middleware-Cookies */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })

  const parsed = setupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await saveRuntimeConfig(parsed.data)

  const response = NextResponse.json({ success: true })

  // Supabase-Credentials als Cookies für die Middleware setzen
  // (der Anon-Key ist public-safe — er steht sowieso im Browser-Code)
  const cookieOptions = {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 Jahr
    sameSite: 'lax' as const,
    httpOnly: false, // muss lesbar für Client-Side sein
    secure: process.env.NODE_ENV === 'production',
  }
  response.cookies.set('bs_url', parsed.data.supabaseUrl,     cookieOptions)
  response.cookies.set('bs_key', parsed.data.supabaseAnonKey, cookieOptions)

  return response
}
