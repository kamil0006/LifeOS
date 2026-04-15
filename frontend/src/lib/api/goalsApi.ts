import { api } from './client'

export const goalsApi = {
  getAll: () =>
    api<{ id: string; name: string; target: number; current: number; unit?: string }[]>('/goals'),
  create: (data: { name: string; target: number; current?: number; unit?: string }) =>
    api<{ id: string; name: string; target: number; current: number; unit?: string }>(
      '/goals',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (id: string, data: { current?: number; target?: number; name?: string; unit?: string }) =>
    api<{ id: string; name: string; target: number; current: number; unit?: string }>(
      `/goals/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/goals/${id}`, { method: 'DELETE' }),
}
