/** Kategorie wydarzeń z przypisanymi kolorami */

export const EVENT_CATEGORIES = [
  { id: 'praca', label: 'Praca', color: '#00e5ff' },
  { id: 'prywatne', label: 'Prywatne', color: '#ff00d4' },
  { id: 'zdrowie', label: 'Zdrowie', color: '#00ff9d' },
  { id: 'rozrywka', label: 'Rozrywka', color: '#ffb800' },
  { id: 'inne', label: 'Inne', color: '#9d4edd' },
] as const

export type EventCategoryId = (typeof EVENT_CATEGORIES)[number]['id']

export function getCategoryColor(categoryId?: string | null): string {
  const cat = EVENT_CATEGORIES.find((c) => c.id === categoryId)
  return cat?.color ?? '#00e5ff'
}
