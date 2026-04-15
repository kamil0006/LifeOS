import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface CodingHour {
  id: string
  date: string
  hours: number
  note?: string
}

export interface Course {
  id: string
  name: string
  platform?: string
  platformUrl?: string
  progress: number
  status: 'w_trakcie' | 'ukonczony' | 'zaplanowany'
  startedAt?: string
  completedAt?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  tech?: string
  status: 'w_trakcie' | 'ukonczony' | 'zaplanowany'
  url?: string
  githubUrl?: string
}

export interface Book {
  id: string
  title: string
  author: string
  category?: string
  finishedAt: string
  rating?: number
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url?: string
}

/** Zalogowane konto — osobny prefiks niż demo i niż stary `lifeos_nauka_*`, żeby nie wczytywać zapisanych kiedyś przykładów. */
const STORAGE_KEY_AUTH = 'lifeos_nauka_user'
/** Stary wspólny prefiks (przed rozdzieleniem demo/user) — używany tylko do jednorazowej migracji. */
const STORAGE_KEY_LEGACY = 'lifeos_nauka'
const STORAGE_KEY_DEMO = 'lifeos_nauka_demo'

const currentYear = new Date().getFullYear()
const pad = (m: number, d: number) => `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const DEMO_CODING_HOURS: CodingHour[] = [
  { id: '1', date: pad(3, 5), hours: 3, note: 'LifeOS' },
  { id: '2', date: pad(3, 4), hours: 2 },
  { id: '3', date: pad(3, 3), hours: 4, note: 'Backend' },
  { id: '4', date: pad(3, 1), hours: 1.5 },
  { id: '5', date: pad(2, 28), hours: 5 },
  { id: '6', date: pad(2, 15), hours: 3 },
  { id: '7', date: pad(2, 8), hours: 2.5 },
  { id: '8', date: pad(1, 25), hours: 4 },
  { id: '9', date: pad(1, 18), hours: 3 },
  { id: '10', date: pad(1, 10), hours: 2 },
]

const DEMO_COURSES: Course[] = [
  { id: '1', name: 'React + TypeScript', platform: 'Udemy', platformUrl: 'https://udemy.com', progress: 100, status: 'ukonczony', completedAt: '2025-02-15' },
  { id: '2', name: 'Node.js API', platform: 'YouTube', platformUrl: 'https://youtube.com', progress: 65, status: 'w_trakcie', startedAt: '2025-01-10' },
  { id: '3', name: 'PostgreSQL', platform: 'Udemy', progress: 0, status: 'zaplanowany' },
]

const DEMO_PROJECTS: Project[] = [
  { id: '1', name: 'LifeOS', description: 'Aplikacja do zarządzania życiem', tech: 'React, Node, PostgreSQL', status: 'w_trakcie', githubUrl: 'https://github.com/example/lifeos' },
  { id: '2', name: 'Portfolio', tech: 'Next.js', status: 'ukonczony', url: 'https://example.com', githubUrl: 'https://github.com/example/portfolio' },
]

const DEMO_BOOKS: Book[] = [
  { id: '1', title: 'Czysty kod', author: 'Robert C. Martin', category: 'Programowanie', finishedAt: '2025-02-20', rating: 5 },
  { id: '2', title: 'Pragmatyczny programista', author: 'David Thomas, Andrew Hunt', category: 'Programowanie', finishedAt: '2025-01-05', rating: 5 },
]

const DEMO_CERTIFICATES: Certification[] = [
  { id: '1', name: 'AWS Cloud Practitioner', issuer: 'Amazon', date: '2024-12-01' },
]

interface LearningContextType {
  codingHours: CodingHour[]
  courses: Course[]
  projects: Project[]
  books: Book[]
  bookCategories: string[]
  certifications: Certification[]
  addCodingHour: (h: Omit<CodingHour, 'id'>) => void
  deleteCodingHour: (id: string) => void
  addCourse: (c: Omit<Course, 'id'>) => void
  updateCourse: (id: string, u: Partial<Course>) => void
  deleteCourse: (id: string) => void
  addProject: (p: Omit<Project, 'id'>) => void
  updateProject: (id: string, u: Partial<Project>) => void
  deleteProject: (id: string) => void
  addBook: (b: Omit<Book, 'id'>) => void
  updateBook: (id: string, u: Partial<Book>) => void
  deleteBook: (id: string) => void
  addBookCategory: (name: string) => void
  removeBookCategory: (name: string) => void
  addCertification: (c: Omit<Certification, 'id'>) => void
  deleteCertification: (id: string) => void
}

const LearningContext = createContext<LearningContextType | null>(null)

function loadFromStorage<T>(storagePrefix: string, key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(`${storagePrefix}_${key}`)
    if (s) return JSON.parse(s) as T
  } catch {
    /* ignore */
  }
  return fallback
}

function saveToStorage<T>(storagePrefix: string, key: string, data: T) {
  try {
    localStorage.setItem(`${storagePrefix}_${key}`, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

/** Dla konta: najpierw `lifeos_nauka_user_*`, potem ewentualnie migracja ze starego `lifeos_nauka_*` (pomijamy treść identyczną z demo). */
function loadAuthSlice<T>(key: string, empty: T, demoSeed: T): T {
  try {
    const userRaw = localStorage.getItem(`${STORAGE_KEY_AUTH}_${key}`)
    if (userRaw != null) return JSON.parse(userRaw) as T
  } catch {
    /* ignore */
  }
  try {
    const legacyRaw = localStorage.getItem(`${STORAGE_KEY_LEGACY}_${key}`)
    if (legacyRaw == null) return empty
    const parsed = JSON.parse(legacyRaw) as T
    if (JSON.stringify(parsed) === JSON.stringify(demoSeed)) return empty
    saveToStorage(STORAGE_KEY_AUTH, key, parsed)
    return parsed
  } catch {
    return empty
  }
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useAuth()
  const storagePrefix = isDemoMode ? STORAGE_KEY_DEMO : STORAGE_KEY_AUTH

  const [codingHours, setCodingHours] = useState<CodingHour[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'codingHours', DEMO_CODING_HOURS)
      : loadAuthSlice('codingHours', [], DEMO_CODING_HOURS),
  )
  const [courses, setCourses] = useState<Course[]>(() =>
    isDemoMode ? loadFromStorage(storagePrefix, 'courses', DEMO_COURSES) : loadAuthSlice('courses', [], DEMO_COURSES),
  )
  const [projects, setProjects] = useState<Project[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'projects', DEMO_PROJECTS)
      : loadAuthSlice('projects', [], DEMO_PROJECTS),
  )
  const [books, setBooks] = useState<Book[]>(() =>
    isDemoMode ? loadFromStorage(storagePrefix, 'books', DEMO_BOOKS) : loadAuthSlice('books', [], DEMO_BOOKS),
  )
  const [bookCategories, setBookCategories] = useState<string[]>(() =>
    isDemoMode ? loadFromStorage(storagePrefix, 'bookCategories', []) : loadAuthSlice('bookCategories', [], []),
  )
  const [certifications, setCertifications] = useState<Certification[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'certifications', DEMO_CERTIFICATES)
      : loadAuthSlice('certifications', [], DEMO_CERTIFICATES),
  )

  useEffect(() => {
    saveToStorage(storagePrefix, 'codingHours', codingHours)
  }, [codingHours, storagePrefix])
  useEffect(() => {
    saveToStorage(storagePrefix, 'courses', courses)
  }, [courses, storagePrefix])
  useEffect(() => {
    saveToStorage(storagePrefix, 'projects', projects)
  }, [projects, storagePrefix])
  useEffect(() => {
    saveToStorage(storagePrefix, 'books', books)
  }, [books, storagePrefix])
  useEffect(() => {
    saveToStorage(storagePrefix, 'bookCategories', bookCategories)
  }, [bookCategories, storagePrefix])
  useEffect(() => {
    saveToStorage(storagePrefix, 'certifications', certifications)
  }, [certifications, storagePrefix])

  const addCodingHour = (h: Omit<CodingHour, 'id'>) => {
    setCodingHours((prev) => [...prev, { ...h, id: Date.now().toString() }])
  }
  const deleteCodingHour = (id: string) => {
    setCodingHours((prev) => prev.filter((x) => x.id !== id))
  }

  const addCourse = (c: Omit<Course, 'id'>) => {
    setCourses((prev) => [...prev, { ...c, id: Date.now().toString() }])
  }
  const updateCourse = (id: string, u: Partial<Course>) => {
    setCourses((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  }
  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((x) => x.id !== id))
  }

  const addProject = (p: Omit<Project, 'id'>) => {
    setProjects((prev) => [...prev, { ...p, id: Date.now().toString() }])
  }
  const updateProject = (id: string, u: Partial<Project>) => {
    setProjects((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  }
  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((x) => x.id !== id))
  }

  const addBook = (b: Omit<Book, 'id'>) => {
    setBooks((prev) => [...prev, { ...b, id: Date.now().toString() }])
  }
  const updateBook = (id: string, u: Partial<Book>) => {
    setBooks((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  }
  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((x) => x.id !== id))
  }

  const addBookCategory = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBookCategories((prev) => {
      if (prev.includes(trimmed)) return prev
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b))
    })
  }
  const removeBookCategory = (name: string) => {
    setBookCategories((prev) => prev.filter((c) => c !== name))
  }

  const addCertification = (c: Omit<Certification, 'id'>) => {
    setCertifications((prev) => [...prev, { ...c, id: Date.now().toString() }])
  }
  const deleteCertification = (id: string) => {
    setCertifications((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <LearningContext.Provider
      value={{
        codingHours,
        courses,
        projects,
        books,
        bookCategories,
        certifications,
        addCodingHour,
        deleteCodingHour,
        addCourse,
        updateCourse,
        deleteCourse,
        addProject,
        updateProject,
        deleteProject,
        addBook,
        updateBook,
        deleteBook,
        addBookCategory,
        removeBookCategory,
        addCertification,
        deleteCertification,
      }}
    >
      {children}
    </LearningContext.Provider>
  )
}

export function useLearning() {
  return useContext(LearningContext)
}
