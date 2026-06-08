'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { MonthlyStat } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  data: MonthlyStat[]
}

export function MonthlyChart({ data }: Props) {
  const chartData = data.map(d => ({
    ...d,
    label: format(parseISO(d.month + '-01'), 'MMM', { locale: de }),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Ausgaben pro Monat</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={28}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}€`}
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
            }
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="total" fill="#1f2937" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
