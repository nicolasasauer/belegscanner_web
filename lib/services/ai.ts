import type { AiProviderType } from '@/types'

interface AiConfig {
  provider: AiProviderType
  model: string
  baseUrl: string
  apiKey: string
}

const PROVIDER_DEFAULTS: Record<AiProviderType, { model: string; baseUrl: string }> = {
  ollama:   { model: 'llava',                    baseUrl: 'http://localhost:11434' },
  lmstudio: { model: 'loaded-model',             baseUrl: 'http://localhost:1234' },
  claude:   { model: 'claude-haiku-4-5-20251001', baseUrl: 'https://api.anthropic.com' },
  mistral:  { model: 'pixtral-12b-2409',         baseUrl: 'https://api.mistral.ai' },
  gemini:   { model: 'gemini-1.5-flash',         baseUrl: 'https://generativelanguage.googleapis.com' },
}

/**
 * Liest AI-Config aus Runtime-Config (Docker: /app/data/config.json),
 * fällt auf Env-Vars zurück (lokale Entwicklung).
 */
export async function getAiConfig(): Promise<AiConfig> {
  // Dynamischer Import vermeidet Edge-Runtime-Fehler (ai.ts läuft nur server-side)
  const { getRuntimeConfig } = await import('@/lib/config/runtime')
  const cfg = await getRuntimeConfig()

  const provider = (cfg.aiProvider || process.env.AI_PROVIDER || 'ollama') as AiProviderType
  const defaults = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.ollama
  return {
    provider,
    model:   cfg.aiModel   || process.env.AI_MODEL   || defaults.model,
    baseUrl: cfg.aiBaseUrl || process.env.AI_BASE_URL || defaults.baseUrl,
    apiKey:  cfg.aiApiKey  || process.env.AI_API_KEY  || '',
  }
}

export async function callAi(
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  const config = await getAiConfig()
  switch (config.provider) {
    case 'ollama':   return callOllama(config, prompt, imageBase64)
    case 'lmstudio': return callOpenAiCompat(config, prompt, imageBase64, mimeType)
    case 'claude':   return callClaude(config, prompt, imageBase64, mimeType)
    case 'mistral':  return callOpenAiCompat(config, prompt, imageBase64, mimeType)
    case 'gemini':   return callGemini(config, prompt, imageBase64, mimeType)
  }
}

async function callOllama(config: AiConfig, prompt: string, imageBase64?: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.model,
    prompt,
    stream: false,
    // Deterministische Extraktion — mit Default-Temperature liefert das Modell
    // mal JSON, mal Prosa, mal fast nichts (beobachtet mit llava beim OCR).
    options: { temperature: 0 },
  }
  if (imageBase64) body.images = [imageBase64]

  const res = await fetch(`${config.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  const data = await res.json()
  return data.response ?? ''
}

async function callOpenAiCompat(
  config: AiConfig,
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  type ContentPart = { type: string; text?: string; image_url?: { url: string } }
  let content: string | ContentPart[] = prompt
  if (imageBase64 && mimeType) {
    content = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
    ]
  }

  const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`${config.provider} API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callClaude(
  config: AiConfig,
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

  const content: ContentBlock[] = []
  if (imageBase64 && mimeType) {
    content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } })
  }
  content.push({ type: 'text', text: prompt })

  const res = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`Claude error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function callGemini(
  config: AiConfig,
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  type Part = { text: string } | { inline_data: { mime_type: string; data: string } }
  const parts: Part[] = []
  if (imageBase64 && mimeType) {
    parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } })
  }
  parts.push({ text: prompt })

  const url = `${config.baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export function extractJson<T>(text: string): T | null {
  try {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0]) as T
  } catch {
    // JSON extraction failed
  }
  return null
}
