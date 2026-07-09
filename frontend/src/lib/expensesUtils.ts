import type { PaymentMethod } from './paymentMethod'

export interface ExpenseLike {
  id: string
  name: string
  amount: number
  category: string
  date: string
  paymentMethod?: PaymentMethod | null
  note?: string | null
}

export interface ScheduledExpenseLike {
  id: string
  name: string
  amount: number
  currency?: string
  originalAmount?: number | null
  category: string
  dayOfMonth: number
  active: boolean
  paymentMethod?: PaymentMethod | null
  pausedUntil?: string | null
  note?: string | null
  /** Data zakończenia (soft delete) — płatności po tej dacie nie są generowane, wcześniejsze zostają. */
  endedAt?: string | null
  /** Kiedy dodano stały wydatek — nie pokazujemy go w miesiącach sprzed tej daty. */
  createdAt?: string | Date
}

export interface MergedExpense extends ExpenseLike {
  isScheduled?: boolean
  scheduledId?: string
  currency?: string
  originalAmount?: number | null
}

/** Czy stały koszt jest zakończony (soft delete) przed podaną datą wystąpienia (YYYY-MM-DD)? */
function isEndedBefore(s: ScheduledExpenseLike, date: string): boolean {
  if (!s.endedAt) return false
  return date > s.endedAt.slice(0, 10)
}

/** Łączy wydatki z zaplanowanymi – generuje wirtualne wydatki na dany miesiąc.
 * Pomija z expenses te, które pokrywają się ze scheduled (ta sama nazwa, ten sam dzień miesiąca).
 * Zakończone stałe koszty (endedAt) generują wystąpienia tylko do daty zakończenia. */
export function mergeExpensesWithScheduled<E extends ExpenseLike, S extends ScheduledExpenseLike>(
  expenses: E[],
  scheduled: S[],
  month: number,
  year: number
): MergedExpense[] {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')

  const real: MergedExpense[] = expenses
    .filter((e) => {
      const day = parseInt(e.date.split('-')[2], 10)
      const nameLower = e.name.toLowerCase()
      const matchingScheduled = scheduled.find(
        (s) =>
          s.active &&
          s.name.toLowerCase() === nameLower &&
          s.dayOfMonth === day &&
          !isEndedBefore(s, e.date)
      )
      return !matchingScheduled
    })
    .map((e) => ({
      ...e,
      isScheduled: false,
    }))

  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

  const virtual: MergedExpense[] = scheduled
    .filter((s) => {
      if (!s.active) return false
      if (!s.createdAt) return true
      const created = new Date(s.createdAt)
      return isNaN(created.getTime()) || created <= monthEnd
    })
    .reduce<MergedExpense[]>((acc, s) => {
      const day = Math.min(s.dayOfMonth, lastDay)
      const date = `${year}-${pad(month + 1)}-${pad(day)}`
      if (s.pausedUntil && s.pausedUntil >= date) return acc
      if (isEndedBefore(s, date)) return acc
      acc.push({
        id: `scheduled-${s.id}-${date}`,
        name: s.name,
        amount: s.amount,
        currency: s.currency,
        originalAmount: s.originalAmount ?? null,
        category: s.category,
        date,
        paymentMethod: s.paymentMethod ?? null,
        note: s.note ?? null,
        isScheduled: true,
        scheduledId: s.id,
      })
      return acc
    }, [])

  return [...real, ...virtual].sort((a, b) => a.date.localeCompare(b.date))
}
