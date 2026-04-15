import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
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

export function useTodos() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId
  const todosKey = queryKeys.todos(userId)

  const { data: todos = [], isPending } = useQuery({
    queryKey: todosKey,
    queryFn: isDemoMode
      ? () => DEMO_TODOS
      : () =>
          todosApi.getAll().then((data) =>
            data.map((t) => ({ ...t, createdAt: t.createdAt?.split('T')[0] ?? '' }))
          ),
    enabled: isDemoMode || queryEnabled,
    staleTime: isDemoMode ? Infinity : undefined,
    gcTime: isDemoMode ? Infinity : undefined,
  })

  const loading = !isDemoMode && isPending

  const addMutation = useMutation({
    mutationFn: (text: string) => todosApi.create(text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      const optimistic: TodoItem = {
        id: `optimistic-${Date.now()}`,
        text: text.trim(),
        done: false,
        createdAt: new Date().toISOString().split('T')[0],
      }
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) => [...(old ?? []), optimistic])
      return { previous }
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(todosKey, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosKey })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => todosApi.toggle(id, done),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done } : t))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(todosKey, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosKey })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) => (old ?? []).filter((t) => t.id !== id))
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(todosKey, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosKey })
    },
  })

  const addTodo = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) => [
        ...(old ?? []),
        {
          id: Date.now().toString(),
          text: trimmed,
          done: false,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ])
      return
    }
    addMutation.mutate(trimmed)
  }

  const toggleTodo = (id: string, done: boolean) => {
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done } : t))
      )
      return
    }
    toggleMutation.mutate({ id, done })
  }

  const removeTodo = (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? []).filter((t) => t.id !== id)
      )
      return
    }
    removeMutation.mutate(id)
  }

  return { todos, addTodo, toggleTodo, removeTodo, loading }
}
