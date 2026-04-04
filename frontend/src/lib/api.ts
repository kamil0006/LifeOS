const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('lifeos_token') || sessionStorage.getItem('lifeos_token')
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isAuthRoute = path.startsWith('/auth/')
  const token = isAuthRoute ? null : getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch (e) {
    throw new Error(
      'Nie można połączyć z serwerem. Upewnij się, że backend działa (port 3002).'
    )
  }
  if (res.status === 401) {
    if (!isAuthRoute) {
      localStorage.removeItem('lifeos_token')
      localStorage.removeItem('lifeos_user')
      sessionStorage.removeItem('lifeos_token')
      sessionStorage.removeItem('lifeos_user')
      window.location.href = '/login'
    }
    const err = await res.json().catch(() => ({ error: 'Nieprawidłowy email lub hasło' }))
    throw new Error(err.error || 'Nieprawidłowy email lub hasło')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg = err?.error || err?.message
    const fallback =
      res.status === 400
        ? 'Nieprawidłowe dane'
        : res.status === 404
          ? 'Nie znaleziono'
          : res.status === 503
            ? 'Serwis tymczasowo niedostępny'
            : 'Wystąpił błąd serwera'
    throw new Error(msg || fallback)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api<{ token: string; user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    api<{ token: string; user: { id: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  resetPassword: (email: string, newPassword: string) =>
    api<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),
}

// Expenses
export const expensesApi = {
  getAll: () => api<{ id: string; name: string; amount: number; category: string; date: string }[]>('/expenses'),
  create: (data: { name: string; amount: number; category: string; date: string }) =>
    api<{ id: string; name: string; amount: number; category: string; date: string }>(
      '/expenses',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  delete: (id: string) => api(`/expenses/${id}`, { method: 'DELETE' }),
}

// Expense categories (własne kategorie z kolorami)
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

// Scheduled expenses (przyszłe wydatki – co miesiąc)
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

// Income
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

// Todos
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

// Wishes
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

// Achievements
export const achievementsApi = {
  getAll: () =>
    api<{ id: string; achievementId: string; unlockedAt: string }[]>('/achievements'),
}

// Events
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

// Habits
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

// Goals
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
