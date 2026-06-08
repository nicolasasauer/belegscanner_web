import type { Category } from '@/types'

export const CATEGORY_LABELS: Record<Category, string> = {
  food: 'Lebensmittel',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Freizeit',
  health: 'Gesundheit',
  utilities: 'Nebenkosten',
  housing: 'Wohnen',
  education: 'Bildung',
  travel: 'Reisen',
  other: 'Sonstiges',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  shopping: '#a855f7',
  entertainment: '#ec4899',
  health: '#22c55e',
  utilities: '#eab308',
  housing: '#06b6d4',
  education: '#6366f1',
  travel: '#f43f5e',
  other: '#94a3b8',
}

export const CATEGORIES: Category[] = [
  'food', 'transport', 'shopping', 'entertainment',
  'health', 'utilities', 'housing', 'education', 'travel', 'other',
]
