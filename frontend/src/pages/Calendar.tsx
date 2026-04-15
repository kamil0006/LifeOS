import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange } from 'lucide-react'
import { Card } from '../components/Card'
import { EventModal } from '../components/EventModal'
import { useEvents, type DemoEvent } from '../context/EventsContext'
import { getPolishHolidays } from '../lib/polishHolidays'
import { EVENT_CATEGORIES, getCategoryColor } from '../lib/eventCategories'
import { SimplePageSkeleton } from '../components/skeletons'

const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

type ViewMode = 'month' | 'week'

export function Calendar() {
  const { events, addEvent, updateEvent, deleteEvent, loading } = useEvents()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DemoEvent | null>(null)
  const [initialDate, setInitialDate] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const { year, month } = useMemo(() => ({
    year: viewDate.getFullYear(),
    month: viewDate.getMonth(),
  }), [viewDate])

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startPad = (first.getDay() + 6) % 7
    const daysInMonth = last.getDate()

    const days: { date: Date; day: number; isCurrentMonth: boolean }[] = []

    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, 1 - (startPad - i))
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), day: d, isCurrentMonth: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
    }
    return days
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {}
    events.forEach((ev) => {
      const key = ev.date
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const holidays = useMemo(() => getPolishHolidays(year), [year])

  const formatKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return []
    const start = new Date(viewDate)
    const dayOffset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - dayOffset)
    const days: { date: Date; key: string }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push({ date: d, key: formatKey(d) })
    }
    return days
  }, [viewMode, viewDate])

  const isToday = (d: Date) => {
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
  const prevWeek = () => setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })

  const openAddModal = (date?: string) => {
    setEditingEvent(null)
    setInitialDate(date)
    setModalOpen(true)
  }

  const openEditModal = (ev: DemoEvent) => {
    setEditingEvent(ev)
    setInitialDate(undefined)
    setModalOpen(true)
  }

  const handleAdd = (data: Omit<DemoEvent, 'id'>) => {
    addEvent(data)
  }

  const handleUpdate = (id: string, data: Partial<Omit<DemoEvent, 'id'>>) => {
    updateEvent(id, data)
  }

  const handleDelete = (id: string) => {
    deleteEvent(id)
  }

  if (loading) {
    return <SimplePageSkeleton titleWidth="w-36" />
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-(--text-primary) font-gaming tracking-wider">
            KALENDARZ
          </h1>
          <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
            Twoje wydarzenia i terminy
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Dodaj wydarzenie
        </button>
      </motion.div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        initialDate={initialDate}
        event={editingEvent}
        holidayName={initialDate ? holidays[initialDate] : undefined}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={viewMode === 'month' ? prevMonth : prevWeek}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
              aria-label={viewMode === 'month' ? 'Poprzedni miesiąc' : 'Poprzedni tydzień'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-(--text-primary) font-gaming min-w-[200px] text-center">
              {viewMode === 'month'
                ? `${monthNames[month]} ${year}`
                : weekDays[0]
                  ? `${weekDays[0].date.getDate()}–${weekDays[6].date.getDate()} ${monthNames[weekDays[0].date.getMonth()]} ${year}`
                  : ''}
            </h2>
            <button
              onClick={viewMode === 'month' ? nextMonth : nextWeek}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
              aria-label={viewMode === 'month' ? 'Następny miesiąc' : 'Następny tydzień'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-(--border) p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-gaming transition-colors ${
                  viewMode === 'month' ? 'bg-(--accent-cyan) text-(--bg-dark)' : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Miesiąc
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-gaming transition-colors ${
                  viewMode === 'week' ? 'bg-(--accent-cyan) text-(--bg-dark)' : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                Tydzień
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'week' ? (
          <div className="grid grid-cols-7 gap-px bg-(--border) rounded-lg overflow-hidden">
            {dayNames.map((name) => (
              <div
                key={name}
                className="bg-(--bg-card) p-2 text-center text-base font-gaming text-(--text-muted) uppercase"
              >
                {name}
              </div>
            ))}
            {weekDays.map(({ date, key }) => {
              const dayEvents = eventsByDate[key] ?? []
              const holiday = holidays[key]
              const today = isToday(date)

              return (
                <div
                  key={key}
                  className="min-h-[200px] p-3 bg-(--bg-card) flex flex-col cursor-pointer hover:bg-(--bg-card-hover)"
                  onClick={() => openAddModal(key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-base font-gaming w-8 h-8 flex items-center justify-center rounded-full ${
                        today ? 'bg-(--accent-cyan) text-(--bg-dark) font-bold' : 'text-(--text-primary)'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {holiday && (
                      <span className="text-xs font-mono" style={{ color: '#e57373' }} title={holiday}>
                        {holiday}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                        className="text-sm px-2 py-1.5 rounded border-l-2 cursor-pointer hover:opacity-90"
                        style={{
                          borderLeftColor: getCategoryColor(ev.category) ?? ev.color ?? 'var(--accent-cyan)',
                          backgroundColor: `${getCategoryColor(ev.category) ?? ev.color ?? '#00e5ff'}20`,
                        }}
                      >
                        {ev.time ? `${ev.time} ` : ''}{ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
        <div className="grid grid-cols-7 gap-px bg-(--border) rounded-lg overflow-hidden">
          {dayNames.map((name) => (
            <div
              key={name}
              className="bg-(--bg-card) p-2 text-center text-base font-gaming text-(--text-muted) uppercase"
            >
              {name}
            </div>
          ))}
          {calendarDays.map(({ date, day, isCurrentMonth }) => {
            const key = formatKey(date)
            const dayEvents = eventsByDate[key] ?? []
            const holiday = holidays[key]
            const today = isToday(date)

            return (
              <div
                key={key}
                className={`min-h-[100px] p-2 bg-(--bg-card) flex flex-col ${
                  !isCurrentMonth ? 'opacity-40' : ''
                } ${isCurrentMonth ? 'cursor-pointer hover:bg-(--bg-card-hover)' : ''}`}
                onClick={() => isCurrentMonth && openAddModal(key)}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={`text-base font-gaming w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
                      today
                        ? 'bg-(--accent-cyan) text-(--bg-dark) font-bold'
                        : 'text-(--text-primary)'
                    }`}
                  >
                    {day}
                  </span>
                  {holiday && (
                    <span
                      className="text-[11px] font-mono truncate max-w-[65px] block"
                      style={{ color: '#e57373' }}
                      title={holiday}
                    >
                      {holiday}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                      className="text-sm px-2 py-0.5 rounded truncate border-l-2 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        borderLeftColor: getCategoryColor(ev.category) ?? ev.color ?? 'var(--accent-cyan)',
                        backgroundColor: `${getCategoryColor(ev.category) ?? ev.color ?? '#00e5ff'}20`,
                      }}
                      title={`${ev.title}${ev.time ? ` ${ev.time}` : ''} – kliknij aby edytować`}
                    >
                      {ev.time ? `${ev.time} ` : ''}{ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-base text-(--text-muted)">+{dayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )}

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t border-(--border) flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base text-(--text-muted) font-gaming uppercase">Kategorie:</span>
            {EVENT_CATEGORIES.map(({ id, label, color }) => (
              <span key={id} className="flex items-center gap-1.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#e57373' }} />
            <span className="text-sm">Święto państwowe</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
