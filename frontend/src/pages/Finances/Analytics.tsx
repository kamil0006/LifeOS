import { useMemo } from 'react'
import { Card } from '../../components/Card'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts'
import { MonthSelector } from '../../components/MonthSelector'
import { ChartPeriodSelector } from '../../components/ChartPeriodSelector'
import { useChartPeriod, getMonthsInQuarter } from '../../context/ChartPeriodContext'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES } from '../../context/DemoDataContext'
import { mergeExpensesWithScheduled, type MergedExpense } from '../../lib/expensesUtils'
import { useMonth, parseDate } from '../../context/MonthContext'
import { useFinanceCategories } from '../../context/FinanceCategoriesContext'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

function DonutTooltip(props: { active?: boolean; payload?: readonly unknown[]; total: number }) {
  const { active, payload, total } = props
  if (!active || !payload?.length) return null
  const item = payload[0] as { name?: string; value?: number; payload?: { kwota: number } } | undefined
  const kwota = item?.payload?.kwota ?? item?.value ?? 0
  const pct = total > 0 ? ((kwota / total) * 100).toFixed(0) : '0'
  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium text-base">{item?.name ?? ''}</p>
      <p className="text-sm text-(--accent-cyan)">
        {(item?.value ?? kwota ?? 0).toLocaleString('pl-PL')} zł ({pct}%)
      </p>
    </div>
  )
}

