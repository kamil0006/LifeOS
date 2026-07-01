import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { buildCurrentYearMonthOptions } from '../lib/monthSelectLabels'

export type ChartPeriodType = 'month' | 'quarter' | 'year'

export interface ChartPeriodMonth {
  type: 'month'
  month: number
  year: number
}

export interface ChartPeriodQuarter {
  type: 'quarter'
  quarter: 1 | 2 | 3 | 4
  year: number
}

export interface ChartPeriodYear {
  type: 'year'
  year: number
}

export type ChartPeriod = ChartPeriodMonth | ChartPeriodQuarter | ChartPeriodYear

interface ChartPeriodContextType {
  periodType: ChartPeriodType
  period: ChartPeriod
  setPeriodType: (t: ChartPeriodType) => void
  setMonth: (month: number, year: number) => void
  setQuarter: (quarter: 1 | 2 | 3 | 4, year: number) => void
  setYear: (year: number) => void
  monthOptions: { month: number; year: number; label: string }[]
  quarterOptions: { quarter: 1 | 2 | 3 | 4; year: number; label: string }[]
  yearOptions: { year: number; label: string }[]
  monthNames: string[]
}

const ChartPeriodContext = createContext<ChartPeriodContextType | null>(null)

/** `recalcToken` bumps when wall-clock advances so labels stay in sync (see `calendarTick`). */
function getMonthOptions(recalcToken: number, monthNames: readonly string[]) {
  return buildCurrentYearMonthOptions(recalcToken, monthNames)
}

function getQuarterOptions(recalcToken: number) {
  void recalcToken
  const now = new Date()
  const y0 = now.getFullYear()
  const maxQuarter = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4
  const options: { quarter: 1 | 2 | 3 | 4; year: number; label: string }[] = []
  for (let q = 1; q <= maxQuarter; q++) {
    options.push({ quarter: q as 1 | 2 | 3 | 4, year: y0, label: `Q${q} ${y0}` })
  }
  return options
}

function getYearOptions(recalcToken: number) {
  void recalcToken
  const y0 = new Date().getFullYear()
  return [{ year: y0, label: String(y0) }]
}

export function ChartPeriodProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const monthNames = t('months', { returnObjects: true }) as string[]
  const [periodType, setPeriodType] = useState<ChartPeriodType>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(() => {
    const m = new Date().getMonth()
    return (Math.floor(m / 3) + 1) as 1 | 2 | 3 | 4
  })
  const [selectedQuarterYear, setSelectedQuarterYear] = useState(() => new Date().getFullYear())
  const [selectedYearOnly, setSelectedYearOnly] = useState(() => new Date().getFullYear())
  const [calendarTick, setCalendarTick] = useState(0)

  useEffect(() => {
    const bump = () => setCalendarTick((t) => t + 1)
    const id = setInterval(bump, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') bump()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const monthOptions = useMemo(() => getMonthOptions(calendarTick, monthNames), [calendarTick, monthNames])
  const quarterOptions = useMemo(() => getQuarterOptions(calendarTick), [calendarTick])
  const yearOptions = useMemo(() => getYearOptions(calendarTick), [calendarTick])

  useEffect(() => {
    const ok = yearOptions.some((o) => o.year === selectedYearOnly)
    if (!ok && yearOptions.length > 0) {
      setSelectedYearOnly(yearOptions[0].year)
    }
  }, [yearOptions, selectedYearOnly])

  useEffect(() => {
    const ok = quarterOptions.some((o) => o.quarter === selectedQuarter && o.year === selectedQuarterYear)
    if (!ok && quarterOptions.length > 0) {
      const last = quarterOptions[quarterOptions.length - 1]
      setSelectedQuarter(last.quarter)
      setSelectedQuarterYear(last.year)
    }
  }, [quarterOptions, selectedQuarter, selectedQuarterYear])

  const period: ChartPeriod = useMemo(() => {
    if (periodType === 'month') {
      return { type: 'month', month: selectedMonth, year: selectedYear }
    }
    if (periodType === 'quarter') {
      return { type: 'quarter', quarter: selectedQuarter, year: selectedQuarterYear }
    }
    return { type: 'year', year: selectedYearOnly }
  }, [periodType, selectedMonth, selectedYear, selectedQuarter, selectedQuarterYear, selectedYearOnly])

  const value = useMemo(
    () => ({
      periodType,
      period,
      setPeriodType,
      setMonth: (month: number, year: number) => {
        setSelectedMonth(month)
        setSelectedYear(year)
      },
      setQuarter: (quarter: 1 | 2 | 3 | 4, year: number) => {
        setSelectedQuarter(quarter)
        setSelectedQuarterYear(year)
      },
      setYear: (year: number) => {
        setSelectedYearOnly(year)
      },
      monthOptions,
      quarterOptions,
      yearOptions,
      monthNames,
    }),
    [periodType, period, monthOptions, quarterOptions, yearOptions, monthNames]
  )

  return <ChartPeriodContext.Provider value={value}>{children}</ChartPeriodContext.Provider>
}

export function useChartPeriod() {
  const ctx = useContext(ChartPeriodContext)
  return ctx
}

export function getMonthsInQuarter(q: 1 | 2 | 3 | 4, year: number): { month: number; year: number }[] {
  const startMonth = (q - 1) * 3
  return [
    { month: startMonth, year },
    { month: startMonth + 1, year },
    { month: startMonth + 2, year },
  ]
}
