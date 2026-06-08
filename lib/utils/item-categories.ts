import type { ItemCategory } from '@/types'

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  lebensmittel: 'Lebensmittel',
  getraenke:    'Getränke',
  kosmetik:     'Kosmetik',
  haushalt:     'Haushalt',
  elektronik:   'Elektronik',
  kleidung:     'Kleidung',
  tierbedarf:   'Tierbedarf',
  buero:        'Bürobedarf',
  spielzeug:    'Spielzeug',
  alkohol:      'Alkohol',
  tabak:        'Tabak',
  medikamente:  'Medikamente',
  sonstiges:    'Sonstiges',
}

export const ITEM_CATEGORY_COLORS: Record<ItemCategory, string> = {
  lebensmittel: '#22c55e',
  getraenke:    '#3b82f6',
  kosmetik:     '#ec4899',
  haushalt:     '#f97316',
  elektronik:   '#6366f1',
  kleidung:     '#a855f7',
  tierbedarf:   '#f59e0b',
  buero:        '#06b6d4',
  spielzeug:    '#ef4444',
  alkohol:      '#8b5cf6',
  tabak:        '#64748b',
  medikamente:  '#10b981',
  sonstiges:    '#94a3b8',
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  'lebensmittel', 'getraenke', 'kosmetik', 'haushalt', 'elektronik',
  'kleidung', 'tierbedarf', 'buero', 'spielzeug', 'alkohol', 'tabak',
  'medikamente', 'sonstiges',
]
