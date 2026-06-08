import { createClient } from '@/lib/supabase/server'
import { AiStatusPanel } from '@/components/settings/AiStatusPanel'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">Konto und App-Einstellungen</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Konto</h2>
        <div>
          <label className="text-xs font-medium text-gray-500">E-Mail</label>
          <p className="text-sm text-gray-900 mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">KI-Provider</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            OCR, Artikel-Erkennung und Kategorisierung
          </p>
        </div>
        <AiStatusPanel />
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Verfügbare Provider</p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Lokal</span>
              <span><strong>Ollama</strong> — ollama.com · kostenlos · Modell: llava, llama3.2-vision</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Lokal</span>
              <span><strong>LM Studio</strong> — lmstudio.ai · kostenlos · OpenAI-kompatibel</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Cloud</span>
              <span><strong>Claude</strong> — Anthropic · Vision · schnell &amp; genau</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Cloud</span>
              <span><strong>Mistral</strong> — mistral.ai · Vision via Pixtral</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Cloud</span>
              <span><strong>Gemini</strong> — Google · Vision · großzügiges Free-Tier</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Sync &amp; Export</h2>
        <p className="text-sm text-gray-500">
          Daten können als JSON oder CSV exportiert werden (Belege-Seite → Export-Buttons).
        </p>
      </div>
    </div>
  )
}
