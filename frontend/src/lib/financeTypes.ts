import type { PaymentMethod } from './paymentMethod'

export type ExpenseRow = {
  id: string
  name: string
  amount: number
  category: string
  date: string
  paymentMethod?: PaymentMethod | null
}
export type IncomeRow = {
  id: string
  source: string
  amount: number
  date: string
  recurring: boolean
  category?: string
  paymentMethod?: PaymentMethod | null
}
export type ScheduledExpenseRow = {
  id: string
  name: string
  amount: number
  category: string
  dayOfMonth: number
  active: boolean
  paymentMethod?: PaymentMethod | null
  pausedUntil?: string | null
  reminderDaysBefore?: number | null
}
