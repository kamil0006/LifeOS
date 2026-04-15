import { api } from './client'

export const wishesApi = {
  getAll: () =>
    api<{ id: string; name: string; estimatedPrice: number; priority: number; stage: string; savedAmount: number; notes?: string }[]>('/wishes'),
  create: (data: { name: string; estimatedPrice: number; priority: number; stage?: string; savedAmount?: number; notes?: string }) =>
    api<{ id: string; name: string; estimatedPrice: number; priority: number; stage: string; savedAmount: number; notes?: string }>(
      '/wishes',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (id: string, data: { name?: string; estimatedPrice?: number; priority?: number; stage?: string; savedAmount?: number; notes?: string }) =>
    api<{ id: string; name: string; estimatedPrice: number; priority: number; stage: string; savedAmount: number; notes?: string }>(
      `/wishes/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/wishes/${id}`, { method: 'DELETE' }),
}
