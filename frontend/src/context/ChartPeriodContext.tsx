import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

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

function getMonthOptions() {
  const options: { month: number; year: number; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    options.push({ month: m, year: y, label: `${monthNames[m]} ${y}` })
  }
  return options
}

function getQuarterOptions() {
  const options: { quarter: 1 | 2 | 3 | 4; year: number; label: string }[] = []
  const quarters = [1, 2, 3, 4] as const
  const y0 = new Date().getFullYear()
  for (let yOffset = 0; yOffset <= 2; yOffset++) {
    const y = y0 - yOffset
    for (const q of quarters) {
      options.push({ quarter: q, year: y, label: `Q${q} ${y}` })
    }
  }
  return options
}

function getYearOptions() {
  const options: { year: number; label: string }[] = []
  const y0 = new Date().getFullYear()
  for (let yOffset = 0; yOffset <= 5; yOffset++) {
    const y = y0 - yOffset
    options.push({ year: y, label: String(y) })
  }
  return options
}

export function ChartPeriodProvider({ children }: { children: ReactNode }) {
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

  const monthOptions = useMemo(() => getMonthOptions(), [calendarTick])
  const quarterOptions = useMemo(() => getQuarterOptions(), [calendarTick])
  const yearOptions = useMemo(() => getYearOptions(), [calendarTick])

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
    [periodType, period, monthOptions, quarterOptions, yearOptions]
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
