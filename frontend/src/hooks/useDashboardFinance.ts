import { useMemo } from 'react'
import { mergeExpensesWithScheduled, type ExpenseLike, type ScheduledExpenseLike } from '../lib/expensesUtils'
import { parseDate, inMonth } from '../context/MonthContext'
import { getMonthsInQuarter, type ChartPeriod } from '../context/ChartPeriodContext'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

type IncomeLike = { date: string; amount: number }

export function useDashboardFinance(
  effectiveExpenses: ExpenseLike[],
  effectiveScheduled: ScheduledExpenseLike[],
  effectiveIncome: IncomeLike[],
  selectedMonth: number,
  selectedYear: number,
  chartPeriod: { period: ChartPeriod } | null
) {
  const filteredData = useMemo(() => {
    const monthExpenses = effectiveExpenses.filter((e) => inMonth(e.date, selectedMonth, selectedYear))
    const mergedExpenses = mergeExpensesWithScheduled(monthExpenses, effectiveScheduled, selectedMonth, selectedYear)
    const monthIncome = effectiveIncome.filter((i) => inMonth(i.date, selectedMonth, selectedYear))
    const expensesTotal = mergedExpenses.reduce((s, e) => s + e.amount, 0)
    const incomeTotal = monthIncome.reduce((s, i) => s + i.amount, 0)
    const byCategory: Record<string, number> = {}
    mergedExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    })
    const categoryData = Object.entries(byCategory).map(([kategoria, kwota]) => ({ kategoria, kwota }))
    return {
      expensesTotal,
      incomeTotal,
      balance: incomeTotal - expensesTotal,
      categoryData,
    }
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear])

  const chartFilteredData = useMemo(() => {
    if (!chartPeriod) return filteredData
    if (chartPeriod.period.type === 'year') {
      const y = chartPeriod.period.year
      const byCategory: Record<string, number> = {}
      let expensesTotal = 0
      let incomeTotal = 0
      for (let m = 0; m < 12; m++) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
        merged.forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
        })
        expensesTotal += merged.reduce((s, e) => s + e.amount, 0)
        incomeTotal += effectiveIncome
          .filter((i) => {
            const { year: iy, month: im } = parseDate(i.date)
            return im === m && iy === y
          })
          .reduce((s, i) => s + i.amount, 0)
      }
      const categoryData = Object.entries(byCategory).map(([kategoria, kwota]) => ({ kategoria, kwota }))
      return { ...filteredData, categoryData, expensesTotal, incomeTotal, balance: incomeTotal - expensesTotal }
    }
    if (chartPeriod.period.type === 'quarter') {
      const { quarter, year } = chartPeriod.period
      const months = getMonthsInQuarter(quarter, year)
      const byCategory: Record<string, number> = {}
      let expensesTotal = 0
      let incomeTotal = 0
      for (const { month: m, year: y } of months) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
        merged.forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
        })
        expensesTotal += merged.reduce((s, e) => s + e.amount, 0)
        incomeTotal += effectiveIncome
          .filter((i) => {
            const { year: iy, month: im } = parseDate(i.date)
            return im === m && iy === y
          })
          .reduce((s, i) => s + i.amount, 0)
      }
      const categoryData = Object.entries(byCategory).map(([kategoria, kwota]) => ({ kategoria, kwota }))
      return { ...filteredData, categoryData, expensesTotal, incomeTotal, balance: incomeTotal - expensesTotal }
    }
    const m = chartPeriod.period.month
    const y = chartPeriod.period.year
    const monthExp = effectiveExpenses.filter((e) => inMonth(e.date, m, y))
    const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
    const monthInc = effectiveIncome.filter((i) => inMonth(i.date, m, y))
    const byCategory: Record<string, number> = {}
    merged.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    })
    const categoryData = Object.entries(byCategory).map(([kategoria, kwota]) => ({ kategoria, kwota }))
    const expensesTotal = merged.reduce((s, e) => s + e.amount, 0)
    const incomeTotal = monthInc.reduce((s, i) => s + i.amount, 0)
    return { ...filteredData, categoryData, expensesTotal, incomeTotal, balance: incomeTotal - expensesTotal }
  }, [chartPeriod, filteredData, effectiveExpenses, effectiveScheduled, effectiveIncome])

  const kpiPeriodLabel = useMemo(() => {
    if (!chartPeriod) return `${monthNames[selectedMonth]} ${selectedYear}`
    if (chartPeriod.period.type === 'year') return String(chartPeriod.period.year)
    if (chartPeriod.period.type === 'quarter') return `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}`
    return `${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year}`
  }, [chartPeriod, selectedMonth, selectedYear])

  const emptyCategoryMessage = useMemo(() => {
    if (!chartPeriod) return 'Brak wydatków w tym miesiącu'
    if (chartPeriod.period.type === 'year') return `Brak wydatków w roku ${chartPeriod.period.year}`
    if (chartPeriod.period.type === 'quarter') {
      return `Brak wydatków w Q${chartPeriod.period.quarter} ${chartPeriod.period.year}`
    }
    return `Brak wydatków w ${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year}`
  }, [chartPeriod])

  const chartData = useMemo(() => {
    const chart: { label: string; wydatki: number; przychody: number }[] = []
    if (chartPeriod?.period.type === 'quarter') {
      const { quarter, year } = chartPeriod.period
      const months = getMonthsInQuarter(quarter, year)
      for (const { month: m, year: y } of months) {
        const monthExpenses = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExpenses, effectiveScheduled, m, y)
        const wydatki = merged.reduce((s, e) => s + e.amount, 0)
        const przychody = effectiveIncome
          .filter((i) => {
            const { year: iy, month: im } = parseDate(i.date)
            return im === m && iy === y
          })
          .reduce((s, i) => s + i.amount, 0)
        chart.push({ label: `${monthNames[m]} ${y}`, wydatki, przychody })
      }
    } else if (chartPeriod?.period.type === 'month') {
      const m = chartPeriod.period.month
      const y = chartPeriod.period.year
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const monthExpenses = effectiveExpenses.filter((e) => {
        const { year: ey, month: em } = parseDate(e.date)
        return em === m && ey === y
      })
      const merged = mergeExpensesWithScheduled(monthExpenses, effectiveScheduled, m, y)
      const monthIncome = effectiveIncome.filter((i) => {
        const { year: iy, month: im } = parseDate(i.date)
        return im === m && iy === y
      })
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const wydatki = merged.filter((e) => e.date === dayStr).reduce((s, e) => s + e.amount, 0)
        const przychody = monthIncome.filter((i) => i.date === dayStr).reduce((s, i) => s + i.amount, 0)
        chart.push({ label: String(d), wydatki, przychody })
      }
    } else if (chartPeriod?.period.type === 'year') {
      const y = chartPeriod.period.year
      for (let m = 0; m < 12; m++) {
        const monthExpenses = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExpenses, effectiveScheduled, m, y)
        const wydatki = merged.reduce((s, e) => s + e.amount, 0)
        const przychody = effectiveIncome
          .filter((i) => {
            const { year: iy, month: im } = parseDate(i.date)
            return im === m && iy === y
          })
          .reduce((s, i) => s + i.amount, 0)
        chart.push({ label: monthNames[m], wydatki, przychody })
      }
    } else {
      const baseMonth = selectedMonth
      const baseYear = selectedYear
      for (let i = 4; i >= 0; i--) {
        const d = new Date(baseYear, baseMonth - i, 1)
        const mo = d.getMonth()
        const yr = d.getFullYear()
        const monthExpenses = effectiveExpenses.filter((e) => {
          const { year, month } = parseDate(e.date)
          return month === mo && year === yr
        })
        const merged = mergeExpensesWithScheduled(monthExpenses, effectiveScheduled, mo, yr)
        const wydatki = merged.reduce((s, e) => s + e.amount, 0)
        const przychody = effectiveIncome
          .filter((i) => {
            const { year, month } = parseDate(i.date)
            return month === mo && year === yr
          })
          .reduce((s, i) => s + i.amount, 0)
        chart.push({ label: `${monthNames[mo]} ${yr}`, wydatki, przychody })
      }
    }
    return chart
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear, chartPeriod])

  return {
    filteredData,
    chartFilteredData,
    kpiPeriodLabel,
    emptyCategoryMessage,
    chartData,
  }
}
