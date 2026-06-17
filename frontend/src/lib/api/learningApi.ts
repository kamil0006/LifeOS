import { api } from './client'
import type {
  LearningSession,
  Course,
  Project,
  Book,
  Certification,
} from '../../context/LearningContext'

export interface LearningSettingsDto {
  weeklyGoalMinutes: number
  sessionCategories: string[]
  bookCategories: string[]
}

function crud<TEntity extends { id: string }>(resource: string) {
  return {
    getAll: () => api<TEntity[]>(`/learning/${resource}`),
    create: (data: Omit<TEntity, 'id'>) =>
      api<TEntity>(`/learning/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Omit<TEntity, 'id'>>) =>
      api<TEntity>(`/learning/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => api(`/learning/${resource}/${id}`, { method: 'DELETE' }),
  }
}

export const learningApi = {
  sessions: crud<LearningSession>('sessions'),
  courses: crud<Course>('courses'),
  projects: crud<Project>('projects'),
  books: crud<Book>('books'),
  certifications: crud<Certification>('certifications'),
  getSettings: () => api<LearningSettingsDto>('/learning/settings'),
  updateSettings: (data: Partial<LearningSettingsDto>) =>
    api<LearningSettingsDto>('/learning/settings', { method: 'PUT', body: JSON.stringify(data) }),
}
