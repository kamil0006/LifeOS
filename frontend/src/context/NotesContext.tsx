import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  type Note,
  type NoteType,
  type IdeaStatus,
  type ReferenceKind,
  type NoteCreateInput,
  normalizeNotesArray,
  createNotePayloadFromInput,
} from '../lib/notesModel'

export type { Note, NoteType, IdeaStatus, ReferenceKind, NoteCreateInput }

const STORAGE_KEY_DEMO = 'lifeos_notes_demo'
const STORAGE_KEY_USER = 'lifeos_notes_user'

const DEMO_NOTES: Note[] = normalizeNotesArray([
  {
    id: '1',
    type: 'inbox',
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
    ideaStatus: 'nowy',
  },
  {
    id: '3',
    type: 'reference',
    content: '[React docs](https://react.dev) – hooks, useEffect, useMemo',
    tags: ['react', 'docs'],
    createdAt: '2025-03-03T09:15:00',
    updatedAt: '2025-03-03T09:15:00',
    referenceKind: 'link',
    referenceUrl: 'https://react.dev',
  },
])

export type NoteUpdate = Partial<
  Pick<
    Note,
    | 'content'
    | 'tags'
    | 'type'
    | 'title'
    | 'pinned'
    | 'archivedAt'
    | 'ideaStatus'
    | 'referenceKind'
    | 'referenceUrl'
    | 'referenceSource'
  >
>

interface NotesContextType {
  notes: Note[]
  addNote: (n: NoteCreateInput) => void
  updateNote: (id: string, u: NoteUpdate) => void
  archiveNote: (id: string) => void
  restoreNote: (id: string) => void
  deleteNotePermanently: (id: string) => void
  togglePin: (id: string) => void
}

const NotesContext = createContext<NotesContextType | null>(null)

function getStorageKey(isDemoMode: boolean) {
  return isDemoMode ? `${STORAGE_KEY_DEMO}_notes` : `${STORAGE_KEY_USER}_notes`
}

function parseStoredNotes(raw: string | null): Note[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeNotesArray(parsed)
  } catch {
    return []
  }
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useAuth()
  const storageKey = getStorageKey(isDemoMode)
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const s = localStorage.getItem(storageKey)
      if (s) return parseStoredNotes(s)
    } catch {
      /* ignore */
    }
    return isDemoMode ? DEMO_NOTES : []
  })

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey)
      if (s) {
        setNotes(parseStoredNotes(s))
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

  const addNote = (n: NoteCreateInput) => {
    const now = new Date().toISOString()
    const payload = createNotePayloadFromInput(n)
    setNotes((prev) => [
      ...prev,
      { ...payload, id: Date.now().toString(), createdAt: now, updatedAt: now },
    ])
  }

  const updateNote = (id: string, u: NoteUpdate) => {
    const now = new Date().toISOString()
    setNotes((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x
        const next = { ...x, ...u, updatedAt: now }
        if (u.type !== undefined && u.type !== x.type) {
          if (u.type !== 'idea') next.ideaStatus = 'nowy'
          if (u.type !== 'reference') {
            next.referenceKind = 'link'
            next.referenceUrl = null
            next.referenceSource = null
          }
        }
        return next
      })
    )
  }

  const archiveNote = (id: string) => {
    const ts = new Date().toISOString()
    updateNote(id, { archivedAt: ts })
  }

  const restoreNote = (id: string) => {
    updateNote(id, { archivedAt: null })
  }

  const deleteNotePermanently = (id: string) => {
    setNotes((prev) => prev.filter((x) => x.id !== id))
  }

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((x) => (x.id === id ? { ...x, pinned: !x.pinned, updatedAt: new Date().toISOString() } : x))
    )
  }

  return (
    <NotesContext.Provider
      value={{
        notes,
        addNote,
        updateNote,
        archiveNote,
        restoreNote,
        deleteNotePermanently,
        togglePin,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  return useContext(NotesContext)
}
