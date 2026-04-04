export type ExpenseRow = { id: string; name: string; amount: number; category: string; date: string }
export type IncomeRow = { id: string; source: string; amount: number; date: string; recurring: boolean }
export type ScheduledExpenseRow = {
  id: string
  name: string
  amount: number
  category: string
  dayOfMonth: number
  active: boolean
}
