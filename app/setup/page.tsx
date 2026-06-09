'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

type AiProvider = 'ollama' | 'lmstudio' | 'claude' | 'mistral' | 'gemini' | ''

const AI_DEFAULTS: Record<string, { model: string; baseUrl: string; needsKey: boolean }> = {
  ollama:   { model: 'llava',                      baseUrl: 'http://ollama:11434',                       needsKey: false },
  lmstudio: { model: 'loaded-model',               baseUrl: 'http://localhost:1234',                     needsKey: false },
  claude:   { model: 'claude-haiku-4-5-20251001',  baseUrl: 'https://api.anthropic.com',                 needsKey: true  },
  mistral:  { model: 'pixtral-12b-2409',           baseUrl: 'https://api.mistral.ai',                    needsKey: true  },
  gemini:   { model: 'gemini-2.0-flash',           baseUrl: 'https://generativelanguage.googleapis.com', needsKey: true  },
}

export default function SetupPage() {
  const router = useRouter()

  const [hasUsers,       setHasUsers]       = useState(false)
  const [alreadyDone,    setAlreadyDone]    = useState(false)
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [aiProvider,     setAiProvider]     = useState<AiProvider>('ollama')
  const [aiModel,        setAiModel]        = useState('llava')
  const [aiBaseUrl,      setAiBaseUrl]      = useState('http://ollama:11434')
  const [aiApiKey,       setAiApiKey]       = useState('')
  const [status,         setStatus]         = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [message,        setMessage]        = useState('')

  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(data => {
        setHasUsers(data.hasUsers)
        setAlreadyDone(data.configured && data.hasUsers)
        setAiProvider(data.aiProvider  || 'ollama')
        setAiModel(data.aiModel        || 'llava')
        setAiBaseUrl(data.aiBaseUrl    || 'http://ollama:11434')
      })
      .catch(() => {})
  }, [])

  function handleProviderChange(provider: AiProvider) {
    const d = AI_DEFAULTS[provider]
    setAiProvider(provider)
    setAiModel(d?.model   ?? '')
    setAiBaseUrl(d?.baseUrl ?? '')
    setAiApiKey('')
  }

  async function handleSave() {
    if (!hasUsers && (!email || !password)) {
      setMessage('E-Mail und Passwort sind erforderlich.')
      setStatus('error')
      return
    }
    setStatus('saving')
    setMessage('Wird gespeichert...')

    try {
      const res = await fetch('/api/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:      !hasUsers ? email    : undefined,
          password:   !hasUsers ? password : undefined,
          aiProvider, aiModel, aiBaseUrl, aiApiKey,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage(`Fehler: ${JSON.stringify(data.error)}`)
        setStatus('error')
        return
      }

      setStatus('done')

      if (!hasUsers) {
        // Direkt einloggen
        setMessage('✓ Konto erstellt! Du wirst angemeldet...')
        await signIn('credentials', { email, password, redirect: false })
        setTimeout(() => router.push('/dashboard'), 1000)
      } else {
        setMessage('✓ Einstellungen gespeichert!')
        setTimeout(() => router.push('/'), 1000)
      }
    } catch {
      setMessage('Speichern fehlgeschlagen. Server nicht erreichbar?')
      setStatus('error')
    }
  }

  const needsKey = aiProvider ? AI_DEFAULTS[aiProvider]?.needsKey ?? false : false
  const isBusy   = status === 'saving'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🧾</div>
          <h1 className="text-2xl font-bold text-gray-900">Belegscanner</h1>
          <p className="text-gray-500 mt-1">
            {alreadyDone ? 'Einstellungen' : 'Ersteinrichtung'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {alreadyDone && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center gap-2 text-sm text-green-800">
              <span>✓</span>
              <span>App ist bereits eingerichtet.</span>
              <button onClick={() => router.push('/')} className="ml-auto underline hover:no-underline">
                Zurück zur App
              </button>
            </div>
          )}

          <div className="p-6 space-y-8">

            {/* ── Schritt 1: Konto (nur beim ersten Start) ── */}
            {!hasUsers && (
              <>
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    <h2 className="font-semibold text-gray-900">Konto erstellen</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-Mail <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="deine@email.de"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passwort <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-normal ml-1">(mind. 8 Zeichen)</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </section>
                <hr className="border-gray-100" />
              </>
            )}

            {/* ── Schritt 2: KI-Provider ── */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                  {hasUsers ? '1' : '2'}
                </span>
                <h2 className="font-semibold text-gray-900">KI für Belegscan</h2>
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </div>
              <p className="text-xs text-gray-500 mb-4 ml-8">
                Ohne KI können Belege manuell eingegeben werden.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anbieter</label>
                  <select
                    value={aiProvider}
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

                {aiProvider && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
                        <input
                          type="text"
                          value={aiModel}
                          onChange={e => setAiModel(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                        <input
                          type="url"
                          value={aiBaseUrl}
                          onChange={e => setAiBaseUrl(e.target.value)}
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
                          value={aiApiKey}
                          onChange={e => setAiApiKey(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    {(aiProvider === 'ollama' || aiProvider === 'lmstudio') && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                        💡 <strong>Ollama mit Docker:</strong> Starte mit{' '}
                        <code className="bg-gray-200 px-1 rounded">docker compose --profile ai up -d</code>
                        {' '}und lade das Modell mit{' '}
                        <code className="bg-gray-200 px-1 rounded">docker exec belegscanner-ollama ollama pull llava</code>.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Feedback */}
            {message && (
              <div className={`text-sm px-4 py-3 rounded-lg ${
                status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                status === 'done'  ? 'bg-green-50 text-green-700 border border-green-200' :
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
               status === 'done'   ? '✓ Fertig!' :
               hasUsers            ? 'Einstellungen speichern' :
               'Konto erstellen & loslegen →'}
            </button>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Alle Daten liegen lokal auf deinem Server · Kein Supabase · Kein Cloud-Zwang
        </p>
      </div>
    </div>
  )
}
