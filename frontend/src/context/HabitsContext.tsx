import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import {
  habitsApi,
  type HabitCheckInStatus,
  type HabitScheduleType,
  type HabitUpsertPayload,
} from '../lib/api/habitsApi'
import { goalsApi } from '../lib/api/goalsApi'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export interface HabitCheckInItem {
  id: string
  date: string
  value: number | null
  status: HabitCheckInStatus
  note: string | null
}

export interface HabitItem {
  id: string
  name: string
  category: string | null
  color: string | null
  scheduleType: HabitScheduleType
  scheduleDays: number[]
  weeklyTarget: number | null
  monthlyTarget: number | null
  unit: string | null
  targetPerDay: number | null
  /** Data utworzenia nawyku (YYYY-MM-DD). */
  createdAt: string
  archivedAt: string | null
  checkIns: HabitCheckInItem[]
}

export interface GoalItem {
  id: string
  name: string
  target: number
  current: number
  unit?: string
}

function toYmd(d: string | Date): string {
  if (typeof d === 'string') return d.split('T')[0]
  return d.toISOString().split('T')[0]
}

function normalizeHabitFromApi(habit: {
  id: string
  name: string
  unit?: string | null
  targetPerDay?: number | null
  category?: string | null
  color?: string | null
  scheduleType?: HabitScheduleType
  scheduleDays?: number[]
  weeklyTarget?: number | null
  monthlyTarget?: number | null
  createdAt?: string | Date
  archivedAt?: string | Date | null
  checkIns: {
    id: string
    date: string | Date
    value?: number | null
    status?: HabitCheckInStatus
    note?: string | null
  }[]
}): HabitItem {
  return {
    ...habit,
    category: habit.category ?? null,
    color: habit.color ?? null,
    scheduleType: habit.scheduleType ?? 'daily',
    scheduleDays: habit.scheduleDays ?? [],
    weeklyTarget: habit.weeklyTarget ?? null,
    monthlyTarget: habit.monthlyTarget ?? null,
    unit: habit.unit ?? null,
    targetPerDay: habit.targetPerDay ?? null,
    createdAt: habit.createdAt != null ? toYmd(habit.createdAt) : toYmd(new Date()),
    archivedAt: habit.archivedAt != null ? toYmd(habit.archivedAt) : null,
    checkIns: habit.checkIns.map((c) => ({
      id: c.id,
      date: typeof c.date === 'string' ? c.date.split('T')[0] : String(c.date).split('T')[0],
      value: c.value ?? null,
      status: c.status ?? 'done',
      note: c.note ?? null,
    })),
  }
}

function getDemoHabits(): HabitItem[] {
  const today = new Date()
  const pad = (d: Date) => d.toISOString().split('T')[0]
  const dates: string[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(pad(d))
  }
  const created = pad(today)
  return [
    {
      id: '1',
      name: 'Bieg',
      category: 'Zdrowie',
      color: '#00ff9d',
      scheduleType: 'weekly',
      scheduleDays: [],
      weeklyTarget: 4,
      monthlyTarget: null,
      unit: 'km',
      targetPerDay: 10,
      createdAt: created,
      archivedAt: null,
      checkIns: dates.flatMap((date, i) => {
        if (i % 2 !== 0) return []
        const value = i === 6 ? 7 : 10
        return [{ id: `c1-${date}`, date, value, status: 'done', note: null }]
      }),
    },
    {
      id: '2',
      name: 'Czytanie 20 min',
      category: 'Rozwój',
      color: '#00e5ff',
      scheduleType: 'daily',
      scheduleDays: [],
      weeklyTarget: null,
      monthlyTarget: null,
      unit: null,
      targetPerDay: null,
      createdAt: created,
      archivedAt: null,
      checkIns: dates.filter((_, i) => i < 10).map((date) => ({
        id: `c2-${date}`,
        date,
        value: null,
        status: 'done',
        note: null,
      })),
    },
    {
      id: '3',
      name: 'Pić 2L wody',
      category: 'Zdrowie',
      color: '#38bdf8',
      scheduleType: 'daily',
      scheduleDays: [],
      weeklyTarget: null,
      monthlyTarget: null,
      unit: null,
      targetPerDay: null,
      createdAt: created,
      archivedAt: null,
      checkIns: dates.slice(0, 7).map((date) => ({
        id: `c3-${date}`,
        date,
        value: null,
        status: 'done',
        note: null,
      })),
    },
    {
      id: '4',
      name: 'Medytacja 10 min',
      category: 'Mindset',
      color: '#a78bfa',
      scheduleType: 'weekdays',
      scheduleDays: [1, 2, 3, 4, 5],
      weeklyTarget: null,
      monthlyTarget: null,
      unit: null,
      targetPerDay: null,
      createdAt: created,
      archivedAt: null,
      checkIns: dates
        .filter((_, i) => i % 3 === 0)
        .map((date) => ({ id: `c4-${date}`, date, value: null, status: 'done', note: null })),
    },
  ]
}

