import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
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

interface FinanceCategoriesContextType {
  categories: FinanceCategory[]
  customCategories: FinanceCategory[]
  getColor: (categoryName: string) => string
  getLabel: (categoryNameOrId: string) => string
  addCategory: (name: string, color: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  isLoading: boolean
}

const FinanceCategoriesContext = createContext<FinanceCategoriesContextType | null>(null)

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

export function FinanceCategoriesProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId

  const [demoCustom, setDemoCustom] = useState<FinanceCategory[]>(() => loadDemoCategories())

  const { data: apiCustom = [], isPending } = useQuery({
    queryKey: queryKeys.expenseCategories(userId),
    queryFn: () => expenseCategoriesApi.getAll().then(mapApiCategories),
    enabled: queryEnabled,
  })

  const customCategories = isDemoMode ? demoCustom : apiCustom
  const loading = !isDemoMode && isPending

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]

  const getColor = useCallback(
    (categoryName: string): string => {
      const lower = categoryName?.toLowerCase() ?? ''
      const cat = allCategories.find(
        (c) =>
          c.name.toLowerCase() === lower ||
          c.id.toLowerCase() === lower ||
          c.label.toLowerCase() === lower
      )
      return cat?.color ?? '#9d4edd'
    },
    [allCategories]
  )

  const getLabel = useCallback(
    (categoryNameOrId: string): string => {
      const cat = allCategories.find((c) => c.name === categoryNameOrId || c.id === categoryNameOrId)
      if (cat) return cat.label
      if (categoryNameOrId.startsWith('demo-') && categoryNameOrId.includes('-')) {
        const parts = categoryNameOrId.split('-')
        if (parts.length >= 3) return parts.slice(2).join('-')
      }
      return categoryNameOrId
    },
    [allCategories]
  )

  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories(userId) })
  }

  const addCategory = useCallback(
    async (name: string, color: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      if (allCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return

      if (isDemoMode) {
        const existing = loadDemoCategories()
        const newCat: FinanceCategory = {
          id: `demo-${Date.now()}-${trimmed}`,
          label: trimmed,
          name: trimmed,
          color,
        }
        const updated = [...existing, newCat]
        saveDemoCategories(updated)
        setDemoCustom(updated)
      } else {
        await expenseCategoriesApi.create({ name: trimmed, color })
        invalidate()
      }
    },
    [isDemoMode, allCategories, userId]
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        const existing = loadDemoCategories()
        const updated = existing.filter((c) => c.id !== id)
        saveDemoCategories(updated)
        setDemoCustom(updated)
      } else {
        await expenseCategoriesApi.delete(id)
        invalidate()
      }
    },
    [isDemoMode, userId]
  )

  const value: FinanceCategoriesContextType = {
    categories: allCategories,
    customCategories,
    getColor,
    getLabel,
    addCategory,
    deleteCategory,
    isLoading: loading,
  }

  return (
    <FinanceCategoriesContext.Provider value={value}>
      {children}
    </FinanceCategoriesContext.Provider>
  )
}

export function useFinanceCategories() {
  const ctx = useContext(FinanceCategoriesContext)
  return ctx
}