export function Analytics() {
  const { isDemoMode } = useAuth()
  const financeCats = useFinanceCategories()
  const getColor = financeCats?.getColor ?? (() => '#9d4edd')
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
  const chartPeriod = useChartPeriod()

  const effectiveExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const effectiveScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES) : qScheduled
  const effectiveIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome
  const loading = isDemoMode ? false : financeLoading

  type ChartRow = {
    label: string
    wydatki: number
    przychody: number
    bilans: number
    bilansNarastająco: number
  }

  const chartData = useMemo(() => {
    const chart: { label: string; wydatki: number; przychody: number; bilans: number }[] = []
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
        chart.push({ label: `${monthNames[m]} ${y}`, wydatki, przychody, bilans: przychody - wydatki })
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
        chart.push({ label: String(d), wydatki, przychody, bilans: przychody - wydatki })
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
        chart.push({ label: monthNames[m], wydatki, przychody, bilans: przychody - wydatki })
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
        chart.push({ label: `${monthNames[mo]} ${yr}`, wydatki, przychody, bilans: przychody - wydatki })
      }
    }
    let cum = 0
    return chart.map((row) => {
      cum += row.bilans
      return { ...row, bilansNarastająco: cum }
    }) as ChartRow[]
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear, chartPeriod])

  const chartMonth = chartPeriod?.period.type === 'month' ? chartPeriod.period.month : selectedMonth
  const chartYear = chartPeriod?.period.type === 'month' ? chartPeriod.period.year : chartPeriod?.period.type === 'quarter' ? chartPeriod.period.year : chartPeriod?.period.type === 'year' ? chartPeriod.period.year : selectedYear

  const weekdayData = useMemo(() => {
    const byDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    if (chartPeriod?.period.type === 'quarter') {
      const { quarter, year } = chartPeriod.period
      const months = getMonthsInQuarter(quarter, year)
      for (const { month: m, year: y } of months) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
        merged.forEach((e) => {
          const [ey, em, ed] = e.date.split('-').map(Number)
          const dayOfWeek = new Date(ey, em - 1, ed).getDay()
          byDay[dayOfWeek] = (byDay[dayOfWeek] || 0) + e.amount
        })
      }
    } else if (chartPeriod?.period.type === 'year') {
      const { year } = chartPeriod.period
      for (let m = 0; m < 12; m++) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === year
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, year)
        merged.forEach((e) => {
          const [ey, em, ed] = e.date.split('-').map(Number)
          const dayOfWeek = new Date(ey, em - 1, ed).getDay()
          byDay[dayOfWeek] = (byDay[dayOfWeek] || 0) + e.amount
        })
      }
    } else {
      const monthExp = effectiveExpenses.filter((e) => {
        const { year, month } = parseDate(e.date)
        return month === chartMonth && year === chartYear
      })
      const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, chartMonth, chartYear)
      merged.forEach((e) => {
        const [y, m, d] = e.date.split('-').map(Number)
        const dayOfWeek = new Date(y, m - 1, d).getDay()
        byDay[dayOfWeek] = (byDay[dayOfWeek] || 0) + e.amount
      })
    }
    return dayNames.map((name, i) => ({ dzień: name, kwota: byDay[i] ?? 0 }))
  }, [effectiveExpenses, effectiveScheduled, chartMonth, chartYear, chartPeriod])

  const topExpenses = useMemo(() => {
    let mergedList: MergedExpense[]
    if (chartPeriod?.period.type === 'quarter' || chartPeriod?.period.type === 'year') {
      const months =
        chartPeriod.period.type === 'quarter'
          ? getMonthsInQuarter(chartPeriod.period.quarter, chartPeriod.period.year)
          : Array.from({ length: 12 }, (_, m) => ({ month: m, year: chartPeriod.period.year }))
      const allExp: MergedExpense[] = []
      for (const { month: m, year: y } of months) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        allExp.push(...mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y))
      }
      mergedList = allExp
    } else {
      const monthExp = effectiveExpenses.filter((e) => {
        const { year, month } = parseDate(e.date)
        return month === chartMonth && year === chartYear
      })
      mergedList = mergeExpensesWithScheduled(monthExp, effectiveScheduled, chartMonth, chartYear)
    }

    const byName = new Map<string, { sum: number; displayName: string }>()
    for (const e of mergedList) {
      const key = e.name.trim().toLowerCase()
      const prev = byName.get(key)
      if (prev) {
        prev.sum += e.amount
      } else {
        byName.set(key, { sum: e.amount, displayName: e.name.trim() })
      }
    }

    return [...byName.values()]
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 10)
      .map(({ sum, displayName }) => ({
        nazwa: displayName.length > 12 ? displayName.slice(0, 12) + '…' : displayName,
        kwota: sum,
        fullName: displayName,
      }))
  }, [effectiveExpenses, effectiveScheduled, chartMonth, chartYear, chartPeriod])

  const { categoryData, expensesTotal } = useMemo(() => {
    if (chartPeriod?.period.type === 'quarter' || chartPeriod?.period.type === 'year') {
      const months = chartPeriod.period.type === 'quarter'
        ? getMonthsInQuarter(chartPeriod.period.quarter, chartPeriod.period.year)
        : Array.from({ length: 12 }, (_, m) => ({ month: m, year: chartPeriod.period.year }))
      const byCategory: Record<string, number> = {}
      let total = 0
      for (const { month: m, year: y } of months) {
        const monthExp = effectiveExpenses.filter((e) => {
          const { year: ey, month: em } = parseDate(e.date)
          return em === m && ey === y
        })
        const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, m, y)
        merged.forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
        })
        total += merged.reduce((s, e) => s + e.amount, 0)
      }
      return {
        categoryData: Object.entries(byCategory).map(([kategoria, kwota]) => ({ kategoria, kwota })),
        expensesTotal: total,
      }
    }
    const monthExp = effectiveExpenses.filter((e) => {
      const { year, month } = parseDate(e.date)
      return month === chartMonth && year === chartYear
    })
    const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, chartMonth, chartYear)
    const byCategory: Record<string, number> = {}
    merged.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    })
    const categoryData = Object.entries(byCategory).map(([kategoria, kwota]) => ({ kategoria, kwota }))
    const expensesTotal = merged.reduce((s, e) => s + e.amount, 0)
    return { categoryData, expensesTotal }
  }, [effectiveExpenses, effectiveScheduled, chartMonth, chartYear, chartPeriod])

  if (loading) {
    return (
      <div className="flex justify-center min-h-[200px] items-center text-base text-(--text-muted)">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthSelector />
        {chartPeriod && <ChartPeriodSelector />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Trend wydatków i przychodów">
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
                <Area type="monotone" dataKey="wydatki" stroke="#ff00d4" strokeWidth={2} fillOpacity={1} fill="url(#colorWydatki)" name="Wydatki" />
                <Area type="monotone" dataKey="przychody" stroke="#00ff9d" strokeWidth={2} fillOpacity={1} fill="url(#colorPrzychody)" name="Przychody" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={`Wg kategorii (${
          chartPeriod?.period.type === 'quarter'
            ? `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}`
            : chartPeriod?.period.type === 'year'
              ? chartPeriod.period.year
              : `${monthNames[chartMonth]} ${chartYear}`
        })`}>
          <div className="h-60 w-full min-h-[200px] relative">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="kwota"
                      nameKey="kategoria"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={95}
                      paddingAngle={2}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.kategoria} fill={getColor(entry.kategoria)} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => (
                        <DonutTooltip active={active} payload={payload} total={expensesTotal} />
                      )}
                      offset={70}
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
                    <p className="text-lg font-bold text-(--accent-cyan) font-gaming leading-tight">
                      {expensesTotal.toLocaleString('pl-PL')} zł
                    </p>
                    <p className="text-xs text-(--text-muted) font-gaming mt-0.5">łącznie</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-base text-(--text-muted)">
                Brak wydatków w tym miesiącu
              </div>
            )}
          </div>
        </Card>

        <Card title="Trend oszczędności">
          <p className="text-base text-(--text-muted) mb-1">
            Narastająca suma nadwyżek i deficytów z kolejnych punktów wykresu obok (dzień / miesiąc). W dymku: bilans w danym punkcie.
          </p>
          <div className="h-60 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBilans" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value: number | undefined, _n, item) => {
                    const raw = item as { payload?: ChartRow } | ChartRow | undefined
                    const payload =
                      raw && typeof raw === 'object' && 'payload' in raw && raw.payload
                        ? raw.payload
                        : (raw as ChartRow | undefined)
                    const okresowy = payload?.bilans
                    const suffix =
                      okresowy != null
                        ? ` (w tym okresie: ${okresowy >= 0 ? '+' : ''}${okresowy.toLocaleString('pl-PL')} zł)`
                        : ''
                    return [value != null ? `${value.toLocaleString('pl-PL')} zł${suffix}` : '', 'Bilans narastający']
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bilansNarastająco"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBilans)"
                  name="Bilans narastający"
                  baseValue={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Wydatki wg dni tygodnia">
          <p className="text-sm text-(--text-muted) mb-1">
            {chartPeriod?.period.type === 'quarter' ? `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}` : chartPeriod?.period.type === 'year' ? chartPeriod.period.year : `${monthNames[chartMonth]} ${chartYear}`}
          </p>
          <div className="h-60 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dzień" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${v} zł`} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => [value != null ? `${value} zł` : '', 'Wydatki']}
                />
                <Bar dataKey="kwota" fill="#ff00d4" fillOpacity={0.8} radius={[4, 4, 0, 0]} name="Wydatki" activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top 10 wydatków">
          <p className="text-base text-(--text-muted) mb-1">
            {chartPeriod?.period.type === 'quarter' ? `Q${chartPeriod.period.quarter} ${chartPeriod.period.year}` : chartPeriod?.period.type === 'year' ? chartPeriod.period.year : `${monthNames[chartMonth]} ${chartYear}`}
            {' — '}
            te same nazwy są zsumowane
          </p>
          {topExpenses.length > 0 ? (
            <div className="h-60 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topExpenses} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(v) => `${v} zł`} />
                  <YAxis type="category" dataKey="nazwa" stroke="var(--text-muted)" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number | undefined, _name?: string, props?: { payload?: { fullName: string } }) => [
                      value != null ? `${value} zł` : '',
                      props?.payload?.fullName ?? '',
                    ]}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="kwota" fill="#ff00d4" fillOpacity={0.8} radius={[0, 4, 4, 0]} name="Kwota" activeBar={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center items-center h-48 text-base text-(--text-muted)">
              Brak wydatków w tym miesiącu
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
