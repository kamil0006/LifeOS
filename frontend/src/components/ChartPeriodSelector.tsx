import { useChartPeriod, type ChartPeriodType } from '../context/ChartPeriodContext'
import { useMonth } from '../context/MonthContext'

const currentYear = new Date().getFullYear()

const selectClass =
  'min-h-[40px] shrink-0 cursor-pointer rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 font-gaming text-sm tracking-wide text-(--text-primary) transition-colors focus:border-(--accent-cyan) focus:outline-none'

interface ChartPeriodSelectorProps {
  /** Jednolity pasek np. „Okres:” przed przełącznikami */
  leadingLabel?: string
}

export function ChartPeriodSelector({ leadingLabel }: ChartPeriodSelectorProps = {}) {
  const ctx = useChartPeriod()
  const monthCtx = useMonth()
  if (!ctx) return null

  const { periodType, period, setPeriodType, setMonth, setQuarter, setYear, monthOptions, quarterOptions, yearOptions } = ctx

  const handleTypeChange = (next: ChartPeriodType) => {
    if (next === 'month' && monthCtx) {
      setMonth(monthCtx.selectedMonth, monthCtx.selectedYear)
    }
    setPeriodType(next)
  }

  return (
    <div className="flex w-full max-w-full flex-wrap items-center gap-2">
      {leadingLabel ? (
        <span className="shrink-0 text-base text-(--text-muted) font-gaming tracking-wide">{leadingLabel}</span>
      ) : null}

      <label htmlFor="chart-period-type" className="sr-only">
        Zakres okresu
      </label>
      <select
        id="chart-period-type"
        value={periodType}
        onChange={(e) => handleTypeChange(e.target.value as ChartPeriodType)}
        className={selectClass}
      >
        <option value="month">Miesiąc</option>
        <option value="quarter">Kwartał</option>
        <option value="year">Rok</option>
      </select>

      {periodType === 'month' ? (
        <>
          <label htmlFor="chart-period-month" className="sr-only">
            Wybierz miesiąc
          </label>
          <select
            id="chart-period-month"
            value={`${period.type === 'month' ? period.month : 0}-${period.type === 'month' ? period.year : 0}`}
            onChange={(e) => {
              const [m, y] = e.target.value.split('-').map(Number)
              setMonth(m, y)
              monthCtx?.setSelectedMonth(m)
              monthCtx?.setSelectedYear(y)
            }}
            className={`${selectClass} min-w-[130px]`}
          >
            {monthOptions.map((opt) => (
              <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </>
      ) : periodType === 'quarter' ? (
        <>
          <label htmlFor="chart-period-quarter" className="sr-only">
            Wybierz kwartał
          </label>
          <select
            id="chart-period-quarter"
            value={`Q${period.type === 'quarter' ? period.quarter : 1}-${period.type === 'quarter' ? period.year : 0}`}
            onChange={(e) => {
              const val = e.target.value
              const q = parseInt(val.slice(1, 2), 10) as 1 | 2 | 3 | 4
              const y = parseInt(val.slice(3), 10)
              setQuarter(q, y)
              monthCtx?.setSelectedYear(y)
            }}
            className={`${selectClass} min-w-[110px]`}
          >
            {quarterOptions.map((opt) => (
              <option key={`Q${opt.quarter}-${opt.year}`} value={`Q${opt.quarter}-${opt.year}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <label htmlFor="chart-period-year" className="sr-only">
            Wybierz rok
          </label>
          <select
            id="chart-period-year"
            value={period.type === 'year' ? period.year : currentYear}
            onChange={(e) => {
              const y = parseInt(e.target.value, 10)
              setYear(y)
              monthCtx?.setSelectedYear(y)
            }}
            className={`${selectClass} min-w-[90px]`}
          >
            {yearOptions.map((opt) => (
              <option key={opt.year} value={opt.year}>
                {opt.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}
