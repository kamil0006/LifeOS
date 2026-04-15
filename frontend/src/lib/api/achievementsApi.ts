import { api } from './client'

export const achievementsApi = {
  getAll: () =>
    api<{ id: string; achievementId: string; unlockedAt: string }[]>('/achievements'),
}
