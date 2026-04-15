import { api } from './client'

export const todosApi = {
  getAll: () => api<{ id: string; text: string; done: boolean; createdAt: string }[]>('/todos'),
  create: (text: string) =>
    api<{ id: string; text: string; done: boolean; createdAt: string }>('/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  toggle: (id: string, done: boolean) =>
    api(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  delete: (id: string) => api(`/todos/${id}`, { method: 'DELETE' }),
}
