import { api } from './client'

export const habitsApi = {
  getAll: () =>
    api<{ id: string; name: string; checkIns: { id: string; date: string }[] }[]>('/habits'),
  create: (name: string) =>
    api<{ id: string; name: string }>('/habits', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    api<{ id: string; name: string }>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) => api(`/habits/${id}`, { method: 'DELETE' }),
  checkIn: (habitId: string, date: string) =>
    api(`/habits/${habitId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),
  uncheckIn: (habitId: string, date: string) =>
    api(`/habits/${habitId}/check-in?date=${encodeURIComponent(date)}`, {
      method: 'DELETE',
    }),
}
