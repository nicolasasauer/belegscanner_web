/**
 * Runtime-Config — liest/schreibt /app/data/config.json
 * Fällt auf Env-Vars zurück (für lokale Entwicklung).
 * Läuft NUR server-side (Node.js), nicht im Edge Runtime.
 */
import { promises as fs } from 'fs'
import path from 'path'

export interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  aiProvider: string
  aiModel: string
  aiBaseUrl: string
  aiApiKey: string
  setupComplete: boolean
}

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json')

// Einmal pro Prozess-Lifetime gecacht
let _cache: RuntimeConfig | null = null

function fromEnv(): RuntimeConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return {
    supabaseUrl:     url,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    aiProvider:  process.env.AI_PROVIDER  ?? 'ollama',
    aiModel:     process.env.AI_MODEL     ?? 'llava',
    aiBaseUrl:   process.env.AI_BASE_URL  ?? 'http://ollama:11434',
    aiApiKey:    process.env.AI_API_KEY   ?? '',
    // Als "konfiguriert" gilt: echter (nicht placeholder) URL
    setupComplete: !!url && !url.includes('not-configured'),
  }
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (_cache) return _cache
  let result: RuntimeConfig
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8')
    result = { ...fromEnv(), ...JSON.parse(raw) }
  } catch {
    result = fromEnv()
  }
  _cache = result
  return result
}

export async function saveRuntimeConfig(
  update: Partial<Omit<RuntimeConfig, 'setupComplete'>>
): Promise<RuntimeConfig> {
  const current = await getRuntimeConfig()
  const next: RuntimeConfig = { ...current, ...update, setupComplete: true }
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf-8')
  _cache = next
  return next
}

export async function isSetupComplete(): Promise<boolean> {
  const cfg = await getRuntimeConfig()
  return cfg.setupComplete && !!cfg.supabaseUrl && !!cfg.supabaseAnonKey
}

/** Cache leeren (z. B. nach saveRuntimeConfig in Tests) */
export function clearConfigCache() {
  _cache = null
}
