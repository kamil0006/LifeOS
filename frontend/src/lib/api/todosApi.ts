import { api } from './client'
import type { TodoCategory, TodoPriority } from '../todoDomain'

export interface TodoApiRecord {
  id: string
  text: string
  done: boolean
  createdAt: string
  dueDate?: string | null
  dueTime?: string | null
  priority?: string | null
  category?: string | null
  archivedAt?: string | null
  noteId?: string | null
}

export interface TodoCreateBody {
  text: string
  dueDate?: string | null
  dueTime?: string | null
  priority?: TodoPriority
  category?: TodoCategory
  noteId?: string | null
}

export interface TodoUpdateBody {
  done?: boolean
  text?: string
  dueDate?: string | null
  dueTime?: string | null
  priority?: TodoPriority
  category?: TodoCategory
  archivedAt?: string | null
  noteId?: string | null
}

export const todosApi = {
  getAll: () => api<TodoApiRecord[]>('/todos'),
  create: (body: TodoCreateBody) =>
    api<TodoApiRecord>('/todos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: TodoUpdateBody) =>
    api<TodoApiRecord>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (id: string) => api(`/todos/${id}`, { method: 'DELETE' }),
  deleteAllCompleted: () =>
    api<void>('/todos/bulk/completed', {
      method: 'DELETE',
    }),
}
