import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { wishesApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export type WishStage = 'pomysl' | 'chce_kupic' | 'odkladam' | 'kupione'

export interface Wish {
  id: string
  name: string
  estimatedPrice: number
  priority: 1 | 2 | 3
  stage: WishStage
  savedAmount: number
  notes?: string
}

const DEMO_WISHES: Wish[] = [
  { id: '1', name: 'Monitor 27"', estimatedPrice: 1200, priority: 1, stage: 'odkladam', savedAmount: 300 },
  { id: '2', name: 'Kurs programowania', estimatedPrice: 299, priority: 2, stage: 'pomysl', savedAmount: 0 },
  { id: '3', name: 'Słuchawki bezprzewodowe', estimatedPrice: 450, priority: 1, stage: 'chce_kupic', savedAmount: 0 },
  { id: '4', name: 'Weekend w górach', estimatedPrice: 800, priority: 3, stage: 'odkladam', savedAmount: 200 },
]

interface WishesContextType {
  wishes: Wish[]
  addWish: (wish: Omit<Wish, 'id'>) => void
  updateWish: (id: string, updates: Partial<Wish>) => void
  removeWish: (id: string) => void
  loading: boolean
}

const WishesContext = createContext<WishesContextType | null>(null)

function mapWish(w: {
  id: string
  name: string
  estimatedPrice: number
  priority: number
  stage: string
  savedAmount: number
  notes?: string
}): Wish {
  return {
    ...w,
    priority: w.priority as 1 | 2 | 3,
    stage: (w.stage ?? 'pomysl') as WishStage,
    savedAmount: w.savedAmount ?? 0,
  }
}

export function WishesProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId

  const [demoWishes, setDemoWishes] = useState<Wish[]>(DEMO_WISHES)

  const { data: apiWishes = [], isPending } = useQuery({
    queryKey: queryKeys.wishes(userId),
    queryFn: () => wishesApi.getAll().then((data) => data.map(mapWish)),
    enabled: queryEnabled,
  })

  const wishes = isDemoMode ? demoWishes : apiWishes
  const loading = !isDemoMode && isPending

  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.wishes(userId) })
  }

  const addWish = async (wish: Omit<Wish, 'id'>) => {
    if (isDemoMode) {
      setDemoWishes((prev) => [
        ...prev,
        { ...wish, id: Date.now().toString(), stage: wish.stage ?? 'pomysl', savedAmount: wish.savedAmount ?? 0 },
      ])
      return
    }
    try {
      await wishesApi.create(wish)
      invalidate()
    } catch {
      // ignore
    }
  }

  const updateWish = async (id: string, updates: Partial<Wish>) => {
    if (isDemoMode) {
      setDemoWishes((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)))
      return
    }
    try {
      await wishesApi.update(id, updates)
      invalidate()
    } catch {
      // ignore
    }
  }

  const removeWish = async (id: string) => {
    if (isDemoMode) {
      setDemoWishes((prev) => prev.filter((w) => w.id !== id))
      return
    }
    try {
      await wishesApi.delete(id)
      invalidate()
    } catch {
      // ignore
    }
  }

  return (
    <WishesContext.Provider value={{ wishes, addWish, updateWish, removeWish, loading }}>
      {children}
    </WishesContext.Provider>
  )
}

export function useWishes() {
  const ctx = useContext(WishesContext)
  return ctx
}
