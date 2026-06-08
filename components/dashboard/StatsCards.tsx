import { TrendingUp, Receipt, Euro, Calendar } from 'lucide-react'
import type { UserStats } from '@/types'
import { CATEGORY_LABELS } from '@/lib/utils/categories'

interface Props {
  stats: UserStats | null
}

function fmt(amount: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function StatsCards({ stats }: Props) {
  const cards = [
    {
      label: 'Belege gesamt',
      value: stats?.total_receipts.toString() ?? '–',
      sub: `${stats?.receipts_this_month ?? 0} diesen Monat`,
      icon: Receipt,
    },
    {
      label: 'Ausgaben gesamt',
      value: stats ? fmt(stats.total_amount) : '–',
      sub: `Ø ${stats ? fmt(stats.avg_amount) : '–'} pro Beleg`,
      icon: Euro,
    },
    {
      label: 'Diesen Monat',
      value: stats ? fmt(stats.amount_this_month) : '–',
      sub: `${stats?.receipts_this_month ?? 0} Belege`,
      icon: Calendar,
    },
    {
      label: 'Top-Kategorie',
      value: stats?.top_category ? CATEGORY_LABELS[stats.top_category] : '–',
      sub: 'nach Ausgaben',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <Icon size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
