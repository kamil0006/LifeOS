import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../components/Card'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Flame,
  Pencil,
  Check,
  X,
  ChevronDown,
  Award,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useHabits, type HabitItem } from '../context/HabitsContext'
import type { HabitCheckInStatus, HabitScheduleType } from '../lib/api/habitsApi'
import { SimplePageSkeleton } from '../components/skeletons'
import { useModalMotion } from '../lib/modalMotion'
import { TODO_ITEM_SPRING } from '../lib/todoMotion'

/** Gdy nie ma żadnego wpisu — pokazujemy tyle dni kończąc na dziś (bez sztucznej historii). */
const EMPTY_GRID_DAYS = 10
/**
 * Szerokość siatki ≈ EMPTY_GRID_DAYS × komórka + gapy (widać naraz; starsze: suwak).
 */
const HABIT_GRID_WRAP_CLASS =
  'w-full max-w-[min(100%,27rem)] pb-1.5 self-start'
/** Kratka dnia: większy box, wygodniejszy klik. */
const HABIT_GRID_CELL = 'h-9 w-9 min-h-9 min-w-9'
const HABIT_GRID_COL_GAP = 'gap-2'
/** Suma pod kratką: ostatnie tyle dni od dziś. */
const SUM_LAST_DAYS = 10
/** Domyślny zakres wykresu nawyku (ostatnie N dni). */
const HABIT_CHART_DEFAULT_DAYS = 30

const HABIT_ACCENT_STORAGE_KEY = 'lifeos-habit-accents-v1'

const CHECK_IN_STATUS_LABEL: Record<HabitCheckInStatus, string> = {
  done: 'Zrobione',
  missed: 'Pominięte',
  skipped: 'Usprawiedliwione',
}
const SCHEDULE_LABEL: Record<HabitScheduleType, string> = {
  daily: 'Codziennie',
  weekdays: 'Wybrane dni tygodnia',
  weekly: 'X razy w tygodniu',
  monthly: 'X razy w miesiącu',
}

/** Paleta akcentu nawyku (hex); kratka + wykres. */
const HABIT_ACCENT_PRESETS = [
  { id: 'green', label: 'Zieleń', hex: '#00ff9d' },
  { id: 'cyan', label: 'Cyjan', hex: '#00e5ff' },
  { id: 'magenta', label: 'Magenta', hex: '#ff00d4' },
  { id: 'amber', label: 'Bursztyn', hex: '#ffb800' },
  { id: 'violet', label: 'Fiolet', hex: '#a78bfa' },
  { id: 'emerald', label: 'Szmaragd', hex: '#34d399' },
  { id: 'lime', label: 'Limonkowy', hex: '#bef264' },
  { id: 'orange', label: 'Pomarańcz', hex: '#fb923c' },
  { id: 'rose', label: 'Róż', hex: '#fb7185' },
  { id: 'sky', label: 'Niebieski', hex: '#38bdf8' },
  { id: 'coral', label: 'Koral', hex: '#f87171' },
  { id: 'white', label: 'Biel', hex: '#e2e8f0' },
] as const

type HabitAccentId = (typeof HABIT_ACCENT_PRESETS)[number]['id']

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function resolveHabitAccentHex(
  choiceByHabit: Record<string, string>,
  habitId: string,
  fallbackId: HabitAccentId = HABIT_ACCENT_PRESETS[0].id
): string {
  const id = choiceByHabit[habitId] ?? fallbackId
  return HABIT_ACCENT_PRESETS.find((p) => p.id === id)?.hex ?? HABIT_ACCENT_PRESETS[0].hex
}

function defaultHabitAccentId(seed: string): HabitAccentId {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return HABIT_ACCENT_PRESETS[hash % HABIT_ACCENT_PRESETS.length].id
}

function readHabitAccentStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(HABIT_ACCENT_STORAGE_KEY)
    if (!raw) return {}
    const o = JSON.parse(raw) as Record<string, string>
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

function writeHabitAccentStorage(next: Record<string, string>) {
  try {
    localStorage.setItem(HABIT_ACCENT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

type HabitChartPeriod = '30d' | '90d' | 'month' | 'year' | 'all'

type HabitChartPoint = {
  label: string
  /** Realizacja 0–100 % (cel dnia lub okno binarne). */
  pct: number
  fullDate?: string
  /** Dla binarnych (dzienne widoki): ile dni zaliczono w przesuwnym oknie wykresu. */
  rollingDone?: number
}
const DAY_LETTERS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So']
/** Krótkie etykiety dni (getDay(): 0 = ndz … 6 = sob). */
const WEEKDAY_SHORT_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So']
const WEEKDAY_SHORT_PL_MONDAY_FIRST = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
/** Do zdań typu „w środę”. */
const WEEKDAY_ACCUSATIVE_PL = [
  'niedzielę',
  'poniedziałek',
  'wtorek',
  'środę',
  'czwartek',
  'piątek',
  'sobotę',
]

/** Przy „cała historia” — powyżej tylu dni wykres dzienny zamieniamy na tygodnie (czytelność). */
const CHART_ALL_MAX_DAILY_POINTS = 200

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseLocalYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatMonthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function parseMonthKey(key: string): Date {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

function formatMonthLabel(key: string): string {
  return parseMonthKey(key).toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Zakres: co najmniej ostatnie EMPTY_GRID_DAYS dni + ewentualnie starsze dni z wpisów.
 * Okno pokazuje ~10 kolumn naraz; reszta — suwakiem wstecz w czasie.
 */
function getHabitGridDates(habit: HabitItem): { dates: string[]; letters: string[] } {
  const today = new Date()
  const endStr = formatLocalYmd(today)
  const lastWindowStartDate = new Date(today)
  lastWindowStartDate.setDate(lastWindowStartDate.getDate() - (EMPTY_GRID_DAYS - 1))
  const lastWindowStartStr = formatLocalYmd(lastWindowStartDate)

  let startStr: string
  if (habit.checkIns.length === 0) {
    startStr = lastWindowStartStr
  } else {
    const sorted = [...habit.checkIns].sort((a, b) => a.date.localeCompare(b.date))
    const earliestCheck = sorted[0].date
    startStr =
      earliestCheck < lastWindowStartStr ? earliestCheck : lastWindowStartStr
  }

  const dates: string[] = []
  const letters: string[] = []
  const start = parseLocalYmd(startStr)
  const end = parseLocalYmd(endStr)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatLocalYmd(d))
    letters.push(DAY_LETTERS[d.getDay()])
  }
  return { dates, letters }
}

function sanitizeGoalNumber(val: string): string {
  let s = val.replace(/[^0-9,.]/g, '')
  const parts = s.split(/[.,]/)
  if (parts.length > 2) {
    s = parts[0] + ',' + parts.slice(1).join('')
  } else if (parts.length === 2 && (s.includes(',') && s.includes('.'))) {
    s = parts[0] + ',' + parts[1]
  }
  if (s.length > 1 && s[0] === '0' && s[1] !== '.' && s[1] !== ',') {
    s = s.replace(/^0+/, '') || '0'
  }
  if (/^0+$/.test(s)) s = '0'
  return s
}

function parseGoalNumber(val: string): number {
  return parseFloat(val.replace(',', '.')) || 0
}

function isMeasurableHabit(h: HabitItem): boolean {
  return h.targetPerDay != null || !!(h.unit && h.unit.trim())
}

function checkInForDay(habit: HabitItem, date: string) {
  return habit.checkIns.find((c) => c.date === date)
}

function habitDayIsDone(habit: HabitItem, date: string): boolean {
  const checkIn = checkInForDay(habit, date)
  if (!checkIn || checkIn.status !== 'done') return false
  if (isMeasurableHabit(habit) && habit.targetPerDay != null && habit.targetPerDay > 0) {
    return (checkIn.value ?? 0) >= habit.targetPerDay
  }
  return true
}

function habitDayHasDoneEntry(habit: HabitItem, date: string): boolean {
  return checkInForDay(habit, date)?.status === 'done'
}

function habitScheduledOnDate(habit: HabitItem, date: string): boolean {
  const d = parseLocalYmd(date)
  if (habit.scheduleType === 'weekdays') return habit.scheduleDays.includes(d.getDay())
  return true
}

function formatHabitSchedule(habit: HabitItem): string {
  if (habit.scheduleType === 'weekdays') {
    const days = habit.scheduleDays.length
      ? habit.scheduleDays.map((d) => WEEKDAY_SHORT_PL[d]).join(', ')
      : 'brak dni'
    return `Plan: ${days}`
  }
  if (habit.scheduleType === 'weekly') {
    return `Plan: ${habit.weeklyTarget ?? 1}× tygodniowo`
  }
  if (habit.scheduleType === 'monthly') {
    return `Plan: ${habit.monthlyTarget ?? 1}× miesięcznie`
  }
  return 'Plan: codziennie'
}


function expectedHabitCountInWindow(habit: HabitItem, days: number, scheduledDays: number): number {
  if (habit.scheduleType === 'weekly') {
    return Math.max(1, Math.ceil(days / 7) * (habit.weeklyTarget ?? 1))
  }
  if (habit.scheduleType === 'monthly') {
    return Math.max(1, Math.ceil(days / 30) * (habit.monthlyTarget ?? 1))
  }
  return scheduledDays
}

/** Ile razy nawyk był zaliczony w historii w dany dzień tygodnia (0 = ndz … 6 = sob). */
function countCompletionsByWeekday(habit: HabitItem, measurable: boolean): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const c of habit.checkIns) {
    const w = parseLocalYmd(String(c.date).split('T')[0]).getDay()
    if (c.status !== 'done') continue
    if (measurable) {
      if (c.value != null && c.value > 0) counts[w]++
    } else {
      counts[w]++
    }
  }
  return counts
}

function weekdayCountTitle(weekdayIdx: number, n: number): string {
  const name = WEEKDAY_ACCUSATIVE_PL[weekdayIdx]
  if (n === 1) return `W historii: 1 raz w ${name}`
  return `W historii: ${n} razy w ${name}`
}

function pluralDays(n: number): string {
  if (n === 1) return '1 dzień'
  return `${n} dni`
}

function goalStatusChip(pct: number): { label: string; cls: string } | null {
  if (pct >= 100) return { label: 'Ukończony', cls: 'border-(--accent-green)/40 bg-(--accent-green)/10 text-(--accent-green)' }
  if (pct >= 75) return { label: 'Blisko celu', cls: 'border-(--accent-amber)/40 bg-(--accent-amber)/10 text-(--accent-amber)' }
  return null
}

function goalQuickStep(target: number): number {
  if (target >= 1000) return 100
  if (target >= 100) return 10
  return 1
}

/** Wysokość zielonego wypełnienia komórki: 0–100% względem celu dnia lub „jest wpis”. */
function dayFillPercent(habit: HabitItem, value: number | null | undefined): number {
  if (value == null || value <= 0) return 0
  if (habit.targetPerDay != null && habit.targetPerDay > 0) {
    return Math.min(100, (value / habit.targetPerDay) * 100)
  }
  return 100
}

function sumLastNDays(habit: HabitItem, n: number): number {
  const today = new Date()
  let sum = 0
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const checkIn = checkInForDay(habit, key)
    if (checkIn?.status !== 'done') continue
    const v = checkIn.value
    if (v != null && v > 0) sum += v
  }
  return sum
}

