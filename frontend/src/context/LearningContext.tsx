import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type SessionType = 'kurs' | 'ksiazka' | 'projekt' | 'praktyka' | 'powtorka' | 'inne'

export interface LearningSession {
  id: string
  date: string
  minutes: number
  topic: string
  type: SessionType
  category?: string
  note?: string
  courseId?: string
  projectId?: string
  bookId?: string
}

interface LegacyCodingHour {
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
  nextLesson?: string
}

export type ProjectStatus = 'pomysl' | 'w_trakcie' | 'mvp' | 'ukonczony' | 'porzucony'

export interface Project {
  id: string
  name: string
  description?: string
  tech?: string
  status: ProjectStatus
  url?: string
  githubUrl?: string
  nextStep?: string
  priority?: 'niski' | 'sredni' | 'wysoki'
}

export type ReadingStatus = 'chce_przeczytac' | 'czytam' | 'przeczytane'

export interface Book {
  id: string
  title: string
  author?: string
  category?: string
  status: ReadingStatus
  finishedAt?: string
  startedAt?: string
  rating?: number
  notes?: string
  keyTakeaway?: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url?: string
  expiryDate?: string
  verificationUrl?: string
  renewalReminderDays?: number
}

const STORAGE_KEY_AUTH = 'lifeos_nauka_user'
const STORAGE_KEY_LEGACY = 'lifeos_nauka'
const STORAGE_KEY_DEMO = 'lifeos_nauka_demo'

