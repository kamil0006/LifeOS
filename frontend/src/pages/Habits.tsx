import { useState, useMemo, useEffect, useLayoutEffect, type CSSProperties } from 'react'
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
import { SimplePageSkeleton } from '../components/skeletons'
import { useModalMotion } from '../lib/modalMotion'
import { TODO_ITEM_SPRING } from '../lib/todoMotion'

/** Gdy nie ma żadnego wpisu — pokazujemy tyle dni kończąc na dziś (bez sztucznej historii). */
const EMPTY_GRID_DAYS = 10
/**
 * Szerokość siatki = EMPTY_GRID_DAYS × w-5 + (EMPTY_GRID_DAYS−1) × gap-1.5 → 15.875rem (widać naraz; starsze: suwak).
 */
const HABIT_GRID_WRAP_CLASS =
  'w-full max-w-[min(100%,15.875rem)] pb-1.5 self-start'
/** Suma pod kratką: ostatnie tyle dni od dziś. */
const SUM_LAST_DAYS = 10
/** Domyślny zakres wykresu nawyku (ostatnie N dni). */
const HABIT_CHART_DEFAULT_DAYS = 30

const HABIT_ACCENT_STORAGE_KEY = 'lifeos-habit-accents-v1'

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
  habitId: string
): string {
  const id = choiceByHabit[habitId] ?? HABIT_ACCENT_PRESETS[0].id
  return HABIT_ACCENT_PRESETS.find((p) => p.id === id)?.hex ?? HABIT_ACCENT_PRESETS[0].hex
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

type HabitChartPeriod = '30d' | 'month' | 'year'

type HabitChartPoint = {
  label: string
  /** Realizacja 0–100 % (cel dnia lub okno binarne). */
  pct: number
  fullDate?: string
  /** Dla binarnych (dzienne widoki): ile dni zaliczono w oknie 7 dni. */
  rollingDone?: number
}
const DAY_LETTERS = ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'] // niedziela, pon, wt, śr, czw, pt, sob

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
    const v = checkInForDay(habit, key)?.value
    if (v != null && v > 0) sum += v
  }
  return sum
}

