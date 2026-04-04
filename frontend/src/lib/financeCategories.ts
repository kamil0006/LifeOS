/** Kolory kategorii finansowych – spójne z dashboardem (rozrywka różowy itp.) */

export const FINANCE_CATEGORIES = [
  { id: 'Jedzenie', label: 'Jedzenie', color: '#00ff9d' },
  { id: 'Mieszkanie', label: 'Mieszkanie', color: '#00e5ff' },
  { id: 'Transport', label: 'Transport', color: '#ffb800' },
  { id: 'Rozrywka', label: 'Rozrywka', color: '#ff00d4' },
  { id: 'Inne', label: 'Inne', color: '#e57373' },
  { id: 'Dochód', label: 'Dochód', color: '#00ff9d' },
] as const

export function getFinanceCategoryColor(category: string): string {
  const cat = FINANCE_CATEGORIES.find((c) => c.id === category)
  return cat?.color ?? '#9d4edd'
}
