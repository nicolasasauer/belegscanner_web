import type { Receipt } from '@/types'
import { ReceiptCard } from './ReceiptCard'
import { Pagination } from './Pagination'

interface Props {
  receipts: Receipt[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export function ReceiptList({ receipts, totalCount, currentPage, pageSize }: Props) {
  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-sm">Noch keine Belege vorhanden.</p>
        <p className="text-gray-400 text-xs mt-1">Lade deinen ersten Beleg hoch!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {receipts.map(receipt => (
          <ReceiptCard key={receipt.id} receipt={receipt} />
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / pageSize)}
      />
    </div>
  )
}
