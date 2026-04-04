import { useMonth } from '../context/MonthContext'
import { useChartPeriod } from '../context/ChartPeriodContext'

export function MonthSelector() {
  const monthCtx = useMonth()
  const chartPeriodCtx = useChartPeriod()
  if (!monthCtx) return null

  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, monthOptions } = monthCtx

  return (
    <div className="flex items-center gap-2">
      <label className="text-base text-(--text-muted) font-gaming tracking-wide">Miesiąc:</label>
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
        className="px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) font-gaming tracking-wide focus:border-(--accent-cyan) focus:outline-none cursor-pointer min-w-[140px]"
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
