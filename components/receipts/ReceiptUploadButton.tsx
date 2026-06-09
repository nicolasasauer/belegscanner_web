'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Upload, Loader2, Tag } from 'lucide-react'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/utils/categories'
import { ITEM_CATEGORY_LABELS, ITEM_CATEGORY_COLORS } from '@/lib/utils/item-categories'
import type { OcrResult, Category, ReceiptItem } from '@/types'

async function uploadReceiptImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload fehlgeschlagen')
  const { url } = await res.json()
  return url as string
}

export function ReceiptUploadButton() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocr, setOcr] = useState<OcrResult | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: '',
    category: 'other' as Category,
    vendor: '',
  })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    runOcr(f)
  }

  async function runOcr(f: File) {
    setOcrLoading(true)
    setItems([])
    try {
      const fd = new FormData()
      fd.append('image', f)
      const res = await fetch('/api/ocr', { method: 'POST', body: fd })
      if (res.ok) {
        const data: OcrResult = await res.json()
        setOcr(data)
        setForm(prev => ({
          ...prev,
          title:  data.title  ?? prev.title,
          amount: data.amount?.toString() ?? prev.amount,
          date:   data.date   ?? prev.date,
          vendor: data.vendor ?? prev.vendor,
        }))
        if (data.items?.length) setItems(data.items)
      }
    } catch {
      // OCR optional — user can fill manually
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let image_url: string | undefined
      if (file) image_url = await uploadReceiptImage(file)

      const res = await fetch('/api/receipts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    form.title,
          amount:   parseFloat(form.amount),
          date:     form.date,
          category: form.category,
          vendor:   form.vendor || undefined,
          image_url,
          raw_text: ocr?.raw_text,
          items:    items.length ? items : undefined,
        }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFile(null)
    setPreview(null)
    setOcr(null)
    setItems([])
    setForm({ title: '', amount: '', date: '', category: 'other', vendor: '' })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Beleg hinzufügen</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-gray-900">Neuer Beleg</h2>
              <button onClick={() => { setOpen(false); resetForm() }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Vorschau" className="max-h-40 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload size={24} />
                    <p className="text-sm">Foto aufnehmen oder Datei auswählen</p>
                  </div>
                )}
                {ocrLoading && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    KI analysiert Beleg...
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {items.length > 0 && (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Tag size={13} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-600">
                      Erkannte Artikel ({items.length})
                    </p>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {items.map((item, i) => {
                      const color = item.category ? ITEM_CATEGORY_COLORS[item.category] : '#94a3b8'
                      const label = item.category ? ITEM_CATEGORY_LABELS[item.category] : 'Sonstiges'
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate flex-1 mr-2">{item.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.price != null && (
                              <span className="text-gray-500">{item.price.toFixed(2)} €</span>
                            )}
                            <span
                              className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: color + '20', color }}
                            >
                              {label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Titel *</label>
                    <input
                      required
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Betrag (€) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Datum *</label>
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Händler</label>
                    <input
                      value={form.vendor}
                      onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Speichert...' : 'Beleg speichern'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
