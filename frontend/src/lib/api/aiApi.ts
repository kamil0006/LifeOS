import { api } from './client'

export interface WeeklyReport {
  summary: string
  generatedAt: string
  model: string
  source: 'ai' | 'fallback'
}

export const aiApi = {
  weeklyReport: () => api<WeeklyReport>('/ai/weekly-report', { method: 'POST' }),
  status: () => api<{ enabled: boolean }>('/ai/status'),
}