const currentYear = new Date().getFullYear()
const pad = (m: number, d: number) =>
  `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const DEMO_SESSIONS: LearningSession[] = [
  { id: '1', date: pad(4, 28), minutes: 180, topic: 'LifeOS', type: 'projekt', category: 'Backend' },
  { id: '2', date: pad(4, 27), minutes: 120, topic: 'Backend API', type: 'projekt', category: 'Backend' },
  { id: '3', date: pad(4, 25), minutes: 240, topic: 'Node.js API', type: 'kurs', category: 'Backend' },
  { id: '4', date: pad(4, 22), minutes: 90, topic: 'Powtórka algorytmów', type: 'powtorka', category: 'Algorytmy' },
  { id: '5', date: pad(4, 20), minutes: 300, topic: 'React + TypeScript', type: 'kurs', category: 'Frontend' },
  { id: '6', date: pad(3, 28), minutes: 180, topic: 'Czysty Kod', type: 'ksiazka', category: 'Programowanie' },
  { id: '7', date: pad(3, 15), minutes: 150, topic: 'PostgreSQL', type: 'kurs', category: 'Backend' },
  { id: '8', date: pad(3, 8), minutes: 240, topic: 'LifeOS backend', type: 'projekt', category: 'Backend' },
  { id: '9', date: pad(2, 18), minutes: 180, topic: 'TypeScript generics', type: 'praktyka', category: 'Frontend' },
  { id: '10', date: pad(1, 10), minutes: 120, topic: 'Pragmatyczny Programista', type: 'ksiazka', category: 'Programowanie' },
]

const DEMO_SESSION_CATEGORIES = ['Frontend', 'Backend', 'Algorytmy', 'Programowanie', 'Angielski', 'Matematyka']

const DEMO_COURSES: Course[] = [
  {
    id: '1',
    name: 'React + TypeScript',
    platform: 'Udemy',
    platformUrl: 'https://udemy.com',
    progress: 100,
    status: 'ukonczony',
    startedAt: `${currentYear}-01-10`,
    completedAt: `${currentYear}-02-15`,
  },
  {
    id: '2',
    name: 'Node.js API',
    platform: 'YouTube',
    platformUrl: 'https://youtube.com',
    progress: 65,
    status: 'w_trakcie',
    startedAt: `${currentYear}-02-01`,
    nextLesson: 'Middleware i autoryzacja',
  },
  {
    id: '3',
    name: 'PostgreSQL dla zaawansowanych',
    platform: 'Udemy',
    progress: 0,
    status: 'zaplanowany',
  },
]

const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'LifeOS',
    description: 'Aplikacja do zarządzania życiem',
    tech: 'React, Node, PostgreSQL',
    status: 'w_trakcie',
    githubUrl: 'https://github.com/example/lifeos',
    priority: 'wysoki',
    nextStep: 'Zaimplementować sekcję nauki',
  },
  {
    id: '2',
    name: 'Portfolio',
    tech: 'Next.js',
    status: 'ukonczony',
    url: 'https://example.com',
    githubUrl: 'https://github.com/example/portfolio',
  },
]

const DEMO_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Czysty kod',
    author: 'Robert C. Martin',
    category: 'Programowanie',
    status: 'przeczytane',
    finishedAt: `${currentYear}-02-20`,
    rating: 5,
    keyTakeaway: 'Piszę kod tak, żeby dało się go łatwo czytać',
  },
  {
    id: '2',
    title: 'Pragmatyczny programista',
    author: 'David Thomas, Andrew Hunt',
    category: 'Programowanie',
    status: 'przeczytane',
    finishedAt: `${currentYear}-01-05`,
    rating: 5,
  },
  {
    id: '3',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Rozwój osobisty',
    status: 'czytam',
    startedAt: `${currentYear}-04-01`,
  },
]

const DEMO_CERTIFICATES: Certification[] = [
  {
    id: '1',
    name: 'AWS Cloud Practitioner',
    issuer: 'Amazon',
    date: '2024-12-01',
    expiryDate: '2027-12-01',
    verificationUrl: 'https://aws.amazon.com/verify',
    renewalReminderDays: 90,
  },
]

const DEFAULT_WEEKLY_GOAL_MINUTES = 600

function migrateLegacyCodingHours(legacy: LegacyCodingHour[]): LearningSession[] {
  return legacy.map((h) => ({
    id: h.id,
    date: h.date,
    minutes: Math.round(h.hours * 60),
    topic: h.note || 'Nauka',
    type: 'inne' as SessionType,
  }))
}

function normalizeBooksFromStorage(raw: unknown[]): Book[] {
  return (raw as Array<Record<string, unknown>>).map((b) => ({
    status: 'przeczytane' as ReadingStatus,
    ...b,
  })) as Book[]
}

function normalizeProjectsFromStorage(raw: unknown[]): Project[] {
  return (raw as Array<Record<string, unknown>>).map((p) => ({
    ...p,
    status:
      p.status === 'zaplanowany'
        ? 'pomysl'
        : (p.status as ProjectStatus) || 'w_trakcie',
  })) as Project[]
}

interface LearningContextType {
  sessions: LearningSession[]
  courses: Course[]
  projects: Project[]
  books: Book[]
  bookCategories: string[]
  sessionCategories: string[]
  certifications: Certification[]
  weeklyGoalMinutes: number
  setWeeklyGoalMinutes: (m: number) => void
  addSession: (s: Omit<LearningSession, 'id'>) => void
  updateSession: (id: string, u: Partial<LearningSession>) => void
  deleteSession: (id: string) => void
  addSessionCategory: (name: string) => void
  removeSessionCategory: (name: string) => void
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
  updateCertification: (id: string, u: Partial<Certification>) => void
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

function loadAuthSessions(): LearningSession[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AUTH}_sessions`)
    if (raw != null) return JSON.parse(raw) as LearningSession[]
  } catch {
    /* ignore */
  }
  try {
    const legacyRaw =
      localStorage.getItem(`${STORAGE_KEY_AUTH}_codingHours`) ||
      localStorage.getItem(`${STORAGE_KEY_LEGACY}_codingHours`)
    if (legacyRaw != null) {
      const legacy = JSON.parse(legacyRaw) as LegacyCodingHour[]
      const migrated = migrateLegacyCodingHours(legacy)
      saveToStorage(STORAGE_KEY_AUTH, 'sessions', migrated)
      return migrated
    }
  } catch {
    /* ignore */
  }
  return []
}

