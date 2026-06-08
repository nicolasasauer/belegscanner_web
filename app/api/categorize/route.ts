import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAi, extractJson } from '@/lib/services/ai'
import { ITEM_CATEGORIES } from '@/lib/utils/item-categories'
import type { ReceiptItem, ItemCategory } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items }: { items: ReceiptItem[] } = await request.json()
  if (!items?.length) return NextResponse.json({ items: [] })

  const itemList = items
    .map((item, i) => `${i + 1}. ${item.name}${item.price != null ? ` (${item.price}€)` : ''}`)
    .join('\n')

  const prompt = `Kategorisiere diese Artikel von einem Kassenbon.
Erlaubte Kategorien: ${ITEM_CATEGORIES.join(', ')}

Artikel:
${itemList}

Antworte NUR mit JSON-Array (gleiche Reihenfolge wie oben):
[{"name":"Artikelname","category":"kategorie"}]`

  try {
    const rawText = await callAi(prompt)
    const categorized = extractJson<Array<{ name: string; category: ItemCategory }>>(rawText) ?? []

    const result: ReceiptItem[] = items.map((item, i) => ({
      ...item,
      category: categorized[i]?.category ?? 'sonstiges',
    }))

    return NextResponse.json({ items: result })
  } catch (err) {
    console.error('Categorize error:', err)
    return NextResponse.json({ items }, { status: 200 })
  }
}
