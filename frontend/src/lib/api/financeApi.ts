import { api } from './client'

export const expensesApi = {
  getAll: () => api<{ id: string; name: string; amount: number; category: string; date: string }[]>('/expenses'),
  create: (data: { name: string; amount: number; category: string; date: string }) =>
    api<{ id: string; name: string; amount: number; category: string; date: string }>(
      '/expenses',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/expenses/${id}`, { method: 'DELETE' }),
}

export const expenseCategoriesApi = {
  getAll: () =>
    api<{ id: string; name: string; color: string }[]>('/expense-categories'),
  create: (data: { name: string; color: string }) =>
    api<{ id: string; name: string; color: string }>('/expense-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; color?: string }) =>
    api<{ id: string; name: string; color: string }>(`/expense-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => api(`/expense-categories/${id}`, { method: 'DELETE' }),
}

export const scheduledExpensesApi = {
  getAll: () =>
    api<{ id: string; name: string; amount: number; category: string; dayOfMonth: number; active: boolean }[]>(
      '/scheduled-expenses'
    ),
  create: (data: { name: string; amount: number; category: string; dayOfMonth: number }) =>
    api<{ id: string; name: string; amount: number; category: string; dayOfMonth: number; active: boolean }>(
      '/scheduled-expenses',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (
    id: string,
    data: { name?: string; amount?: number; category?: string; dayOfMonth?: number; active?: boolean }
  ) =>
    api<{ id: string; name: string; amount: number; category: string; dayOfMonth: number; active: boolean }>(
      `/scheduled-expenses/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/scheduled-expenses/${id}`, { method: 'DELETE' }),
}

export const incomeApi = {
  getAll: () =>
    api<{ id: string; source: string; amount: number; date: string; recurring: boolean }[]>('/income'),
  create: (data: { source: string; amount: number; date: string; recurring?: boolean }) =>
    api<{ id: string; source: string; amount: number; date: string; recurring: boolean }>(
      '/income',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/income/${id}`, { method: 'DELETE' }),
}
