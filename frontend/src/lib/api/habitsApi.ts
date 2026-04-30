import { api } from './client'

export type HabitCheckInStatus = 'done' | 'missed' | 'skipped'
export type HabitScheduleType = 'daily' | 'weekdays' | 'weekly' | 'monthly'
export type HabitCheckInDto = {
  id: string
  date: string
  value: number | null
  status?: HabitCheckInStatus
  note?: string | null
}
export type HabitDto = {
  id: string
  name: string
  category: string | null
  color: string | null
  scheduleType: HabitScheduleType
  scheduleDays: number[]
  weeklyTarget: number | null
  monthlyTarget: number | null
  unit: string | null
  targetPerDay: number | null
  createdAt: string
  archivedAt?: string | null
  checkIns: HabitCheckInDto[]
}

export type HabitUpsertPayload = {
  unit?: string | null
  targetPerDay?: number | null
  category?: string | null
  color?: string | null
  scheduleType?: HabitScheduleType
  scheduleDays?: number[]
  weeklyTarget?: number | null
  monthlyTarget?: number | null
  archivedAt?: string | null
}

export const habitsApi = {
  getAll: (options?: { includeArchived?: boolean }) =>
    api<HabitDto[]>(`/habits${options?.includeArchived ? '?includeArchived=true' : ''}`),
  create: (name: string, extras?: HabitUpsertPayload) =>
    api<HabitDto>('/habits', {
      method: 'POST',
      body: JSON.stringify({
        name,
        ...(extras?.unit !== undefined ? { unit: extras.unit } : {}),
        ...(extras?.targetPerDay !== undefined ? { targetPerDay: extras.targetPerDay } : {}),
        ...(extras?.category !== undefined ? { category: extras.category } : {}),
        ...(extras?.color !== undefined ? { color: extras.color } : {}),
        ...(extras?.scheduleType !== undefined ? { scheduleType: extras.scheduleType } : {}),
        ...(extras?.scheduleDays !== undefined ? { scheduleDays: extras.scheduleDays } : {}),
        ...(extras?.weeklyTarget !== undefined ? { weeklyTarget: extras.weeklyTarget } : {}),
        ...(extras?.monthlyTarget !== undefined ? { monthlyTarget: extras.monthlyTarget } : {}),
        ...(extras?.archivedAt !== undefined ? { archivedAt: extras.archivedAt } : {}),
      }),
    }),
  update: (
    id: string,
    payload: { name?: string } & HabitUpsertPayload
  ) =>
    api<HabitDto>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  delete: (id: string) => api(`/habits/${id}`, { method: 'DELETE' }),
  deletePermanently: (id: string) =>
    api(`/habits/${id}?permanent=true`, { method: 'DELETE' }),
  checkIn: (
    habitId: string,
    date: string,
    body?: { value?: number | null; status?: HabitCheckInStatus; note?: string | null }
  ) =>
    api<HabitCheckInDto>(`/habits/${habitId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({
        date,
        ...(body?.value !== undefined ? { value: body.value } : {}),
        ...(body?.status !== undefined ? { status: body.status } : {}),
        ...(body?.note !== undefined ? { note: body.note } : {}),
      }),
    }),
  uncheckIn: (habitId: string, date: string) =>
    api(`/habits/${habitId}/check-in?date=${encodeURIComponent(date)}`, {
      method: 'DELETE',
    }),
}