function loadDemoSessions(): LearningSession[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_DEMO}_sessions`)
    if (raw != null) return JSON.parse(raw) as LearningSession[]
  } catch {
    /* ignore */
  }
  try {
    const legacyRaw = localStorage.getItem(`${STORAGE_KEY_DEMO}_codingHours`)
    if (legacyRaw != null) {
      return migrateLegacyCodingHours(JSON.parse(legacyRaw) as LegacyCodingHour[])
    }
  } catch {
    /* ignore */
  }
  return DEMO_SESSIONS
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useAuth()
  const storagePrefix = isDemoMode ? STORAGE_KEY_DEMO : STORAGE_KEY_AUTH

  const [sessions, setSessions] = useState<LearningSession[]>(() =>
    isDemoMode ? loadDemoSessions() : loadAuthSessions(),
  )
  const [courses, setCourses] = useState<Course[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'courses', DEMO_COURSES)
      : loadAuthSlice('courses', [], DEMO_COURSES),
  )
  const [projects, setProjects] = useState<Project[]>(() => {
    const raw = isDemoMode
      ? loadFromStorage<unknown[]>(storagePrefix, 'projects', DEMO_PROJECTS as unknown[])
      : loadAuthSlice<unknown[]>('projects', [], DEMO_PROJECTS as unknown[])
    return normalizeProjectsFromStorage(raw)
  })
  const [books, setBooks] = useState<Book[]>(() => {
    const raw = isDemoMode
      ? loadFromStorage<unknown[]>(storagePrefix, 'books', DEMO_BOOKS as unknown[])
      : loadAuthSlice<unknown[]>('books', [], DEMO_BOOKS as unknown[])
    return normalizeBooksFromStorage(raw)
  })
  const [bookCategories, setBookCategories] = useState<string[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'bookCategories', [])
      : loadAuthSlice('bookCategories', [], []),
  )
  const [sessionCategories, setSessionCategories] = useState<string[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'sessionCategories', DEMO_SESSION_CATEGORIES)
      : loadAuthSlice('sessionCategories', [], DEMO_SESSION_CATEGORIES),
  )
  const [certifications, setCertifications] = useState<Certification[]>(() =>
    isDemoMode
      ? loadFromStorage(storagePrefix, 'certifications', DEMO_CERTIFICATES)
      : loadAuthSlice('certifications', [], DEMO_CERTIFICATES),
  )
  const [weeklyGoalMinutes, setWeeklyGoalMinutesState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(`${storagePrefix}_weeklyGoalMinutes`)
      if (raw != null) return parseInt(raw, 10) || DEFAULT_WEEKLY_GOAL_MINUTES
    } catch {
      /* ignore */
    }
    return DEFAULT_WEEKLY_GOAL_MINUTES
  })

  useEffect(() => {
    saveToStorage(storagePrefix, 'sessions', sessions)
  }, [sessions, storagePrefix])
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
    saveToStorage(storagePrefix, 'sessionCategories', sessionCategories)
  }, [sessionCategories, storagePrefix])
  useEffect(() => {
    saveToStorage(storagePrefix, 'certifications', certifications)
  }, [certifications, storagePrefix])
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_weeklyGoalMinutes`, String(weeklyGoalMinutes))
    } catch {
      /* ignore */
    }
  }, [weeklyGoalMinutes, storagePrefix])

  const setWeeklyGoalMinutes = (m: number) => setWeeklyGoalMinutesState(Math.max(30, m))

  const addSession = (s: Omit<LearningSession, 'id'>) =>
    setSessions((prev) => [...prev, { ...s, id: Date.now().toString() }])
  const updateSession = (id: string, u: Partial<LearningSession>) =>
    setSessions((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  const deleteSession = (id: string) =>
    setSessions((prev) => prev.filter((x) => x.id !== id))

  const addCourse = (c: Omit<Course, 'id'>) =>
    setCourses((prev) => [...prev, { ...c, id: Date.now().toString() }])
  const updateCourse = (id: string, u: Partial<Course>) =>
    setCourses((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  const deleteCourse = (id: string) =>
    setCourses((prev) => prev.filter((x) => x.id !== id))

  const addProject = (p: Omit<Project, 'id'>) =>
    setProjects((prev) => [...prev, { ...p, id: Date.now().toString() }])
  const updateProject = (id: string, u: Partial<Project>) =>
    setProjects((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  const deleteProject = (id: string) =>
    setProjects((prev) => prev.filter((x) => x.id !== id))

  const addBook = (b: Omit<Book, 'id'>) =>
    setBooks((prev) => [...prev, { ...b, id: Date.now().toString() }])
  const updateBook = (id: string, u: Partial<Book>) =>
    setBooks((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  const deleteBook = (id: string) =>
    setBooks((prev) => prev.filter((x) => x.id !== id))

  const addBookCategory = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBookCategories((prev) => {
      if (prev.includes(trimmed)) return prev
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b))
    })
  }
  const removeBookCategory = (name: string) =>
    setBookCategories((prev) => prev.filter((c) => c !== name))

  const addSessionCategory = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSessionCategories((prev) => {
      if (prev.includes(trimmed)) return prev
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b))
    })
  }
  const removeSessionCategory = (name: string) =>
    setSessionCategories((prev) => prev.filter((c) => c !== name))

  const addCertification = (c: Omit<Certification, 'id'>) =>
    setCertifications((prev) => [...prev, { ...c, id: Date.now().toString() }])
  const updateCertification = (id: string, u: Partial<Certification>) =>
    setCertifications((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)))
  const deleteCertification = (id: string) =>
    setCertifications((prev) => prev.filter((x) => x.id !== id))

  return (
    <LearningContext.Provider
      value={{
        sessions,
        courses,
        projects,
        books,
        bookCategories,
        sessionCategories,
        certifications,
        weeklyGoalMinutes,
        setWeeklyGoalMinutes,
        addSession,
        updateSession,
        deleteSession,
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
        addSessionCategory,
        removeSessionCategory,
        addCertification,
        updateCertification,
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
