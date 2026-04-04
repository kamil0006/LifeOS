import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

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

const STORAGE_KEY = 'lifeos_nauka'

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

interface NaukaContextType {
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

const NaukaContext = createContext<NaukaContextType | null>(null)

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(`${STORAGE_KEY}_${key}`)
    if (s) return JSON.parse(s) as T
  } catch {
    /* ignore */
  }
  return fallback
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function NaukaProvider({ children }: { children: ReactNode }) {
  const [codingHours, setCodingHours] = useState<CodingHour[]>(() => loadFromStorage('codingHours', DEMO_CODING_HOURS))
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage('courses', DEMO_COURSES))
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('projects', DEMO_PROJECTS))
  const [books, setBooks] = useState<Book[]>(() => loadFromStorage('books', DEMO_BOOKS))
  const [bookCategories, setBookCategories] = useState<string[]>(() => loadFromStorage('bookCategories', []))
  const [certifications, setCertifications] = useState<Certification[]>(() => loadFromStorage('certifications', DEMO_CERTIFICATES))

  useEffect(() => {
    saveToStorage('codingHours', codingHours)
  }, [codingHours])
  useEffect(() => {
    saveToStorage('courses', courses)
  }, [courses])
  useEffect(() => {
    saveToStorage('projects', projects)
  }, [projects])
  useEffect(() => {
    saveToStorage('books', books)
  }, [books])
  useEffect(() => {
    saveToStorage('bookCategories', bookCategories)
  }, [bookCategories])
  useEffect(() => {
    saveToStorage('certifications', certifications)
  }, [certifications])

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
    <NaukaContext.Provider
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
    </NaukaContext.Provider>
  )
}

export function useNauka() {
  return useContext(NaukaContext)
}
