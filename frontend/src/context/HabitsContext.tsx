import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { habitsApi, goalsApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export interface HabitItem {
  id: string
  name: string
  checkIns: { id: string; date: string }[]
}

export interface GoalItem {
  id: string
  name: string
  target: number
  current: number
  unit?: string
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
  return [
    {
      id: '1',
      name: 'Ćwiczenia 30 min',
      checkIns: dates.filter((_, i) => i % 2 === 0).map((date) => ({ id: `c1-${date}`, date })),
    },
    {
      id: '2',
      name: 'Czytanie 20 min',
      checkIns: dates.filter((_, i) => i < 10).map((date) => ({ id: `c2-${date}`, date })),
    },
    {
      id: '3',
      name: 'Pić 2L wody',
      checkIns: dates.slice(0, 7).map((date) => ({ id: `c3-${date}`, date })),
    },
    {
      id: '4',
      name: 'Medytacja 10 min',
      checkIns: dates.filter((_, i) => i % 3 === 0).map((date) => ({ id: `c4-${date}`, date })),
    },
  ]
}

const DEMO_GOALS: GoalItem[] = [
  { id: '1', name: 'Przeczytać książki', target: 12, current: 4, unit: 'książek' },
  { id: '2', name: 'Zaoszczędzić', target: 5000, current: 2100, unit: 'zł' },
  { id: '3', name: 'Bieg 5 km', target: 10, current: 3, unit: 'treningów' },
]

interface HabitsContextType {
  habits: HabitItem[]
  goals: GoalItem[]
  addHabit: (name: string) => void
  updateHabit: (id: string, name: string) => void
  removeHabit: (id: string) => void
  toggleCheckIn: (habitId: string, date: string) => void
  addGoal: (goal: Omit<GoalItem, 'id'>) => void
  updateGoal: (id: string, updates: Partial<Pick<GoalItem, 'current' | 'target' | 'name' | 'unit'>>) => void
  removeGoal: (id: string) => void
  loading: boolean
}

const HabitsContext = createContext<HabitsContextType | null>(null)

export function HabitsProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId

  const [demoHabits, setDemoHabits] = useState<HabitItem[]>(getDemoHabits)
  const [demoGoals, setDemoGoals] = useState<GoalItem[]>(DEMO_GOALS)

  const { data: apiHabits = [], isPending: habitsPending } = useQuery({
    queryKey: queryKeys.habits(userId),
    queryFn: () =>
      habitsApi.getAll().then((h) =>
        h.map((habit) => ({
          ...habit,
          checkIns: habit.checkIns.map((c) => ({
            id: c.id,
            date: typeof c.date === 'string' ? c.date.split('T')[0] : c.date,
          })),
        }))
      ),
    enabled: queryEnabled,
  })

  const { data: apiGoals = [], isPending: goalsPending } = useQuery({
    queryKey: queryKeys.goals(userId),
    queryFn: () => goalsApi.getAll(),
    enabled: queryEnabled,
  })

  const habits = isDemoMode ? demoHabits : apiHabits
  const goals = isDemoMode ? demoGoals : apiGoals
  const loading = !isDemoMode && (habitsPending || goalsPending)

  const invalidateHabits = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) })
  }
  const invalidateGoals = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) })
  }

  const toggleCheckIn = async (habitId: string, date: string) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return
    const hasCheckIn = habit.checkIns.some((c) => c.date === date)
    if (isDemoMode) {
      setDemoHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h
          if (hasCheckIn) {
            return { ...h, checkIns: h.checkIns.filter((c) => c.date !== date) }
          }
          return { ...h, checkIns: [...h.checkIns, { id: `c-${date}`, date }] }
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
      invalidateHabits()
    } catch {
      // ignore
    }
  }

  const addHabit = async (name: string) => {
    if (isDemoMode) {
      setDemoHabits((prev) => [...prev, { id: Date.now().toString(), name, checkIns: [] }])
      return
    }
    try {
      await habitsApi.create(name)
      invalidateHabits()
    } catch {
      // ignore
    }
  }

  const updateHabit = async (id: string, name: string) => {
    if (isDemoMode) {
      setDemoHabits((prev) => prev.map((h) => (h.id === id ? { ...h, name } : h)))
      return
    }
    try {
      await habitsApi.update(id, name)
      invalidateHabits()
    } catch {
      // ignore
    }
  }

  const removeHabit = async (id: string) => {
    if (isDemoMode) {
      setDemoHabits((prev) => prev.filter((h) => h.id !== id))
      return
    }
    try {
      await habitsApi.delete(id)
      invalidateHabits()
    } catch {
      // ignore
    }
  }

  const addGoal = async (goal: Omit<GoalItem, 'id'>) => {
    if (isDemoMode) {
      setDemoGoals((prev) => [...prev, { ...goal, id: Date.now().toString() }])
      return
    }
    try {
      await goalsApi.create(goal)
      invalidateGoals()
    } catch {
      // ignore
    }
  }

  const updateGoal = async (
    id: string,
    updates: Partial<Pick<GoalItem, 'current' | 'target' | 'name' | 'unit'>>
  ) => {
    if (isDemoMode) {
      setDemoGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)))
      return
    }
    try {
      await goalsApi.update(id, updates)
      invalidateGoals()
    } catch {
      // ignore
    }
  }

  const removeGoal = async (id: string) => {
    if (isDemoMode) {
      setDemoGoals((prev) => prev.filter((g) => g.id !== id))
      return
    }
    try {
      await goalsApi.delete(id)
      invalidateGoals()
    } catch {
      // ignore
    }
  }

  return (
    <HabitsContext.Provider
      value={{
        habits,
        goals,
        addHabit,
        updateHabit,
        removeHabit,
        toggleCheckIn,
        addGoal,
        updateGoal,
        removeGoal,
        loading,
      }}
    >
      {children}
    </HabitsContext.Provider>
  )
}

export function useHabits() {
  return useContext(HabitsContext)
}
