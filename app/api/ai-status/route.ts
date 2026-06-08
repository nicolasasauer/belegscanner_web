import { NextResponse } from 'next/server'
import { getAiConfig } from '@/lib/services/ai'

export async function GET() {
  const config = getAiConfig()

  let status: 'ok' | 'error' | 'unconfigured' = 'unconfigured'
  let error: string | undefined

  if (config.provider === 'ollama' || config.provider === 'lmstudio') {
    try {
      const testUrl =
        config.provider === 'ollama'
          ? `${config.baseUrl}/api/tags`
          : `${config.baseUrl}/v1/models`
      const res = await fetch(testUrl, { signal: AbortSignal.timeout(5_000) })
      status = res.ok ? 'ok' : 'error'
      if (!res.ok) error = `HTTP ${res.status}`
    } catch (e) {
      status = 'error'
      error = e instanceof Error ? e.message : 'Verbindung fehlgeschlagen'
    }
  } else {
    status = config.apiKey ? 'ok' : 'unconfigured'
    if (!config.apiKey) error = 'AI_API_KEY nicht konfiguriert'
  }

  return NextResponse.json({
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    status,
    error,
  })
}
