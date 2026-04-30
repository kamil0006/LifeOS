import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { todosApi, type TodoApiRecord } from '../lib/api/todosApi'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'
import {
  compareTodosForDisplay,
  localISODate,
  normalizeCategory,
  normalizePriority,
  type TodoCategory,
  type TodoItem,
  type TodoPriority,
} from '../lib/todoDomain'

export type { TodoItem }

export interface TodoCreatePayload {
  text: string
  dueDate?: string | null
  dueTime?: string | null
  priority?: TodoPriority
  category?: TodoCategory
  noteId?: string | null
}

export type TodoUpdatePayload = Partial<{
  done: boolean
  text: string
  dueDate: string | null
  dueTime: string | null
  priority: TodoPriority
  category: TodoCategory
  archivedAt: string | null
  noteId: string | null
}>

function normalizeTodoFromApi(raw: TodoApiRecord): TodoItem {
  let dueDate: string | null = null
  if (raw.dueDate != null && raw.dueDate !== '') {
    dueDate = String(raw.dueDate).split('T')[0]
  }
  return {
    id: raw.id,
    text: raw.text,
    done: raw.done,
    createdAt: raw.createdAt?.includes('T') ? raw.createdAt.split('T')[0] : raw.createdAt ?? '',
    dueDate,
    dueTime: raw.dueTime ?? null,
    priority: normalizePriority(raw.priority),
    category: normalizeCategory(raw.category),
    archivedAt: raw.archivedAt ?? null,
    noteId: raw.noteId ?? null,
  }
}

function applyTodoPatch(t: TodoItem, p: TodoUpdatePayload): TodoItem {
  const next = { ...t }
  if (p.done !== undefined) next.done = p.done
  if (p.text !== undefined) next.text = p.text
  if (p.dueDate !== undefined) next.dueDate = p.dueDate
  if (p.dueTime !== undefined) next.dueTime = p.dueTime
  if (p.priority !== undefined) next.priority = p.priority
  if (p.category !== undefined) next.category = p.category
  if (p.archivedAt !== undefined) next.archivedAt = p.archivedAt
  if (p.noteId !== undefined) next.noteId = p.noteId
  return next
}

function buildDemoTodos(): TodoItem[] {
  const addDays = (n: number) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + n)
    return localISODate(d)
  }
  return [
    {
      id: 'demo-1',
      text: 'Zapłacić rachunki',
      done: false,
      createdAt: localISODate(),
      dueDate: addDays(0),
      dueTime: null,
      priority: 'high',
      category: 'finanse',
      archivedAt: null,
      noteId: null,
    },
    {
      id: 'demo-2',
      text: 'Zaktualizować CV',
      done: false,
      createdAt: localISODate(),
      dueDate: addDays(3),
      dueTime: null,
      priority: 'medium',
      category: 'praca',
      archivedAt: null,
      noteId: null,
    },
    {
      id: 'demo-3',
      text: 'Kupić kabel HDMI',
      done: false,
      createdAt: localISODate(),
      dueDate: null,
      dueTime: null,
      priority: 'low',
      category: 'dom',
      archivedAt: null,
      noteId: null,
    },
    {
      id: 'demo-4',
      text: 'Zadanie po terminie (demo)',
      done: false,
      createdAt: localISODate(),
      dueDate: addDays(-2),
      dueTime: '09:00',
      priority: 'medium',
      category: 'inne',
      archivedAt: null,
      noteId: null,
    },
    {
      id: 'demo-5',
      text: 'Zrobione zadanie demo',
      done: true,
      createdAt: localISODate(),
      dueDate: addDays(-1),
      dueTime: null,
      priority: 'low',
      category: 'inne',
      archivedAt: null,
      noteId: null,
    },
  ]
}

export function useTodos() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId
  const todosKey = queryKeys.todos(userId)

  const { data: todos = [], isPending } = useQuery({
    queryKey: todosKey,
    queryFn: isDemoMode
      ? () => buildDemoTodos().sort(compareTodosForDisplay)
      : () =>
          todosApi.getAll().then((data) =>
            data.map(normalizeTodoFromApi).sort(compareTodosForDisplay)
          ),
    enabled: isDemoMode || queryEnabled,
    staleTime: isDemoMode ? Infinity : undefined,
    gcTime: isDemoMode ? Infinity : undefined,
  })

  const loading = !isDemoMode && isPending

  const addMutation = useMutation({
    mutationFn: (payload: TodoCreatePayload) =>
      todosApi.create({
        text: payload.text.trim(),
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
        priority: payload.priority ?? 'medium',
        category: payload.category ?? 'inne',
        noteId: payload.noteId,
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      const optimistic: TodoItem = {
        id: `optimistic-${Date.now()}`,
        text: payload.text.trim(),
        done: false,
        createdAt: localISODate(),
        dueDate: payload.dueDate ?? null,
        dueTime: payload.dueTime ?? null,
        priority: payload.priority ?? 'medium',
        category: payload.category ?? 'inne',
        archivedAt: null,
        noteId: payload.noteId ?? null,
      }
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        [...(old ?? []), optimistic].sort(compareTodosForDisplay)
      )
      return { previous }
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(todosKey, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TodoUpdatePayload }) =>
      todosApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? [])
          .map((t) => (t.id === id ? applyTodoPatch(t, patch) : t))
          .sort(compareTodosForDisplay)
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => todosApi.update(id, { done }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done } : t)).sort(compareTodosForDisplay)
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

  const clearCompletedMutation = useMutation({
    mutationFn: () => todosApi.deleteAllCompleted(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: todosKey })
      const previous = queryClient.getQueryData<TodoItem[]>(todosKey)
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) => (old ?? []).filter((t) => !t.done))
      return { previous }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(todosKey, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosKey })
    },
  })

  const addTodo = (input: string | TodoCreatePayload) => {
    const payload: TodoCreatePayload =
      typeof input === 'string'
        ? { text: input.trim(), priority: 'medium', category: 'inne', dueDate: null, dueTime: null }
        : input
    if (!payload.text.trim()) return
    if (isDemoMode) {
      const item: TodoItem = {
        id: `demo-${Date.now()}`,
        text: payload.text.trim(),
        done: false,
        createdAt: localISODate(),
        dueDate: payload.dueDate ?? null,
        dueTime: payload.dueTime ?? null,
        priority: payload.priority ?? 'medium',
        category: payload.category ?? 'inne',
        archivedAt: null,
        noteId: payload.noteId ?? null,
      }
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        [...(old ?? []), item].sort(compareTodosForDisplay)
      )
      return
    }
    addMutation.mutate(payload)
  }

  const updateTodo = (id: string, patch: TodoUpdatePayload) => {
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? [])
          .map((t) => (t.id === id ? applyTodoPatch(t, patch) : t))
          .sort(compareTodosForDisplay)
      )
      return
    }
    updateMutation.mutate({ id, patch })
  }

  const toggleTodo = (id: string, done: boolean) => {
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done } : t)).sort(compareTodosForDisplay)
      )
      return
    }
    toggleMutation.mutate({ id, done })
  }

  const removeTodo = (id: string) => {
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) => (old ?? []).filter((t) => t.id !== id))
      return
    }
    removeMutation.mutate(id)
  }

  const clearCompletedTodos = () => {
    if (isDemoMode) {
      queryClient.setQueryData<TodoItem[]>(todosKey, (old) => (old ?? []).filter((t) => !t.done))
      return
    }
    clearCompletedMutation.mutate()
  }

  return {
    todos,
    addTodo,
    updateTodo,
    toggleTodo,
    removeTodo,
    clearCompletedTodos,
    loading,
  }
}
