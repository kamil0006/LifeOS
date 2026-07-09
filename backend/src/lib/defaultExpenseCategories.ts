/**
 * Default expense categories (name = value of the `category` field in Expense / ScheduledExpense).
 * The income category is excluded — it applies to income only.
 */
export const DEFAULT_EXPENSE_CATEGORIES_FOR_SEED = [
  { name: 'Jedzenie', color: '#63b28f' },
  { name: 'Mieszkanie', color: '#82a7cf' },
  { name: 'Transport', color: '#c9a35c' },
  { name: 'Rozrywka', color: '#b58cc4' },
  { name: 'Inne', color: '#e57373' },
] as const