/** Najdłuższa ciągła seria dni kalendarzowych z dowolnym wpisem. */
function getLongestStreakDays(checkIns: { date: string }[]): number {
  if (checkIns.length === 0) return 0
  const unique = [...new Set(checkIns.map((c) => c.date))].sort((a, b) =>
    a.localeCompare(b)
  )
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

const BINARY_ROLLING_DAYS = 7

function binaryRollingWindowMeta(habit: HabitItem, endDate: Date): { pct: number; done: number } {
  let done = 0
  for (let i = 0; i < BINARY_ROLLING_DAYS; i++) {
    const d = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    )
    d.setDate(d.getDate() - i)
    const key = formatLocalYmd(d)
    if (checkInForDay(habit, key)) done++
  }
  return { pct: (done / BINARY_ROLLING_DAYS) * 100, done }
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
      pct = dayFillPercent(habit, checkInForDay(habit, key)?.value ?? null)
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
          sum += dayFillPercent(habit, checkInForDay(habit, key)?.value ?? null)
        } else {
          sum += checkInForDay(habit, key) ? 100 : 0
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

  const out: HabitChartPoint[] = []
  for (let i = HABIT_CHART_DEFAULT_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    out.push(pushDaily(d))
  }
  return out
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
    toggleCheckIn,
    upsertHabitDayValue,
    addHabitDayDefault,
    removeHabitDay,
    addGoal,
    updateGoal,
    removeGoal,
    loading,
  } = useHabits()

  const [showHabitForm, setShowHabitForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitUnit, setNewHabitUnit] = useState('')
  const [newHabitTargetRaw, setNewHabitTargetRaw] = useState('')
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '0', unit: '' })
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingHabitName, setEditingHabitName] = useState('')
  const [editingHabitUnit, setEditingHabitUnit] = useState('')
  const [editingHabitTargetRaw, setEditingHabitTargetRaw] = useState('')
  const [measurableEditor, setMeasurableEditor] = useState<{
    habitId: string
    date: string
  } | null>(null)
  const [measurableEditorRaw, setMeasurableEditorRaw] = useState('')
  const [habitPendingDelete, setHabitPendingDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState({ name: '', target: '', unit: '' })
  const [currentInputRaw, setCurrentInputRaw] = useState<{ goalId: string; value: string } | null>(null)
  /** Rozwinięty panel „środek” nawyku: wykres + rekord serii. */
  const [habitExpandedId, setHabitExpandedId] = useState<string | null>(null)
  /** Zakres czasu wykresu w panelu szczegółów (per nawyk). */
  const [habitChartPeriod, setHabitChartPeriod] = useState<
    Record<string, HabitChartPeriod>
  >({})
  const [habitAccentChoice, setHabitAccentChoice] = useState<Record<string, string>>(
    readHabitAccentStorage
  )

  const habitGrids = useMemo(
    () => habits.map((h) => getHabitGridDates(h)),
    [habits]
  )

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
    if (!measurableEditor) return
    const h = habits.find((x) => x.id === measurableEditor.habitId)
    if (!h) return
    const v = checkInForDay(h, measurableEditor.date)?.value
    setMeasurableEditorRaw(v != null && v > 0 ? String(v) : '')
  }, [measurableEditor, habits])

  useEffect(() => {
    if (!habitPendingDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHabitPendingDelete(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [habitPendingDelete])

  const getStreak = (checkIns: { date: string }[]) => {
    const set = new Set(checkIns.map((c) => c.date))
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const d = new Date(today)
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (set.has(key)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    const unit = newHabitUnit.trim() || null
    const t = parseGoalNumber(newHabitTargetRaw)
    const targetPerDay =
      newHabitTargetRaw.trim() !== '' && !Number.isNaN(t) && t > 0 ? t : null
    addHabit(newHabitName.trim(), {
      unit,
      targetPerDay,
    })
    setNewHabitName('')
    setNewHabitUnit('')
    setNewHabitTargetRaw('')
    setShowHabitForm(false)
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
        <div className="space-y-4">
          {habits.map((habit, habitIdx) => {
            const { dates: gridDates, letters: gridDayLetters } = habitGrids[habitIdx] ?? {
              dates: [],
              letters: [],
            }
            const maxStart = Math.max(0, gridDates.length - EMPTY_GRID_DAYS)
            const sliderBack = Math.min(habitGridSlider[habit.id] ?? 0, maxStart)
            const windowStart = maxStart - sliderBack
            const visibleDates = gridDates.slice(windowStart, windowStart + EMPTY_GRID_DAYS)
            const visibleLetters = gridDayLetters.slice(windowStart, windowStart + EMPTY_GRID_DAYS)
            const streak = getStreak(habit.checkIns)
            const isEditing = editingHabitId === habit.id
            const measurable = isMeasurableHabit(habit)
            const sumLastPeriod = measurable ? sumLastNDays(habit, SUM_LAST_DAYS) : 0
            const longestStreak = getLongestStreakDays(habit.checkIns)
            const chartPeriod = habitChartPeriod[habit.id] ?? '30d'
            const chartSeries = buildHabitChartSeries(habit, measurable, chartPeriod)
            const chartGradId = `hg${habit.id.replace(/[^a-zA-Z0-9]/g, '')}`
            const habitAccentId = habitAccentChoice[habit.id] ?? HABIT_ACCENT_PRESETS[0].id
            const accentHex = resolveHabitAccentHex(habitAccentChoice, habit.id)

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                className="p-3 rounded-lg bg-(--bg-dark) border border-(--border) transition-[border-color] duration-200"
                style={{ '--habit-accent': accentHex } as CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = hexAlpha(accentHex, 0.42)
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.removeProperty('border-color')
                }}
              >
                <div className="mb-2 flex items-start justify-between gap-4">
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
                              updateHabit(habit.id, { name, unit, targetPerDay })
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
                          aria-expanded={habitExpandedId === habit.id}
                          aria-label={
                            habitExpandedId === habit.id
                              ? 'Zwiń szczegóły nawyku'
                              : 'Rozwiń szczegóły: wykres i rekord serii'
                          }
                          title={
                            habitExpandedId === habit.id
                              ? 'Zwiń szczegóły'
                              : 'Szczegóły: wykres i najdłuższa seria'
                          }
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              habitExpandedId === habit.id ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-base">{habit.name}</p>
                          {measurable && (
                            <p className="text-base text-(--text-muted) mt-0.5">
                              {habit.targetPerDay != null
                                ? `Cel: ${habit.targetPerDay} ${habit.unit ?? ''}/dzień`
                                : habit.unit
                                  ? `Jednostka: ${habit.unit} (bez ustalonego celu dnia)`
                                  : null}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {!isEditing && streak > 0 && (
                      <span className="flex items-center gap-1 text-sm text-(--accent-amber)">
                        <Flame className="w-4 h-4" />
                        {streak} dni
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
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
                        title="Usuń nawyk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {habitExpandedId === habit.id && !isEditing && (
                    <motion.div
                      key={`habit-expanded-${habit.id}`}
                      variants={habitDetailPanelVariants}
                      initial="hidden"
                      animate="show"
                      exit="leave"
                      className="mb-4 space-y-4 rounded-lg border border-(--border)/60 bg-(--bg-card)/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-base text-(--text-primary)">
                        <Award className="h-5 w-5 shrink-0 text-(--accent-amber)" aria-hidden />
                        <span>
                          Najdłuższa seria:{' '}
                          <span className="font-semibold tabular-nums">{longestStreak}</span> dni
                        </span>
                      </div>
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {(
                            [
                              { id: '30d' as const, label: '30 dni' },
                              { id: 'month' as const, label: 'Ten miesiąc' },
                              { id: 'year' as const, label: 'Rok' },
                            ] as const
                          ).map(({ id, label }) => {
                            const active = chartPeriod === id
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() =>
                                  setHabitChartPeriod((prev) => ({ ...prev, [habit.id]: id }))
                                }
                                className={`rounded-lg border px-3 py-1.5 text-base transition-colors ${
                                  active
                                    ? ''
                                    : 'border-(--border) text-(--text-muted) hover:border-(--border) hover:text-(--text-primary)'
                                }`}
                                style={
                                  active
                                    ? {
                                        borderColor: hexAlpha(accentHex, 0.5),
                                        backgroundColor: hexAlpha(accentHex, 0.14),
                                        color: accentHex,
                                      }
                                    : undefined
                                }
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Kolor nawyku">
                            {HABIT_ACCENT_PRESETS.map((p) => {
                              const selected = habitAccentId === p.id
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  title={p.label}
                                  aria-label={p.label}
                                  aria-pressed={selected}
                                  onClick={() => {
                                    setHabitAccentChoice((prev) => {
                                      const next = { ...prev, [habit.id]: p.id }
                                      writeHabitAccentStorage(next)
                                      return next
                                    })
                                  }}
                                  className={`h-8 w-8 shrink-0 rounded-full border-2 transition-transform ${
                                    selected
                                      ? 'ring-2 ring-(--text-primary) ring-offset-2 ring-offset-(--bg-card) scale-105'
                                      : 'border-(--border) hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: p.hex }}
                                />
                              )
                            })}
                        </div>
                        <div className="h-[200px] w-full min-h-[180px] min-w-0">
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
                                interval={chartPeriod === 'year' ? 0 : 'preserveStartEnd'}
                                minTickGap={chartPeriod === 'year' ? 8 : 24}
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
                                  if (!p?.fullDate) return p?.label ?? ''
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
                                formatter={(value: number | undefined, _n, item) => {
                                  const p = item?.payload as HabitChartPoint
                                  const pct = typeof value === 'number' ? value : (p?.pct ?? 0)
                                  const parts: string[] = [`${Math.round(pct)}% realizacji`]
                                  if (
                                    measurable &&
                                    p?.fullDate &&
                                    chartPeriod !== 'year'
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
                                    p?.rollingDone != null
                                  ) {
                                    parts.push(`${p.rollingDone}/${BINARY_ROLLING_DAYS} dni w oknie`)
                                  }
                                  if (chartPeriod === 'year') {
                                    parts.push(
                                      measurable
                                        ? 'średnia dzienna realizacja w miesiącu'
                                        : 'średnia: % dni z wpisem w miesiącu'
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
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex flex-col gap-1 items-start">
                  {measurable && (
                    <p className="text-base text-(--text-muted) mb-1">
                      Suma (ostatnie {SUM_LAST_DAYS} dni): {sumLastPeriod.toLocaleString('pl-PL')}
                      {habit.unit ? ` ${habit.unit}` : ''}
                    </p>
                  )}
                  <div className={HABIT_GRID_WRAP_CLASS}>
                    <div className="flex flex-col gap-1.5 py-0.5 pl-0.5 pr-0.5">
                      <div className="flex gap-1.5 text-base text-(--text-muted) leading-none font-medium">
                    {visibleLetters.map((letter: string, i: number) => (
                      <span key={i} className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {letter}
                      </span>
                    ))}
                      </div>
                      <div className="flex gap-1.5">
                    {visibleDates.map((date: string) => {
                      const checkIn = checkInForDay(habit, date)
                      const checked = !!checkIn
                      const pct = dayFillPercent(habit, checkIn?.value ?? null)
                      const titleBits = [date]
                      if (checkIn && checkIn.value != null && checkIn.value > 0) {
                        titleBits.push(`${checkIn.value} ${habit.unit ?? ''}`.trim())
                      } else if (checked) {
                        titleBits.push('zaznaczone')
                      }

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            if (!measurable) {
                              toggleCheckIn(habit.id, date)
                              return
                            }
                            if (!checkIn) {
                              addHabitDayDefault(habit.id, date)
                              setMeasurableEditor({ habitId: habit.id, date })
                              return
                            }
                            setMeasurableEditor({ habitId: habit.id, date })
                          }}
                          className={`relative h-5 w-5 shrink-0 overflow-hidden rounded border transition-colors ${
                            measurable
                              ? 'border-(--border) hover:opacity-90'
                              : checked
                                ? 'border-transparent'
                                : 'bg-(--border) hover:bg-(--border)/80 border-transparent'
                          } ${
                            measurableEditor?.habitId === habit.id &&
                            measurableEditor?.date === date
                              ? 'z-10 ring-2 ring-(--accent-cyan) ring-offset-2 ring-offset-(--bg-dark)'
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
                            </>
                          ) : (
                            <span
                              className={`block h-full w-full rounded ${
                                checked ? '' : 'bg-(--border) hover:bg-(--border)/80'
                              }`}
                              style={
                                checked
                                  ? { backgroundColor: accentHex }
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
                          className="h-2 w-full max-w-[min(100%,15.875rem)] cursor-pointer"
                          style={{ accentColor: accentHex }}
                          title="W prawo — starsze dni; w lewo — ostatnie 10 dni"
                        />
                      </div>
                    )}
                    {visibleDates.length > 0 && (
                      <p className="mt-2 text-base text-(--text-muted)" aria-live="polite">
                        Widoczne dni: {formatVisibleDateRange(visibleDates)}
                      </p>
                    )}
                  </div>
                  {measurable && measurableEditor?.habitId === habit.id && (
                    <div className="mt-3 w-full space-y-4 rounded-lg border border-(--border) bg-(--bg-card)/30 p-4">
                      <p className="text-base font-medium text-(--text-primary)">
                        Wpis dla dnia {measurableEditor.date}
                      </p>
                      <div>
                        <label
                          htmlFor={`day-value-${habit.id}-${measurableEditor.date}`}
                          className="mb-1.5 block text-base text-(--text-muted)"
                        >
                          Wartość{habit.unit ? ` (${habit.unit})` : ''}
                        </label>
                        <input
                          id={`day-value-${habit.id}-${measurableEditor.date}`}
                          type="text"
                          inputMode="decimal"
                          value={measurableEditorRaw}
                          onChange={(e) =>
                            setMeasurableEditorRaw(sanitizeGoalNumber(e.target.value))
                          }
                          className="w-full max-w-xs rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-(--border)/60 pt-4">
                        <button
                          type="button"
                          onClick={async () => {
                            const n = parseGoalNumber(measurableEditorRaw)
                            if (Number.isNaN(n) || n <= 0) return
                            const ok = await upsertHabitDayValue(
                              habit.id,
                              measurableEditor.date,
                              n
                            )
                            if (ok) setMeasurableEditor(null)
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
                          onClick={() => {
                            removeHabitDay(habit.id, measurableEditor.date)
                            setMeasurableEditor(null)
                          }}
                          className="rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card)"
                        >
                          Usuń dzień
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeasurableEditor(null)}
                          className="rounded-lg px-4 py-2 text-base text-(--text-muted) hover:text-(--text-primary)"
                        >
                          Zamknij
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          <AnimatePresence>
            {showHabitForm ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                className="space-y-2"
              >
                <label className="block text-base text-(--text-muted) font-gaming">Nazwa nawyku</label>
                <div className="flex flex-col gap-3">
                  <input
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                    autoFocus
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">
                        Jednostka (opcj., np. km)
                      </label>
                      <input
                        value={newHabitUnit}
                        onChange={(e) => setNewHabitUnit(e.target.value)}
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
                        value={newHabitTargetRaw}
                        onChange={(e) =>
                          setNewHabitTargetRaw(sanitizeGoalNumber(e.target.value))
                        }
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
                      onClick={handleAddHabit}
                      className="px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming hover:bg-(--accent-green)/25 hover:border-(--accent-green)/50 transition-colors"
                    >
                      Dodaj
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowHabitForm(false)
                        setNewHabitUnit('')
                        setNewHabitTargetRaw('')
                      }}
                      className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) hover:text-(--text-primary) hover:border-(--border) transition-colors"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
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
      </Card>

      {/* Cele */}
      <Card title="Aktywne cele" className="border-(--accent-cyan)/20">
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(100, (goal.current / goal.target) * 100)
            const isEditing = editingGoalId === goal.id

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                className="p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-cyan)/20"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm text-(--text-muted) font-gaming mb-0.5">Nazwa</label>
                          <input
                            value={editingGoal.name}
                            onChange={(e) =>
                              setEditingGoal((g) => ({ ...g, name: e.target.value }))
                            }
                            className="w-full px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div>
                            <label className="block text-sm text-(--text-muted) font-gaming mb-0.5">Cel</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editingGoal.target}
                              onChange={(e) =>
                                setEditingGoal((g) => ({
                                  ...g,
                                  target: sanitizeGoalNumber(e.target.value),
                                }))
                              }
                              className="w-20 px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-(--text-muted) font-gaming mb-0.5">Jednostka</label>
                            <input
                              value={editingGoal.unit}
                              onChange={(e) =>
                                setEditingGoal((g) => ({ ...g, unit: e.target.value }))
                              }
                              className="w-24 px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const target = parseGoalNumber(editingGoal.target)
                              if (editingGoal.name.trim() && !isNaN(target) && target > 0) {
                                updateGoal(goal.id, {
                                  name: editingGoal.name.trim(),
                                  target,
                                  unit: editingGoal.unit.trim() || undefined,
                                })
                                setEditingGoalId(null)
                              }
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 text-sm hover:bg-(--accent-cyan)/25"
                          >
                            <Check className="w-4 h-4" />
                            Zapisz
                          </button>
                          <button
                            onClick={() => setEditingGoalId(null)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-(--border) text-(--text-muted) text-sm hover:bg-(--bg-card)"
                          >
                            <X className="w-4 h-4" />
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-base">{goal.name}</p>
                        <p className="text-base text-(--text-muted) font-medium">
                          {goal.current} / {goal.target} {goal.unit ?? ''}
                        </p>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={currentInputRaw?.goalId === goal.id ? currentInputRaw.value : String(goal.current)}
                        onFocus={() => setCurrentInputRaw({ goalId: goal.id, value: String(goal.current) })}
                        onChange={(e) => {
                          const sanitized = sanitizeGoalNumber(e.target.value)
                          setCurrentInputRaw({ goalId: goal.id, value: sanitized })
                          const num = parseGoalNumber(sanitized)
                          if (!Number.isNaN(num) && num <= goal.target) {
                            updateGoal(goal.id, { current: num })
                          }
                        }}
                        onBlur={() => setCurrentInputRaw(null)}
                        className="w-16 px-2 py-1.5 rounded-md bg-(--bg-card) border border-(--border)/60 text-(--text-primary) text-sm text-center font-medium focus:border-(--accent-cyan)/60 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/30"
                      />
                      <button
                        onClick={() => {
                          setEditingGoalId(goal.id)
                          setEditingGoal({
                            name: goal.name,
                            target: String(goal.target),
                            unit: goal.unit ?? '',
                          })
                        }}
                        className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                        title="Edytuj"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="h-2 rounded-full bg-(--bg-card) overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-(--accent-cyan) to-(--accent-green) transition-[width] duration-300 ease-out motion-reduce:transition-none"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}

          <AnimatePresence>
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
          </AnimatePresence>
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
                    Usunąć nawyk?
                  </h3>
                  <p className="mb-1 text-base text-(--text-muted)">
                    Czy na pewno chcesz usunąć ten nawyk? Tej operacji nie można cofnąć.
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
                        const { id } = habitPendingDelete
                        removeHabit(id)
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
                        setHabitPendingDelete(null)
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
    </div>
  )
}
