import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { receipts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Receipt } from '@/types'

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const format = new URL(request.url).searchParams.get('format') ?? 'json'

  const rows = db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, session.user.id))
    .orderBy(desc(receipts.date))
    .all()

  const data: Receipt[] = rows.map(r => ({
    id:          r.id,
    user_id:     r.userId,
    title:       r.title,
    amount:      r.amount,
    currency:    r.currency,
    date:        r.date,
    category:    r.category as Receipt['category'],
    vendor:      r.vendor      ?? undefined,
    description: r.description ?? undefined,
    image_url:   r.imageUrl    ?? undefined,
    raw_text:    r.rawText     ?? undefined,
    items:       r.items ? JSON.parse(r.items) : [],
    tags:        r.tags  ? JSON.parse(r.tags)  : [],
    is_synced:   !!r.isSynced,
    created_at:  r.createdAt,
    updated_at:  r.updatedAt,
  }))

  if (format === 'csv') {
    const headers = ['id','title','amount','currency','date','category','vendor','description','tags']
    const csvRows = data.map(r => [
      r.id,
      csvEscape(r.title),
      r.amount.toFixed(2),
      r.currency,
      r.date,
      r.category,
      csvEscape(r.vendor      ?? ''),
      csvEscape(r.description ?? ''),
      csvEscape((r.tags ?? []).join(';')),
    ])
    const csv = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="belege.csv"',
      },
    })
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="belege.json"',
    },
  })
}
