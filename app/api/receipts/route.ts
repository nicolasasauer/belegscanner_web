import { NextRequest, NextResponse } from 'next/server'
import { resolveApiUser } from '@/lib/mobile-auth'
import { getReceipts, createReceipt } from '@/lib/services/receipts'
import { z } from 'zod'
import type { FilterParams } from '@/types'

const insertSchema = z.object({
  title:       z.string().min(1),
  amount:      z.number().positive(),
  currency:    z.string().default('EUR'),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category:    z.enum(['food','transport','shopping','entertainment','health','utilities','housing','education','travel','other']),
  vendor:      z.string().optional(),
  description: z.string().optional(),
  image_url:   z.string().optional(),
  raw_text:    z.string().optional(),
  items:       z.array(z.any()).optional(),
  tags:        z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const result = await getReceipts(user.id, {
    page:     Number(searchParams.get('page')     ?? 1),
    pageSize: Number(searchParams.get('pageSize') ?? 20),
    category: (searchParams.get('category') ?? undefined) as FilterParams['category'],
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo:   searchParams.get('dateTo')   ?? undefined,
    search:   searchParams.get('search')   ?? undefined,
  })

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await request.json()
  const parsed = insertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const receipt = await createReceipt(user.id, parsed.data)
  return NextResponse.json(receipt, { status: 201 })
}
