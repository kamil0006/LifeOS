import { api } from './client'

export const expensesApi = {
  getAll: () => api<{ id: string; name: string; amount: number; category: string; date: string }[]>('/expenses'),
  create: (data: { name: string; amount: number; category: string; date: string }) =>
    api<{ id: string; name: string; amount: number; category: string; date: string }>(
      '/expenses',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (id: string, data: { name?: string; amount?: number; category?: string; date?: string }) =>
    api<{ id: string; name: string; amount: number; category: string; date: string }>(
      `/expenses/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
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
    api<{ id: string; name: string; amount: number; category: string; dayOfMonth: number; active: boolean; pausedUntil?: string | null; reminderDaysBefore?: number | null }[]>(
      '/scheduled-expenses'
    ),
  create: (data: { name: string; amount: number; category: string; dayOfMonth: number }) =>
    api<{ id: string; name: string; amount: number; category: string; dayOfMonth: number; active: boolean; pausedUntil?: string | null; reminderDaysBefore?: number | null }>(
      '/scheduled-expenses',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (
    id: string,
    data: {
      name?: string
      amount?: number
      category?: string
      dayOfMonth?: number
      active?: boolean
      pausedUntil?: string | null
      reminderDaysBefore?: number | null
    }
  ) =>
    api<{ id: string; name: string; amount: number; category: string; dayOfMonth: number; active: boolean; pausedUntil?: string | null; reminderDaysBefore?: number | null }>(
      `/scheduled-expenses/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/scheduled-expenses/${id}`, { method: 'DELETE' }),
}

export const incomeApi = {
  getAll: () =>
    api<{ id: string; source: string; amount: number; date: string; recurring: boolean; category: string }[]>(
      '/income'
    ),
  create: (data: { source: string; amount: number; date: string; recurring?: boolean; category?: string }) =>
    api<{ id: string; source: string; amount: number; date: string; recurring: boolean; category: string }>(
      '/income',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  update: (
    id: string,
    data: { source?: string; amount?: number; date?: string; recurring?: boolean; category?: string }
  ) =>
    api<{ id: string; source: string; amount: number; date: string; recurring: boolean; category: string }>(
      `/income/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/income/${id}`, { method: 'DELETE' }),
}

export type NetWorthAccountDto = {
  id: string
  name: string
  kind: 'asset' | 'liability'
  balance: number
  iconKey?: string | null
  accentKey?: string | null
  createdAt: string
  updatedAt: string
}

export type NetWorthAdjustmentDto = {
  id: string
  accountId: string
  amount: number
  description: string | null
  createdAt: string
  account: { id: string; name: string; kind: 'asset' | 'liability' }
}

export const netWorthApi = {
  getAccounts: () => api<NetWorthAccountDto[]>('/net-worth/accounts'),
  createAccount: (data: {
    name: string
    kind: 'asset' | 'liability'
    balance: number
    iconKey?: string | null
    accentKey?: string | null
  }) =>
    api<NetWorthAccountDto>('/net-worth/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (
    id: string,
    data: Partial<{
      name: string
      kind: 'asset' | 'liability'
      balance: number
      iconKey?: string | null
      accentKey?: string | null
    }>
  ) =>
    api<NetWorthAccountDto>(`/net-worth/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccount: (id: string) => api<void>(`/net-worth/accounts/${id}`, { method: 'DELETE' }),
  getAdjustments: () => api<NetWorthAdjustmentDto[]>('/net-worth/adjustments'),
  createAdjustment: (data: { accountId: string; amount: number; description?: string }) =>
    api<{ adjustment: NetWorthAdjustmentDto; account: NetWorthAccountDto }>('/net-worth/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdjustment: (id: string, data: { description?: string; amount?: number }) =>
    api<NetWorthAdjustmentDto>(`/net-worth/adjustments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAdjustment: (id: string) => api<void>(`/net-worth/adjustments/${id}`, { method: 'DELETE' }),
}
