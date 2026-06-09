/**
 * POST /api/receipts/sync
 * Batch-Sync von Mobile-App-Belegen.
 *
 * Body: { receipts: ReceiptSyncItem[] }
 * Response: { synced_ids: string[] }
 *
 * Logik: Upsert — neue Belege werden eingefügt, vorhandene (gleiche ID)
 * werden aktualisiert, wenn updated_at neuere ist.
 */
import { NextRequest, NextResponse } from 'next/server'
import { resolveApiUser } from '@/lib/mobile-auth'
import { db } from '@/lib/db'
import { receipts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const receiptSyncSchema = z.object({
  id:          z.string().uuid(),
  title:       z.string().min(1),
  amount:      z.number().nonnegative(),
  currency:    z.string().default('EUR'),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category:    z.enum([
    'food','transport','shopping','entertainment',
    'health','utilities','housing','education','travel','other',
  ]),
  vendor:      z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  raw_text:    z.string().nullable().optional(),
  created_at:  z.string().optional(),
  updated_at:  z.string().optional(),
})

const syncBodySchema = z.object({
  receipts: z.array(receiptSyncSchema),
})

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await request.json()
  const parsed = syncBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const syncedIds: string[] = []
  const now = new Date().toISOString()

  for (const r of parsed.data.receipts) {
    const existing = db
      .select({ id: receipts.id, updatedAt: receipts.updatedAt })
      .from(receipts)
      .where(and(eq(receipts.id, r.id), eq(receipts.userId, user.id)))
      .get()

    if (!existing) {
      // Neuer Beleg — einfügen
      db.insert(receipts).values({
        id:          r.id,
        userId:      user.id,
        title:       r.title,
        amount:      r.amount,
        currency:    r.currency,
        date:        r.date,
        category:    r.category,
        vendor:      r.vendor      ?? null,
        description: r.description ?? null,
        rawText:     r.raw_text    ?? null,
        items:       '[]',
        tags:        '[]',
        isSynced:    1,
        createdAt:   r.created_at  ?? now,
        updatedAt:   r.updated_at  ?? now,
      }).run()
    } else if (r.updated_at && r.updated_at > existing.updatedAt) {
      // Neuere Version vom Mobile — aktualisieren
      db.update(receipts)
        .set({
          title:       r.title,
          amount:      r.amount,
          currency:    r.currency,
          date:        r.date,
          category:    r.category,
          vendor:      r.vendor      ?? null,
          description: r.description ?? null,
          rawText:     r.raw_text    ?? null,
          updatedAt:   r.updated_at  ?? now,
        })
        .where(and(eq(receipts.id, r.id), eq(receipts.userId, user.id)))
        .run()
    }

    syncedIds.push(r.id)
  }

  return NextResponse.json({ synced_ids: syncedIds })
}
