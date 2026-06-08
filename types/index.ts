export type Category =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'utilities'
  | 'housing'
  | 'education'
  | 'travel'
  | 'other'

export type ItemCategory =
  | 'lebensmittel'
  | 'getraenke'
  | 'kosmetik'
  | 'haushalt'
  | 'elektronik'
  | 'kleidung'
  | 'tierbedarf'
  | 'buero'
  | 'spielzeug'
  | 'alkohol'
  | 'tabak'
  | 'medikamente'
  | 'sonstiges'

export interface ReceiptItem {
  name: string
  price?: number
  quantity?: number
  category?: ItemCategory
}

export type AiProviderType = 'ollama' | 'lmstudio' | 'claude' | 'mistral' | 'gemini'

export interface Receipt {
  id: string
  user_id: string
  title: string
  amount: number
  currency: string
  date: string
  category: Category
  vendor?: string
  description?: string
  image_url?: string
  raw_text?: string
  items?: ReceiptItem[]
  tags: string[]
  is_synced: boolean
  created_at: string
  updated_at: string
}

export interface ReceiptInsert {
  title: string
  amount: number
  currency?: string
  date: string
  category: Category
  vendor?: string
  description?: string
  image_url?: string
  raw_text?: string
  items?: ReceiptItem[]
  tags?: string[]
}

export interface ReceiptUpdate extends Partial<ReceiptInsert> {
  id: string
}

export interface UserStats {
  total_receipts: number
  total_amount: number
  avg_amount: number
  receipts_this_month: number
  amount_this_month: number
  top_category: Category | null
  by_category: CategoryStat[]
  by_month: MonthlyStat[]
}

export interface CategoryStat {
  category: Category
  count: number
  total: number
}

export interface MonthlyStat {
  month: string
  count: number
  total: number
}

export interface OcrResult {
  raw_text: string
  title?: string
  amount?: number
  currency?: string
  date?: string
  vendor?: string
  items?: ReceiptItem[]
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FilterParams {
  category?: Category
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}
