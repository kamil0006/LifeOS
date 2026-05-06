import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import { ROLLING_MONTH_NAMES, buildCurrentYearMonthOptions } from '../lib/monthSelectLabels'

const monthNames = [...ROLLING_MONTH_NAMES]

interface MonthContextType {
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (m: number) => void
  setSelectedYear: (y: number) => void
  monthOptions: { month: number; year: number; label: string }[]
  monthNames: string[]
}

const MonthContext = createContext<MonthContextType | null>(null)

export function MonthProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
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

  const monthOptions = useMemo(() => buildCurrentYearMonthOptions(calendarTick), [calendarTick])

  useEffect(() => {
    const key = `${selectedMonth}-${selectedYear}`
    const ok = monthOptions.some((o) => `${o.month}-${o.year}` === key)
    if (!ok && monthOptions.length > 0) {
      const first = monthOptions[0]
      setSelectedMonth(first.month)
      setSelectedYear(first.year)
    }
  }, [monthOptions, selectedMonth, selectedYear])

  const value = useMemo(
    () => ({
      selectedMonth,
      selectedYear,
      setSelectedMonth,
      setSelectedYear,
      monthOptions,
      monthNames,
    }),
    [selectedMonth, selectedYear, monthOptions]
  )

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  return ctx
}

export function parseDate(dateStr: string): { year: number; month: number } {
  const [y, m] = dateStr.split('T')[0].split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function inMonth(dateStr: string, targetMonth: number, targetYear: number): boolean {
  const { year, month } = parseDate(dateStr)
  return month === targetMonth && year === targetYear
}
