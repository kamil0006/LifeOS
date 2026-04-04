import { useMonth } from '../context/MonthContext'
import { useChartPeriod } from '../context/ChartPeriodContext'

export function MonthSelector() {
  const monthCtx = useMonth()
  const chartPeriodCtx = useChartPeriod()
  if (!monthCtx) return null

  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, monthOptions } = monthCtx

  return (
    <div className="flex w-full max-w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <label className="shrink-0 text-base text-(--text-muted) font-gaming tracking-wide">Miesiąc:</label>
      <select
        value={`${selectedMonth}-${selectedYear}`}
        onChange={(e) => {
          const [m, y] = e.target.value.split('-').map(Number)
          setSelectedMonth(m)
          setSelectedYear(y)
          if (chartPeriodCtx?.periodType === 'month') {
            chartPeriodCtx.setMonth(m, y)
          }
        }}
        className="min-h-[44px] min-w-0 max-w-full flex-1 cursor-pointer rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 font-gaming tracking-wide text-(--text-primary) focus:border-(--accent-cyan) focus:outline-none sm:min-w-[140px] sm:flex-none"
      >
        {monthOptions.map((opt) => (
          <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
