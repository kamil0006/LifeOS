import { useMemo } from 'react'
import { Card } from '../components/Card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFinanceCategories } from '../context/FinanceCategoriesContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES } from '../context/DemoDataContext'
import { mergeExpensesWithScheduled } from '../lib/expensesUtils'
import { useMonth, parseDate, inMonth } from '../context/MonthContext'
import { useEvents } from '../context/EventsContext'
import { useTodos } from '../context/TodosContext'
import { useWishes } from '../context/WishesContext'
import { useHabits } from '../context/HabitsContext'
import { useNotes } from '../context/NotesContext'
import { MonthSelector } from '../components/MonthSelector'
import { ChartPeriodSelector } from '../components/ChartPeriodSelector'
import { useChartPeriod, getMonthsInQuarter } from '../context/ChartPeriodContext'
import { StickyNote, Calendar, GraduationCap, Target } from 'lucide-react'
import { useFinanceListsQuery } from '../hooks/useFinanceListsQuery'
import { DashboardSkeleton } from '../components/skeletons'
import { buildTransactionsDrilldownSearch } from '../lib/buildDrilldownSearch'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

function DonutTooltip(props: { active?: boolean; payload?: readonly unknown[]; total: number }) {
  const { active, payload, total } = props
  if (!active || !payload?.length) return null
  const item = payload[0] as { name?: string; value?: number; payload?: { kwota: number } } | undefined
  const kwota = item?.payload?.kwota ?? item?.value ?? 0
  const pct = total > 0 ? ((kwota / total) * 100).toFixed(0) : '0'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="rounded-lg border px-3 py-2 shadow-lg"
      style={{
        backgroundColor: '#0f0f18',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium text-base">{item?.name ?? ''}</p>
      <p className="text-sm text-(--accent-cyan)">
        {(item?.value ?? kwota ?? 0).toLocaleString('pl-PL')} zł ({pct}%)
      </p>
    </motion.div>
  )
}

function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${monthNames[m - 1]} ${y}`
}

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()

export function Dashboard() {
  const navigate = useNavigate()
  const { isDemoMode } = useAuth()
  const demoData = useDemoData()
  const financeCats = useFinanceCategories()
  const getCategoryColor = financeCats?.getColor ?? (() => '#9d4edd')
  const {
    expenses: qExpenses,
    income: qIncome,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()
  const monthCtx = useMonth()
  const todosCtx = useTodos()
  const wishesCtx = useWishes()
  const habitsCtx = useHabits()
  const notesCtx = useNotes()
  const todos = todosCtx?.todos ?? []
  const wishes = wishesCtx?.wishes ?? []
  const goals = habitsCtx?.goals ?? []
  const habits = habitsCtx?.habits ?? []
  const notesCount = notesCtx?.notes?.length ?? 0
  const todoCount = todosCtx?.loading ? 0 : todos.filter((t) => !t.done).length
  const wishesCount = wishesCtx?.loading ? 0 : wishes.length
  const selectedMonth = monthCtx?.selectedMonth ?? currentMonth
  const selectedYear = monthCtx?.selectedYear ?? currentYear
  const chartPeriod = useChartPeriod()
  const { events } = useEvents() ?? { events: [] }

  const effectiveExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const effectiveScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES) : qScheduled
  const effectiveIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome
  const loading = isDemoMode ? false : financeLoading

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

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
  }, [events])

  const todayStr = new Date().toISOString().split('T')[0]
  const habitsToday = useMemo(() => {
    const total = habits.length
    const done = habits.filter((h) => h.checkIns.some((c) => c.date === todayStr)).length
    return { done, total }
  }, [habits, todayStr])

  const handleCategoryPieClick = (data: unknown) => {
    const d = data as { kategoria?: string; name?: string; payload?: { kategoria?: string } }
    const kategoria = d.kategoria ?? d.payload?.kategoria ?? d.name
    if (!kategoria) return
    const qs = buildTransactionsDrilldownSearch(
      kategoria,
      chartPeriod,
      selectedMonth,
      selectedYear
    )
    navigate(`/finances/transactions?${qs}`)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-(--text-primary) font-gaming tracking-wider">
            DASHBOARD
          </h1>
          <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
            {isDemoMode ? 'Dane przykładowe' : 'Przegląd Twoich finansów i aktywności'}
          </p>
        </div>
        <MonthSelector />
      </motion.div>

      {/* KPI cards – HUD style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-(--accent-green)/20 hover:border-(--accent-green)/40 hover:shadow-[0_0_15px_rgba(0,255,157,0.08)]">
          <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Przychody ({kpiPeriodLabel})</p>
          <p className="text-2xl font-bold text-(--accent-green) mt-1 font-gaming drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]">
            {chartFilteredData.incomeTotal.toLocaleString('pl-PL')} zł
          </p>
        </Card>
        <Card className="border-(--accent-magenta)/20 hover:border-(--accent-magenta)/40 hover:shadow-[0_0_15px_rgba(255,0,212,0.08)]">
          <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Wydatki ({kpiPeriodLabel})</p>
          <p className="text-2xl font-bold text-(--accent-magenta) mt-1 font-gaming drop-shadow-[0_0_8px_rgba(255,0,212,0.3)]">
            {chartFilteredData.expensesTotal.toLocaleString('pl-PL')} zł
          </p>
        </Card>
        <Card className={chartFilteredData.balance >= 0 ? 'border-(--accent-cyan)/20 hover:border-(--accent-cyan)/40' : 'border-[#e74c3c]/30 hover:border-[#e74c3c]/50'}>
          <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Bilans ({kpiPeriodLabel})</p>
          <p className={`text-2xl font-bold mt-1 font-gaming ${chartFilteredData.balance >= 0 ? 'text-(--accent-cyan) drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]' : 'text-[#e74c3c] drop-shadow-[0_0_8px_rgba(231,76,60,0.3)]'}`}>
            {chartFilteredData.balance >= 0 ? '+' : ''}{chartFilteredData.balance.toLocaleString('pl-PL')} zł
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card
          title="Wydatki vs Przychody"
          action={chartPeriod ? <ChartPeriodSelector /> : undefined}
        >
          <div className="h-60 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWydatki" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff00d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff00d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPrzychody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${v} zł`} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => [value != null ? `${value} zł` : '', '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="wydatki"
                  stroke="#ff00d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorWydatki)"
                  name="Wydatki"
                />
                <Area
                  type="monotone"
                  dataKey="przychody"
                  stroke="#00ff9d"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrzychody)"
                  name="Przychody"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card
          title={`Wydatki po kategoriach (${
            chartPeriod?.period.type === 'quarter'
              ? `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}`
              : chartPeriod?.period.type === 'year'
                ? chartPeriod.period.year
                : chartPeriod?.period.type === 'month'
                  ? `${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year}`
                  : `${monthNames[selectedMonth]} ${selectedYear}`
          })`}
          action={chartPeriod ? <ChartPeriodSelector /> : undefined}
        >
          <p className="text-sm text-(--text-muted) mb-3 font-gaming tracking-wide">
            Kliknij segment kategorii, aby zobaczyć transakcje w tym okresie.
          </p>
          <div className="h-60 w-full min-h-[200px] relative">
            {chartFilteredData.categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                  <Pie
                    data={chartFilteredData.categoryData}
                    dataKey="kwota"
                    nameKey="kategoria"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={handleCategoryPieClick}
                  >
                    {chartFilteredData.categoryData.map((entry) => (
                      <Cell key={entry.kategoria} fill={getCategoryColor(entry.kategoria)} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => (
                      <DonutTooltip active={active} payload={payload} total={chartFilteredData.expensesTotal} />
                    )}
                    offset={70}
                    cursor={{ fill: 'rgba(0,229,255,0.06)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: '8px' }}
                    formatter={(value) => (
                      <span className="text-(--text-primary) text-sm font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center w-24">
                    <p className="text-lg font-bold text-(--accent-cyan) font-gaming drop-shadow-[0_0_8px_rgba(0,229,255,0.3)] leading-tight">
                      {chartFilteredData.expensesTotal.toLocaleString('pl-PL')} zł
                    </p>
                    <p className="text-xs text-(--text-muted) font-gaming mt-0.5">łącznie</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-base text-(--text-muted)">
                {emptyCategoryMessage}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Nadchodzące wydarzenia + Quick stats – rozszerzony grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
        <Card title="Nadchodzące wydarzenia" className="border-(--accent-cyan)/20 p-3 flex flex-col h-full">
          <div className="flex-1 min-h-0">
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-1.5">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ev.color ?? 'var(--accent-cyan)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/calendar"
                        className="text-sm text-(--text-primary) hover:text-(--accent-cyan) transition-colors truncate block outline-none focus:outline-none"
                      >
                        {ev.title}
                      </Link>
                      <p className="text-xs text-(--text-muted) font-mono">
                        {formatEventDate(ev.date)} {ev.time && `• ${ev.time}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-(--text-muted) text-sm">Brak nadchodzących wydarzeń</p>
            )}
          </div>
          <Link
            to="/calendar"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz kalendarz →
          </Link>
        </Card>
        <Card title="Do zrobienia" className="border-(--accent-amber)/20 p-3 flex flex-col h-full">
          <div className="flex-1 min-h-0">
            <p className="text-2xl font-bold text-(--accent-amber) font-gaming drop-shadow-[0_0_10px_rgba(255,184,0,0.3)]">{todoCount}</p>
            <p className="text-sm text-(--text-muted) mt-1">
              aktywnych zadań
            </p>
          </div>
          <Link
            to="/todo"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz To-do →
          </Link>
        </Card>
        <Card title="Zachcianki w kolejce" className="border-(--accent-magenta)/20 p-3 flex flex-col h-full">
          <div className="flex-1 min-h-0">
            <p className="text-2xl font-bold text-(--accent-magenta) font-gaming drop-shadow-[0_0_10px_rgba(255,0,212,0.3)]">{wishesCount}</p>
            <p className="text-sm text-(--text-muted) mt-1">
              rzeczy na liście
            </p>
          </div>
          <Link
            to="/finances/wishes"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz zachcianki →
          </Link>
        </Card>
        <Card title="Aktywne cele" className="border-(--accent-cyan)/20 p-3 flex flex-col h-full">
          <div className="flex-1 min-h-0">
            {goals.length > 0 ? (
              <div className="space-y-2">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, (g.current / g.target) * 100)
                  return (
                    <div key={g.id} className="space-y-1">
                      <p className="text-sm text-(--text-primary) truncate font-medium">{g.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-(--bg-card) overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-(--accent-cyan) to-(--accent-green) transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-(--text-muted) shrink-0 font-mono">
                          {g.current}/{g.target} {g.unit ?? ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-(--text-muted) text-sm">Brak aktywnych celów</p>
            )}
          </div>
          <Link
            to="/habits"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            {goals.length > 0 ? 'Zobacz cele →' : 'Dodaj cel →'}
          </Link>
        </Card>
        <Card title="Nawyki dziś" className="border-(--accent-green)/20 p-3 flex flex-col h-full">
          <div className="flex-1 min-h-0">
            {habitsToday.total > 0 ? (
              <>
                <p className="text-2xl font-bold text-(--accent-green) font-gaming drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">
                  {habitsToday.done}/{habitsToday.total}
                </p>
                <p className="text-sm text-(--text-muted) mt-1">
                  odznaczonych dziś
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-(--bg-dark) overflow-hidden">
                  <div
                    className="h-full rounded-full bg-(--accent-green) transition-all"
                    style={{ width: `${habitsToday.total > 0 ? (habitsToday.done / habitsToday.total) * 100 : 0}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-(--text-muted) text-sm">Brak nawyków</p>
            )}
          </div>
          <Link
            to="/habits"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz nawyki →
          </Link>
        </Card>
      </div>

      {/* Szybkie linki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Link
          to="/notes"
          className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <StickyNote className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Notatki</p>
          <p className="text-sm text-(--text-muted) mt-0.5">{notesCount} notatek</p>
        </Link>
        <Link
          to="/calendar"
          className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <Calendar className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Kalendarz</p>
          <p className="text-sm text-(--text-muted) mt-0.5">Wydarzenia</p>
        </Link>
        <Link
          to="/nauka"
          className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <GraduationCap className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Nauka</p>
          <p className="text-sm text-(--text-muted) mt-0.5">Kursy, projekty</p>
        </Link>
        <Link
          to="/habits"
          className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <Target className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Nawyki</p>
          <p className="text-sm text-(--text-muted) mt-0.5">{habits.length} nawyków</p>
        </Link>
      </div>
    </div>
  )
}
