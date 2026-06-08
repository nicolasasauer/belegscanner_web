'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CategoryStat } from '@/types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/utils/categories'

interface Props {
  data: CategoryStat[]
}

export function CategoryChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: CATEGORY_LABELS[d.category],
    value: d.total,
    color: CATEGORY_COLORS[d.category],
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Ausgaben nach Kategorie</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
          Noch keine Daten
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
              }
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
