'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import type { AiProviderType } from '@/types'

interface AiStatus {
  provider: AiProviderType
  model: string
  baseUrl: string
  status: 'ok' | 'error' | 'unconfigured'
  error?: string
}

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  ollama:   'Ollama (lokal)',
  lmstudio: 'LM Studio (lokal)',
  claude:   'Anthropic Claude',
  mistral:  'Mistral AI',
  gemini:   'Google Gemini',
}

const PROVIDER_DOCS: Record<AiProviderType, { setup: string; link: string }> = {
  ollama:   { setup: 'ollama pull llava', link: 'https://ollama.com' },
  lmstudio: { setup: 'Modell laden → Local Server starten', link: 'https://lmstudio.ai' },
  claude:   { setup: 'AI_API_KEY=sk-ant-... in .env.local', link: 'https://console.anthropic.com' },
  mistral:  { setup: 'AI_API_KEY=... in .env.local', link: 'https://console.mistral.ai' },
  gemini:   { setup: 'AI_API_KEY=AIza... in .env.local', link: 'https://aistudio.google.com/app/apikey' },
}

export function AiStatusPanel() {
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [loading, setLoading] = useState(false)

  async function checkStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-status')
      setStatus(await res.json())
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            KI-Provider wird über die Umgebungsvariable{' '}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">AI_PROVIDER</code>{' '}
            in <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.env.local</code> konfiguriert.
          </p>
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Status prüfen
        </button>
      </div>

      {status && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            {status.status === 'ok' && <CheckCircle size={16} className="text-green-500 shrink-0" />}
            {status.status === 'error' && <XCircle size={16} className="text-red-500 shrink-0" />}
            {status.status === 'unconfigured' && <AlertCircle size={16} className="text-amber-500 shrink-0" />}
            <span className="font-medium text-sm text-gray-900">
              {PROVIDER_LABELS[status.provider]}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  status.status === 'ok' ? '#dcfce7' :
                  status.status === 'error' ? '#fee2e2' : '#fef3c7',
                color:
                  status.status === 'ok' ? '#16a34a' :
                  status.status === 'error' ? '#dc2626' : '#d97706',
              }}
            >
              {status.status === 'ok' ? 'Verbunden' :
               status.status === 'error' ? 'Fehler' : 'Nicht konfiguriert'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-700">Modell:</span>{' '}
              <code className="bg-gray-100 px-1 rounded">{status.model}</code>
            </div>
            <div>
              <span className="font-medium text-gray-700">URL:</span>{' '}
              <code className="bg-gray-100 px-1 rounded">{status.baseUrl}</code>
            </div>
          </div>

          {status.error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {status.error}
            </p>
          )}

          <div className="border-t pt-3 text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Setup:</p>
            <code className="bg-gray-100 px-2 py-1 rounded block mb-1">
              {PROVIDER_DOCS[status.provider].setup}
            </code>
            <a
              href={PROVIDER_DOCS[status.provider].link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {PROVIDER_DOCS[status.provider].link} →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
