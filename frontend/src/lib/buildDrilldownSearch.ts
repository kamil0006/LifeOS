import type { ChartPeriod } from '../context/ChartPeriodContext'
import { getMonthsInQuarter } from '../context/ChartPeriodContext'

/** Query string dla `/finances/transactions` — drill z dashboardu (wykres kategorii). */
export function buildTransactionsDrilldownSearch(
  category: string,
  chartPeriod: { period: ChartPeriod } | null,
  selectedMonth: number,
  selectedYear: number
): string {
  const params = new URLSearchParams()
  params.set('category', category)

  if (!chartPeriod) {
    params.set('month', String(selectedMonth))
    params.set('year', String(selectedYear))
    return params.toString()
  }

  const p = chartPeriod.period
  if (p.type === 'month') {
    params.set('month', String(p.month))
    params.set('year', String(p.year))
    return params.toString()
  }
  if (p.type === 'quarter') {
    const months = getMonthsInQuarter(p.quarter, p.year)
    const first = months[0]
    const last = months[months.length - 1]
    const lastDay = new Date(last.year, last.month + 1, 0).getDate()
    const pad = (n: number) => String(n).padStart(2, '0')
    params.set('from', `${first.year}-${pad(first.month + 1)}-01`)
    params.set('to', `${last.year}-${pad(last.month + 1)}-${pad(lastDay)}`)
    return params.toString()
  }
  params.set('from', `${p.year}-01-01`)
  params.set('to', `${p.year}-12-31`)
  return params.toString()
}
