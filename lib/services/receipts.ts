import { createClient } from '@/lib/supabase/client'
import type { Receipt, ReceiptInsert, ReceiptUpdate, PaginatedResponse, FilterParams } from '@/types'

const TABLE = 'receipts'

export async function getReceipts(filters: FilterParams = {}): Promise<PaginatedResponse<Receipt>> {
  const supabase = createClient()
  const { page = 1, pageSize = 20, category, dateFrom, dateTo, search } = filters

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (category) query = query.eq('category', category)
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)
  if (search) query = query.or(`title.ilike.%${search}%,vendor.ilike.%${search}%`)

  const { data, count, error } = await query
  if (error) throw error

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createReceipt(receipt: ReceiptInsert): Promise<Receipt> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...receipt, user_id: user.id, currency: receipt.currency ?? 'EUR', tags: receipt.tags ?? [] })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReceipt({ id, ...updates }: ReceiptUpdate): Promise<Receipt> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteReceipt(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function uploadReceiptImage(file: File): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('receipt-images').upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from('receipt-images').getPublicUrl(path)
  return data.publicUrl
}
