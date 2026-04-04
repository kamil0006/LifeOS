import { useState, useEffect, useMemo } from 'react'
import { Card } from '../../components/Card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { PiggyBank, TrendingUp, Wallet, Banknote, CreditCard, BarChart3, Pencil, Undo2 } from 'lucide-react'
import { MonthSelector } from '../../components/MonthSelector'
import { ChartPeriodSelector } from '../../components/ChartPeriodSelector'
import { useChartPeriod, getMonthsInQuarter } from '../../context/ChartPeriodContext'
import { NetWorthAdjustModal } from '../../components/NetWorthAdjustModal'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES, DEMO_NET_WORTH } from '../../context/DemoDataContext'
import type { NetWorthPositionKey } from '../../context/DemoDataContext'
import { mergeExpensesWithScheduled } from '../../lib/expensesUtils'
import { useMonth, parseDate, inMonth } from '../../context/MonthContext'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'
import { NetWorthPageSkeleton } from '../../components/skeletons'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

const POSITION_CONFIG: { key: NetWorthPositionKey; label: string; icon: typeof Banknote; desc: string; borderClass: string; iconClass: string }[] = [
  { key: 'cash', label: 'Gotówka', icon: Banknote, desc: 'W portfelu', borderClass: 'border-(--accent-green)/20', iconClass: 'text-(--accent-green)' },
  { key: 'bankAccount', label: 'Konto bankowe', icon: CreditCard, desc: 'Karta, konto', borderClass: 'border-(--accent-cyan)/20', iconClass: 'text-(--accent-cyan)' },
  { key: 'assets', label: 'Aktywa', icon: BarChart3, desc: 'Inwestycje, nieruchomości', borderClass: 'border-(--accent-magenta)/20', iconClass: 'text-(--accent-magenta)' },
]

