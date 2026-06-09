import { db } from '@/lib/db'
import { receipts } from '@/lib/db/schema'
import { eq, and, gte, lte, or, like, desc } from 'drizzle-orm'
import crypto from 'crypto'
import type { Receipt, ReceiptInsert, ReceiptUpdate, PaginatedResponse, FilterParams } from '@/types'

// SQLite-Row → Receipt-Typ (JSON-Felder parsen)
function rowToReceipt(row: typeof receipts.$inferSelect): Receipt {
  return {
    id:          row.id,
    user_id:     row.userId,
    title:       row.title,
    amount:      row.amount,
    currency:    row.currency,
    date:        row.date,
    category:    row.category as Receipt['category'],
    vendor:      row.vendor      ?? undefined,
    description: row.description ?? undefined,
    image_url:   row.imageUrl    ?? undefined,
    raw_text:    row.rawText     ?? undefined,
    items:       row.items ? JSON.parse(row.items) : [],
    tags:        row.tags  ? JSON.parse(row.tags)  : [],
    is_synced:   !!row.isSynced,
    created_at:  row.createdAt,
    updated_at:  row.updatedAt,
  }
}

export async function getReceipts(
  userId: string,
  filters: FilterParams = {}
): Promise<PaginatedResponse<Receipt>> {
  const { page = 1, pageSize = 20, category, dateFrom, dateTo, search } = filters

  const conditions = [eq(receipts.userId, userId)]
  if (category) conditions.push(eq(receipts.category, category))
  if (dateFrom)  conditions.push(gte(receipts.date, dateFrom))
  if (dateTo)    conditions.push(lte(receipts.date, dateTo))
  if (search) {
    conditions.push(
      or(like(receipts.title, `%${search}%`), like(receipts.vendor, `%${search}%`))!
    )
  }

  const allRows  = db.select().from(receipts).where(and(...conditions)).orderBy(desc(receipts.date)).all()
  const count    = allRows.length
  const pageRows = allRows.slice((page - 1) * pageSize, page * pageSize)

  return {
    data:       pageRows.map(rowToReceipt),
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  }
}

export async function getReceiptById(id: string, userId: string): Promise<Receipt | null> {
  const row = db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, userId)))
    .get()
  return row ? rowToReceipt(row) : null
}

export async function createReceipt(userId: string, receipt: ReceiptInsert): Promise<Receipt> {
  const id  = crypto.randomUUID()
  const now = new Date().toISOString()

  db.insert(receipts).values({
    id,
    userId,
    title:       receipt.title,
    amount:      receipt.amount,
    currency:    receipt.currency    ?? 'EUR',
    date:        receipt.date,
    category:    receipt.category,
    vendor:      receipt.vendor      ?? null,
    description: receipt.description ?? null,
    imageUrl:    receipt.image_url   ?? null,
    rawText:     receipt.raw_text    ?? null,
    items:       JSON.stringify(receipt.items ?? []),
    tags:        JSON.stringify(receipt.tags  ?? []),
    isSynced:    0,
    createdAt:   now,
    updatedAt:   now,
  }).run()

  const row = db.select().from(receipts).where(eq(receipts.id, id)).get()!
  return rowToReceipt(row)
}

export async function updateReceipt({ id, ...updates }: ReceiptUpdate, userId: string): Promise<Receipt> {
  const now = new Date().toISOString()

  db.update(receipts)
    .set({
      ...(updates.title       !== undefined && { title:       updates.title }),
      ...(updates.amount      !== undefined && { amount:      updates.amount }),
      ...(updates.currency    !== undefined && { currency:    updates.currency }),
      ...(updates.date        !== undefined && { date:        updates.date }),
      ...(updates.category    !== undefined && { category:    updates.category }),
      ...(updates.vendor      !== undefined && { vendor:      updates.vendor }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.image_url   !== undefined && { imageUrl:    updates.image_url }),
      ...(updates.raw_text    !== undefined && { rawText:     updates.raw_text }),
      ...(updates.items       !== undefined && { items:       JSON.stringify(updates.items) }),
      ...(updates.tags        !== undefined && { tags:        JSON.stringify(updates.tags) }),
      updatedAt: now,
    })
    .where(and(eq(receipts.id, id), eq(receipts.userId, userId)))
    .run()

  const row = db.select().from(receipts).where(eq(receipts.id, id)).get()!
  return rowToReceipt(row)
}

export async function deleteReceipt(id: string, userId: string): Promise<void> {
  db.delete(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, userId)))
    .run()
}

export async function uploadReceiptImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Bild-Upload fehlgeschlagen')

  const { url } = await res.json()
  return url as string
}
