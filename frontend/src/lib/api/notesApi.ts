import { api } from './client'
import type { Note } from '../notesModel'

export type NoteDto = {
  id: string
  type: Note['type']
  content: string
  tags: string[]
  title: string | null
  pinned: boolean
  archivedAt: string | null
  ideaStatus: Note['ideaStatus']
  referenceKind: Note['referenceKind']
  referenceUrl: string | null
  referenceSource: string | null
  createdAt: string
  updatedAt: string
}

export type NoteCreateBody = Partial<Omit<NoteDto, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<NoteDto, 'type' | 'content' | 'tags'>

export const notesApi = {
  getAll: () => api<NoteDto[]>('/notes'),
  create: (data: NoteCreateBody) => api<NoteDto>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<NoteCreateBody>) =>
    api<NoteDto>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/notes/${id}`, { method: 'DELETE' }),
}
