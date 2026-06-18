import type { PaymentMethod } from './paymentMethod'

export interface ExpenseLike {
  id: string
  name: string
  amount: number
  category: string
  date: string
  paymentMethod?: PaymentMethod | null
}

export interface ScheduledExpenseLike {
  id: string
  name: string
  amount: number
  category: string
  dayOfMonth: number
  active: boolean
  paymentMethod?: PaymentMethod | null
  pausedUntil?: string | null
}

export interface MergedExpense extends ExpenseLike {
  isScheduled?: boolean
  scheduledId?: string
}

/** Łączy wydatki z zaplanowanymi – generuje wirtualne wydatki na dany miesiąc.
 * Pomija z expenses te, które pokrywają się ze scheduled (ta sama nazwa, ten sam dzień miesiąca). */
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
        (s) => s.active && s.name.toLowerCase() === nameLower && s.dayOfMonth === day
      )
      return !matchingScheduled
    })
    .map((e) => ({
      ...e,
      isScheduled: false,
    }))

  const virtual: MergedExpense[] = scheduled
    .filter((s) => s.active)
    .reduce<MergedExpense[]>((acc, s) => {
      const day = Math.min(s.dayOfMonth, lastDay)
      const date = `${year}-${pad(month + 1)}-${pad(day)}`
      if (s.pausedUntil && s.pausedUntil >= date) return acc
      acc.push({
        id: `scheduled-${s.id}-${date}`,
        name: s.name,
        amount: s.amount,
        category: s.category,
        date,
        paymentMethod: s.paymentMethod ?? null,
        isScheduled: true,
        scheduledId: s.id,
      })
      return acc
    }, [])

  return [...real, ...virtual].sort((a, b) => a.date.localeCompare(b.date))
}
