import { api } from './client'

export interface EventDto {
  id: string
  title: string
  date: string
  time?: string
  category?: string
  color?: string
  notes?: string
  recurrenceType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  recurrenceInterval?: number
  recurrenceUnit?: 'day' | 'week' | 'month' | 'year'
  recurrenceUntil?: string
  linkedTodoId?: string | null
}

export interface EventCategoryDto {
  id: string
  name: string
  color: string
  icon?: string
  isVisible: boolean
}

export const eventsApi = {
  getAll: () => api<EventDto[]>('/events'),
  create: (data: Omit<EventDto, 'id'>) => api<EventDto>('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<EventDto, 'id'>>) =>
    api<EventDto>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/events/${id}`, { method: 'DELETE' }),
}

export const eventCategoriesApi = {
  getAll: () => api<EventCategoryDto[]>('/event-categories'),
  create: (data: Omit<EventCategoryDto, 'id'>) =>
    api<EventCategoryDto>('/event-categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<EventCategoryDto, 'id'>>) =>
    api<EventCategoryDto>(`/event-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/event-categories/${id}`, { method: 'DELETE' }),
}
