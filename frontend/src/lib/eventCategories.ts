/** Kategorie wydarzeń (domyślne + własne użytkownika). */

export interface EventCategory {
  id: string
  name: string
  color: string
  isVisible: boolean
  isDefault?: boolean
}

export const DEFAULT_EVENT_CATEGORIES: EventCategory[] = [
  { id: 'praca', name: 'Praca', color: '#82a7cf', isVisible: true, isDefault: true },
  { id: 'prywatne', name: 'Prywatne', color: '#b58cc4', isVisible: true, isDefault: true },
  { id: 'zdrowie', name: 'Zdrowie', color: '#0d9488', isVisible: true, isDefault: true },
  { id: 'rozrywka', name: 'Rozrywka', color: '#d97706', isVisible: true, isDefault: true },
  { id: 'inne', name: 'Inne', color: '#9d4edd', isVisible: true, isDefault: true },
]

export const EVENT_CATEGORY_COLOR_OPTIONS = [
  '#f8fafc',
  '#e2e8f0',
  '#82a7cf',
  '#39ff14',
  '#d0ff00',
  '#bc13fe',
  '#b58cc4',
  '#9d4edd',
  '#3b82f6',
  '#d97706',
  '#a16207',
  '#78350f',
  '#92400e',
  '#dc2626',
  '#0d9488',
  '#84cc16',
  '#e11d48',
  '#14b8a6',
  '#8b5cf6',
  '#64748b',
  '#334155',
  '#06b6d4',
  '#7c3aed',
  '#4d7c0f',
  '#22d3ee',
  '#f72585',
  '#00f5d4',
] as const

export function getCategoryColor(categoryId?: string | null): string {
  const cat = DEFAULT_EVENT_CATEGORIES.find((c) => c.id === categoryId)
  return cat?.color ?? '#82a7cf'
}
