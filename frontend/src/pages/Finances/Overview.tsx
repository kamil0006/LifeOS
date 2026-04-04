import { useMemo } from 'react'
import { Card } from '../../components/Card'
import { MonthSelector } from '../../components/MonthSelector'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES } from '../../context/DemoDataContext'
import { mergeExpensesWithScheduled } from '../../lib/expensesUtils'
import { useMonth, inMonth } from '../../context/MonthContext'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'
import { OverviewSkeleton } from '../../components/skeletons'

const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']

export function Overview() {
  const { isDemoMode } = useAuth()
  const demoData = useDemoData()
  const monthCtx = useMonth()
  const {
    expenses: qExpenses,
    income: qIncome,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()

  const selectedMonth = monthCtx?.selectedMonth ?? new Date().getMonth()
  const selectedYear = monthCtx?.selectedYear ?? new Date().getFullYear()

  const effectiveExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const effectiveScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES) : qScheduled
  const effectiveIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome
  const loading = isDemoMode ? false : financeLoading

  const { currentTotal, previousTotal, changePercent } = useMemo(() => {
    const monthExp = effectiveExpenses.filter((e) => inMonth(e.date, selectedMonth, selectedYear))
    const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, selectedMonth, selectedYear)
    const monthInc = effectiveIncome.filter((i) => inMonth(i.date, selectedMonth, selectedYear))
    const currentExpenses = merged.reduce((s, e) => s + e.amount, 0)
    const currentIncome = monthInc.reduce((s, i) => s + i.amount, 0)
    const currentTotal = currentIncome - currentExpenses

    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
    const prevMonthExp = effectiveExpenses.filter((e) => inMonth(e.date, prevMonth, prevYear))
    const prevMerged = mergeExpensesWithScheduled(prevMonthExp, effectiveScheduled, prevMonth, prevYear)
    const prevMonthInc = effectiveIncome.filter((i) => inMonth(i.date, prevMonth, prevYear))
    const prevExpenses = prevMerged.reduce((s, e) => s + e.amount, 0)
    const prevIncome = prevMonthInc.reduce((s, i) => s + i.amount, 0)
    const previousTotal = prevIncome - prevExpenses

    const changePercent = previousTotal !== 0
      ? (((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100).toFixed(0)
      : currentTotal > 0 ? '100' : '0'

    return {
      currentTotal,
      previousTotal,
      changePercent: Number(changePercent),
    }
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear])

  const { expensesTotal, incomeTotal } = useMemo(() => {
    const monthExp = effectiveExpenses.filter((e) => inMonth(e.date, selectedMonth, selectedYear))
    const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, selectedMonth, selectedYear)
    const monthInc = effectiveIncome.filter((i) => inMonth(i.date, selectedMonth, selectedYear))
    return {
      expensesTotal: merged.reduce((s, e) => s + e.amount, 0),
      incomeTotal: monthInc.reduce((s, i) => s + i.amount, 0),
    }
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear])

  if (loading) {
    return <OverviewSkeleton />
  }

  const prevMonthName = monthNames[selectedMonth === 0 ? 11 : selectedMonth - 1]
  const currMonthName = monthNames[selectedMonth]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <MonthSelector />
      </div>

      {/* Monthly trend */}
      <Card className="border-(--accent-cyan)/20">
        <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase mb-3">Trend miesięczny</p>
        <div className="flex flex-wrap gap-6 items-baseline">
          <div>
            <p className="text-base text-(--text-muted)">{currMonthName}</p>
            <p className="text-2xl font-bold text-(--accent-cyan) font-gaming drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]">
              {currentTotal.toLocaleString('pl-PL')} zł
            </p>
          </div>
          <div>
            <p className="text-base text-(--text-muted)">{prevMonthName}</p>
            <p className="text-xl font-semibold text-(--text-primary)">
              {previousTotal.toLocaleString('pl-PL')} zł
            </p>
          </div>
          <div>
            <p className="text-base text-(--text-muted)">Zmiana</p>
            <p
              className={`text-xl font-semibold font-gaming ${
                changePercent >= 0 ? 'text-(--accent-green)' : 'text-[#e74c3c]'
              }`}
            >
              {changePercent >= 0 ? '+' : ''}{changePercent}%
            </p>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-(--accent-green)/20">
          <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Przychody</p>
          <p className="text-2xl font-bold text-(--accent-green) mt-1 font-gaming">
            {incomeTotal.toLocaleString('pl-PL')} zł
          </p>
        </Card>
        <Card className="border-(--accent-magenta)/20">
          <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Wydatki</p>
          <p className="text-2xl font-bold text-(--accent-magenta) mt-1 font-gaming">
            {expensesTotal.toLocaleString('pl-PL')} zł
          </p>
        </Card>
        <Card className={currentTotal >= 0 ? 'border-(--accent-cyan)/20' : 'border-[#e74c3c]/30'}>
          <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Bilans</p>
          <p
            className={`text-2xl font-bold mt-1 font-gaming ${
              currentTotal >= 0 ? 'text-(--accent-cyan)' : 'text-[#e74c3c]'
            }`}
          >
            {currentTotal >= 0 ? '+' : ''}{currentTotal.toLocaleString('pl-PL')} zł
          </p>
        </Card>
      </div>
    </div>
  )
}
