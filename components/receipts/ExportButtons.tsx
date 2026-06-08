'use client'

import { Download } from 'lucide-react'

export function ExportButtons() {
  function exportData(format: 'json' | 'csv') {
    window.location.href = `/api/export?format=${format}`
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportData('json')}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        JSON
      </button>
      <button
        onClick={() => exportData('csv')}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        CSV
      </button>
    </div>
  )
}
