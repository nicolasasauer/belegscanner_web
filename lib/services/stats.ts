import { db } from '@/lib/db'
import { receipts } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import type { UserStats, CategoryStat, MonthlyStat, Category } from '@/types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function getUserStats(userId: string): Promise<UserStats> {
  const now        = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now),   'yyyy-MM-dd')

  const allRows   = db.select().from(receipts).where(eq(receipts.userId, userId)).all()
  const monthRows = db
    .select()
    .from(receipts)
    .where(and(eq(receipts.userId, userId), gte(receipts.date, monthStart), lte(receipts.date, monthEnd)))
    .all()

  const total_receipts = allRows.length
  const total_amount   = allRows.reduce((s, r) => s + r.amount, 0)

  // Kategorien
  const categoryMap = new Map<string, CategoryStat>()
  for (const r of allRows) {
    const existing = categoryMap.get(r.category) ?? { category: r.category as Category, count: 0, total: 0 }
    categoryMap.set(r.category, {
      ...existing,
      count: existing.count + 1,
      total: existing.total + r.amount,
    })
  }
  const by_category = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
  const top_category = by_category[0]?.category ?? null

  // Letzte 6 Monate
  const monthMap = new Map<string, MonthlyStat>()
  for (let i = 5; i >= 0; i--) {
    const month = format(subMonths(now, i), 'yyyy-MM')
    monthMap.set(month, { month, count: 0, total: 0 })
  }
  for (const r of allRows) {
    const month = r.date.substring(0, 7)
    if (monthMap.has(month)) {
      const existing = monthMap.get(month)!
      monthMap.set(month, { ...existing, count: existing.count + 1, total: existing.total + r.amount })
    }
  }

  return {
    total_receipts,
    total_amount,
    avg_amount:           total_receipts > 0 ? total_amount / total_receipts : 0,
    receipts_this_month:  monthRows.length,
    amount_this_month:    monthRows.reduce((s, r) => s + r.amount, 0),
    top_category,
    by_category,
    by_month: Array.from(monthMap.values()),
  }
}
