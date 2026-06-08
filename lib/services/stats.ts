import { createClient } from '@/lib/supabase/client'
import type { UserStats, CategoryStat, MonthlyStat } from '@/types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function getUserStats(): Promise<UserStats> {
  const supabase = createClient()

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const [allReceipts, monthReceipts] = await Promise.all([
    supabase.from('receipts').select('id, amount, category, date'),
    supabase.from('receipts').select('id, amount').gte('date', monthStart).lte('date', monthEnd),
  ])

  if (allReceipts.error) throw allReceipts.error
  if (monthReceipts.error) throw monthReceipts.error

  const receipts = allReceipts.data ?? []
  const total_amount = receipts.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const total_receipts = receipts.length

  const categoryMap = new Map<string, CategoryStat>()
  for (const r of receipts) {
    const existing = categoryMap.get(r.category) ?? { category: r.category, count: 0, total: 0 }
    categoryMap.set(r.category, {
      ...existing,
      count: existing.count + 1,
      total: existing.total + (r.amount ?? 0),
    })
  }

  const by_category = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
  const top_category = by_category[0]?.category ?? null

  const monthMap = new Map<string, MonthlyStat>()
  for (let i = 5; i >= 0; i--) {
    const month = format(subMonths(now, i), 'yyyy-MM')
    monthMap.set(month, { month, count: 0, total: 0 })
  }
  for (const r of receipts) {
    const month = r.date.substring(0, 7)
    if (monthMap.has(month)) {
      const existing = monthMap.get(month)!
      monthMap.set(month, {
        ...existing,
        count: existing.count + 1,
        total: existing.total + (r.amount ?? 0),
      })
    }
  }

  const thisMonth = monthReceipts.data ?? []

  return {
    total_receipts,
    total_amount,
    avg_amount: total_receipts > 0 ? total_amount / total_receipts : 0,
    receipts_this_month: thisMonth.length,
    amount_this_month: thisMonth.reduce((sum, r) => sum + (r.amount ?? 0), 0),
    top_category,
    by_category,
    by_month: Array.from(monthMap.values()),
  }
}
