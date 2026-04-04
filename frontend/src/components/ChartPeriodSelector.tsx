import { useChartPeriod } from '../context/ChartPeriodContext'
import { useMonth } from '../context/MonthContext'

const currentYear = new Date().getFullYear()

export function ChartPeriodSelector() {
  const ctx = useChartPeriod()
  const monthCtx = useMonth()
  if (!ctx) return null

  const { periodType, period, setPeriodType, setMonth, setQuarter, setYear, monthOptions, quarterOptions, yearOptions } = ctx

  return (
    <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--bg-dark) p-1">
      <div className="flex rounded-md p-0.5 bg-(--bg-card)/50">
        <button
          type="button"
          onClick={() => {
            if (monthCtx) {
              setMonth(monthCtx.selectedMonth, monthCtx.selectedYear)
            }
            setPeriodType('month')
          }}
          className={`px-2 py-1.5 rounded text-sm font-gaming transition-colors ${
            periodType === 'month'
              ? 'bg-(--accent-cyan) text-(--bg-dark)'
              : 'text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          Miesiąc
        </button>
        <button
          type="button"
          onClick={() => setPeriodType('quarter')}
          className={`px-2 py-1.5 rounded text-sm font-gaming transition-colors ${
            periodType === 'quarter'
              ? 'bg-(--accent-cyan) text-(--bg-dark)'
              : 'text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          Kwartał
        </button>
        <button
          type="button"
          onClick={() => setPeriodType('year')}
          className={`px-2 py-1.5 rounded text-sm font-gaming transition-colors ${
            periodType === 'year'
              ? 'bg-(--accent-cyan) text-(--bg-dark)'
              : 'text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          Rok
        </button>
      </div>
      {periodType === 'month' ? (
        <select
          value={`${period.type === 'month' ? period.month : 0}-${period.type === 'month' ? period.year : 0}`}
          onChange={(e) => {
            const [m, y] = e.target.value.split('-').map(Number)
            setMonth(m, y)
            monthCtx?.setSelectedMonth(m)
            monthCtx?.setSelectedYear(y)
          }}
          className="px-2.5 py-1.5 rounded-md bg-(--bg-card) border border-(--border) text-(--text-primary) font-gaming text-sm focus:border-(--accent-cyan) focus:outline-none cursor-pointer min-w-[120px]"
        >
          {monthOptions.map((opt) => (
            <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : periodType === 'quarter' ? (
        <select
          value={`Q${period.type === 'quarter' ? period.quarter : 1}-${period.type === 'quarter' ? period.year : 0}`}
          onChange={(e) => {
            const val = e.target.value
            const q = parseInt(val.slice(1, 2), 10) as 1 | 2 | 3 | 4
            const y = parseInt(val.slice(3), 10)
            setQuarter(q, y)
            monthCtx?.setSelectedYear(y)
          }}
          className="px-2.5 py-1.5 rounded-md bg-(--bg-card) border border-(--border) text-(--text-primary) font-gaming text-sm focus:border-(--accent-cyan) focus:outline-none cursor-pointer min-w-[100px]"
        >
          {quarterOptions.map((opt) => (
            <option key={`Q${opt.quarter}-${opt.year}`} value={`Q${opt.quarter}-${opt.year}`}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <select
          value={period.type === 'year' ? period.year : currentYear}
          onChange={(e) => {
            const y = parseInt(e.target.value, 10)
            setYear(y)
            monthCtx?.setSelectedYear(y)
          }}
          className="px-2.5 py-1.5 rounded-md bg-(--bg-card) border border-(--border) text-(--text-primary) font-gaming text-sm focus:border-(--accent-cyan) focus:outline-none cursor-pointer min-w-[80px]"
        >
          {yearOptions.map((opt) => (
            <option key={opt.year} value={opt.year}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
