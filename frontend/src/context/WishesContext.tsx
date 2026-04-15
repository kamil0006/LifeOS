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

export function useWishes() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId
  const key = queryKeys.wishes(userId)

  const { data: wishes = [], isPending } = useQuery({
    queryKey: key,
    queryFn: isDemoMode
      ? () => DEMO_WISHES
      : () => wishesApi.getAll().then((data) => data.map(mapWish)),
    enabled: isDemoMode || queryEnabled,
    staleTime: isDemoMode ? Infinity : undefined,
    gcTime: isDemoMode ? Infinity : undefined,
  })

  const loading = !isDemoMode && isPending

  const addWish = async (wish: Omit<Wish, 'id'>) => {
    if (isDemoMode) {
      queryClient.setQueryData<Wish[]>(key, (old) => [
        ...(old ?? []),
        { ...wish, id: Date.now().toString(), stage: wish.stage ?? 'pomysl', savedAmount: wish.savedAmount ?? 0 },
      ])
      return
    }
    try {
      await wishesApi.create(wish)
      queryClient.invalidateQueries({ queryKey: key })
    } catch {
      // ignore
    }
  }

  const updateWish = async (id: string, updates: Partial<Wish>) => {
    if (isDemoMode) {
      queryClient.setQueryData<Wish[]>(key, (old) =>
        (old ?? []).map((w) => (w.id === id ? { ...w, ...updates } : w))
      )
      return
    }
    try {
      await wishesApi.update(id, updates)
      queryClient.invalidateQueries({ queryKey: key })
    } catch {
      // ignore
    }
  }

  const removeWish = async (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<Wish[]>(key, (old) =>
        (old ?? []).filter((w) => w.id !== id)
      )
      return
    }
    try {
      await wishesApi.delete(id)
      queryClient.invalidateQueries({ queryKey: key })
    } catch {
      // ignore
    }
  }

  return { wishes, addWish, updateWish, removeWish, loading }
}
