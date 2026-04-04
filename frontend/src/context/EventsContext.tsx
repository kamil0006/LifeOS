import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { eventsApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

export interface DemoEvent {
  id: string
  title: string
  date: string
  time?: string
  category?: string
  color?: string
  notes?: string
}

interface EventsContextType {
  events: DemoEvent[]
  addEvent: (e: Omit<DemoEvent, 'id'>) => void
  updateEvent: (id: string, e: Partial<Omit<DemoEvent, 'id'>>) => void
  deleteEvent: (id: string) => void
  loading: boolean
}

const EventsContext = createContext<EventsContextType | null>(null)

function getDemoEvents(year: number): DemoEvent[] {
  const y = year.toString()
  const pad = (m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return [
    { id: '1', title: 'Spotkanie z klientem', date: pad(3, 5), time: '10:00', category: 'praca', color: '#00e5ff' },
    { id: '2', title: 'Urodziny mamy', date: pad(3, 12), category: 'prywatne', color: '#ff00d4' },
    { id: '3', title: 'Wizyta u dentysty', date: pad(3, 18), time: '14:30', category: 'zdrowie', color: '#00ff9d' },
    { id: '4', title: 'Spotkanie zespołu', date: pad(3, 22), time: '09:00', category: 'praca', color: '#00e5ff' },
    { id: '5', title: 'Kino z przyjaciółmi', date: pad(3, 28), time: '19:00', category: 'rozrywka', color: '#ffb800' },
    { id: '6', title: 'Prezentacja projektu', date: pad(4, 3), time: '11:00', category: 'praca', color: '#00e5ff' },
    { id: '7', title: 'Wakacje – wyjazd', date: pad(4, 15), category: 'rozrywka', color: '#00ff9d' },
    { id: '8', title: 'Rocznica ślubu', date: pad(4, 20), category: 'prywatne', color: '#ff00d4' },
    { id: '9', title: 'Kontrola samochodu', date: pad(5, 8), time: '08:00', category: 'inne', color: '#ffb800' },
    { id: '10', title: 'Urodziny', date: pad(5, 25), category: 'prywatne', color: '#ff00d4' },
    { id: '11', title: 'Konferencja IT', date: pad(6, 10), category: 'praca', color: '#00e5ff' },
    { id: '12', title: 'Wesele kolegi', date: pad(6, 21), category: 'prywatne', color: '#ff00d4' },
  ]
}

const currentYear = new Date().getFullYear()
const DEMO_EVENTS = getDemoEvents(currentYear)

export function EventsProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId

  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>(DEMO_EVENTS)

  const { data: apiEvents = [], isPending } = useQuery({
    queryKey: queryKeys.events(userId),
    queryFn: () =>
      eventsApi.getAll().then((data) =>
        data.map((e) => ({ ...e, date: e.date.split('T')[0], category: e.category ?? undefined }))
      ),
    enabled: queryEnabled,
  })

  const events = isDemoMode ? demoEvents : apiEvents
  const loading = !isDemoMode && isPending

  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.events(userId) })
  }

  const addEvent = async (e: Omit<DemoEvent, 'id'>) => {
    if (isDemoMode) {
      setDemoEvents((prev) => [...prev, { ...e, id: Date.now().toString() }])
      return
    }
    try {
      await eventsApi.create(e)
      invalidate()
    } catch {
      // ignore
    }
  }

  const updateEvent = async (id: string, updates: Partial<Omit<DemoEvent, 'id'>>) => {
    if (isDemoMode) {
      setDemoEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)))
      return
    }
    try {
      await eventsApi.update(id, updates)
      invalidate()
    } catch {
      // ignore
    }
  }

  const deleteEvent = async (id: string) => {
    if (isDemoMode) {
      setDemoEvents((prev) => prev.filter((ev) => ev.id !== id))
      return
    }
    try {
      await eventsApi.delete(id)
      invalidate()
    } catch {
      // ignore
    }
  }

  return (
    <EventsContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, loading }}>
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  return ctx
}
