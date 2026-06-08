import type { Receipt } from '@/types'

export function exportToJson(receipts: Receipt[]): void {
  const json = JSON.stringify(receipts, null, 2)
  downloadFile(json, 'belege.json', 'application/json')
}

export function exportToCsv(receipts: Receipt[]): void {
  const headers = ['id', 'title', 'amount', 'currency', 'date', 'category', 'vendor', 'description', 'tags', 'created_at']
  const rows = receipts.map(r => [
    r.id,
    csvEscape(r.title),
    r.amount.toFixed(2),
    r.currency,
    r.date,
    r.category,
    csvEscape(r.vendor ?? ''),
    csvEscape(r.description ?? ''),
    csvEscape(r.tags.join(';')),
    r.created_at,
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadFile(csv, 'belege.csv', 'text/csv;charset=utf-8;')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
