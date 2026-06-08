'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type AiProvider = 'ollama' | 'lmstudio' | 'claude' | 'mistral' | 'gemini' | ''

interface FormState {
  supabaseUrl: string
  supabaseAnonKey: string
  aiProvider: AiProvider
  aiModel: string
  aiBaseUrl: string
  aiApiKey: string
}

const AI_DEFAULTS: Record<string, { model: string; baseUrl: string; needsKey: boolean }> = {
  ollama:   { model: 'llava',                     baseUrl: 'http://ollama:11434',                    needsKey: false },
  lmstudio: { model: 'loaded-model',              baseUrl: 'http://localhost:1234',                  needsKey: false },
  claude:   { model: 'claude-haiku-4-5-20251001', baseUrl: 'https://api.anthropic.com',              needsKey: true  },
  mistral:  { model: 'pixtral-12b-2409',          baseUrl: 'https://api.mistral.ai',                 needsKey: true  },
  gemini:   { model: 'gemini-2.0-flash',          baseUrl: 'https://generativelanguage.googleapis.com', needsKey: true },
}

export default function SetupPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    supabaseUrl: '',
    supabaseAnonKey: '',
    aiProvider: 'ollama',
    aiModel: 'llava',
    aiBaseUrl: 'http://ollama:11434',
    aiApiKey: '',
  })
  const [status, setStatus] = useState<'idle' | 'testing' | 'saving' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [alreadyConfigured, setAlreadyConfigured] = useState(false)

  // Vorhandene Config laden
  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(data => {
        if (data.configured) setAlreadyConfigured(true)
        setForm(f => ({
          ...f,
          aiProvider: data.aiProvider || 'ollama',
          aiModel:    data.aiModel    || 'llava',
          aiBaseUrl:  data.aiBaseUrl  || 'http://ollama:11434',
        }))
      })
      .catch(() => {/* Fehler ignorieren */})
  }, [])

  function handleProviderChange(provider: AiProvider) {
    const defaults = AI_DEFAULTS[provider]
    setForm(f => ({
      ...f,
      aiProvider: provider,
      aiModel:    defaults?.model   ?? '',
      aiBaseUrl:  defaults?.baseUrl ?? '',
      aiApiKey:   '',
    }))
  }

  async function testSupabase() {
    if (!form.supabaseUrl || !form.supabaseAnonKey) {
      setMessage('Bitte erst URL und Anon-Key eingeben.')
      setStatus('error')
      return
    }
    setStatus('testing')
    setMessage('Verbindung wird getestet...')
    try {
      const res = await fetch(`${form.supabaseUrl}/rest/v1/`, {
        headers: { apikey: form.supabaseAnonKey, Authorization: `Bearer ${form.supabaseAnonKey}` },
        signal: AbortSignal.timeout(8_000),
      })
      if (res.ok || res.status === 404 || res.status === 406) {
        setMessage('✓ Supabase-Verbindung erfolgreich!')
        setStatus('idle')
      } else {
        setMessage(`Verbindung fehlgeschlagen (HTTP ${res.status}). URL oder Key prüfen.`)
        setStatus('error')
      }
    } catch {
      setMessage('Verbindung fehlgeschlagen. Ist die URL erreichbar?')
      setStatus('error')
    }
  }

  async function handleSave() {
    if (!form.supabaseUrl || !form.supabaseAnonKey) {
      setMessage('Supabase URL und Anon-Key sind Pflichtfelder.')
      setStatus('error')
      return
    }
    setStatus('saving')
    setMessage('Wird gespeichert...')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('done')
        setMessage('✓ Einrichtung abgeschlossen! Du wirst weitergeleitet...')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        const data = await res.json()
        setMessage(`Fehler: ${JSON.stringify(data.error)}`)
        setStatus('error')
      }
    } catch {
      setMessage('Speichern fehlgeschlagen. Server nicht erreichbar?')
      setStatus('error')
    }
  }

  const needsKey = form.aiProvider ? AI_DEFAULTS[form.aiProvider]?.needsKey ?? false : false
  const isBusy = status === 'testing' || status === 'saving'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🧾</div>
          <h1 className="text-2xl font-bold text-gray-900">Belegscanner</h1>
          <p className="text-gray-500 mt-1">Ersteinrichtung</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Already configured banner */}
          {alreadyConfigured && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center gap-2 text-sm text-green-800">
              <span>✓</span>
              <span>App ist bereits eingerichtet. Du kannst hier Einstellungen ändern.</span>
              <button
                onClick={() => router.push('/')}
                className="ml-auto underline hover:no-underline"
              >
                Zurück zur App
              </button>
            </div>
          )}

          <div className="p-6 space-y-8">

            {/* ── Schritt 1: Supabase ────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                <h2 className="font-semibold text-gray-900">Supabase Datenbank</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://xxxxxxxxxxxx.supabase.co"
                    value={form.supabaseUrl}
                    onChange={e => setForm(f => ({ ...f, supabaseUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anon (public) Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={form.supabaseAnonKey}
                    onChange={e => setForm(f => ({ ...f, supabaseAnonKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <a
                    href="https://supabase.com/dashboard/project/_/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    → Wo finde ich diese Werte? (Supabase Dashboard)
                  </a>
                  <button
                    onClick={testSupabase}
                    disabled={isBusy}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {status === 'testing' ? '⏳ Teste...' : 'Verbindung testen'}
                  </button>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* ── Schritt 2: KI-Provider ─────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                <h2 className="font-semibold text-gray-900">KI für Belegscan</h2>
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </div>
              <p className="text-xs text-gray-500 mb-4 ml-8">
                Ohne KI können Belege trotzdem manuell eingegeben werden.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anbieter</label>
                  <select
                    value={form.aiProvider}
                    onChange={e => handleProviderChange(e.target.value as AiProvider)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">— Kein KI —</option>
                    <option value="ollama">Ollama (lokal, empfohlen für Pi)</option>
                    <option value="lmstudio">LM Studio (lokal)</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="mistral">Mistral AI</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>

                {form.aiProvider && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
                        <input
                          type="text"
                          value={form.aiModel}
                          onChange={e => setForm(f => ({ ...f, aiModel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                        <input
                          type="url"
                          value={form.aiBaseUrl}
                          onChange={e => setForm(f => ({ ...f, aiBaseUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    {needsKey && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          placeholder="sk-..."
                          value={form.aiApiKey}
                          onChange={e => setForm(f => ({ ...f, aiApiKey: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    {(form.aiProvider === 'ollama' || form.aiProvider === 'lmstudio') && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                        💡 <strong>Ollama mit Docker:</strong> Starte mit{' '}
                        <code className="bg-gray-200 px-1 rounded">make up-ai</code> und lade das Modell mit{' '}
                        <code className="bg-gray-200 px-1 rounded">make pull-llava</code>.
                        Die URL <code className="bg-gray-200 px-1 rounded">http://ollama:11434</code> funktioniert nur im Docker-Netzwerk.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* ── Feedback & Save ────────────────────────────────────── */}
            {message && (
              <div className={`text-sm px-4 py-3 rounded-lg ${
                status === 'error'  ? 'bg-red-50 text-red-700 border border-red-200' :
                status === 'done'   ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isBusy}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {status === 'saving' ? '⏳ Wird gespeichert...' :
               status === 'done'   ? '✓ Gespeichert!' :
               alreadyConfigured   ? 'Einstellungen aktualisieren' :
               'Einrichtung abschließen →'}
            </button>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Belegscanner Web · Alle Daten bleiben auf deinem Server
        </p>
      </div>
    </div>
  )
}
