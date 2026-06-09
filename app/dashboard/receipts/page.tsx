import { auth } from '@/auth'
import { getReceipts } from '@/lib/services/receipts'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { ReceiptUploadButton } from '@/components/receipts/ReceiptUploadButton'
import { ExportButtons } from '@/components/receipts/ExportButtons'
import type { FilterParams } from '@/types'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const filters: FilterParams = {
    page:     Number(searchParams.page ?? 1),
    pageSize: 20,
    category: searchParams.category as FilterParams['category'],
    dateFrom: searchParams.dateFrom as string,
    dateTo:   searchParams.dateTo   as string,
    search:   searchParams.search   as string,
  }

  const { data, count } = await getReceipts(session.user.id, filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Belege</h1>
          <p className="text-sm text-gray-500 mt-1">{count} Belege insgesamt</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons />
          <ReceiptUploadButton />
        </div>
      </div>

      <ReceiptList
        receipts={data}
        totalCount={count}
        currentPage={filters.page ?? 1}
        pageSize={20}
      />
    </div>
  )
}
