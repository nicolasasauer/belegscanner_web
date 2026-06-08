import { createClient } from '@/lib/supabase/server'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { ReceiptUploadButton } from '@/components/receipts/ReceiptUploadButton'
import { ExportButtons } from '@/components/receipts/ExportButtons'
import type { FilterParams } from '@/types'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const filters: FilterParams = {
    page: Number(searchParams.page ?? 1),
    pageSize: 20,
    category: searchParams.category as FilterParams['category'],
    dateFrom: searchParams.dateFrom as string,
    dateTo: searchParams.dateTo as string,
    search: searchParams.search as string,
  }

  let query = supabase
    .from('receipts')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(((filters.page ?? 1) - 1) * 20, (filters.page ?? 1) * 20 - 1)

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('date', filters.dateTo)
  if (filters.search) query = query.or(`title.ilike.%${filters.search}%,vendor.ilike.%${filters.search}%`)

  const { data, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Belege</h1>
          <p className="text-sm text-gray-500 mt-1">{count ?? 0} Belege insgesamt</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons />
          <ReceiptUploadButton />
        </div>
      </div>

      <ReceiptList
        receipts={data ?? []}
        totalCount={count ?? 0}
        currentPage={filters.page ?? 1}
        pageSize={20}
      />
    </div>
  )
}
