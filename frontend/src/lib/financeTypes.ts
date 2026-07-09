import type { PaymentMethod } from './paymentMethod'
import type { Currency } from './currency'

export type ExpenseRow = {
  id: string
  name: string
  amount: number
  category: string
  date: string
  paymentMethod?: PaymentMethod | null
  note?: string | null
}
export type IncomeRow = {
  id: string
  source: string
  amount: number
  date: string
  recurring: boolean
  category?: string
  paymentMethod?: PaymentMethod | null
  note?: string | null
}
export type ScheduledExpenseRow = {
  id: string
  name: string
  /** Zawsze w PLN — przeliczone wg bieżącego kursu, gdy currency != PLN. */
  amount: number
  currency?: Currency
  /** Kwota w walucie `currency`, gdy currency != PLN. */
  originalAmount?: number | null
  category: string
  dayOfMonth: number
  active: boolean
  paymentMethod?: PaymentMethod | null
  pausedUntil?: string | null
  reminderDaysBefore?: number | null
  note?: string | null
  /** Data zakończenia (soft delete) — płatności po tej dacie nie są generowane. */
  endedAt?: string | null
  createdAt?: string
}
