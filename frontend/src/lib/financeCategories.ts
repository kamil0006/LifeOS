/** Kolory kategorii finansowych – spójne z dashboardem (rozrywka różowy itp.) */

export const FINANCE_CATEGORIES = [
  { id: 'Jedzenie', label: 'Jedzenie', color: '#63b28f' },
  { id: 'Mieszkanie', label: 'Mieszkanie', color: '#82a7cf' },
  { id: 'Transport', label: 'Transport', color: '#c9a35c' },
  { id: 'Rozrywka', label: 'Rozrywka', color: '#b58cc4' },
  { id: 'Inne', label: 'Inne', color: '#e57373' },
  { id: 'Dochód', label: 'Dochód', color: '#63b28f' },
] as const

export function getFinanceCategoryColor(category: string): string {
  const cat = FINANCE_CATEGORIES.find((c) => c.id === category)
  return cat?.color ?? '#9d4edd'
}