export function FinancesNetWorth() {
  const { isDemoMode } = useAuth()
  const demoData = useDemoData()
  const monthCtx = useMonth()
  const {
    expenses: qExpenses,
    income: qIncome,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<NetWorthPositionKey | null>(null)
  const [undoInfo, setUndoInfo] = useState<{ position: NetWorthPositionKey; delta: number } | null>(null)

  const selectedMonth = monthCtx?.selectedMonth ?? new Date().getMonth()
  const selectedYear = monthCtx?.selectedYear ?? new Date().getFullYear()
  const chartPeriod = useChartPeriod()

  const effectiveExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const effectiveScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES) : qScheduled
  const effectiveIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome
  const loading = isDemoMode ? false : financeLoading
  const netWorthPositions = demoData?.netWorth ?? DEMO_NET_WORTH

  const { cumulativeSavings, trendData, currentIncome, currentExpenses, savingsRate } = useMemo(() => {
    let cumulative = 0
    const trend: { label: string; wartość: number; bilans: number }[] = []

    if (chartPeriod?.period.type === 'quarter') {
      const { quarter, year } = chartPeriod.period
      const months = getMonthsInQuarter(quarter, year)
      for (const { month: m, year: y } of months) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
        const wydatki = merged.reduce((s, e) => s + e.amount, 0)
        const przychody = effectiveIncome
          .filter((i) => {
            const { year: iy, month: im } = parseDate(i.date)
            return im === m && iy === y
          })
          .reduce((s, i) => s + i.amount, 0)
        const bilans = przychody - wydatki
        cumulative += bilans
        trend.push({ label: `${monthNames[m]} ${y}`, wartość: cumulative, bilans })
      }
    } else if (chartPeriod?.period.type === 'year') {
      const y = chartPeriod.period.year
      for (let m = 0; m < 12; m++) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
        const wydatki = merged.reduce((s, e) => s + e.amount, 0)
        const przychody = effectiveIncome
          .filter((i) => {
            const { year: iy, month: im } = parseDate(i.date)
            return im === m && iy === y
          })
          .reduce((s, i) => s + i.amount, 0)
        const bilans = przychody - wydatki
        cumulative += bilans
        trend.push({ label: monthNames[m], wartość: cumulative, bilans })
      }
    } else if (chartPeriod?.period.type === 'month') {
      const m = chartPeriod.period.month
      const y = chartPeriod.period.year
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const monthExp = effectiveExpenses.filter((e) => {
        const { year: ey, month: em } = parseDate(e.date)
        return em === m && ey === y
      })
      const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
      const monthIncome = effectiveIncome.filter((i) => {
        const { year: iy, month: im } = parseDate(i.date)
        return im === m && iy === y
      })
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const wydatki = merged.filter((e) => e.date === dayStr).reduce((s, e) => s + e.amount, 0)
        const przychody = monthIncome.filter((i) => i.date === dayStr).reduce((s, i) => s + i.amount, 0)
        const bilans = przychody - wydatki
        cumulative += bilans
        trend.push({ label: String(d), wartość: cumulative, bilans })
      }
    } else {
      const baseMonth = selectedMonth
      const baseYear = selectedYear
      for (let i = 4; i >= 0; i--) {
        const d = new Date(baseYear, baseMonth - i, 1)
        const mo = d.getMonth()
        const yr = d.getFullYear()
        const monthExp = effectiveExpenses.filter((e) => {
          const { year, month } = parseDate(e.date)
          return month === mo && year === yr
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, mo, yr)
        const wydatki = merged.reduce((s, e) => s + e.amount, 0)
        const przychody = effectiveIncome
          .filter((i) => {
            const { year, month } = parseDate(i.date)
            return month === mo && year === yr
          })
          .reduce((s, i) => s + i.amount, 0)
        const bilans = przychody - wydatki
        cumulative += bilans
        trend.push({ label: `${monthNames[mo]} ${yr}`, wartość: cumulative, bilans })
      }
    }

    const monthExp = effectiveExpenses.filter((e) => inMonth(e.date, selectedMonth, selectedYear))
    const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, selectedMonth, selectedYear)
    const monthInc = effectiveIncome.filter((i) => inMonth(i.date, selectedMonth, selectedYear))
    const inc = monthInc.reduce((s, i) => s + i.amount, 0)
    const exp = merged.reduce((s, e) => s + e.amount, 0)
    const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0
    return {
      cumulativeSavings: cumulative,
      trendData: trend,
      currentIncome: inc,
      currentExpenses: exp,
      savingsRate: rate,
    }
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear, chartPeriod])

  const totalNetWorth =
    cumulativeSavings +
    (netWorthPositions.cash ?? 0) +
    (netWorthPositions.bankAccount ?? 0) +
    (netWorthPositions.assets ?? 0)

  const cumulativePeriodLabel = useMemo(() => {
    if (!chartPeriod) return `${monthNames[selectedMonth]} ${selectedYear}`
    if (chartPeriod.period.type === 'year') return `rok ${chartPeriod.period.year}`
    if (chartPeriod.period.type === 'quarter') return `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}`
    return `${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year}`
  }, [chartPeriod, selectedMonth, selectedYear])

  const handleAdjust = (position: NetWorthPositionKey) => {
    setAdjustTarget(position)
    setAdjustModalOpen(true)
  }

  const handleAdjustSubmit = (position: NetWorthPositionKey, amount: number, isAdd: boolean) => {
    const delta = isAdd ? amount : -amount
    demoData?.updateNetWorthPosition(position, delta)
    setAdjustModalOpen(false)
    setAdjustTarget(null)
    setUndoInfo({ position, delta })
  }

  const handleUndo = () => {
    if (!undoInfo) return
    demoData?.updateNetWorthPosition(undoInfo.position, -undoInfo.delta)
    setUndoInfo(null)
  }

  useEffect(() => {
    if (!undoInfo) return
    const t = setTimeout(() => setUndoInfo(null), 6000)
    return () => clearTimeout(t)
  }, [undoInfo])

  if (loading) {
    return <NetWorthPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthSelector />
        {chartPeriod && <ChartPeriodSelector />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-(--text-primary) font-gaming tracking-wider">Wartość netto</h3>
        <p className="text-base text-(--text-muted) mt-1">
          Oszczędności, gotówka, konto, aktywa – korekta przy pomyłce
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-(--accent-cyan)/20">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-(--accent-cyan)" />
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Oszczędności</p>
          </div>
          <p className="text-2xl font-bold text-(--accent-cyan) mt-1 font-gaming">
            {cumulativeSavings.toLocaleString('pl-PL')} zł
          </p>
          <p className="text-sm text-(--text-muted) mt-0.5">Bilans skumulowany ({cumulativePeriodLabel})</p>
        </Card>

        {POSITION_CONFIG.map(({ key, label, icon: Icon, desc, borderClass, iconClass }) => (
          <Card key={key} className={`${borderClass} group relative`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${iconClass}`} />
                <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">{label}</p>
              </div>
              <button
                onClick={() => handleAdjust(key)}
                className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--bg-card-hover) transition-colors"
                title="Korekta – dodaj lub odejmij"
                aria-label="Korekta"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-2xl font-bold mt-1 font-gaming ${iconClass}`}>
              {(netWorthPositions[key] ?? 0).toLocaleString('pl-PL')} zł
            </p>
            <p className="text-sm text-(--text-muted) mt-0.5">{desc}</p>
          </Card>
        ))}

        <Card className="border-(--accent-amber)/20">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-(--accent-amber)" />
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Wartość netto</p>
          </div>
          <p
            className={`text-2xl font-bold mt-1 font-gaming ${
              totalNetWorth >= 0 ? 'text-(--accent-cyan)' : 'text-[#e74c3c]'
            }`}
          >
            {totalNetWorth.toLocaleString('pl-PL')} zł
          </p>
          <p className="text-sm text-(--text-muted) mt-0.5">Suma wszystkich pozycji</p>
        </Card>
      </div>

      <Card title="Wskaźnik oszczędności">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-(--accent-green)" />
          <p className="text-base text-(--text-muted)">{monthNames[selectedMonth]} {selectedYear}</p>
        </div>
        <p className="text-2xl font-bold text-(--accent-green) mt-1 font-gaming">
          {savingsRate >= 0 ? savingsRate.toFixed(0) : 0}%
        </p>
        <p className="text-sm text-(--text-muted) mt-0.5">
          {(currentIncome - currentExpenses).toLocaleString('pl-PL')} zł z {currentIncome.toLocaleString('pl-PL')} zł przychodów
        </p>
      </Card>

      <Card title={`Trend wartości netto (${
        chartPeriod?.period.type === 'quarter'
          ? `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}`
          : chartPeriod?.period.type === 'year'
            ? chartPeriod.period.year
            : chartPeriod?.period.type === 'month'
              ? `${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year}`
              : selectedYear
      })`}>
        <p className="text-sm text-(--text-muted) mb-2">
          {chartPeriod?.period.type === 'month' ? 'Skumulowany bilans dzienny' : chartPeriod?.period.type === 'year' ? 'Skumulowany bilans miesięczny (cały rok)' : 'Skumulowany bilans miesięczny'}
        </p>
        <div className="h-60 w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorWartosc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${v} zł`} />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                formatter={(value: number | undefined, _name, item) => {
                  const payload = (item as { payload?: { bilans?: number } } | undefined)?.payload
                  const bilans = payload?.bilans
                  const suffix =
                    bilans != null
                      ? ` (w tym okresie: ${bilans >= 0 ? '+' : ''}${bilans.toLocaleString('pl-PL')} zł)`
                      : ''
                  return [value != null ? `${value.toLocaleString('pl-PL')} zł${suffix}` : '', 'Skumulowany bilans']
                }}
              />
              <Area
                type="monotone"
                dataKey="wartość"
                stroke="#00e5ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorWartosc)"
                name="Skumulowany bilans"
                baseValue={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <NetWorthAdjustModal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false)
          setAdjustTarget(null)
        }}
        onSubmit={handleAdjustSubmit}
        initialPosition={adjustTarget ?? undefined}
        currentValue={adjustTarget ? (netWorthPositions[adjustTarget] ?? 0) : 0}
      />

      <AnimatePresence>
        {undoInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 px-4 py-2 rounded-lg border border-(--border) bg-(--bg-card) shadow-xl"
          >
            <span className="text-sm text-(--text-primary)">Zastosowano</span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) font-gaming text-sm hover:bg-(--accent-cyan)/30 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Cofnij
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
