/**
 * Domyślne kategorie wydatków (nazwa = wartość pola `category` w Expense / ScheduledExpense).
 * Dochód wyłączony — dotyczy tylko przychodów.
 */
export const DEFAULT_EXPENSE_CATEGORIES_FOR_SEED = [
  { name: 'Jedzenie', color: '#00ff9d' },
  { name: 'Mieszkanie', color: '#00e5ff' },
  { name: 'Transport', color: '#ffb800' },
  { name: 'Rozrywka', color: '#ff00d4' },
  { name: 'Inne', color: '#e57373' },
] as const
