import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type NoteType = 'quick' | 'idea' | 'reference'

export interface Note {
  id: string
  type: NoteType
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY_DEMO = 'lifeos_notes_demo'
const STORAGE_KEY_USER = 'lifeos_notes_user'

const DEMO_NOTES: Note[] = [
  {
    id: '1',
    type: 'quick',
    content: '**Spotkanie** o 15:00 – przygotować prezentację.\n\n- Slajdy 1–5\n- Demo',
    tags: ['spotkanie', 'prezentacja'],
    createdAt: '2025-03-05T10:00:00',
    updatedAt: '2025-03-05T10:00:00',
  },
  {
    id: '2',
    type: 'idea',
    content: '## Pomysł: aplikacja do śledzenia nawyków\n\nIntegracja z kalendarzem i przypomnieniami.',
    tags: ['pomysł', 'app'],
    createdAt: '2025-03-04T14:30:00',
    updatedAt: '2025-03-04T14:30:00',
  },
  {
    id: '3',
    type: 'reference',
    content: '[React docs](https://react.dev) – hooks, useEffect, useMemo',
    tags: ['react', 'docs'],
    createdAt: '2025-03-03T09:15:00',
    updatedAt: '2025-03-03T09:15:00',
  },
]

interface NotesContextType {
  notes: Note[]
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, u: Partial<Pick<Note, 'content' | 'tags' | 'type'>>) => void
  deleteNote: (id: string) => void
}

const NotesContext = createContext<NotesContextType | null>(null)

function getStorageKey(isDemoMode: boolean) {
  return isDemoMode ? `${STORAGE_KEY_DEMO}_notes` : `${STORAGE_KEY_USER}_notes`
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useAuth()
  const storageKey = getStorageKey(isDemoMode)
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const s = localStorage.getItem(storageKey)
      if (s) return JSON.parse(s) as Note[]
    } catch {
      /* ignore */
    }
    return isDemoMode ? DEMO_NOTES : []
  })

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey)
      if (s) {
        setNotes(JSON.parse(s) as Note[])
      } else {
        setNotes(isDemoMode ? [...DEMO_NOTES] : [])
      }
    } catch {
      setNotes(isDemoMode ? [...DEMO_NOTES] : [])
    }
  }, [isDemoMode, storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes))
    } catch {
      /* ignore */
    }
  }, [notes, storageKey])

  const addNote = (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    setNotes((prev) => [
      ...prev,
      { ...n, id: Date.now().toString(), createdAt: now, updatedAt: now },
    ])
  }

  const updateNote = (id: string, u: Partial<Pick<Note, 'content' | 'tags' | 'type'>>) => {
    const now = new Date().toISOString()
    setNotes((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...u, updatedAt: now } : x))
    )
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  return useContext(NotesContext)
}
