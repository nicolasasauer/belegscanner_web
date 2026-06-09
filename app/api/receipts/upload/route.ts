/**
 * POST /api/receipts/upload
 * Kombinierter Upload + OCR-Endpunkt für die Mobile-App.
 *
 * Erwartet: multipart/form-data mit Feld "file" (JPEG/PNG)
 * Liefert: { url, raw_text?, title?, amount?, date?, vendor?, currency?, items? }
 *
 * Ablauf:
 * 1. Datei speichern → /api/uploads/<userId>/<uuid>.jpg
 * 2. OCR via AI-Service (optional — wenn AI nicht konfiguriert, nur URL)
 */
import { NextRequest, NextResponse } from 'next/server'
import { resolveApiUser } from '@/lib/mobile-auth'
import { callAi, extractJson } from '@/lib/services/ai'
import { ITEM_CATEGORIES } from '@/lib/utils/item-categories'
import type { OcrResult } from '@/types'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads')

const OCR_PROMPT = `Analysiere diesen Kassenbon/Beleg sorgfältig und extrahiere alle Informationen.

Antworte AUSSCHLIESSLICH mit diesem JSON (kein erklärender Text davor oder danach):
{
  "title": "Kurze Beschreibung des Belegs",
  "amount": 0.00,
  "currency": "EUR",
  "date": "YYYY-MM-DD",
  "vendor": "Name des Händlers",
  "items": [
    {
      "name": "Artikelname",
      "price": 0.00,
      "quantity": 1,
      "category": "lebensmittel"
    }
  ]
}

Erlaubte Kategorien für Artikel: ${ITEM_CATEGORIES.join(', ')}

Wichtig:
- Extrahiere ALLE sichtbaren Einzelartikel
- Benutze für date das Format YYYY-MM-DD
- amount ist der Gesamtbetrag (Zahl ohne Währungssymbol)
- Antworte NUR mit validem JSON`

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Keine Datei übergeben' }, { status: 400 })

  // 1. Datei speichern
  const ext      = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const userDir  = path.join(UPLOADS_DIR, user.id)
  const filename = `${crypto.randomUUID()}.${ext}`
  const filePath = path.join(userDir, filename)
  const bytes    = await file.arrayBuffer()

  await fs.mkdir(userDir, { recursive: true })
  await fs.writeFile(filePath, Buffer.from(bytes))

  const url = `/api/uploads/${user.id}/${filename}`

  // 2. OCR versuchen (optional — schlägt fehl wenn AI nicht konfiguriert)
  try {
    const base64   = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'
    const rawText  = await callAi(OCR_PROMPT, base64, mimeType)
    const parsed   = extractJson<Partial<OcrResult>>(rawText) ?? {}

    return NextResponse.json({ url, raw_text: rawText, ...parsed } satisfies OcrResult & { url: string })
  } catch {
    // AI nicht konfiguriert oder Fehler — nur URL zurückgeben
    return NextResponse.json({ url, raw_text: '' })
  }
}
