import Link from 'next/link'
import type { Receipt } from '@/types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/utils/categories'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { ImageIcon } from 'lucide-react'

interface Props {
  receipt: Receipt
}

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

export function ReceiptCard({ receipt }: Props) {
  const categoryColor = CATEGORY_COLORS[receipt.category] ?? '#94a3b8'

  return (
    <Link
      href={`/dashboard/receipts/${receipt.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-400 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: categoryColor + '20' }}>
          {receipt.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receipt.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <ImageIcon size={16} style={{ color: categoryColor }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{receipt.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {receipt.vendor && <span>{receipt.vendor} · </span>}
            {format(parseISO(receipt.date), 'd. MMM yyyy', { locale: de })}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-semibold text-gray-900">{fmt(receipt.amount, receipt.currency)}</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block"
            style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
          >
            {CATEGORY_LABELS[receipt.category]}
          </span>
        </div>
      </div>
    </Link>
  )
}
