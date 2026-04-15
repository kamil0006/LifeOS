import { api } from './client'

export const eventsApi = {
  getAll: () =>
    api<{ id: string; title: string; date: string; time?: string; category?: string; color?: string; notes?: string }[]>('/events'),
  create: (data: { title: string; date: string; time?: string; category?: string; color?: string; notes?: string }) =>
    api<{ id: string; title: string; date: string; time?: string; category?: string; color?: string; notes?: string }>(
      '/events',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (id: string, data: Partial<{ title: string; date: string; time?: string; category?: string; color?: string; notes?: string }>) =>
    api<{ id: string; title: string; date: string; time?: string; category?: string; color?: string; notes?: string }>(
      `/events/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/events/${id}`, { method: 'DELETE' }),
}
