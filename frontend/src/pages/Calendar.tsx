import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, CalendarRange, CheckSquare2, ChevronDown, ChevronLeft, ChevronRight, Plus, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { EventModal } from '../components/EventModal'
import { expandRecurringEvents, normalizeEventDate, type DemoEvent, useEvents } from '../context/EventsContext'
import { getPolishHolidays } from '../lib/polishHolidays'
import { getCategoryColor } from '../lib/eventCategories'
import { SimplePageSkeleton } from '../components/skeletons'
import { useTodos } from '../context/TodosContext'
import { TODO_CATEGORY_LABEL, TODO_PRIORITY_LABEL, formatTodoDueSummary, localISODate, type TodoItem } from '../lib/todoDomain'

const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

type ViewMode = 'month' | 'week'
type FeedFilter = 'all' | 'events' | 'todos'

export function Calendar() {
  const navigate = useNavigate()
  const {
    events,
    categories,
    addEvent,
    updateEvent,
    deleteEvent,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryVisibility,
    loading,
  } = useEvents()
  const { todos, toggleTodo, updateTodo } = useTodos()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DemoEvent | null>(null)
  const [initialDate, setInitialDate] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [isDayPanelCollapsed, setIsDayPanelCollapsed] = useState(false)
  const [openCategoryManagerOnOpen, setOpenCategoryManagerOnOpen] = useState(false)
  const [showEvents, setShowEvents] = useState(true)
  const [showTodos, setShowTodos] = useState(true)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all')
  const [rescheduleDateByTodoId, setRescheduleDateByTodoId] = useState<Record<string, string>>({})

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

  const categoryById = useMemo(() => {
    const map = new Map<string, (typeof categories)[number]>()
    categories.forEach((category) => map.set(category.id, category))
    return map
  }, [categories])

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === 'week' && weekDays.length > 0) {
      return { rangeStart: weekDays[0].key, rangeEnd: weekDays[6].key }
    }
    return {
      rangeStart: formatKey(calendarDays[0]?.date ?? new Date()),
      rangeEnd: formatKey(calendarDays[calendarDays.length - 1]?.date ?? new Date()),
    }
  }, [viewMode, weekDays, calendarDays])

  const expandedEventsForGrid = useMemo(
    () => expandRecurringEvents(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd]
  )

  const isEventVisible = useCallback((event: DemoEvent) => {
    if (!event.category) return true
    const category = categoryById.get(event.category)
    if (!category) return true
    return category.isVisible
  }, [categoryById])

  const filteredEventsForGrid = useMemo(
    () => (showEvents ? expandedEventsForGrid.filter(isEventVisible) : []),
    [expandedEventsForGrid, isEventVisible, showEvents]
  )

  const eventsByDate = useMemo(() => {
    const map: Record<string, DemoEvent[]> = {}
    filteredEventsForGrid.forEach((event) => {
      const key = normalizeEventDate(event.date)
      if (!map[key]) map[key] = []
      map[key].push(event)
    })
    return map
  }, [filteredEventsForGrid])

  const todosWithDates = useMemo(
    () => todos.filter((todo) => !!todo.dueDate),
    [todos]
  )

  const todosByDate = useMemo(() => {
    const map: Record<string, TodoItem[]> = {}
    todosWithDates.forEach((todo) => {
      const key = todo.dueDate as string
      if (!map[key]) map[key] = []
      map[key].push(todo)
    })
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        if (a.done !== b.done) return Number(a.done) - Number(b.done)
        if (a.priority !== b.priority) {
          const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2
          const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2
          return pa - pb
        }
        return (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99')
      })
    })
    return map
  }, [todosWithDates])

  const holidays = useMemo(() => getPolishHolidays(year), [year])

  const isToday = (d: Date) => {
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
  const prevWeek = () => setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const switchToMonthView = () => setViewMode('month')
  const switchToWeekView = () => {
    setViewMode('week')
    setViewDate(new Date())
  }
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  )


  const openAddModal = (date?: string) => {
    setEditingEvent(null)
    setInitialDate(date)
    setOpenCategoryManagerOnOpen(false)
    setModalOpen(true)
  }

  const openEditModal = (ev: DemoEvent) => {
    const sourceId = ev.sourceEventId ?? ev.id
    const sourceEvent = events.find((item) => item.id === sourceId)
    if (!sourceEvent) return
    setEditingEvent(sourceEvent)
    setInitialDate(undefined)
    setOpenCategoryManagerOnOpen(false)
    setModalOpen(true)
  }

  const handleAdd = (data: Omit<DemoEvent, 'id'>) => {
    void addEvent(data)
  }

  const handleUpdate = (id: string, data: Partial<Omit<DemoEvent, 'id'>>) => {
    void updateEvent(id, data)
  }

  const handleDelete = (id: string) => {
    void deleteEvent(id)
  }

  const handleDayClick = (dateKey: string, dayEvents: DemoEvent[], dayTodos: TodoItem[], isCurrentMonth = true) => {
    if (!isCurrentMonth) return
    if (dayEvents.length === 0 && dayTodos.length === 0) {
      openAddModal(dateKey)
      return
    }
    if (selectedDayKey === dateKey) {
      setIsDayPanelCollapsed((prev) => !prev)
      return
    }
    setSelectedDayKey(dateKey)
    setIsDayPanelCollapsed(false)
  }

  const upcomingEvents = useMemo(() => {
    if (!showEvents) return []
    const start = formatKey(new Date())
    const future = new Date()
    future.setDate(future.getDate() + 120)
    const end = formatKey(future)
    return expandRecurringEvents(events, start, end)
      .filter(isEventVisible)
      .slice(0, 8)
  }, [events, isEventVisible, showEvents])

  const upcomingTodos = useMemo(() => {
    const today = localISODate()
    return todosWithDates
      .filter((todo) => (todo.dueDate ?? '') >= today)
      .slice(0, 12)
  }, [todosWithDates])

  const selectedDayEvents = selectedDayKey ? eventsByDate[selectedDayKey] ?? [] : []
  const selectedDayTodos = selectedDayKey ? (todosByDate[selectedDayKey] ?? []) : []

  const formatHumanDate = (raw: string) => {
    const [, monthRaw, dayRaw] = raw.split('-').map(Number)
    const monthShort = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'][(monthRaw ?? 1) - 1]
    return `${dayRaw} ${monthShort}`
  }

  const formatPanelDayHeader = (raw: string) => {
    const [year, month, day] = raw.split('-').map(Number)
    const date = new Date(year, (month ?? 1) - 1, day ?? 1)
    const fullDate = new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
    const weekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(date)
    return { fullDate, weekday }
  }

  const openCategoryManagerModal = () => {
    setEditingEvent(null)
    setInitialDate(undefined)
    setOpenCategoryManagerOnOpen(true)
    setModalOpen(true)
  }

  const getEventCardColor = (event: DemoEvent) => {
    const category = event.category ? categoryById.get(event.category) : null
    if (!category) return '#6b7280'
    return category.color ?? event.color ?? getCategoryColor(event.category)
  }

  const getEventCategoryLabel = (event: DemoEvent) => {
    if (!event.category) return 'Bez kategorii'
    return categoryById.get(event.category)?.name ?? 'Bez kategorii'
  }

  const getTodoPriorityBadgeClass = (priority: TodoItem['priority']) => {
    if (priority === 'high') return 'border-[#ef4444]/50 text-[#fca5a5] bg-[#ef4444]/10'
    if (priority === 'medium') return 'border-[#f59e0b]/50 text-[#fcd34d] bg-[#f59e0b]/10'
    return 'border-[#10b981]/50 text-[#6ee7b7] bg-[#10b981]/10'
  }

  const getTodoPriorityAccent = (priority: TodoItem['priority']) => {
    if (priority === 'high') return '#ef4444'
    if (priority === 'medium') return '#f59e0b'
    return '#10b981'
  }

  const selectedDayHeader = selectedDayKey ? formatPanelDayHeader(selectedDayKey) : null

  const upcomingFeed = useMemo(() => {
    const eventItems = upcomingEvents.map((event) => ({ kind: 'event' as const, date: event.date, time: event.time, event }))
    const todoItems = upcomingTodos.map((todo) => ({ kind: 'todo' as const, date: todo.dueDate as string, time: todo.dueTime ?? undefined, todo }))
    return [...eventItems, ...todoItems]
      .filter((item) => (feedFilter === 'all' ? true : feedFilter === 'events' ? item.kind === 'event' : item.kind === 'todo'))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
      .slice(0, 12)
  }, [upcomingEvents, upcomingTodos, feedFilter])

  const rescheduleTodoToDate = (todo: TodoItem) => {
    const nextDate = rescheduleDateByTodoId[todo.id] ?? todo.dueDate ?? localISODate()
    if (!nextDate) return
    toggleTodo(todo.id, false)
    updateTodo(todo.id, { dueDate: nextDate })
  }

  useEffect(() => {
    if (!selectedDayKey) return
    const hasEvents = (eventsByDate[selectedDayKey] ?? []).length > 0
    const hasTodos = (todosByDate[selectedDayKey] ?? []).length > 0
    if (!hasEvents && (!showTodos || !hasTodos)) setSelectedDayKey(null)
  }, [eventsByDate, todosByDate, selectedDayKey, showTodos])

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
            Twoje wydarzenia — lista aktualizuje się od razu po zapisie.
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
        onClose={() => {
          setModalOpen(false)
          setOpenCategoryManagerOnOpen(false)
        }}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        initialDate={initialDate}
        event={editingEvent}
        holidayName={initialDate ? holidays[initialDate] : undefined}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onToggleCategoryVisibility={toggleCategoryVisibility}
        openCategoryManager={openCategoryManagerOnOpen}
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
            <span className="px-3 py-1.5 rounded-lg border border-(--border) text-sm text-(--text-muted)">
              Dziś: {todayLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-(--border) p-0.5">
              <button
                onClick={switchToMonthView}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-gaming transition-colors ${
                  viewMode === 'month' ? 'bg-(--accent-cyan) text-(--bg-dark)' : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Miesiąc
              </button>
              <button
                onClick={switchToWeekView}
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

        {selectedDayKey && (selectedDayEvents.length > 0 || selectedDayTodos.length > 0) && (
          <div className="mb-3 rounded-lg border border-(--border) bg-(--bg-dark) p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-lg font-gaming text-(--text-primary)">{selectedDayHeader?.fullDate}</h3>
                <p className="text-base text-(--text-muted)">{selectedDayHeader?.weekday}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDayPanelCollapsed((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-card-hover)"
                  title={isDayPanelCollapsed ? 'Rozwiń plan dnia' : 'Zwiń plan dnia'}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDayPanelCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                  {isDayPanelCollapsed ? 'Rozwiń' : 'Zwiń'}
                </button>
                <button
                  onClick={() => openAddModal(selectedDayKey)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming"
                >
                  + Dodaj w tym dniu
                </button>
              </div>
            </div>
            {!isDayPanelCollapsed && (
            <div className="space-y-1">
              {selectedDayTodos.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-sm font-gaming text-(--text-muted) uppercase mb-1">Zadania</h4>
                  <div className="space-y-1.5">
                    {selectedDayTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg border border-transparent hover:border-(--border) ${
                          todo.done ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#6b7280]/50 bg-(--bg-card-hover) px-2 py-0.5 text-xs text-(--text-primary)">
                              {todo.done ? <CheckSquare2 className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                              Zadanie
                            </span>
                            <span className="text-sm text-(--text-muted)">
                              {todo.dueTime ? `${todo.dueTime} · ` : ''}{TODO_CATEGORY_LABEL[todo.category]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleTodo(todo.id, !todo.done)}
                              className="p-1 rounded hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--accent-cyan)"
                              title={todo.done ? 'Oznacz jako niezrobione' : 'Oznacz jako zrobione'}
                            >
                              {todo.done ? <CheckSquare2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                            <input
                              type="date"
                              value={rescheduleDateByTodoId[todo.id] ?? todo.dueDate ?? localISODate()}
                              onChange={(e) =>
                                setRescheduleDateByTodoId((prev) => ({ ...prev, [todo.id]: e.target.value }))
                              }
                              className="px-1.5 py-0.5 rounded text-xs border border-(--border) bg-(--bg-card) text-(--text-muted)"
                            />
                            <button
                              onClick={() => rescheduleTodoToDate(todo)}
                              className="px-2 py-0.5 rounded text-xs border border-(--border) text-(--text-muted) hover:text-(--text-primary)"
                              title="Przełóż na wybraną datę"
                            >
                              Przełóż
                            </button>
                            <button
                              onClick={() => navigate('/todo')}
                              className="p-1 rounded hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary)"
                              title="Przejdź do To-Do"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-sm ${todo.done ? 'line-through text-(--text-muted)' : 'text-(--text-primary)'}`}>
                          <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
                          {todo.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => openEditModal(event)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-(--bg-card-hover) border border-transparent hover:border-(--border)"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-(--accent-cyan)/40 bg-(--bg-card-hover) px-2 py-0.5 text-xs text-(--text-primary)">
                        <CalendarDays className="w-3 h-3" />
                        Wydarzenie
                      </span>
                      <br />
                      <span className="text-sm text-(--text-muted)">
                        {event.time ? `${event.time} · ` : ''}{getEventCategoryLabel(event)} ·{' '}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm text-(--text-primary)">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEventCardColor(event) }} />
                        {event.title}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
          </div>
        )}

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
              const dayTodos = showTodos ? (todosByDate[key] ?? []) : []
              const previewItems = [
                ...dayEvents.map((ev) => ({ kind: 'event' as const, ev })),
                ...dayTodos.map((todo) => ({ kind: 'todo' as const, todo })),
              ].slice(0, 3)
              const hiddenCount = dayEvents.length + dayTodos.length - previewItems.length
              const holiday = holidays[key]
              const today = isToday(date)

              return (
                <div
                  key={key}
                  className="relative h-[220px] p-3 bg-(--bg-card) flex flex-col cursor-pointer hover:bg-(--bg-card-hover) overflow-hidden"
                  onClick={() => handleDayClick(key, dayEvents, dayTodos)}
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
                  <div className="space-y-2 flex-1 overflow-y-auto pr-0.5 scrollbar-hidden">
                    {previewItems.map((item) =>
                      item.kind === 'event' ? (
                        <div
                          key={item.ev.id}
                          onClick={(e) => { e.stopPropagation(); openEditModal(item.ev) }}
                          className={`text-sm px-2 py-1.5 rounded border-l-2 cursor-pointer hover:opacity-90 ${!item.ev.category ? 'opacity-70' : ''}`}
                          style={{
                            borderLeftColor: getEventCardColor(item.ev),
                            backgroundColor: `${getEventCardColor(item.ev)}20`,
                          }}
                        >
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getEventCardColor(item.ev) }} />
                            <span>{item.ev.time ? `${item.ev.time} ` : ''}{item.ev.title}</span>
                          </span>
                        </div>
                      ) : (
                        <div
                          key={item.todo.id}
                          className={`text-sm px-2 py-1.5 rounded border-l-2 ${item.todo.done ? 'opacity-60 line-through' : ''}`}
                          style={{
                            borderLeftColor: getTodoPriorityAccent(item.todo.priority),
                            backgroundColor: '#6b728014',
                          }}
                          title={`${item.todo.text} – ${formatTodoDueSummary(item.todo.dueDate, item.todo.dueTime)} – priorytet: ${TODO_PRIORITY_LABEL[item.todo.priority]}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {item.todo.done ? <CheckSquare2 className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                            <span>{item.todo.dueTime ? `${item.todo.dueTime} ` : ''}{item.todo.text}</span>
                          </span>
                        </div>
                      )
                    )}
                    {hiddenCount > 0 && (
                      <div className="text-base text-(--text-muted)">+{hiddenCount}</div>
                    )}
                  </div>
                  {hiddenCount > 0 && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-(--bg-card) to-transparent" />
                  )}
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
            const dayTodos = showTodos ? (todosByDate[key] ?? []) : []
            const previewItems = [
              ...dayEvents.map((ev) => ({ kind: 'event' as const, ev })),
              ...dayTodos.map((todo) => ({ kind: 'todo' as const, todo })),
            ].slice(0, 3)
            const hiddenCount = dayEvents.length + dayTodos.length - previewItems.length
            const holiday = holidays[key]
            const today = isToday(date)

            return (
              <div
                key={key}
                className={`relative h-[125px] p-2 bg-(--bg-card) flex flex-col overflow-hidden ${
                  !isCurrentMonth ? 'opacity-40' : ''
                } ${isCurrentMonth ? 'cursor-pointer hover:bg-(--bg-card-hover)' : ''}`}
                onClick={() => handleDayClick(key, dayEvents, dayTodos, isCurrentMonth)}
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
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto scrollbar-hidden">
                  {previewItems.map((item) =>
                    item.kind === 'event' ? (
                      <div
                        key={item.ev.id}
                        onClick={(e) => { e.stopPropagation(); openEditModal(item.ev) }}
                        className={`text-sm px-2 py-0.5 rounded truncate border-l-2 cursor-pointer hover:opacity-90 transition-opacity ${!item.ev.category ? 'opacity-70' : ''}`}
                        style={{
                          borderLeftColor: getEventCardColor(item.ev),
                          backgroundColor: `${getEventCardColor(item.ev)}20`,
                        }}
                        title={`${item.ev.title}${item.ev.time ? ` ${item.ev.time}` : ''} – kliknij aby edytować`}
                      >
                        <span className="inline-flex items-center gap-1 truncate max-w-full">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getEventCardColor(item.ev) }} />
                          <span className="truncate">{item.ev.time ? `${item.ev.time} ` : ''}{item.ev.title}</span>
                        </span>
                      </div>
                    ) : (
                      <div
                        key={item.todo.id}
                        className={`text-sm px-2 py-0.5 rounded truncate border-l-2 ${item.todo.done ? 'opacity-60 line-through' : ''}`}
                        style={{
                          borderLeftColor: getTodoPriorityAccent(item.todo.priority),
                          backgroundColor: '#6b728014',
                        }}
                        title={`${item.todo.text} – priorytet: ${TODO_PRIORITY_LABEL[item.todo.priority]}`}
                      >
                        <span className="inline-flex items-center gap-1 truncate max-w-full">
                          {item.todo.done ? <CheckSquare2 className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate">{item.todo.dueTime ? `${item.todo.dueTime} ` : ''}{item.todo.text}</span>
                        </span>
                      </div>
                    )
                  )}
                  {hiddenCount > 0 && (
                    <div className="text-base text-(--text-muted)">+{hiddenCount}</div>
                  )}
                </div>
                {hiddenCount > 0 && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-(--bg-card) to-transparent" />
                )}
              </div>
            )
          })}
        </div>
        )}

        {/* Legenda + filtry */}
        <div className="mt-6 pt-4 border-t border-(--border) space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base text-(--text-muted) font-gaming uppercase">Widoczność:</span>
            <button
              onClick={() => setShowEvents((v) => !v)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md border text-sm transition-colors ${
                showEvents
                  ? 'border-(--accent-cyan)/50 text-(--accent-cyan) hover:bg-(--bg-card-hover)'
                  : 'border-(--border) text-(--text-muted) hover:text-(--accent-cyan) hover:border-(--accent-cyan)/50 hover:bg-(--bg-card-hover)'
              }`}
            >
              {showEvents ? 'Ukryj wydarzenia' : 'Pokaż wydarzenia'}
            </button>
            <button
              onClick={() => setShowTodos((v) => !v)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md border text-sm transition-colors ${
                showTodos
                  ? 'border-(--accent-cyan)/50 text-(--accent-cyan) hover:bg-(--bg-card-hover)'
                  : 'border-(--border) text-(--text-muted) hover:text-(--accent-cyan) hover:border-(--accent-cyan)/50 hover:bg-(--bg-card-hover)'
              }`}
            >
              {showTodos ? 'Ukryj zadania' : 'Pokaż zadania'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base text-(--text-muted) font-gaming uppercase">Kategorie:</span>
            <button
              onClick={openCategoryManagerModal}
              className="inline-flex items-center px-2.5 py-1 rounded-md border border-(--border) text-sm text-(--text-muted) hover:text-(--accent-cyan) hover:border-(--accent-cyan)/50 hover:bg-(--bg-card-hover) transition-colors"
            >
              Zarządzaj
            </button>
            {categories.map(({ id, name, color, isVisible }) => (
              <span key={id} className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => toggleCategoryVisibility(id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                    isVisible ? 'border-(--accent-cyan)' : 'border-(--border) opacity-50'
                  } hover:bg-(--bg-card-hover) transition-colors`}
                  title={isVisible ? 'Ukryj kategorię' : 'Pokaż kategorię'}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {name}
                </button>
              </span>
            ))}
            <span className="flex items-center gap-1.5 px-2 py-1 rounded border border-(--border) text-(--text-muted) text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#6b7280' }} />
              Bez kategorii
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#e57373' }} />
            <span className="text-sm">Święto państwowe</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-(--border)">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-lg font-gaming text-(--text-primary)">Nadchodzące</h3>
            <div className="flex items-center gap-1 rounded-md border border-(--border) p-0.5">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-2 py-1 text-xs rounded ${feedFilter === 'all' ? 'bg-(--accent-cyan) text-(--bg-dark)' : 'text-(--text-muted)'}`}
              >
                Wszystko
              </button>
              <button
                onClick={() => setFeedFilter('events')}
                className={`px-2 py-1 text-xs rounded ${feedFilter === 'events' ? 'bg-(--accent-cyan) text-(--bg-dark)' : 'text-(--text-muted)'}`}
              >
                Wydarzenia
              </button>
              <button
                onClick={() => setFeedFilter('todos')}
                className={`px-2 py-1 text-xs rounded ${feedFilter === 'todos' ? 'bg-(--accent-cyan) text-(--bg-dark)' : 'text-(--text-muted)'}`}
              >
                Zadania
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {upcomingFeed.length === 0 && (
              <p className="text-base text-(--text-muted)">Brak nadchodzących wydarzeń.</p>
            )}
            {upcomingFeed.map((item) =>
              item.kind === 'event' ? (
                <button
                  key={`event-${item.event.id}`}
                  onClick={() => openEditModal(item.event)}
                  className="group w-full text-left px-3 py-1.5 rounded-lg hover:bg-(--bg-card-hover) border border-transparent hover:border-(--border)"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="mb-0.5 inline-flex items-center gap-1 rounded-full border border-(--accent-cyan)/40 bg-(--bg-card-hover) px-2 py-0.5 text-xs text-(--text-primary)">
                        <CalendarDays className="w-3 h-3" />
                        Wydarzenie
                      </span>
                      <br />
                      <span className="text-base text-(--text-muted)">
                        {formatHumanDate(item.event.date)}{item.event.time ? ` · ${item.event.time}` : ''} ·{' '}
                      </span>
                      <span className="text-base text-(--text-primary)">{item.event.title}</span>
                      <span className="ml-2 inline-flex items-center gap-1.5 text-sm text-(--text-muted)">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEventCardColor(item.event) }} />
                        {getEventCategoryLabel(item.event)}
                      </span>
                    </div>
                  </div>
                </button>
              ) : (
                <div
                  key={`todo-${item.todo.id}`}
                  className={`group w-full text-left px-3 py-1.5 rounded-lg border border-transparent hover:border-(--border) ${
                    item.todo.done ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#6b7280]/50 bg-(--bg-card-hover) px-2 py-0.5 text-xs text-(--text-primary)">
                        {item.todo.done ? <CheckSquare2 className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                        Zadanie
                      </span>
                      <span className="text-base text-(--text-muted)">
                        {formatHumanDate(item.todo.dueDate ?? localISODate())}
                        {item.todo.dueTime ? ` · ${item.todo.dueTime}` : ''} · {TODO_CATEGORY_LABEL[item.todo.category]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getTodoPriorityBadgeClass(item.todo.priority)}`}
                        title={`Priorytet: ${TODO_PRIORITY_LABEL[item.todo.priority]}`}
                      >
                        {TODO_PRIORITY_LABEL[item.todo.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleTodo(item.todo.id, !item.todo.done)}
                        className="p-1 rounded hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--accent-cyan)"
                      >
                        {item.todo.done ? <CheckSquare2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <input
                        type="date"
                        value={rescheduleDateByTodoId[item.todo.id] ?? item.todo.dueDate ?? localISODate()}
                        onChange={(e) =>
                          setRescheduleDateByTodoId((prev) => ({ ...prev, [item.todo.id]: e.target.value }))
                        }
                        className="px-1.5 py-0.5 rounded text-xs border border-(--border) bg-(--bg-card) text-(--text-muted)"
                      />
                      <button
                        onClick={() => rescheduleTodoToDate(item.todo)}
                        className="px-2 py-0.5 rounded text-xs border border-(--border) text-(--text-muted) hover:text-(--text-primary)"
                        title="Przełóż na wybraną datę"
                      >
                        Przełóż
                      </button>
                      <button
                        onClick={() => navigate('/todo')}
                        className="p-1 rounded hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary)"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-base ${item.todo.done ? 'line-through text-(--text-muted)' : 'text-(--text-primary)'}`}>
                    <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
                    {item.todo.text}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
