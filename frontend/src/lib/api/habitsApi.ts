import { api } from './client'

export type HabitCheckInDto = { id: string; date: string; value: number | null }
export type HabitDto = {
  id: string
  name: string
  unit: string | null
  targetPerDay: number | null
  createdAt: string
  checkIns: HabitCheckInDto[]
}

export const habitsApi = {
  getAll: () => api<HabitDto[]>('/habits'),
  create: (name: string, extras?: { unit?: string | null; targetPerDay?: number | null }) =>
    api<HabitDto>('/habits', {
      method: 'POST',
      body: JSON.stringify({
        name,
        ...(extras?.unit !== undefined ? { unit: extras.unit } : {}),
        ...(extras?.targetPerDay !== undefined ? { targetPerDay: extras.targetPerDay } : {}),
      }),
    }),
  update: (
    id: string,
    payload: { name?: string; unit?: string | null; targetPerDay?: number | null }
  ) =>
    api<HabitDto>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  delete: (id: string) => api(`/habits/${id}`, { method: 'DELETE' }),
  checkIn: (habitId: string, date: string, body?: { value?: number | null }) =>
    api<HabitCheckInDto>(`/habits/${habitId}/check-in`, {
      method: 'POST',
      body: JSON.stringify(body?.value !== undefined ? { date, value: body.value } : { date }),
    }),
  uncheckIn: (habitId: string, date: string) =>
    api(`/habits/${habitId}/check-in?date=${encodeURIComponent(date)}`, {
      method: 'DELETE',
    }),
}
