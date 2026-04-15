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
import { motion, useReducedMotion } from 'framer-motion'
import { dashboardContainerVariants, getDashboardTileVariants } from '../lib/dashboardMotion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFinanceCategories } from '../context/FinanceCategoriesContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES } from '../context/DemoDataContext'
import { useMonth } from '../context/MonthContext'
import { useEvents } from '../context/EventsContext'
import { useTodos } from '../context/TodosContext'
import { useWishes } from '../context/WishesContext'
import { useHabits } from '../context/HabitsContext'
import { useNotes } from '../context/NotesContext'
import { MonthSelector } from '../components/MonthSelector'
import { ChartPeriodSelector } from '../components/ChartPeriodSelector'
import { useChartPeriod } from '../context/ChartPeriodContext'
import { useFinanceListsQuery } from '../hooks/useFinanceListsQuery'
import { useDashboardFinance } from '../hooks/useDashboardFinance'
import { DashboardSkeleton } from '../components/skeletons'
import { buildTransactionsDrilldownSearch } from '../lib/buildDrilldownSearch'
import { DashboardQuickStats } from '../components/dashboard/DashboardQuickStats'
import { DashboardQuickLinks } from '../components/dashboard/DashboardQuickLinks'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

/** Jedna wysokość obszaru wykresu obok siebie (area vs donut). */
const DASHBOARD_CHART_PX = 280

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

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()

export function Dashboard() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { isDemoMode } = useAuth()
  const demoData = useDemoData()
  const { getColor: getCategoryColor } = useFinanceCategories()
  const {
    expenses: qExpenses,
    income: qIncome,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()
  const monthCtx = useMonth()
  const { todos, loading: todosLoading } = useTodos()
  const { wishes, loading: wishesLoading } = useWishes()
  const { habits, goals } = useHabits()
  const notesCtx = useNotes()

  const notesCount = notesCtx?.notes?.length ?? 0
  const todoCount = todosLoading ? 0 : todos.filter((t) => !t.done).length
  const wishesCount = wishesLoading ? 0 : wishes.length
  const selectedMonth = monthCtx?.selectedMonth ?? currentMonth
  const selectedYear = monthCtx?.selectedYear ?? currentYear
  const chartPeriod = useChartPeriod()
  const { events } = useEvents()

  const effectiveExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const effectiveScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES) : qScheduled
  const effectiveIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome
  const loading = isDemoMode ? false : financeLoading

  const { chartFilteredData, kpiPeriodLabel, emptyCategoryMessage, chartData } = useDashboardFinance(
    effectiveExpenses,
    effectiveScheduled,
    effectiveIncome,
    selectedMonth,
    selectedYear,
    chartPeriod
  )

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
    <motion.div
      className="space-y-10"
      variants={dashboardContainerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={getDashboardTileVariants(reduceMotion, 0)}
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

      {/* KPI cards – każdy kafel z innej strony */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={getDashboardTileVariants(reduceMotion, 1)} className="min-w-0">
          <Card
            animateEntrance={false}
            className="border-(--accent-green)/20 hover:border-(--accent-green)/40 hover:shadow-[0_0_15px_rgba(0,255,157,0.08)]"
          >
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Przychody ({kpiPeriodLabel})</p>
            <p className="text-2xl font-bold text-(--accent-green) mt-1 font-gaming drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]">
              {chartFilteredData.incomeTotal.toLocaleString('pl-PL')} zł
            </p>
          </Card>
        </motion.div>
        <motion.div variants={getDashboardTileVariants(reduceMotion, 2)} className="min-w-0">
          <Card
            animateEntrance={false}
            className="border-(--accent-magenta)/20 hover:border-(--accent-magenta)/40 hover:shadow-[0_0_15px_rgba(255,0,212,0.08)]"
          >
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Wydatki ({kpiPeriodLabel})</p>
            <p className="text-2xl font-bold text-(--accent-magenta) mt-1 font-gaming drop-shadow-[0_0_8px_rgba(255,0,212,0.3)]">
              {chartFilteredData.expensesTotal.toLocaleString('pl-PL')} zł
            </p>
          </Card>
        </motion.div>
        <motion.div variants={getDashboardTileVariants(reduceMotion, 3)} className="min-w-0">
          <Card
            animateEntrance={false}
            className={
              chartFilteredData.balance >= 0
                ? 'border-(--accent-cyan)/20 hover:border-(--accent-cyan)/40'
                : 'border-[#e74c3c]/30 hover:border-[#e74c3c]/50'
            }
          >
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Bilans ({kpiPeriodLabel})</p>
            <p
              className={`text-2xl font-bold mt-1 font-gaming ${
                chartFilteredData.balance >= 0
                  ? 'text-(--accent-cyan) drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                  : 'text-[#e74c3c] drop-shadow-[0_0_8px_rgba(231,76,60,0.3)]'
              }`}
            >
              {chartFilteredData.balance >= 0 ? '+' : ''}
              {chartFilteredData.balance.toLocaleString('pl-PL')} zł
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
        <motion.div variants={getDashboardTileVariants(reduceMotion, 4)} className="min-w-0 flex">
          <Card
            animateEntrance={false}
            className="flex h-full min-h-0 w-full flex-col"
            title="Wydatki vs Przychody"
            action={chartPeriod ? <ChartPeriodSelector /> : undefined}
          >
          <div className="flex min-h-0 w-full flex-1 flex-col justify-end">
            <div className="w-full shrink-0" style={{ height: DASHBOARD_CHART_PX }}>
            <ResponsiveContainer width="100%" height={DASHBOARD_CHART_PX}>
              <AreaChart
                data={chartData}
                margin={{ top: 6, right: 8, bottom: 10, left: 4 }}
              >
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
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: 0 }}
                />
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
          </div>
        </Card>
        </motion.div>
        <motion.div variants={getDashboardTileVariants(reduceMotion, 5)} className="min-w-0 flex">
          <Card
            animateEntrance={false}
            className="flex h-full min-h-0 w-full flex-col"
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
          <p className="mb-3 shrink-0 text-sm text-(--text-muted) font-gaming tracking-wide">
            Kliknij segment kategorii, aby zobaczyć transakcje w tym okresie.
          </p>
          <div className="relative w-full shrink-0" style={{ height: DASHBOARD_CHART_PX }}>
            {chartFilteredData.categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={DASHBOARD_CHART_PX}>
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
        </motion.div>
      </div>

      {/* Nadchodzące wydarzenia + Quick stats – rozszerzony grid */}
      <DashboardQuickStats
        upcomingEvents={upcomingEvents}
        todoCount={todoCount}
        wishesCount={wishesCount}
        goals={goals}
        habitsToday={habitsToday}
        reduceMotion={reduceMotion}
      />

      {/* Szybkie linki */}
      <DashboardQuickLinks notesCount={notesCount} habitsCount={habits.length} reduceMotion={reduceMotion} />
    </motion.div>
  )
}