/** Najdłuższa ciągła seria dni kalendarzowych z dowolnym wpisem. */
function getLongestStreakDays(habit: HabitItem): number {
  const start = getHabitHistoryStart(habit)
  const end = new Date()
  end.setHours(12, 0, 0, 0)
  const unique: string[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatLocalYmd(d)
    if (habitDayIsDone(habit, key)) unique.push(key)
  }
  if (unique.length === 0) return 0
  let best = 1
  let cur = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = parseLocalYmd(unique[i - 1])
    const next = parseLocalYmd(unique[i])
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) {
      cur++
      best = Math.max(best, cur)
    } else {
      cur = 1
    }
  }
  return best
}

/** Etykieta widocznego okna kratki (np. „7 kwi – 16 kwi 2026”). */
function formatVisibleDateRange(dates: string[]): string {
  if (dates.length === 0) return ''
  const first = dates[0]
  const last = dates[dates.length - 1]
  const d0 = parseLocalYmd(first)
  const d1 = parseLocalYmd(last)
  if (first === last) {
    return d0.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  const sameYear = d0.getFullYear() === d1.getFullYear()
  const left = d0.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' as const }),
  })
  const right = d1.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${left} – ${right}`
}

/**
 * Okno kroczące dla nawyku binarnego na wykresie (dziennie / miesiąc).
 * Szersze niż tydzień — żeby 7 z rzędu nie dawało od razu 100% (pełna skala = zaliczone wszystkie dni w oknie).
 */
const BINARY_CHART_ROLLING_DAYS = 14

function binaryRollingWindowMeta(habit: HabitItem, endDate: Date): { pct: number; done: number } {
  let done = 0
  for (let i = 0; i < BINARY_CHART_ROLLING_DAYS; i++) {
    const d = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    )
    d.setDate(d.getDate() - i)
    const key = formatLocalYmd(d)
    if (habitDayHasDoneEntry(habit, key)) done++
  }
  return { pct: (done / BINARY_CHART_ROLLING_DAYS) * 100, done }
}

/** Początek historii do statystyk / „cała historia”: min(createdAt, najstarszy wpis). */
function getHabitHistoryStart(habit: HabitItem): Date {
  let minYmd = habit.createdAt.split('T')[0]
  if (habit.checkIns.length > 0) {
    const sorted = [...habit.checkIns].sort((a, b) => a.date.localeCompare(b.date))
    if (sorted[0].date < minYmd) minYmd = sorted[0].date
  }
  const d = parseLocalYmd(minYmd)
  d.setHours(12, 0, 0, 0)
  return d
}

/** Średnia realizacja 0–100 wg dnia tygodnia (każdy kalendarzowy dzień od startu historii do dziś). */
function computeWeekdayStats(
  habit: HabitItem,
  measurable: boolean
): { avg: number[]; bestIdx: number | null; maxAvg: number } {
  const start = getHabitHistoryStart(habit)
  const end = new Date()
  end.setHours(12, 0, 0, 0)
  const sum = [0, 0, 0, 0, 0, 0, 0]
  const cnt = [0, 0, 0, 0, 0, 0, 0]
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    cnt[w]++
    const key = formatLocalYmd(d)
    if (measurable) {
      const checkIn = checkInForDay(habit, key)
      sum[w] += checkIn?.status === 'done' ? dayFillPercent(habit, checkIn.value) : 0
    } else {
      sum[w] += habitDayHasDoneEntry(habit, key) ? 100 : 0
    }
  }
  const avg = [0, 1, 2, 3, 4, 5, 6].map((i) => (cnt[i] ? sum[i] / cnt[i] : 0))
  let bestIdx: number | null = null
  let maxAvg = -1
  for (let i = 0; i < 7; i++) {
    if (cnt[i] === 0) continue
    if (avg[i] > maxAvg) {
      maxAvg = avg[i]
      bestIdx = i
    }
  }
  if (bestIdx === null || maxAvg < 0) maxAvg = 0
  return { avg, bestIdx, maxAvg }
}

function buildHabitChartSeries(
  habit: HabitItem,
  measurable: boolean,
  period: HabitChartPeriod
): HabitChartPoint[] {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const pushDaily = (d: Date): HabitChartPoint => {
    const key = formatLocalYmd(d)
    let pct: number
    let rollingDone: number | undefined
    if (measurable) {
      const checkIn = checkInForDay(habit, key)
      pct = checkIn?.status === 'done' ? dayFillPercent(habit, checkIn.value) : 0
    } else {
      const meta = binaryRollingWindowMeta(habit, d)
      pct = meta.pct
      rollingDone = meta.done
    }
    return {
      label: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      pct: Math.min(100, Math.max(0, pct)),
      fullDate: key,
      rollingDone,
    }
  }

  if (period === 'year') {
    const out: HabitChartPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const y = monthStart.getFullYear()
      const mon = monthStart.getMonth()
      let sum = 0
      let n = 0
      for (let day = 1; day <= 31; day++) {
        const d = new Date(y, mon, day)
        if (d.getMonth() !== mon) break
        if (d > today) break
        n++
        const key = formatLocalYmd(d)
        if (measurable) {
          const checkIn = checkInForDay(habit, key)
          sum += checkIn?.status === 'done' ? dayFillPercent(habit, checkIn.value) : 0
        } else {
          sum += habitDayHasDoneEntry(habit, key) ? 100 : 0
        }
      }
      const pct = n > 0 ? Math.min(100, Math.max(0, sum / n)) : 0
      const label = monthStart.toLocaleDateString('pl-PL', {
        month: 'short',
        year: '2-digit',
      })
      out.push({
        label,
        pct,
        fullDate: formatLocalYmd(new Date(y, mon, 15)),
      })
    }
    return out
  }

  if (period === 'month') {
    const out: HabitChartPoint[] = []
    const y = today.getFullYear()
    const mon = today.getMonth()
    for (let day = 1; day <= 31; day++) {
      const d = new Date(y, mon, day)
      if (d.getMonth() !== mon) break
      if (d > today) break
      out.push(pushDaily(d))
    }
    return out
  }

  if (period === 'all') {
    const start = getHabitHistoryStart(habit)
    const end = new Date(today)
    const dayCount =
      Math.floor((end.getTime() - start.getTime()) / 86400000) + 1

    if (dayCount <= 0) return []

    if (dayCount <= CHART_ALL_MAX_DAILY_POINTS) {
      const out: HabitChartPoint[] = []
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(start)
        d.setHours(12, 0, 0, 0)
        d.setDate(d.getDate() + i)
        if (d > end) break
        out.push(pushDaily(d))
      }
      return out
    }

    const out: HabitChartPoint[] = []
    let chunkStart = new Date(start)
    chunkStart.setHours(12, 0, 0, 0)
    const endT = new Date(end)
    endT.setHours(12, 0, 0, 0)
    while (chunkStart <= endT) {
      const chunkEnd = new Date(chunkStart)
      chunkEnd.setDate(chunkEnd.getDate() + 6)
      if (chunkEnd > endT) chunkEnd.setTime(endT.getTime())
      let sumP = 0
      let n = 0
      for (let d = new Date(chunkStart); d <= chunkEnd; d.setDate(d.getDate() + 1)) {
        n++
        const key = formatLocalYmd(d)
        if (measurable) {
          const checkIn = checkInForDay(habit, key)
          sumP += checkIn?.status === 'done' ? dayFillPercent(habit, checkIn.value) : 0
        } else {
          sumP += binaryRollingWindowMeta(habit, d).pct
        }
      }
      const pct = n > 0 ? Math.min(100, Math.max(0, sumP / n)) : 0
      const label = `${chunkStart.getDate()}.${String(chunkStart.getMonth() + 1).padStart(2, '0')}–${chunkEnd.getDate()}.${String(chunkEnd.getMonth() + 1).padStart(2, '0')}`
      out.push({
        label,
        pct,
        fullDate: formatLocalYmd(chunkEnd),
      })
      chunkStart = new Date(chunkEnd)
      chunkStart.setDate(chunkStart.getDate() + 1)
    }
    return out
  }

  if (period === '90d') {
    const out: HabitChartPoint[] = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      out.push(pushDaily(d))
    }
    return out
  }

  const out: HabitChartPoint[] = []
  for (let i = HABIT_CHART_DEFAULT_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    out.push(pushDaily(d))
  }
  return out
}

function computeHabitWindowStats(habit: HabitItem, days: number) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  let planned = 0
  let done = 0
  let skipped = 0
  let valueSum = 0
  let valueCount = 0
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = formatLocalYmd(d)
    if (habitScheduledOnDate(habit, key)) planned++
    const checkIn = checkInForDay(habit, key)
    if (checkIn?.status === 'skipped') skipped++
    if (habitDayIsDone(habit, key)) done++
    if (checkIn?.status === 'done' && checkIn.value != null && checkIn.value > 0) {
      valueSum += checkIn.value
      valueCount++
    }
  }
  planned = expectedHabitCountInWindow(habit, days, planned)
  const denominator = Math.max(1, planned - skipped)
  return {
    days,
    done,
    planned,
    skipped,
    pct: Math.round((done / denominator) * 100),
    avgValue: valueCount ? valueSum / valueCount : null,
  }
}

function computeHabitTrend(habit: HabitItem, days: number): number {
  const current = computeHabitWindowStats(habit, days).pct
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  let planned = 0
  let done = 0
  let skipped = 0
  for (let i = days; i < days * 2; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = formatLocalYmd(d)
    if (habitScheduledOnDate(habit, key)) planned++
    const checkIn = checkInForDay(habit, key)
    if (checkIn?.status === 'skipped') skipped++
    if (habitDayIsDone(habit, key)) done++
  }
  planned = expectedHabitCountInWindow(habit, days, planned)
  const previous = Math.round((done / Math.max(1, planned - skipped)) * 100)
  return current - previous
}

type HabitCalendarCell =
  | { kind: 'blank'; key: string }
  | { kind: 'day'; date: string; day: number; pct: number; status: HabitCheckInStatus | 'empty' }

function buildHabitMonthOptions(habit: HabitItem): { key: string; label: string }[] {
  const start = getHabitHistoryStart(habit)
  const end = new Date()
  const out: { key: string; label: string }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cursor <= endMonth) {
    const key = formatMonthKey(cursor)
    out.push({ key, label: formatMonthLabel(key) })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out.reverse()
}

function buildHabitMonthCalendar(habit: HabitItem, monthKey: string): HabitCalendarCell[] {
  const month = parseMonthKey(monthKey)
  const y = month.getFullYear()
  const mon = month.getMonth()
  const firstDay = new Date(y, mon, 1)
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const days: HabitCalendarCell[] = Array.from({ length: leadingBlanks }, (_, i) => ({
    kind: 'blank',
    key: `blank-${i}`,
  }))
  for (let day = 1; day <= 31; day++) {
    const d = new Date(y, mon, day)
    if (d.getMonth() !== mon) break
    const date = formatLocalYmd(d)
    const checkIn = checkInForDay(habit, date)
    days.push({
      kind: 'day',
      date,
      day,
      pct: checkIn?.status === 'done' ? dayFillPercent(habit, checkIn.value) : 0,
      status: checkIn?.status ?? 'empty',
    })
  }
  return days
}

function computeHabitMonthSummary(habit: HabitItem, monthKey: string) {
  const month = parseMonthKey(monthKey)
  const y = month.getFullYear()
  const mon = month.getMonth()
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  let calendarDays = 0
  let planned = 0
  let done = 0
  let missed = 0
  let skipped = 0

  for (let day = 1; day <= 31; day++) {
    const d = new Date(y, mon, day)
    if (d.getMonth() !== mon) break
    if (d > today) break
    calendarDays++
    const key = formatLocalYmd(d)
    if (habitScheduledOnDate(habit, key)) planned++
    const checkIn = checkInForDay(habit, key)
    if (checkIn?.status === 'missed') missed++
    if (checkIn?.status === 'skipped') skipped++
    if (habitDayIsDone(habit, key)) done++
  }

  const expected = expectedHabitCountInWindow(habit, Math.max(1, calendarDays), planned)
  const effectiveExpected = Math.max(1, expected - skipped)
  return {
    done,
    missed,
    skipped,
    expected,
    pct: Math.round((done / effectiveExpected) * 100),
  }
}

function toggleScheduleDayValue(
  day: number,
  setDays: Dispatch<SetStateAction<number[]>>
) {
  setDays((prev) =>
    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
  )
}

function buildHabitSchedulePayload(
  type: HabitScheduleType,
  days: number[],
  weeklyRaw: string,
  monthlyRaw: string
) {
  return {
    scheduleType: type,
    scheduleDays: type === 'weekdays' ? days : [],
    weeklyTarget:
      type === 'weekly' ? Math.max(1, Math.round(parseGoalNumber(weeklyRaw) || 1)) : null,
    monthlyTarget:
      type === 'monthly' ? Math.max(1, Math.round(parseGoalNumber(monthlyRaw) || 1)) : null,
  }
}

function HabitCreateForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, extras: {
    unit: string | null
    targetPerDay: number | null
    category: string | null
    color: string | null
    scheduleType: HabitScheduleType
    scheduleDays: number[]
    weeklyTarget: number | null
    monthlyTarget: number | null
  }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [targetRaw, setTargetRaw] = useState('')
  const [category, setCategory] = useState('')
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>('daily')
  const [scheduleDays, setScheduleDays] = useState<number[]>([])
  const [weeklyTargetRaw, setWeeklyTargetRaw] = useState('')
  const [monthlyTargetRaw, setMonthlyTargetRaw] = useState('')
  const [accentId, setAccentId] = useState<HabitAccentId>(HABIT_ACCENT_PRESETS[1].id)

  const submit = () => {
    if (!name.trim()) return
    const parsedTarget = parseGoalNumber(targetRaw)
    const targetPerDay =
      targetRaw.trim() !== '' && !Number.isNaN(parsedTarget) && parsedTarget > 0
        ? parsedTarget
        : null
    onAdd(name.trim(), {
      unit: unit.trim() || null,
      targetPerDay,
      category: category.trim() || null,
      color: HABIT_ACCENT_PRESETS.find((p) => p.id === accentId)?.hex ?? null,
      ...buildHabitSchedulePayload(scheduleType, scheduleDays, weeklyTargetRaw, monthlyTargetRaw),
    })
  }

  return (
    <div className="space-y-2">
      <label className="block text-base text-(--text-muted) font-gaming">Nazwa nawyku</label>
      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
          autoFocus
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">
              Kategoria
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
              placeholder="np. Zdrowie"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">
              Harmonogram
            </label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as HabitScheduleType)}
              className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
            >
              {Object.entries(SCHEDULE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {scheduleType === 'weekdays' && (
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_SHORT_PL.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleScheduleDayValue(i, setScheduleDays)}
                className={`rounded-lg border px-3 py-2 text-base ${
                  scheduleDays.includes(i)
                    ? 'border-(--accent-green)/50 bg-(--accent-green)/15 text-(--accent-green)'
                    : 'border-(--border) text-(--text-muted)'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
        {scheduleType === 'weekly' && (
          <input
            type="text"
            inputMode="numeric"
            value={weeklyTargetRaw}
            onChange={(e) => setWeeklyTargetRaw(sanitizeGoalNumber(e.target.value))}
            className="w-full max-w-xs px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
            placeholder="Ile razy w tygodniu, np. 3"
          />
        )}
        {scheduleType === 'monthly' && (
          <input
            type="text"
            inputMode="numeric"
            value={monthlyTargetRaw}
            onChange={(e) => setMonthlyTargetRaw(sanitizeGoalNumber(e.target.value))}
            className="w-full max-w-xs px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
            placeholder="Ile razy w miesiącu, np. 12"
          />
        )}
        <div>
          <label className="block text-base text-(--text-muted) font-gaming mb-2">
            Kolor nawyku
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kolor nowego nawyku">
            {HABIT_ACCENT_PRESETS.map((p) => {
              const selected = accentId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.label}
                  aria-label={p.label}
                  aria-pressed={selected}
                  onClick={() => setAccentId(p.id)}
                  className={`h-8 w-8 shrink-0 rounded-full border-2 transition-transform ${
                    selected
                      ? 'scale-105 ring-2 ring-(--text-primary) ring-offset-2 ring-offset-(--bg-card)'
                      : 'border-(--border) hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">
              Jednostka (opcj., np. km)
            </label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
              placeholder="np. km"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">
              Cel dziennie (opcj.)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={targetRaw}
              onChange={(e) => setTargetRaw(sanitizeGoalNumber(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
              placeholder="np. 10"
            />
          </div>
        </div>
        <p className="text-base text-(--text-muted)">
          Bez jednostki i celu — nawyk binarny (klik = tak/nie). Z jednostką lub celem — wpisujesz
          liczby i widzisz pasek wypełnienia.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming hover:bg-(--accent-green)/25 hover:border-(--accent-green)/50 transition-colors"
          >
            Dodaj
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) hover:text-(--text-primary) hover:border-(--border) transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}

function HabitDayEditor({
  habit,
  date,
  measurable,
  accentHex,
  onSave,
  onRemove,
  onClose,
}: {
  habit: HabitItem
  date: string
  measurable: boolean
  accentHex: string
  onSave: (
    value: number | null,
    extras: { status: HabitCheckInStatus; note: string | null }
  ) => Promise<boolean>
  onRemove: () => void
  onClose: () => void
}) {
  const checkIn = checkInForDay(habit, date)
  const [valueRaw, setValueRaw] = useState(() =>
    checkIn?.value != null && checkIn.value > 0 ? String(checkIn.value) : ''
  )
  const [status, setStatus] = useState<HabitCheckInStatus>(checkIn?.status ?? 'done')
  const [note, setNote] = useState(checkIn?.note ?? '')

  useEffect(() => {
    const next = checkInForDay(habit, date)
    setValueRaw(next?.value != null && next.value > 0 ? String(next.value) : '')
    setStatus(next?.status ?? 'done')
    setNote(next?.note ?? '')
  }, [habit, date])

  return (
    <div className="mt-2 w-full space-y-4 rounded-lg border border-(--border) bg-(--bg-card)/25 p-4 sm:p-5">
      <p className="text-base font-medium text-(--text-primary)">Wpis dla dnia {date}</p>
      <div>
        <label
          htmlFor={`day-status-${habit.id}-${date}`}
          className="mb-1.5 block text-base text-(--text-muted)"
        >
          Status dnia
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CHECK_IN_STATUS_LABEL) as [HabitCheckInStatus, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-lg border px-3 py-1.5 text-base transition-colors ${
                  status === value
                    ? 'border-(--accent-cyan)/50 bg-(--accent-cyan)/15 text-(--accent-cyan)'
                    : 'border-(--border) text-(--text-muted) hover:bg-(--bg-card)'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>
      {measurable && (
        <div>
          <label
            htmlFor={`day-value-${habit.id}-${date}`}
            className="mb-1.5 block text-base text-(--text-muted)"
          >
            Wartość{habit.unit ? ` (${habit.unit})` : ''}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`day-value-${habit.id}-${date}`}
              type="text"
              inputMode="decimal"
              value={valueRaw}
              onChange={(e) => setValueRaw(sanitizeGoalNumber(e.target.value))}
              className="w-full max-w-xs rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
            />
            {habit.targetPerDay != null && habit.targetPerDay > 0 && (
              <button
                type="button"
                onClick={() => setValueRaw(String(habit.targetPerDay))}
                className="rounded-lg border border-(--border) px-3 py-2 text-base text-(--text-muted) hover:bg-(--bg-card) hover:text-(--text-primary)"
              >
                Użyj celu dziennego
              </button>
            )}
          </div>
        </div>
      )}
      <div>
        <label
          htmlFor={`day-note-${habit.id}-${date}`}
          className="mb-1.5 block text-base text-(--text-muted)"
        >
          Notatka
        </label>
        <textarea
          id={`day-note-${habit.id}-${date}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
          placeholder="np. energia, kontekst, przeszkody"
        />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-(--border)/60 pt-4">
        <button
          type="button"
          onClick={async () => {
            const n = parseGoalNumber(valueRaw)
            if (measurable && status === 'done' && (Number.isNaN(n) || n <= 0)) return
            const ok = await onSave(measurable ? n : null, {
              status,
              note: note.trim() || null,
            })
            if (ok) onClose()
          }}
          className="rounded-lg border px-4 py-2 text-base hover:opacity-90"
          style={{
            borderColor: hexAlpha(accentHex, 0.45),
            backgroundColor: hexAlpha(accentHex, 0.14),
            color: accentHex,
          }}
        >
          Zapisz
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card)"
        >
          Usuń dzień
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-base text-(--text-muted) hover:text-(--text-primary)"
        >
          Zamknij
        </button>
      </div>
    </div>
  )
}

export function Habits() {
  const { backdrop, panel } = useModalMotion()
  const reduceMotion = useReducedMotion()
  const { isDemoMode } = useAuth()
  const {
    habits,
    goals,
    addHabit,
    updateHabit,
    removeHabit,
    restoreHabit,
    deleteHabitPermanently,
    upsertHabitDayValue,
    removeHabitDay,
    addGoal,
    updateGoal,
    removeGoal,
    loading,
  } = useHabits()

  const [showHabitForm, setShowHabitForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showArchivedHabits, setShowArchivedHabits] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '0', unit: '' })
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingHabitName, setEditingHabitName] = useState('')
  const [editingHabitUnit, setEditingHabitUnit] = useState('')
  const [editingHabitTargetRaw, setEditingHabitTargetRaw] = useState('')
  const [editingHabitCategory, setEditingHabitCategory] = useState('')
  const [editingHabitScheduleType, setEditingHabitScheduleType] = useState<HabitScheduleType>('daily')
  const [editingHabitScheduleDays, setEditingHabitScheduleDays] = useState<number[]>([])
  const [editingHabitWeeklyTargetRaw, setEditingHabitWeeklyTargetRaw] = useState('')
  const [editingHabitMonthlyTargetRaw, setEditingHabitMonthlyTargetRaw] = useState('')
  const [editingHabitColor, setEditingHabitColor] = useState<string | null>(null)
  const [measurableEditor, setMeasurableEditor] = useState<{
    habitId: string
    date: string
  } | null>(null)
  const [habitPendingDelete, setHabitPendingDelete] = useState<{
    id: string
    name: string
    permanent?: boolean
  } | null>(null)
  const [goalPendingDelete, setGoalPendingDelete] = useState<{
    id: string
    name: string
    completed: boolean
  } | null>(null)
  const [goalToast, setGoalToast] = useState<{
    type: 'progress' | 'completed'
    goalId: string
    goalName: string
    previousValue: number
  } | null>(null)
  const goalToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState({ name: '', target: '', unit: '', current: '' })
  const [showCompletedGoals, setShowCompletedGoals] = useState(false)
  /** Rozwinięty panel „środek” nawyku: wykres + rekord serii. */
  const [habitExpandedId, setHabitExpandedId] = useState<string | null>(null)
  /** Zakres czasu wykresu w panelu szczegółów (per nawyk). */
  const [habitChartPeriod, setHabitChartPeriod] = useState<
    Record<string, HabitChartPeriod>
  >({})
  const [habitCalendarMonth, setHabitCalendarMonth] = useState<Record<string, string>>({})
  const [habitAccentChoice, setHabitAccentChoice] = useState<Record<string, string>>(
    readHabitAccentStorage
  )

  const habitGrids = useMemo(
    () => habits.map((h) => getHabitGridDates(h)),
    [habits]
  )
  const habitGridById = useMemo(
    () =>
      Object.fromEntries(habits.map((h, i) => [h.id, habitGrids[i]] as const)),
    [habits, habitGrids]
  )
  const activeHabits = useMemo(() => habits.filter((h) => !h.archivedAt), [habits])
  const archivedHabits = useMemo(() => habits.filter((h) => !!h.archivedAt), [habits])
  const visibleHabits = showArchivedHabits ? archivedHabits : activeHabits
  const activeGoals = useMemo(() => goals.filter((g) => g.current < g.target), [goals])
  const completedGoals = useMemo(() => goals.filter((g) => g.current >= g.target), [goals])
  const visibleGoals = showCompletedGoals ? completedGoals : activeGoals

  /** 0 = najnowsze okno (ostatnie N dni); większa wartość = starsze okno (tylko wstecz w czasie). */
  const [habitGridSlider, setHabitGridSlider] = useState<Record<string, number>>({})

  const habitDetailPanelVariants = useMemo(
    () => ({
      hidden: reduceMotion
        ? { opacity: 0 }
        : { opacity: 0, y: 14, scale: 0.99 },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: reduceMotion ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const } : TODO_ITEM_SPRING,
      },
      leave: {
        opacity: 0,
        y: 6,
        transition: { duration: reduceMotion ? 0.1 : 0.15, ease: 'easeOut' as const },
      },
    }),
    [reduceMotion]
  )

  useLayoutEffect(() => {
    setHabitGridSlider((prev) => {
      const next = { ...prev }
      let changed = false
      habits.forEach((h, i) => {
        const len = habitGrids[i]?.dates.length ?? 0
        const maxS = Math.max(0, len - EMPTY_GRID_DAYS)
        const v = next[h.id] ?? 0
        if (v > maxS) {
          next[h.id] = maxS
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [habits, habitGrids])

  useEffect(() => {
    if (!habitPendingDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHabitPendingDelete(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [habitPendingDelete])

  useEffect(() => {
    if (!goalPendingDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGoalPendingDelete(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goalPendingDelete])

  const getStreak = (habit: HabitItem) => {
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const d = new Date(today)
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (habitDayIsDone(habit, key)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const handleAddGoal = () => {
    const name = newGoal.name.trim()
    const target = parseGoalNumber(newGoal.target)
    const current = parseGoalNumber(newGoal.current)
    if (!name || isNaN(target) || target <= 0) return
    addGoal({ name, target, current, unit: newGoal.unit.trim() || undefined })
    setNewGoal({ name: '', target: '', current: '0', unit: '' })
    setShowGoalForm(false)
  }

  if (loading) {
    return <SimplePageSkeleton titleWidth="w-44" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-(--text-primary) font-gaming tracking-wider">
          NAWYKI I CELE
        </h1>
        <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
          {isDemoMode ? 'Dane przykładowe' : 'Śledź nawyki i realizuj cele'}
        </p>
      </div>
      {/* Nawyki */}
      <Card title="Nawyki" className="border-(--accent-green)/20">
        <div className="flex flex-col">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchivedHabits(false)}
              className={`rounded-lg border px-3 py-2 text-base ${
                !showArchivedHabits
                  ? 'border-(--accent-green)/50 bg-(--accent-green)/15 text-(--accent-green)'
                  : 'border-(--border) text-(--text-muted) hover:bg-(--bg-card)'
              }`}
            >
              Aktywne ({activeHabits.length})
            </button>
            <button
              type="button"
              onClick={() => setShowArchivedHabits(true)}
              className={`rounded-lg border px-3 py-2 text-base ${
                showArchivedHabits
                  ? 'border-(--accent-cyan)/50 bg-(--accent-cyan)/15 text-(--accent-cyan)'
                  : 'border-(--border) text-(--text-muted) hover:bg-(--bg-card)'
              }`}
            >
              Archiwum ({archivedHabits.length})
            </button>
            {showArchivedHabits && (
              <span className="text-base text-(--text-muted)">
                Archiwalne nawyki są tylko do podglądu, możesz je przywrócić.
              </span>
            )}
          </div>
          {visibleHabits.map((habit, habitIdx) => {
            const { dates: gridDates, letters: gridDayLetters } = habitGridById[habit.id] ?? {
              dates: [],
              letters: [],
            }
            const maxStart = Math.max(0, gridDates.length - EMPTY_GRID_DAYS)
            const sliderBack = Math.min(habitGridSlider[habit.id] ?? 0, maxStart)
            const windowStart = maxStart - sliderBack
            const visibleDates = gridDates.slice(windowStart, windowStart + EMPTY_GRID_DAYS)
            const visibleLetters = gridDayLetters.slice(windowStart, windowStart + EMPTY_GRID_DAYS)
            const streak = getStreak(habit)
            const isEditing = editingHabitId === habit.id
            const isArchived = !!habit.archivedAt
            const isExpanded = habitExpandedId === habit.id
            const measurable = isMeasurableHabit(habit)
            const weekdayCompletionCounts = isExpanded
              ? countCompletionsByWeekday(habit, measurable)
              : [0, 0, 0, 0, 0, 0, 0]
            const sumLastPeriod = measurable ? sumLastNDays(habit, SUM_LAST_DAYS) : 0
            const longestStreak = isExpanded ? getLongestStreakDays(habit) : 0
            const chartPeriod = habitChartPeriod[habit.id] ?? '30d'
            const chartSeries = isExpanded ? buildHabitChartSeries(habit, measurable, chartPeriod) : []
            const weekdayStats = isExpanded ? computeWeekdayStats(habit, measurable) : null
            const chartScrollWide =
              chartSeries.length > 36 ||
              chartPeriod === 'all' ||
              chartPeriod === '90d'
            const chartInnerMinWidthPx = Math.max(320, chartSeries.length * 5)
            const xAxisInterval =
              chartPeriod === 'year'
                ? 0
                : chartSeries.length > 48
                  ? Math.max(2, Math.floor(chartSeries.length / 14))
                  : chartSeries.length > 28
                    ? Math.max(1, Math.floor(chartSeries.length / 12))
                    : ('preserveStartEnd' as const)
            const xAxisMinTickGap =
              chartPeriod === 'year' ? 8 : chartSeries.length > 36 ? 4 : 24
            const chartWeeklyAggregated =
              chartPeriod === 'all' &&
              chartSeries.length > 0 &&
              chartSeries.some((pt) => pt.label.includes('–'))
            const chartGradId = `hg${habit.id.replace(/[^a-zA-Z0-9]/g, '')}`
            const fallbackAccentId = defaultHabitAccentId(`${habit.id}-${habit.name}`)
            const accentHex =
              habit.color ?? resolveHabitAccentHex(habitAccentChoice, habit.id, fallbackAccentId)
            const stats7 = isExpanded ? computeHabitWindowStats(habit, 7) : null
            const stats30 = computeHabitWindowStats(habit, 30)
            const stats90 = isExpanded ? computeHabitWindowStats(habit, 90) : null
            const trend30 = isExpanded ? computeHabitTrend(habit, 30) : null
            const monthOptions = isExpanded ? buildHabitMonthOptions(habit) : []
            const selectedCalendarMonth =
              habitCalendarMonth[habit.id] ?? formatMonthKey(new Date())
            const currentMonthCalendar = isExpanded
              ? buildHabitMonthCalendar(habit, selectedCalendarMonth)
              : []
            const monthSummary = isExpanded
              ? computeHabitMonthSummary(habit, selectedCalendarMonth)
              : null

            return (
              <div
                key={habit.id}
                className={
                  habitIdx > 0 ? 'mt-10 border-t border-(--border)/45 pt-10' : ''
                }
              >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                className="flex flex-col gap-5 rounded-xl border border-(--border)/55 bg-(--bg-card)/20 p-4 transition-[border-color,box-shadow] duration-200 sm:p-5"
                style={{ '--habit-accent': accentHex } as CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = hexAlpha(accentHex, 0.38)
                  e.currentTarget.style.boxShadow = `0 0 0 1px ${hexAlpha(accentHex, 0.12)}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.removeProperty('border-color')
                  e.currentTarget.style.removeProperty('box-shadow')
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex min-w-0 flex-1 ${
                      isEditing
                        ? 'flex-col'
                        : 'flex-row flex-wrap items-center gap-3'
                    }`}
                  >
                    {isEditing ? (
                      <div className="w-full space-y-4 rounded-lg border border-(--border) bg-(--bg-card)/30 p-4">
                        <div>
                          <label
                            htmlFor={`edit-habit-name-${habit.id}`}
                            className="mb-1.5 block text-base text-(--text-muted)"
                          >
                            Nazwa
                          </label>
                          <input
                            id={`edit-habit-name-${habit.id}`}
                            value={editingHabitName}
                            onChange={(e) => setEditingHabitName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingHabitId(null)
                            }}
                            className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                            autoFocus
                            placeholder="Np. Bieg"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`edit-habit-category-${habit.id}`}
                              className="mb-1.5 block text-base text-(--text-muted)"
                            >
                              Kategoria
                            </label>
                            <input
                              id={`edit-habit-category-${habit.id}`}
                              value={editingHabitCategory}
                              onChange={(e) => setEditingHabitCategory(e.target.value)}
                              className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                              placeholder="np. Zdrowie"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`edit-habit-schedule-${habit.id}`}
                              className="mb-1.5 block text-base text-(--text-muted)"
                            >
                              Harmonogram
                            </label>
                            <select
                              id={`edit-habit-schedule-${habit.id}`}
                              value={editingHabitScheduleType}
                              onChange={(e) =>
                                setEditingHabitScheduleType(e.target.value as HabitScheduleType)
                              }
                              className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                            >
                              {Object.entries(SCHEDULE_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {editingHabitScheduleType === 'weekdays' && (
                          <div className="flex flex-wrap gap-2">
                            {WEEKDAY_SHORT_PL.map((day, i) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleScheduleDayValue(i, setEditingHabitScheduleDays)}
                                className={`rounded-lg border px-3 py-2 text-base ${
                                  editingHabitScheduleDays.includes(i)
                                    ? 'border-(--accent-cyan)/50 bg-(--accent-cyan)/15 text-(--accent-cyan)'
                                    : 'border-(--border) text-(--text-muted)'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        )}
                        {editingHabitScheduleType === 'weekly' && (
                          <div>
                            <label className="mb-1.5 block text-base text-(--text-muted)">
                              Ile razy w tygodniu
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editingHabitWeeklyTargetRaw}
                              onChange={(e) =>
                                setEditingHabitWeeklyTargetRaw(sanitizeGoalNumber(e.target.value))
                              }
                              className="w-full max-w-xs rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary)"
                              placeholder="np. 3"
                            />
                          </div>
                        )}
                        {editingHabitScheduleType === 'monthly' && (
                          <div>
                            <label className="mb-1.5 block text-base text-(--text-muted)">
                              Ile razy w miesiącu
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editingHabitMonthlyTargetRaw}
                              onChange={(e) =>
                                setEditingHabitMonthlyTargetRaw(sanitizeGoalNumber(e.target.value))
                              }
                              className="w-full max-w-xs rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary)"
                              placeholder="np. 12"
                            />
                          </div>
                        )}
                        <div>
                          <p className="mb-2 text-base font-medium text-(--text-primary)">
                            Opcje mierzalne
                          </p>
                          <p className="mb-3 text-base text-(--text-muted)">
                            Puste pole = nawyk binarny (klik tak/nie). Wpisz jednostkę lub cel, żeby
                            logować liczby i pasek postępu.
                          </p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor={`edit-habit-unit-${habit.id}`}
                                className="mb-1.5 block text-base text-(--text-muted)"
                              >
                                Jednostka
                              </label>
                              <input
                                id={`edit-habit-unit-${habit.id}`}
                                value={editingHabitUnit}
                                onChange={(e) => setEditingHabitUnit(e.target.value)}
                                className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                                placeholder="np. km, min"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`edit-habit-target-${habit.id}`}
                                className="mb-1.5 block text-base text-(--text-muted)"
                              >
                                Cel dziennie
                              </label>
                              <input
                                id={`edit-habit-target-${habit.id}`}
                                type="text"
                                inputMode="decimal"
                                value={editingHabitTargetRaw}
                                onChange={(e) =>
                                  setEditingHabitTargetRaw(sanitizeGoalNumber(e.target.value))
                                }
                                className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                                placeholder="opcjonalnie"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-base text-(--text-muted)">Kolor nawyku</p>
                          <div className="flex flex-wrap gap-2" role="group" aria-label="Kolor nawyku">
                            {HABIT_ACCENT_PRESETS.map((p) => {
                              const selected = (editingHabitColor ?? accentHex) === p.hex
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  title={p.label}
                                  aria-label={p.label}
                                  aria-pressed={selected}
                                  onClick={() => setEditingHabitColor(p.hex)}
                                  className={`h-7 w-7 shrink-0 rounded-full border-2 transition-transform ${
                                    selected
                                      ? 'ring-2 ring-(--text-primary) ring-offset-2 ring-offset-(--bg-card) scale-105'
                                      : 'border-(--border) hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: p.hex }}
                                />
                              )
                            })}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-(--border)/60 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const name = editingHabitName.trim()
                              if (!name) return
                              const unit = editingHabitUnit.trim() || null
                              const t = parseGoalNumber(editingHabitTargetRaw)
                              const targetPerDay =
                                editingHabitTargetRaw.trim() !== '' &&
                                !Number.isNaN(t) &&
                                t > 0
                                  ? t
                                  : null
                              updateHabit(habit.id, {
                                name,
                                unit,
                                targetPerDay,
                                category: editingHabitCategory.trim() || null,
                                color: editingHabitColor,
                                ...buildHabitSchedulePayload(
                                  editingHabitScheduleType,
                                  editingHabitScheduleDays,
                                  editingHabitWeeklyTargetRaw,
                                  editingHabitMonthlyTargetRaw
                                ),
                              })
                              if (editingHabitColor) {
                                setHabitAccentChoice((prev) => {
                                  const matched = HABIT_ACCENT_PRESETS.find(
                                    (p) => p.hex === editingHabitColor
                                  )
                                  if (!matched) return prev
                                  const next = { ...prev, [habit.id]: matched.id }
                                  writeHabitAccentStorage(next)
                                  return next
                                })
                              }
                              setEditingHabitId(null)
                            }}
                            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-base hover:opacity-90"
                            style={{
                              borderColor: hexAlpha(accentHex, 0.45),
                              backgroundColor: hexAlpha(accentHex, 0.14),
                              color: accentHex,
                            }}
                          >
                            <Check className="h-4 w-4 shrink-0" />
                            Zapisz
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingHabitId(null)}
                            className="flex items-center gap-2 rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card)"
                          >
                            <X className="h-4 w-4 shrink-0" />
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-w-0 items-start gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setHabitExpandedId((id) => (id === habit.id ? null : habit.id))
                          }
                          className="mt-0.5 shrink-0 rounded-md p-1 text-(--text-muted) transition-colors hover:bg-(--bg-card) hover:text-(--text-primary)"
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? 'Zwiń szczegóły nawyku'
                              : 'Rozwiń szczegóły: wykres i rekord serii'
                          }
                          title={
                            isExpanded
                              ? 'Zwiń szczegóły'
                              : 'Szczegóły: wykres i najdłuższa seria'
                          }
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-base">{habit.name}</p>
                          <p className="text-base text-(--text-muted) mt-0.5">
                            {[
                              habit.category,
                              formatHabitSchedule(habit),
                              measurable && habit.targetPerDay != null
                                ? `Cel: ${habit.targetPerDay} ${habit.unit ?? ''}/dzień`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {isArchived && (
                            <p className="mt-1 text-base text-(--text-muted)">
                              Zarchiwizowano: {habit.archivedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {!isEditing && streak > 0 && (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--accent-amber)/40 bg-(--accent-amber)/10 px-2.5 py-1 text-sm font-medium text-(--accent-amber)">
                        <Flame className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Seria: {pluralDays(streak)}
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      {isArchived ? (
                        <>
                        <button
                          type="button"
                          onClick={() => restoreHabit(habit.id)}
                          className="flex items-center gap-2 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/10 px-3 py-2 text-base text-(--accent-cyan) hover:bg-(--accent-cyan)/20"
                          title="Przywróć nawyk"
                        >
                          <Check className="h-4 w-4" />
                          Przywróć
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setHabitPendingDelete({
                              id: habit.id,
                              name: habit.name,
                              permanent: true,
                            })
                          }
                          className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                          title="Usuń na stałe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setHabitExpandedId(null)
                              setEditingHabitId(habit.id)
                              setEditingHabitName(habit.name)
                              setEditingHabitUnit(habit.unit ?? '')
                              setEditingHabitTargetRaw(
                                habit.targetPerDay != null ? String(habit.targetPerDay) : ''
                              )
                              setEditingHabitCategory(habit.category ?? '')
                              setEditingHabitScheduleType(habit.scheduleType)
                              setEditingHabitScheduleDays(habit.scheduleDays)
                              setEditingHabitWeeklyTargetRaw(
                                habit.weeklyTarget != null ? String(habit.weeklyTarget) : ''
                              )
                              setEditingHabitMonthlyTargetRaw(
                                habit.monthlyTarget != null ? String(habit.monthlyTarget) : ''
                              )
                              setEditingHabitColor(habit.color ?? null)
                            }}
                            className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                            title="Edytuj"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setHabitPendingDelete({ id: habit.id, name: habit.name })
                            }
                            className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                            title="Archiwizuj nawyk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="border-t border-(--border)/35 pt-4">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      {measurable && (
                        <p className="mb-1.5 text-base text-(--text-muted)">
                          Ostatnie {SUM_LAST_DAYS} dni
                          {sumLastPeriod > 0
                            ? ` · ${sumLastPeriod.toLocaleString('pl-PL')}${habit.unit ? ` ${habit.unit}` : ''}`
                            : ''}
                        </p>
                      )}
                      <p className="mb-1.5 text-xs text-(--text-muted)">
                        Kliknij dzień, aby oznaczyć wykonanie
                      </p>
                      <div className={HABIT_GRID_WRAP_CLASS}>
                        <div className="flex flex-col gap-1.5 py-1 pl-0.5 pr-0.5">
                          <div
                            className={`flex ${HABIT_GRID_COL_GAP} text-base font-medium leading-none text-(--text-muted)`}
                          >
                            {visibleLetters.map((letter: string, i: number) => (
                              <span
                                key={i}
                                className={`flex ${HABIT_GRID_CELL} shrink-0 items-center justify-center`}
                              >
                                {letter}
                              </span>
                            ))}
                          </div>
                          <div className={`flex ${HABIT_GRID_COL_GAP}`} role="group" aria-label="Zaznaczanie dni nawyku">
                            {visibleDates.map((date: string) => {
                              const checkIn = checkInForDay(habit, date)
                              const checked = !!checkIn
                              const pct =
                                checkIn?.status === 'done'
                                  ? dayFillPercent(habit, checkIn.value ?? null)
                                  : 0
                              const titleBits = [date]
                              if (checkIn?.status) titleBits.push(CHECK_IN_STATUS_LABEL[checkIn.status])
                              if (checkIn && checkIn.value != null && checkIn.value > 0) {
                                titleBits.push(`${checkIn.value} ${habit.unit ?? ''}`.trim())
                              } else if (checked) {
                                titleBits.push('zaznaczone')
                              }
                              if (checkIn?.note) titleBits.push(checkIn.note)
                              return (
                                <button
                                  key={date}
                                  type="button"
                                  onClick={() => {
                                    if (!isArchived) setMeasurableEditor({ habitId: habit.id, date })
                                  }}
                                  className={`relative ${HABIT_GRID_CELL} shrink-0 overflow-hidden rounded-md border transition-colors ${
                                    measurable
                                      ? 'border-(--border) hover:opacity-90'
                                      : checked
                                        ? 'border-transparent'
                                        : 'border-transparent bg-(--border) hover:bg-(--border)/80'
                                  } ${
                                    measurableEditor?.habitId === habit.id &&
                                    measurableEditor?.date === date
                                      ? 'z-10 ring-2 ring-(--accent-cyan) ring-offset-2 ring-offset-(--bg-card)'
                                      : ''
                                  }`}
                                  title={titleBits.join(' — ')}
                                >
                                  {measurable ? (
                                    <>
                                      <span className="absolute inset-0 bg-(--border)" />
                                      <span
                                        className="absolute bottom-0 left-0 right-0"
                                        style={{
                                          height: `${pct}%`,
                                          backgroundColor: hexAlpha(accentHex, 0.92),
                                        }}
                                      />
                                      {checkIn?.status && checkIn.status !== 'done' && (
                                        <span
                                          className="absolute right-1 top-1 h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor:
                                              checkIn.status === 'missed' ? '#f87171' : '#94a3b8',
                                          }}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <span
                                      className={`block h-full w-full rounded-sm ${
                                        checked ? '' : 'bg-(--border) hover:bg-(--border)/80'
                                      }`}
                                      style={
                                        checked
                                          ? {
                                              backgroundColor:
                                                checkIn?.status === 'missed'
                                                  ? '#f87171'
                                                  : checkIn?.status === 'skipped'
                                                    ? '#94a3b8'
                                                    : accentHex,
                                            }
                                          : undefined
                                      }
                                    />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        {maxStart > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            <label
                              htmlFor={`habit-history-${habit.id}`}
                              className="sr-only"
                            >
                              Przesuń w prawo, by zobaczyć starsze dni (bieżące okno po lewej stronie suwaka)
                            </label>
                            <input
                              id={`habit-history-${habit.id}`}
                              type="range"
                              min={0}
                              max={maxStart}
                              step={1}
                              value={sliderBack}
                              onChange={(e) => {
                                const v = Number(e.target.value)
                                setHabitGridSlider((p) => ({ ...p, [habit.id]: v }))
                              }}
                              className="h-2 w-full max-w-[min(100%,27rem)] cursor-pointer"
                              style={{ accentColor: accentHex }}
                              title="W prawo — starsze dni; w lewo — ostatnie 10 dni"
                            />
                          </div>
                        )}
                        {visibleDates.length > 0 && (
                          <p className="mt-1.5 text-xs text-(--text-muted)" aria-live="polite">
                            {formatVisibleDateRange(visibleDates)}
                          </p>
                        )}
                      </div>
                    </div>
                    {stats30 && !isEditing && (
                      <div className="shrink-0 space-y-1 pt-0.5 text-right">
                        <p className="text-xs text-(--text-muted)">30 dni</p>
                        <p
                          className="text-lg font-semibold tabular-nums"
                          style={{ color: accentHex }}
                        >
                          {stats30.pct}%
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {stats30.done}/{Math.max(1, stats30.planned - stats30.skipped)}
                        </p>
                        {measurable && stats30.avgValue != null && (
                          <p className="text-xs text-(--text-muted)">
                            śr.&nbsp;{stats30.avgValue.toFixed(1)}{habit.unit ? `\u00a0${habit.unit}` : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {measurableEditor?.habitId === habit.id && (
                    <HabitDayEditor
                      habit={habit}
                      date={measurableEditor.date}
                      measurable={measurable}
                      accentHex={accentHex}
                      onSave={(value, extras) =>
                        upsertHabitDayValue(habit.id, measurableEditor.date, value, extras)
                      }
                      onRemove={() => {
                        removeHabitDay(habit.id, measurableEditor.date)
                        setMeasurableEditor(null)
                      }}
                      onClose={() => setMeasurableEditor(null)}
                    />
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {isExpanded && !isEditing && (
                    <motion.div
                      key={`habit-expanded-${habit.id}`}
                      variants={habitDetailPanelVariants}
                      initial="hidden"
                      animate="show"
                      exit="leave"
                      className="space-y-6 rounded-lg border border-(--border)/50 bg-(--bg-card)/15 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-base text-(--text-primary)">
                        <Award className="h-5 w-5 shrink-0 text-(--accent-amber)" aria-hidden />
                        <span>
                          Najdłuższa seria:{' '}
                          <span className="font-semibold tabular-nums">{pluralDays(longestStreak)}</span>
                        </span>
                      </div>
                      {stats7 && stats30 && stats90 && (
                      <div className="flex flex-wrap gap-2">
                        {[
                          ['7 dni', stats7],
                          ['30 dni', stats30],
                          ['90 dni', stats90],
                        ].map(([label, stat]) => {
                          const s = stat as typeof stats7
                          return (
                            <div
                              key={label as string}
                              className="flex items-baseline gap-2 rounded-lg border border-(--border)/35 bg-(--bg-dark)/10 px-3 py-2"
                            >
                              <span className="text-base text-(--text-muted)">{label as string}</span>
                              <span className="text-base font-semibold tabular-nums text-(--text-primary)">
                                {s.pct}%
                              </span>
                              <span className="text-sm text-(--text-muted)">
                                {s.done}/{Math.max(1, s.planned - s.skipped)}
                              </span>
                              {measurable && s.avgValue != null && (
                                <span className="text-sm text-(--text-muted)">
                                  śr.&nbsp;{s.avgValue.toFixed(1)}&nbsp;{habit.unit ?? ''}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      )}
                      {trend30 != null && (
                      <p className="text-base text-(--text-muted)">
                        Trend 30 dni względem poprzednich 30 dni:{' '}
                        <span
                          className={
                            trend30 >= 0 ? 'text-(--accent-green)' : 'text-red-400'
                          }
                        >
                          {trend30 >= 0 ? '+' : ''}
                          {trend30} pp
                        </span>
                      </p>
                      )}
                      <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-medium text-(--text-primary)">Analiza</span>
                          <select
                            id={`habit-chart-period-${habit.id}`}
                            value={chartPeriod}
                            onChange={(e) =>
                              setHabitChartPeriod((prev) => ({
                                ...prev,
                                [habit.id]: e.target.value as HabitChartPeriod,
                              }))
                            }
                            className="w-auto rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                          >
                            <option value="30d">Ostatnie 30 dni</option>
                            <option value="90d">Ostatnie 90 dni</option>
                            <option value="month">Ten miesiąc</option>
                            <option value="year">Ostatni rok (miesiące)</option>
                            <option value="all">Cała historia</option>
                          </select>
                        </div>
                        {chartWeeklyAggregated && (
                          <p className="text-base text-(--text-muted)">
                            Długa historia: wykres po tygodniach (średnia), powyżej{' '}
                            {CHART_ALL_MAX_DAILY_POINTS} dni.
                          </p>
                        )}
                        <div
                          className={`w-full min-w-0 min-h-[160px] ${chartScrollWide ? 'overflow-x-auto pb-1' : ''}`}
                        >
                          <div
                            className="h-[180px] min-h-[160px]"
                            style={
                              chartScrollWide
                                ? { minWidth: chartInnerMinWidthPx }
                                : undefined
                            }
                          >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartSeries} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                              <defs>
                                <linearGradient id={chartGradId} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={accentHex} stopOpacity={0.35} />
                                  <stop offset="95%" stopColor={accentHex} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis
                                dataKey="label"
                                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                interval={xAxisInterval}
                                minTickGap={xAxisMinTickGap}
                              />
                              <YAxis
                                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                width={40}
                                domain={[0, 100]}
                                tickFormatter={(v: number) => `${v}%`}
                              />
                              <Tooltip
                                cursor={{ stroke: 'var(--border)' }}
                                contentStyle={{
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                }}
                                labelFormatter={(_label, payload) => {
                                  const p = payload?.[0]?.payload as HabitChartPoint | undefined
                                  if (!p) return ''
                                  if (p.label.includes('–')) return p.label
                                  if (!p.fullDate) return p.label
                                  if (chartPeriod === 'year') {
                                    return parseLocalYmd(p.fullDate).toLocaleDateString('pl-PL', {
                                      month: 'long',
                                      year: 'numeric',
                                    })
                                  }
                                  return parseLocalYmd(p.fullDate).toLocaleDateString('pl-PL', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                }}
                                formatter={(value: unknown, _n, item) => {
                                  const p = item?.payload as HabitChartPoint
                                  const pct = typeof value === 'number' ? value : (p?.pct ?? 0)
                                  const parts: string[] = [`${Math.round(pct)}% realizacji`]
                                  if (
                                    measurable &&
                                    p?.fullDate &&
                                    chartPeriod !== 'year' &&
                                    !p.label.includes('–')
                                  ) {
                                    const raw = checkInForDay(habit, p.fullDate)?.value
                                    if (raw != null && raw > 0) {
                                      parts.push(
                                        `${raw}${habit.unit ? ` ${habit.unit}` : ''} (dzień)`
                                      )
                                    }
                                  }
                                  if (
                                    !measurable &&
                                    chartPeriod !== 'year' &&
                                    p?.rollingDone != null &&
                                    !p.label.includes('–')
                                  ) {
                                    parts.push(
                                      `${p.rollingDone}/${BINARY_CHART_ROLLING_DAYS} dni w oknie`
                                    )
                                  }
                                  if (chartPeriod === 'year') {
                                    parts.push(
                                      measurable
                                        ? 'średnia dzienna realizacja w miesiącu'
                                        : 'średnia: % dni z wpisem w miesiącu'
                                    )
                                  }
                                  if (p.label.includes('–')) {
                                    parts.push(
                                      measurable
                                        ? 'średnia dzienna w tygodniu'
                                        : 'średnia okna binarnego w tygodniu'
                                    )
                                  }
                                  return [parts.join(' · '), 'Realizacja']
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="pct"
                                stroke={accentHex}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#${chartGradId})`}
                                name="Realizacja"
                                baseValue={0}
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          </div>
                        </div>
                        <details className="rounded-lg border border-(--border)/40 bg-(--bg-dark)/10 [&_summary::-webkit-details-marker]:hidden">
                          <summary className="cursor-pointer list-none px-4 py-3.5 text-base text-(--text-muted) hover:text-(--text-primary)">
                            Kalendarz miesiąca
                          </summary>
                          <div className="border-t border-(--border)/30 p-4">
                            <div className="mb-3">
                              <label
                                htmlFor={`habit-calendar-month-${habit.id}`}
                                className="mb-1.5 block text-base text-(--text-muted)"
                              >
                                Miesiąc
                              </label>
                              {monthOptions.length > 1 ? (
                                <select
                                  id={`habit-calendar-month-${habit.id}`}
                                  value={selectedCalendarMonth}
                                  onChange={(e) =>
                                    setHabitCalendarMonth((prev) => ({
                                      ...prev,
                                      [habit.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full max-w-xs rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                                >
                                  {monthOptions.map((month) => (
                                    <option key={month.key} value={month.key}>
                                      {month.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-base text-(--text-primary)">
                                  {formatMonthLabel(selectedCalendarMonth)}
                                </p>
                              )}
                            </div>
                            {monthSummary && (
                              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-lg border border-(--border)/40 bg-(--bg-card)/20 p-3">
                                  <p className="text-base text-(--text-muted)">Realizacja</p>
                                  <p className="text-xl font-semibold tabular-nums text-(--text-primary)">
                                    {monthSummary.pct}%
                                  </p>
                                  <p className="text-base text-(--text-muted)">
                                    {monthSummary.done}/{Math.max(1, monthSummary.expected - monthSummary.skipped)}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-(--border)/40 bg-(--bg-card)/20 p-3">
                                  <p className="text-base text-(--text-muted)">Pominięte</p>
                                  <p className="text-xl font-semibold tabular-nums text-red-400">
                                    {monthSummary.missed}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-(--border)/40 bg-(--bg-card)/20 p-3">
                                  <p className="text-base text-(--text-muted)">Uspraw.</p>
                                  <p className="text-xl font-semibold tabular-nums text-slate-300">
                                    {monthSummary.skipped}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-(--border)/40 bg-(--bg-card)/20 p-3">
                                  <p className="text-base text-(--text-muted)">Plan</p>
                                  <p className="text-xl font-semibold tabular-nums text-(--text-primary)">
                                    {monthSummary.expected}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-base text-(--text-muted)">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-sm"
                                  style={{ backgroundColor: hexAlpha(accentHex, 0.65) }}
                                />
                                Zrobione
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-3 w-3 rounded-sm bg-red-400/70" />
                                Pominięte
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-3 w-3 rounded-sm bg-slate-400/70" />
                                Usprawiedliwione
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-3 w-3 rounded-sm border border-(--border)" />
                                Brak wpisu
                              </span>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                              {WEEKDAY_SHORT_PL_MONDAY_FIRST.map((day) => (
                                <span
                                  key={day}
                                  className="flex h-7 items-center justify-center text-xs font-medium text-(--text-muted)"
                                >
                                  {day}
                                </span>
                              ))}
                              {currentMonthCalendar.map((day) =>
                                day.kind === 'blank' ? (
                                  <span key={day.key} aria-hidden className="h-9" />
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isArchived}
                                    key={day.date}
                                    onClick={() =>
                                      setMeasurableEditor({ habitId: habit.id, date: day.date })
                                    }
                                    title={`${day.date} — ${
                                      day.status === 'empty'
                                        ? 'brak wpisu'
                                        : CHECK_IN_STATUS_LABEL[day.status]
                                    }`}
                                    className={`flex h-9 items-center justify-center rounded-md border text-xs tabular-nums text-(--text-primary) transition-transform hover:scale-105 disabled:cursor-default disabled:hover:scale-100 ${
                                      measurableEditor?.habitId === habit.id &&
                                      measurableEditor.date === day.date
                                        ? 'border-(--accent-cyan) ring-2 ring-(--accent-cyan)/50'
                                        : 'border-(--border)/40'
                                    }`}
                                    style={{
                                      backgroundColor:
                                        day.status === 'done'
                                          ? hexAlpha(accentHex, Math.max(0.16, day.pct / 120))
                                          : day.status === 'missed'
                                            ? 'rgba(248,113,113,0.22)'
                                            : day.status === 'skipped'
                                              ? 'rgba(148,163,184,0.22)'
                                              : 'transparent',
                                    }}
                                  >
                                    {day.day}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </details>
                        {weekdayStats && weekdayStats.bestIdx != null && (
                          <details className="rounded-lg border border-(--border)/40 bg-(--bg-dark)/10 [&_summary::-webkit-details-marker]:hidden">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-base text-(--text-muted) hover:text-(--text-primary)">
                              <span className="text-(--text-primary)">Dzień tygodnia</span>
                              {' · '}
                              najlepiej we {WEEKDAY_ACCUSATIVE_PL[weekdayStats.bestIdx]}
                              {weekdayStats.maxAvg > 0 && (
                                <> (śr. {Math.round(weekdayStats.maxAvg)}%)</>
                              )}
                            </summary>
                            <div
                              className="border-t border-(--border)/30 px-5 pb-5 pt-4 sm:px-7"
                              role="img"
                              aria-label="Średnia realizacja wg dnia tygodnia"
                            >
                              <div className="grid min-h-30 grid-cols-7 items-end gap-x-2 sm:gap-x-3">
                                {WEEKDAY_SHORT_PL.map((wd, i) => (
                                  <div
                                    key={wd}
                                    className="flex min-h-0 min-w-0 flex-col items-center justify-end gap-2"
                                  >
                                    <div className="flex h-12 w-full items-end justify-center rounded-md bg-(--bg-card)/40 px-1">
                                      <div
                                        className="w-3.5 max-w-full shrink-0 rounded-t-sm sm:w-4"
                                        style={{
                                          height: `${Math.max(
                                            3,
                                            Math.round((weekdayStats.avg[i] / 100) * 44)
                                          )}px`,
                                          backgroundColor: accentHex,
                                          opacity:
                                            weekdayStats.bestIdx === i ? 1 : 0.42,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className="w-full text-center text-xs tabular-nums leading-none tracking-tight text-(--text-muted)"
                                      title={weekdayCountTitle(i, weekdayCompletionCounts[i])}
                                    >
                                      {weekdayCompletionCounts[i]}×
                                    </span>
                                    <span className="w-full text-center text-xs leading-tight text-(--text-muted)">
                                      {wd}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </details>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--text-muted)">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: hexAlpha(accentHex, 0.75) }}
                            />
                            Zrobione
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-red-400/70" />
                            Pominięte
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400/70" />
                            Usprawiedliwione
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm border border-(--border)" />
                            Brak wpisu
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              </div>
            )
          })}

          {visibleHabits.length === 0 && (
            <p className="rounded-lg border border-(--border)/40 bg-(--bg-card)/15 p-4 text-base text-(--text-muted)">
              {showArchivedHabits
                ? 'Brak zarchiwizowanych nawyków.'
                : 'Nie masz jeszcze aktywnych nawyków.'}
            </p>
          )}

          {!showArchivedHabits && (
          <div
            className={
              activeHabits.length > 0
                ? 'mt-10 border-t border-(--border)/40 pt-8'
                : 'mt-2'
            }
          >
          <AnimatePresence>
            {showHabitForm ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
              >
                <HabitCreateForm
                  onAdd={(name, extras) => {
                    addHabit(name, extras)
                    setShowHabitForm(false)
                  }}
                  onCancel={() => setShowHabitForm(false)}
                />
              </motion.div>
            ) : (
              <button
                onClick={() => setShowHabitForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming hover:bg-(--accent-green)/25 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj nawyk
              </button>
            )}
          </AnimatePresence>
          </div>
          )}
        </div>
      </Card>

      {/* Cele */}
      <Card title="Cele" className="border-(--accent-cyan)/20">
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCompletedGoals(false)}
              className={`rounded-lg border px-3 py-2 text-base ${
                !showCompletedGoals
                  ? 'border-(--accent-cyan)/50 bg-(--accent-cyan)/15 text-(--accent-cyan)'
                  : 'border-(--border) text-(--text-muted) hover:bg-(--bg-card)'
              }`}
            >
              Aktywne ({activeGoals.length})
            </button>
            <button
              type="button"
              onClick={() => setShowCompletedGoals(true)}
              className={`rounded-lg border px-3 py-2 text-base ${
                showCompletedGoals
                  ? 'border-(--accent-green)/50 bg-(--accent-green)/15 text-(--accent-green)'
                  : 'border-(--border) text-(--text-muted) hover:bg-(--bg-card)'
              }`}
            >
              Ukończone ({completedGoals.length})
            </button>
          </div>

          {visibleGoals.map((goal) => {
            const pct = Math.min(100, (goal.current / goal.target) * 100)
            const pctRounded = Math.round(pct)
            const isEditing = editingGoalId === goal.id
            const remaining = Math.max(0, goal.target - goal.current)
            const step = goalQuickStep(goal.target)
            const chip = goalStatusChip(pctRounded)

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                className="rounded-lg border border-(--border) bg-(--bg-dark) p-4 hover:border-(--accent-cyan)/25 transition-colors"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-base text-(--text-muted)">Nazwa</label>
                      <input
                        value={editingGoal.name}
                        onChange={(e) => setEditingGoal((g) => ({ ...g, name: e.target.value }))}
                        className="w-full rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-base text-(--text-muted)">Cel</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingGoal.target}
                          onChange={(e) =>
                            setEditingGoal((g) => ({ ...g, target: sanitizeGoalNumber(e.target.value) }))
                          }
                          className="w-full rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-base text-(--text-muted)">Jednostka</label>
                        <input
                          value={editingGoal.unit}
                          onChange={(e) => setEditingGoal((g) => ({ ...g, unit: e.target.value }))}
                          className="w-full rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
                          placeholder="np. km, zł, książka"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-base text-(--text-muted)">Postęp (obecnie)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editingGoal.current ?? String(goal.current)}
                        onChange={(e) =>
                          setEditingGoal((g) => ({ ...g, current: sanitizeGoalNumber(e.target.value) }))
                        }
                        className="w-full max-w-xs rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-(--border)/60 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const target = parseGoalNumber(editingGoal.target)
                          const current = editingGoal.current != null ? parseGoalNumber(editingGoal.current) : goal.current
                          if (editingGoal.name.trim() && !isNaN(target) && target > 0) {
                            updateGoal(goal.id, {
                              name: editingGoal.name.trim(),
                              target,
                              current: Math.min(current, target),
                              unit: editingGoal.unit.trim() || undefined,
                            })
                            setEditingGoalId(null)
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/15 px-4 py-2 text-base text-(--accent-cyan) hover:bg-(--accent-cyan)/25"
                      >
                        <Check className="w-4 h-4" />
                        Zapisz
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGoalId(null)}
                        className="flex items-center gap-1.5 rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card)"
                      >
                        <X className="w-4 h-4" />
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header row: name + status chip + pct */}
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="font-medium text-base leading-snug">{goal.name}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        {chip && (
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${chip.cls}`}>
                            {chip.label}
                          </span>
                        )}
                        <span className="text-base font-semibold tabular-nums text-(--text-primary)">
                          {pctRounded}%
                        </span>
                      </div>
                    </div>
                    {/* Subline: progress + insight */}
                    <p className="mb-3 text-base text-(--text-muted)">
                      {goal.current.toLocaleString('pl-PL')} / {goal.target.toLocaleString('pl-PL')}
                      {goal.unit ? ` ${goal.unit}` : ''}
                      {remaining > 0
                        ? ` · Zostało: ${remaining.toLocaleString('pl-PL')}${goal.unit ? ` ${goal.unit}` : ''}`
                        : ' · Cel osiągnięty!'}
                    </p>
                    {/* Progress bar */}
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-(--bg-card)">
                      <div
                        className="h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
                        style={{
                          width: `${pct}%`,
                          background:
                            pctRounded >= 100
                              ? 'var(--accent-green)'
                              : 'linear-gradient(to right, var(--accent-cyan), var(--accent-green))',
                        }}
                      />
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = Math.min(goal.current + step, goal.target)
                            const isNowCompleted = newValue >= goal.target
                            const prevValue = goal.current
                            updateGoal(goal.id, { current: newValue })
                            if (goalToastTimerRef.current) clearTimeout(goalToastTimerRef.current)
                            setGoalToast({
                              type: isNowCompleted ? 'completed' : 'progress',
                              goalId: goal.id,
                              goalName: goal.name,
                              previousValue: prevValue,
                            })
                            goalToastTimerRef.current = setTimeout(() => {
                              setGoalToast(null)
                              if (isNowCompleted) setShowCompletedGoals(true)
                            }, isNowCompleted ? 2500 : 5000)
                          }}
                          className="flex items-center gap-1 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/10 px-3 py-1.5 text-base text-(--accent-cyan) hover:bg-(--accent-cyan)/20 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0" />
                          {step}{goal.unit ? ` ${goal.unit}` : ''}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGoalId(goal.id)
                          setEditingGoal({
                            name: goal.name,
                            target: String(goal.target),
                            unit: goal.unit ?? '',
                            current: String(goal.current),
                          })
                        }}
                        className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                        title="Edytuj cel"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setGoalPendingDelete({
                            id: goal.id,
                            name: goal.name,
                            completed: pctRounded >= 100,
                          })
                        }
                        className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                        title="Usuń cel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}

          {visibleGoals.length === 0 && (
            <p className="rounded-lg border border-(--border)/40 bg-(--bg-card)/15 p-4 text-base text-(--text-muted)">
              {showCompletedGoals ? 'Brak ukończonych celów.' : 'Brak aktywnych celów.'}
            </p>
          )}

          {!showCompletedGoals && <AnimatePresence>
            {showGoalForm ? (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddGoal()
                }}
                className="space-y-3 p-3 rounded-lg bg-(--bg-dark) border border-(--border)"
              >
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa celu</label>
                  <input
                    value={newGoal.name}
                    onChange={(e) => setNewGoal((g) => ({ ...g, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Obecnie</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newGoal.current}
                      onChange={(e) => setNewGoal((g) => ({ ...g, current: sanitizeGoalNumber(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Cel</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal((g) => ({ ...g, target: sanitizeGoalNumber(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Jednostka</label>
                    <input
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal((g) => ({ ...g, unit: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/25 hover:border-(--accent-cyan)/50 transition-colors"
                  >
                    Dodaj
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) hover:text-(--text-primary) hover:border-(--border) transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </motion.form>
            ) : (
              <button
                onClick={() => setShowGoalForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/25 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj cel
              </button>
            )}
          </AnimatePresence>}
        </div>
      </Card>

      {createPortal(
        <AnimatePresence>
          {habitPendingDelete && (
            <>
              <motion.div
                key="habit-delete-backdrop"
                {...backdrop}
                className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
                onClick={() => setHabitPendingDelete(null)}
              />
              <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-24 pointer-events-none">
                <motion.div
                  key="habit-delete-panel"
                  {...panel}
                  className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="mb-2 text-lg font-bold text-(--text-primary) font-gaming">
                    {habitPendingDelete.permanent ? 'Usunąć na stałe?' : 'Zarchiwizować nawyk?'}
                  </h3>
                  <p className="mb-1 text-base text-(--text-muted)">
                    {habitPendingDelete.permanent
                      ? 'Ten nawyk i cała jego historia zostaną trwale usunięte. Tej operacji nie można cofnąć.'
                      : 'Nawyku nie będzie w aktywnej liście, ale historia zostanie w bazie.'}
                  </p>
                  <p className="mb-6 text-base font-medium text-(--text-primary)">
                    „{habitPendingDelete.name}”
                  </p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setHabitPendingDelete(null)}
                      className="rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const { id, permanent } = habitPendingDelete
                        if (permanent) {
                          deleteHabitPermanently(id)
                        } else {
                          removeHabit(id)
                        }
                        if (measurableEditor?.habitId === id) setMeasurableEditor(null)
                        if (editingHabitId === id) setEditingHabitId(null)
                        if (habitExpandedId === id) setHabitExpandedId(null)
                        setHabitAccentChoice((prev) => {
                          if (!(id in prev)) return prev
                          const next = { ...prev }
                          delete next[id]
                          writeHabitAccentStorage(next)
                          return next
                        })
                        setHabitChartPeriod((prev) => {
                          if (!(id in prev)) return prev
                          const next = { ...prev }
                          delete next[id]
                          return next
                        })
                        setHabitCalendarMonth((prev) => {
                          if (!(id in prev)) return prev
                          const next = { ...prev }
                          delete next[id]
                          return next
                        })
                        setHabitPendingDelete(null)
                      }}
                      className="rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-2 text-base text-red-400 hover:bg-red-500/25"
                    >
                      {habitPendingDelete.permanent ? 'Usuń na stałe' : 'Archiwizuj'}
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {goalPendingDelete && (
            <>
              <motion.div
                key="goal-delete-backdrop"
                {...backdrop}
                className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
                onClick={() => setGoalPendingDelete(null)}
              />
              <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-24 pointer-events-none">
                <motion.div
                  key="goal-delete-panel"
                  {...panel}
                  className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="mb-2 font-gaming text-lg font-bold text-(--text-primary)">
                    {goalPendingDelete.completed ? 'Usunąć ukończony cel?' : 'Usunąć cel?'}
                  </h3>
                  <p className="mb-1 text-base text-(--text-muted)">
                    {goalPendingDelete.completed
                      ? 'Ten cel został ukończony. Usunięcie jest nieodwracalne.'
                      : 'Cel zostanie trwale usunięty z listy. Tej operacji nie można cofnąć.'}
                  </p>
                  <p className="mb-6 text-base font-medium text-(--text-primary)">
                    „{goalPendingDelete.name}"
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setGoalPendingDelete(null)}
                      className="rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeGoal(goalPendingDelete.id)
                        setGoalPendingDelete(null)
                      }}
                      className="rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-2 text-base text-red-400 hover:bg-red-500/25"
                    >
                      Usuń
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {goalToast && createPortal(
        <AnimatePresence>
          <motion.div
            key="goal-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 z-10000 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-(--border) bg-(--bg-card) px-4 py-3 shadow-2xl"
          >
            {goalToast.type === 'completed' ? (
              <>
                <span className="text-base font-medium text-(--accent-green)">
                  Cel ukończony: {goalToast.goalName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateGoal(goalToast.goalId, { current: goalToast.previousValue })
                    if (goalToastTimerRef.current) clearTimeout(goalToastTimerRef.current)
                    setGoalToast(null)
                  }}
                  className="text-sm text-(--text-muted) underline hover:text-(--text-primary)"
                >
                  Cofnij
                </button>
              </>
            ) : (
              <>
                <span className="text-base text-(--text-muted)">
                  Dodano postęp · {goalToast.goalName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateGoal(goalToast.goalId, { current: goalToast.previousValue })
                    if (goalToastTimerRef.current) clearTimeout(goalToastTimerRef.current)
                    setGoalToast(null)
                  }}
                  className="text-sm font-medium text-(--accent-cyan) hover:opacity-80"
                >
                  Cofnij
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