const INITIAL_DEMO_HABITS = getDemoHabits()

const DEMO_GOALS: GoalItem[] = [
  { id: '1', name: 'Przeczytać książki', target: 12, current: 4, unit: 'książek' },
  { id: '2', name: 'Zaoszczędzić', target: 5000, current: 2100, unit: 'zł' },
  { id: '3', name: 'Bieg 5 km', target: 10, current: 3, unit: 'treningów' },
]

export function useHabits() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId
  const habitsKey = queryKeys.habits(userId)
  const goalsKey = queryKeys.goals(userId)

  const { data: habits = [], isPending: habitsPending } = useQuery({
    queryKey: habitsKey,
    queryFn: isDemoMode
      ? () => INITIAL_DEMO_HABITS
      : () => habitsApi.getAll({ includeArchived: true }).then((h) => h.map(normalizeHabitFromApi)),
    enabled: isDemoMode || queryEnabled,
    staleTime: isDemoMode ? Infinity : undefined,
    gcTime: isDemoMode ? Infinity : undefined,
  })

  const { data: goals = [], isPending: goalsPending } = useQuery({
    queryKey: goalsKey,
    queryFn: isDemoMode ? () => DEMO_GOALS : () => goalsApi.getAll(),
    enabled: isDemoMode || queryEnabled,
    staleTime: isDemoMode ? Infinity : undefined,
    gcTime: isDemoMode ? Infinity : undefined,
  })

  const loading = !isDemoMode && (habitsPending || goalsPending)

  const toggleCheckIn = async (habitId: string, date: string) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return
    const hasCheckIn = habit.checkIns.some((c) => c.date === date)

    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) => {
          if (h.id !== habitId) return h
          if (hasCheckIn) {
            return { ...h, checkIns: h.checkIns.filter((c) => c.date !== date) }
          }
          return {
            ...h,
            checkIns: [
              ...h.checkIns,
              { id: `c-${habitId}-${date}`, date, value: null, status: 'done', note: null },
            ],
          }
        })
      )
      return
    }
    try {
      if (hasCheckIn) {
        await habitsApi.uncheckIn(habitId, date)
      } else {
        await habitsApi.checkIn(habitId, date)
      }
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const upsertHabitDayValue = async (
    habitId: string,
    date: string,
    value: number | null,
    extras?: { status?: HabitCheckInStatus; note?: string | null }
  ): Promise<boolean> => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) => {
          if (h.id !== habitId) return h
          const existing = h.checkIns.find((c) => c.date === date)
          const status = extras?.status ?? 'done'
          const note = extras?.note ?? null
          const resolvedValue = status === 'done' ? value : null
          if (existing) {
            return {
              ...h,
              checkIns: h.checkIns.map((c) =>
                c.date === date ? { ...c, value: resolvedValue, status, note } : c
              ),
            }
          }
          return {
            ...h,
            checkIns: [
              ...h.checkIns,
              { id: `c-${habitId}-${date}`, date, value: resolvedValue, status, note },
            ],
          }
        })
      )
      return true
    }
    try {
      await habitsApi.checkIn(habitId, date, { value, ...extras })
      queryClient.invalidateQueries({ queryKey: habitsKey })
      return true
    } catch {
      return false
    }
  }

  const addHabitDayDefault = async (habitId: string, date: string) => {
    if (isDemoMode) {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) return
      const resolved =
        habit.targetPerDay != null ? habit.targetPerDay : habit.unit?.trim() ? 1 : null
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) => {
          if (h.id !== habitId) return h
          if (h.checkIns.some((c) => c.date === date)) return h
          return {
            ...h,
            checkIns: [
              ...h.checkIns,
              {
                id: `c-${habitId}-${date}`,
                date,
                value: resolved,
                status: 'done',
                note: null,
              },
            ],
          }
        })
      )
      return
    }
    try {
      await habitsApi.checkIn(habitId, date)
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const removeHabitDay = async (habitId: string, date: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) =>
          h.id === habitId
            ? { ...h, checkIns: h.checkIns.filter((c) => c.date !== date) }
            : h
        )
      )
      return
    }
    try {
      await habitsApi.uncheckIn(habitId, date)
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const addHabit = async (
    name: string,
    extras?: HabitUpsertPayload
  ) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) => [
        ...(old ?? []),
        {
          id: Date.now().toString(),
          name,
          category: extras?.category ?? null,
          color: extras?.color ?? null,
          scheduleType: extras?.scheduleType ?? 'daily',
          scheduleDays: extras?.scheduleDays ?? [],
          weeklyTarget: extras?.weeklyTarget ?? null,
          monthlyTarget: extras?.monthlyTarget ?? null,
          unit: extras?.unit ?? null,
          targetPerDay: extras?.targetPerDay ?? null,
          createdAt: toYmd(new Date()),
          archivedAt: null,
          checkIns: [],
        },
      ])
      return
    }
    try {
      await habitsApi.create(name, extras)
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const updateHabit = async (
    id: string,
    updates: { name?: string } & HabitUpsertPayload
  ) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) => (h.id === id ? { ...h, ...updates } : h))
      )
      return
    }
    try {
      await habitsApi.update(id, updates)
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const removeHabit = async (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) =>
          h.id === id ? { ...h, archivedAt: toYmd(new Date()) } : h
        )
      )
      return
    }
    try {
      await habitsApi.delete(id)
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const restoreHabit = async (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) => (h.id === id ? { ...h, archivedAt: null } : h))
      )
      return
    }
    try {
      await habitsApi.update(id, { archivedAt: null })
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const deleteHabitPermanently = async (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).filter((h) => h.id !== id)
      )
      return
    }
    try {
      await habitsApi.deletePermanently(id)
      queryClient.invalidateQueries({ queryKey: habitsKey })
    } catch {
      // ignore
    }
  }

  const addGoal = async (goal: Omit<GoalItem, 'id'>) => {
    if (isDemoMode) {
      queryClient.setQueryData<GoalItem[]>(goalsKey, (old) => [
        ...(old ?? []),
        { ...goal, id: Date.now().toString() },
      ])
      return
    }
    try {
      await goalsApi.create(goal)
      queryClient.invalidateQueries({ queryKey: goalsKey })
    } catch {
      // ignore
    }
  }

  const updateGoal = async (
    id: string,
    updates: Partial<Pick<GoalItem, 'current' | 'target' | 'name' | 'unit'>>
  ) => {
    if (isDemoMode) {
      queryClient.setQueryData<GoalItem[]>(goalsKey, (old) =>
        (old ?? []).map((g) => (g.id === id ? { ...g, ...updates } : g))
      )
      return
    }
    try {
      await goalsApi.update(id, updates)
      queryClient.invalidateQueries({ queryKey: goalsKey })
    } catch {
      // ignore
    }
  }

  const removeGoal = async (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<GoalItem[]>(goalsKey, (old) =>
        (old ?? []).filter((g) => g.id !== id)
      )
      return
    }
    try {
      await goalsApi.delete(id)
      queryClient.invalidateQueries({ queryKey: goalsKey })
    } catch {
      // ignore
    }
  }

  return {
    habits,
    goals,
    addHabit,
    updateHabit,
    removeHabit,
    restoreHabit,
    deleteHabitPermanently,
    toggleCheckIn,
    upsertHabitDayValue,
    addHabitDayDefault,
    removeHabitDay,
    addGoal,
    updateGoal,
    removeGoal,
    loading,
  }
}
