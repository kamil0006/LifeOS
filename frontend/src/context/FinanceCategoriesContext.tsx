import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { expenseCategoriesApi } from '../lib/api'
import { FINANCE_CATEGORIES } from '../lib/financeCategories'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export interface FinanceCategory {
  id: string
  label: string
  name: string
  color: string
}

const DEFAULT_CATEGORIES: FinanceCategory[] = FINANCE_CATEGORIES.filter((c) => c.id !== 'Dochód').map((c) => ({
  id: c.id,
  label: c.label,
  name: c.id,
  color: c.color,
}))

const DEMO_STORAGE_KEY = 'lifeos_demo_categories'

function loadDemoCategories(): FinanceCategory[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { name: string; color: string }[]
    return parsed.map((c, i) => ({
      id: `demo-${i}-${c.name}`,
      label: c.name,
      name: c.name,
      color: c.color,
    }))
  } catch {
    return []
  }
}

function saveDemoCategories(cats: FinanceCategory[]) {
  localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify(cats.map((c) => ({ name: c.name, color: c.color })))
  )
}

function mapApiCategories(
  data: { id: string; name: string; color: string }[]
): FinanceCategory[] {
  return data.map((c) => ({
    id: c.id,
    label: c.name,
    name: c.name,
    color: c.color,
  }))
}

export function useFinanceCategories() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId
  const key = queryKeys.expenseCategories(userId)

  const { data: customCategories = [], isPending } = useQuery({
    queryKey: key,
    queryFn: isDemoMode
      ? () => loadDemoCategories()
      : () => expenseCategoriesApi.getAll().then(mapApiCategories),
    enabled: isDemoMode || queryEnabled,
    staleTime: isDemoMode ? Infinity : undefined,
    gcTime: isDemoMode ? Infinity : undefined,
  })

  const isLoading = !isDemoMode && isPending
  const categories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...customCategories],
    [customCategories]
  )

  const getColor = useCallback(
    (categoryName: string): string => {
      const lower = categoryName?.toLowerCase() ?? ''
      const cat = categories.find(
        (c) =>
          c.name.toLowerCase() === lower ||
          c.id.toLowerCase() === lower ||
          c.label.toLowerCase() === lower
      )
      return cat?.color ?? '#9d4edd'
    },
    [categories]
  )

  const getLabel = useCallback(
    (categoryNameOrId: string): string => {
      const cat = categories.find((c) => c.name === categoryNameOrId || c.id === categoryNameOrId)
      if (cat) return cat.label
      if (categoryNameOrId.startsWith('demo-') && categoryNameOrId.includes('-')) {
        const parts = categoryNameOrId.split('-')
        if (parts.length >= 3) return parts.slice(2).join('-')
      }
      return categoryNameOrId
    },
    [categories]
  )

  const addCategory = async (name: string, color: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return

    if (isDemoMode) {
      const newCat: FinanceCategory = {
        id: `demo-${Date.now()}-${trimmed}`,
        label: trimmed,
        name: trimmed,
        color,
      }
      const updated = [...customCategories, newCat]
      saveDemoCategories(updated)
      queryClient.setQueryData<FinanceCategory[]>(key, updated)
    } else {
      await expenseCategoriesApi.create({ name: trimmed, color })
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const deleteCategory = async (id: string) => {
    if (isDemoMode) {
      const updated = customCategories.filter((c) => c.id !== id)
      saveDemoCategories(updated)
      queryClient.setQueryData<FinanceCategory[]>(key, updated)
    } else {
      await expenseCategoriesApi.delete(id)
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  return { categories, customCategories, getColor, getLabel, addCategory, deleteCategory, isLoading }
}
