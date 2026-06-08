import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/utils/categories'
import { ITEM_CATEGORY_LABELS, ITEM_CATEGORY_COLORS } from '@/lib/utils/item-categories'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { DeleteReceiptButton } from '@/components/receipts/DeleteReceiptButton'
import type { Receipt } from '@/types'

interface Props {
  params: { id: string }
}

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

export default async function ReceiptDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !receipt) notFound()

  const r = receipt as Receipt
  const categoryColor = CATEGORY_COLORS[r.category]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/receipts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{r.title}</h1>
        <DeleteReceiptButton id={r.id} />
      </div>

      {r.image_url && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.image_url} alt="Beleg" className="w-full object-contain max-h-80" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">{fmt(r.amount, r.currency)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {format(parseISO(r.date), 'd. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <span
            className="text-sm px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
          >
            {CATEGORY_LABELS[r.category]}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <Field label="Händler" value={r.vendor} />
          <Field label="Beschreibung" value={r.description} />
          <Field label="Erstellt am" value={format(parseISO(r.created_at), 'd. MMM yyyy', { locale: de })} />
          {r.tags?.length > 0 && (
            <div>
              <dt className="text-xs font-medium text-gray-500">Tags</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {r.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {r.items && r.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Artikel ({r.items.length})
          </h3>
          <div className="divide-y divide-gray-100">
            {r.items.map((item, i) => {
              const color = item.category ? ITEM_CATEGORY_COLORS[item.category] : '#94a3b8'
              const label = item.category ? ITEM_CATEGORY_LABELS[item.category] : 'Sonstiges'
              return (
                <div key={i} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.name}</p>
                    {item.quantity && item.quantity !== 1 && (
                      <p className="text-xs text-gray-400">{item.quantity}×</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.price != null && (
                      <span className="text-sm font-medium text-gray-700">
                        {item.price.toFixed(2)} €
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {r.items.some(item => item.price != null) && (
            <div className="flex justify-between pt-3 border-t mt-2">
              <span className="text-xs font-medium text-gray-500">Summe Artikel</span>
              <span className="text-xs font-semibold text-gray-700">
                {r.items
                  .reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0)
                  .toFixed(2)}{' '}€
              </span>
            </div>
          )}
        </div>
      )}

      {r.raw_text && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">OCR-Rohdaten</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 overflow-auto max-h-48">
            {r.raw_text}
          </pre>
        </div>
      )}
    </div>
  )
}
