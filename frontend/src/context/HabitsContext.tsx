import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { habitsApi } from '../lib/api/habitsApi'
import { goalsApi } from '../lib/api/goalsApi'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export interface HabitCheckInItem {
  id: string
  date: string
  value: number | null
}

export interface HabitItem {
  id: string
  name: string
  unit: string | null
  targetPerDay: number | null
  /** Data utworzenia nawyku (YYYY-MM-DD). */
  createdAt: string
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
  createdAt?: string | Date
  checkIns: { id: string; date: string | Date; value?: number | null }[]
}): HabitItem {
  return {
    ...habit,
    unit: habit.unit ?? null,
    targetPerDay: habit.targetPerDay ?? null,
    createdAt: habit.createdAt != null ? toYmd(habit.createdAt) : toYmd(new Date()),
    checkIns: habit.checkIns.map((c) => ({
      id: c.id,
      date: typeof c.date === 'string' ? c.date.split('T')[0] : String(c.date).split('T')[0],
      value: c.value ?? null,
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
      unit: 'km',
      targetPerDay: 10,
      createdAt: created,
      checkIns: dates.flatMap((date, i) => {
        if (i % 2 !== 0) return []
        const value = i === 6 ? 7 : 10
        return [{ id: `c1-${date}`, date, value }]
      }),
    },
    {
      id: '2',
      name: 'Czytanie 20 min',
      unit: null,
      targetPerDay: null,
      createdAt: created,
      checkIns: dates.filter((_, i) => i < 10).map((date) => ({
        id: `c2-${date}`,
        date,
        value: null,
      })),
    },
    {
      id: '3',
      name: 'Pić 2L wody',
      unit: null,
      targetPerDay: null,
      createdAt: created,
      checkIns: dates.slice(0, 7).map((date) => ({ id: `c3-${date}`, date, value: null })),
    },
    {
      id: '4',
      name: 'Medytacja 10 min',
      unit: null,
      targetPerDay: null,
      createdAt: created,
      checkIns: dates
        .filter((_, i) => i % 3 === 0)
        .map((date) => ({ id: `c4-${date}`, date, value: null })),
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
      : () => habitsApi.getAll().then((h) => h.map(normalizeHabitFromApi)),
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
            checkIns: [...h.checkIns, { id: `c-${date}`, date, value: null }],
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
    value: number
  ): Promise<boolean> => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) =>
        (old ?? []).map((h) => {
          if (h.id !== habitId) return h
          const existing = h.checkIns.find((c) => c.date === date)
          if (existing) {
            return {
              ...h,
              checkIns: h.checkIns.map((c) =>
                c.date === date ? { ...c, value } : c
              ),
            }
          }
          return {
            ...h,
            checkIns: [...h.checkIns, { id: `c-${date}`, date, value }],
          }
        })
      )
      return true
    }
    try {
      await habitsApi.checkIn(habitId, date, { value })
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
              { id: `c-${date}`, date, value: resolved },
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
    extras?: { unit?: string | null; targetPerDay?: number | null }
  ) => {
    if (isDemoMode) {
      queryClient.setQueryData<HabitItem[]>(habitsKey, (old) => [
        ...(old ?? []),
        {
          id: Date.now().toString(),
          name,
          unit: extras?.unit ?? null,
          targetPerDay: extras?.targetPerDay ?? null,
          createdAt: toYmd(new Date()),
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
    updates: { name?: string; unit?: string | null; targetPerDay?: number | null }
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
        (old ?? []).filter((h) => h.id !== id)
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
