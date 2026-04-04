import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { todosApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: string
}

const DEMO_TODOS: TodoItem[] = [
  { id: '1', text: 'Zaktualizować CV', done: false, createdAt: '2025-03-01' },
  { id: '2', text: 'Zapłacić rachunki', done: false, createdAt: '2025-03-02' },
  { id: '3', text: 'Zrobić zakupy', done: true, createdAt: '2025-03-03' },
]

interface TodosContextType {
  todos: TodoItem[]
  addTodo: (text: string) => void
  toggleTodo: (id: string, done: boolean) => void
  removeTodo: (id: string) => void
  loading: boolean
}

const TodosContext = createContext<TodosContextType | null>(null)

export function TodosProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId

  const [demoTodos, setDemoTodos] = useState<TodoItem[]>(DEMO_TODOS)

  const { data: apiTodos = [], isPending } = useQuery({
    queryKey: queryKeys.todos(userId),
    queryFn: () =>
      todosApi.getAll().then((data) =>
        data.map((t) => ({ ...t, createdAt: t.createdAt?.split('T')[0] ?? '' }))
      ),
    enabled: queryEnabled,
  })

  const todos = isDemoMode ? demoTodos : apiTodos
  const loading = !isDemoMode && isPending

  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.todos(userId) })
  }

  const addTodo = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (isDemoMode) {
      setDemoTodos((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: trimmed,
          done: false,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ])
      return
    }
    try {
      await todosApi.create(trimmed)
      invalidate()
    } catch {
      // ignore
    }
  }

  const toggleTodo = async (id: string, done: boolean) => {
    if (isDemoMode) {
      setDemoTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)))
      return
    }
    try {
      await todosApi.toggle(id, done)
      invalidate()
    } catch {
      // ignore
    }
  }

  const removeTodo = async (id: string) => {
    if (isDemoMode) {
      setDemoTodos((prev) => prev.filter((t) => t.id !== id))
      return
    }
    try {
      await todosApi.delete(id)
      invalidate()
    } catch {
      // ignore
    }
  }

  return (
    <TodosContext.Provider value={{ todos, addTodo, toggleTodo, removeTodo, loading }}>
      {children}
    </TodosContext.Provider>
  )
}

export function useTodos() {
  const ctx = useContext(TodosContext)
  return ctx
}
