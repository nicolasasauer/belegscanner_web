import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Receipt } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const format = new URL(request.url).searchParams.get('format') ?? 'json'

  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const receipts: Receipt[] = data ?? []

  if (format === 'csv') {
    const headers = ['id', 'title', 'amount', 'currency', 'date', 'category', 'vendor', 'description', 'tags']
    const rows = receipts.map(r => [
      r.id,
      csvEscape(r.title),
      r.amount.toFixed(2),
      r.currency,
      r.date,
      r.category,
      csvEscape(r.vendor ?? ''),
      csvEscape(r.description ?? ''),
      csvEscape((r.tags ?? []).join(';')),
    ])
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="belege.csv"',
      },
    })
  }

  return new NextResponse(JSON.stringify(receipts, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="belege.json"',
    },
  })
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
