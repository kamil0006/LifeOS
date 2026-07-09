/**
 * Domyślne kategorie wydatków (nazwa = wartość pola `category` w Expense / ScheduledExpense).
 * Dochód wyłączony — dotyczy tylko przychodów.
 */
export const DEFAULT_EXPENSE_CATEGORIES_FOR_SEED = [
  { name: 'Jedzenie', color: '#63b28f' },
  { name: 'Mieszkanie', color: '#82a7cf' },
  { name: 'Transport', color: '#c9a35c' },
  { name: 'Rozrywka', color: '#b58cc4' },
  { name: 'Inne', color: '#e57373' },
] as const
