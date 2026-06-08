import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAi, extractJson } from '@/lib/services/ai'
import { ITEM_CATEGORIES } from '@/lib/utils/item-categories'
import type { OcrResult } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const image = formData.get('image') as File | null
  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const bytes = await image.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = image.type || 'image/jpeg'

  const prompt = `Analysiere diesen Kassenbon/Beleg sorgfältig und extrahiere alle Informationen.

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

  try {
    const rawText = await callAi(prompt, base64, mimeType)
    const parsed = extractJson<Partial<OcrResult>>(rawText) ?? {}

    return NextResponse.json({
      raw_text: rawText,
      ...parsed,
    } satisfies OcrResult)
  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json(
      { error: 'OCR-Verarbeitung fehlgeschlagen', raw_text: '' },
      { status: 502 }
    )
  }
}
