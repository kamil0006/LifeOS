import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TodoDueQuickPick, type TodoDuePickMode } from '../components/todo/TodoDueQuickPick'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  ClipboardList,
  Pencil,
  X,
  CalendarDays,
  Target,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useTodos, type TodoItem } from '../context/TodosContext'
import { useEvents, normalizeEventDate } from '../context/EventsContext'
import { useHabits } from '../context/HabitsContext'
import { SimplePageSkeleton } from '../components/skeletons'
import { TODO_ITEM_SPRING, todoItemEnterVariants } from '../lib/todoMotion'
import { parseQuickTodoInput } from '../lib/todoQuickParse'
import { useModalMotion } from '../lib/modalMotion'
import {
  TODO_CATEGORY_LABEL,
  TODO_CATEGORIES,
  TODO_PRIORITY_LABEL,
  compareTodosForDisplay,
  formatTodoDueSummary,
  isArchivedTodo,
  isTodoDueToday,
  isTodoOverdue,
  localISODate,
  todoDateStatus,
  todoInTodayBucket,
  todoMatchesTab,
  type TodoCategory,
  type TodoPriority,
  type TodoTabFilter,
} from '../lib/todoDomain'

const TAB_DEFS: { id: TodoTabFilter; label: string }[] = [
  { id: 'today', label: 'Dzisiaj' },
  { id: 'upcoming', label: 'Nadchodzące' },
  { id: 'all', label: 'Wszystkie' },
  { id: 'done', label: 'Zrobione' },
]

function tasksWord(n: number) {
  if (n === 1) return 'zadanie'
  if (n >= 2 && n <= 4) return 'zadania'
  return 'zadań'
}

function eventsWord(n: number) {
  if (n === 1) return 'wydarzenie'
  if (n >= 2 && n <= 4) return 'wydarzenia'
  return 'wydarzeń'
}

function habitsWord(n: number) {
  if (n === 1) return 'nawyk'
  if (n >= 2 && n <= 4) return 'nawyki'
  return 'nawyków'
}

/** Wyświetlanie: pierwsza litera jak zdania (bez zmiany zapisanego tekstu). */
function formatTodoTitleForDisplay(text: string): string {
  const s = text.trim()
  if (!s) return text
  return s.charAt(0).toLocaleUpperCase('pl-PL') + s.slice(1)
}

function TodoQuickParseHint() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-(--border) bg-(--bg-dark) text-(--text-muted) transition-colors hover:border-(--border) hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
        aria-label="Skróty wpisywania zadania"
        aria-expanded={open}
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-(--border) bg-(--bg-card) p-3 text-base text-(--text-muted) shadow-lg"
        >
          <p className="leading-relaxed">
            Na końcu: <code className="text-(--text-primary)">?</code> — {TODO_PRIORITY_LABEL.low},{' '}
            <code className="text-(--text-primary)">!</code> — {TODO_PRIORITY_LABEL.high}; bez znaku —{' '}
            {TODO_PRIORITY_LABEL.medium}. W treści: np. <code className="text-(--text-primary)">jutro</code>, data{' '}
            <code className="text-(--text-primary)">RRRR-MM-DD</code>, <code className="text-(--text-primary)">14:30</code>,{' '}
            <code className="text-(--text-primary)">#finanse</code>.
          </p>
          <p className="mt-2 leading-relaxed">
            <span className="font-gaming text-(--text-primary)">Opcje</span> — pierwszeństwo nad tekstem przy ustawionych
            polach.
          </p>
        </div>
      )}
    </div>
  )
}

const pageEnter = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const itemEnter = todoItemEnterVariants

function chipClass(kind: 'priority' | 'date', variant: string) {
  const base =
    'inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-gaming text-xs tracking-wide'
  if (kind === 'priority') {
    if (variant === 'high')
      return `${base} border-(--accent-amber)/40 bg-(--accent-amber)/10 text-(--accent-amber)`
    if (variant === 'medium')
      return `${base} border-(--border) bg-(--bg-dark)/60 text-(--text-muted)`
    return `${base} border-(--border) bg-(--bg-dark)/80 text-(--text-muted)`
  }
  if (variant === 'overdue')
    return `${base} border-red-500/35 bg-red-500/10 text-red-400`
  if (variant === 'today')
    return `${base} border-(--border) bg-(--bg-dark)/50 text-(--text-muted)`
  return `${base} border-(--border) text-(--text-muted)`
}

function TodoMetaChips({ todo }: { todo: TodoItem }) {
  const ds = todoDateStatus(todo.dueDate)
  const pri =
    todo.priority === 'high' ? 'high' : todo.priority === 'medium' ? 'medium' : 'low'

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <span className={chipClass('priority', pri)}>{TODO_PRIORITY_LABEL[todo.priority]}</span>
      {ds === 'overdue' && <span className={chipClass('date', 'overdue')}>Po terminie</span>}
      {ds === 'today' && <span className={chipClass('date', 'today')}>Dziś</span>}
      {ds === 'none' && (
        <span className={chipClass('date', 'none')}>Bez terminu</span>
      )}
    </div>
  )
}

function TodoTaskCard({
  todo,
  compact,
  onToggle,
  onRemove,
  onEdit,
}: {
  todo: TodoItem
  compact?: boolean
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
}) {
  const reduceMotion = useReducedMotion()
  const layoutTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.85 }

  return (
    <motion.div
      layout
      layoutId={`todo-card-${todo.id}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduceMotion ? { layout: layoutTransition } : { layout: layoutTransition, ...TODO_ITEM_SPRING }
      }
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.92, filter: 'blur(4px)', transition: { duration: 0.2 } }
      }
      className={`group relative flex flex-col overflow-hidden rounded-lg border transition-colors sm:flex-row sm:items-start ${
        compact ? 'gap-1.5 p-2 sm:p-2.5' : 'gap-2 p-3'
      } ${
        todo.done
          ? 'border-(--border) bg-(--bg-dark)/50'
          : 'border-(--border) bg-(--bg-dark) hover:border-(--border)'
      }`}
    >
      {todo.done ? (
        <motion.span
          aria-hidden
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-(--accent-green)/70"
          layout
          initial={false}
          animate={{ opacity: 0.45, scaleY: 0.65 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      ) : (
        (todo.priority === 'high' || (todo.dueDate && isTodoOverdue(todo.dueDate))) && (
          <motion.span
            aria-hidden
            className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${
              todo.dueDate && isTodoOverdue(todo.dueDate)
                ? 'bg-red-500/75'
                : 'bg-(--accent-amber)/70'
            }`}
            layout
            initial={false}
            animate={{ opacity: 0.95, scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )
      )}
      <div className={`relative z-1 flex min-w-0 flex-1 ${compact ? 'gap-2' : 'gap-3'}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
            todo.done
              ? 'text-(--accent-green)'
              : 'border border-(--border) text-(--text-muted) hover:border-(--border) hover:text-(--text-primary)'
          }`}
        >
          <motion.span
            key={todo.done ? 'done' : 'open'}
            initial={reduceMotion ? false : { scale: 0.6, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            {todo.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </motion.span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-(--border)"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className={`text-base font-medium leading-snug ${
                todo.done ? 'text-(--text-muted) line-through decoration-(--accent-green)/50' : 'text-(--text-primary)'
              }`}
            >
              {formatTodoTitleForDisplay(todo.text)}
            </span>
            <TodoMetaChips todo={todo} />
          </div>
          <p className={`text-base text-(--text-muted) ${compact ? 'mt-0.5' : 'mt-1'}`}>
            {TODO_CATEGORY_LABEL[todo.category]}
            {' · '}
            {formatTodoDueSummary(todo.dueDate, todo.dueTime)}
          </p>
          {todo.noteId && (
            <p className={compact ? 'mt-0.5' : 'mt-1'}>
              <Link
                to="/notes/inbox"
                className="font-gaming text-xs tracking-wide text-(--text-muted) underline-offset-2 hover:text-(--text-primary) hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Powiązana notatka
              </Link>
            </p>
          )}
        </button>
      </div>
      <div className={`relative z-1 flex shrink-0 justify-end gap-1 sm:flex-col ${compact ? 'sm:pt-0' : 'sm:pt-0.5'}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="rounded p-1.5 text-(--text-muted) opacity-70 transition-all hover:text-(--text-primary) group-hover:opacity-100"
          aria-label="Edytuj"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="rounded p-1.5 text-(--text-muted) opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
          aria-label="Usuń"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function TodoEditModal({
  todo,
  onClose,
  onSave,
}: {
  todo: TodoItem
  onClose: () => void
  onSave: (patch: {
    text: string
    dueDate: string | null
    dueTime: string | null
    priority: TodoPriority
    category: TodoCategory
  }) => void
}) {
  const { backdrop, panel } = useModalMotion()
  const [text, setText] = useState(todo.text)
  const [dueDate, setDueDate] = useState(todo.dueDate ?? '')
  const [dueTime, setDueTime] = useState(todo.dueTime ?? '')
  const [priority, setPriority] = useState<TodoPriority>(todo.priority)
  const [category, setCategory] = useState<TodoCategory>(todo.category)

  useEffect(() => {
    setText(todo.text)
    setDueDate(todo.dueDate ?? '')
    setDueTime(todo.dueTime ?? '')
    setPriority(todo.priority)
    setCategory(todo.category)
  }, [todo.id, todo.text, todo.dueDate, todo.dueTime, todo.priority, todo.category])

  const save = () => {
    const t = text.trim()
    if (!t) return
    onSave({
      text: t,
      dueDate: dueDate.trim() || null,
      dueTime: dueTime.trim() || null,
      priority,
      category,
    })
    onClose()
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        key="todo-edit-backdrop"
        {...backdrop}
        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-16 pointer-events-none">
        <motion.div
          key="todo-edit-panel"
          {...panel}
          className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-gaming text-lg font-bold text-(--text-primary)">Zadanie</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
              aria-label="Zamknij"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-base text-(--text-muted)">Treść</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
              />
            </div>
            <TodoDueQuickPick
              mode="explicit"
              onModeExplicit={() => {}}
              hideInheritHint
              quickDueDate={dueDate}
              quickDueTime={dueTime}
              onChangeQuickDueDate={setDueDate}
              onChangeQuickDueTime={setDueTime}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-base text-(--text-muted)">Priorytet</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TodoPriority)}
                  className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
                >
                  {(Object.keys(TODO_PRIORITY_LABEL) as TodoPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {TODO_PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-base text-(--text-muted)">Obszar</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TodoCategory)}
                  className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
                >
                  {TODO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {TODO_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!text.trim()}
              className="rounded-lg bg-(--accent-cyan)/20 px-4 py-2 font-gaming text-base text-(--accent-cyan) border border-(--accent-cyan)/40 hover:bg-(--accent-cyan)/30 disabled:opacity-40"
            >
              Zapisz
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}

function partitionTodayTodos(items: TodoItem[]) {
  const overdue = items.filter((t) => t.dueDate && isTodoOverdue(t.dueDate))
  const todayDated = items.filter(
    (t) => t.dueDate && !isTodoOverdue(t.dueDate) && isTodoDueToday(t.dueDate)
  )
  const undated = items.filter((t) => !t.dueDate)
  return { overdue, todayDated, undated }
}

export function Todo() {
  const { isDemoMode } = useAuth()
  const { todos, addTodo, updateTodo, toggleTodo, removeTodo, clearCompletedTodos, loading } =
    useTodos()
  const { events } = useEvents()
  const { habits } = useHabits()
  const [tab, setTab] = useState<TodoTabFilter>('today')
  const [categoryFilter, setCategoryFilter] = useState<TodoCategory | 'all'>('all')
  const [newText, setNewText] = useState('')
  const [duePickMode, setDuePickMode] = useState<TodoDuePickMode>('inherit')
  const [quickDueDate, setQuickDueDate] = useState('')
  const [quickDueTime, setQuickDueTime] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [draftPriority, setDraftPriority] = useState<TodoPriority | null>(null)
  const [draftCategory, setDraftCategory] = useState<TodoCategory | null>(null)
  const [editing, setEditing] = useState<TodoItem | null>(null)
  const [clearPrompt, setClearPrompt] = useState(false)
  const [undatedCollapsed, setUndatedCollapsed] = useState(false)
  const reduceMotion = useReducedMotion()

  const todayIso = localISODate()

  const todayBucketTodos = useMemo(
    () => todos.filter((t) => todoMatchesTab(t, 'today')),
    [todos]
  )

  const todosTodayOpen = useMemo(
    () => todayBucketTodos.filter((t) => !t.done),
    [todayBucketTodos]
  )

  const planStats = useMemo(() => {
    const todosToday = todosTodayOpen.length
    const eventsToday = events.filter((e) => normalizeEventDate(e.date) === todayIso).length
    const activeHabits = habits.filter((h) => !h.archivedAt).length
    return { todosToday, eventsToday, activeHabits }
  }, [todosTodayOpen, events, habits, todayIso])

  const todayDoneCount = useMemo(
    () => todos.filter((t) => t.done && !isArchivedTodo(t) && todoInTodayBucket(t)).length,
    [todos]
  )

  const filtered = useMemo(() => {
    let list = todos.filter((t) => todoMatchesTab(t, tab))
    if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter)
    }
    return [...list].sort(compareTodosForDisplay)
  }, [todos, tab, categoryFilter])

  const todaySummary = useMemo(() => {
    const openToday = todayBucketTodos.filter((t) => !t.done)
    const high = openToday.filter((t) => t.priority === 'high').length
    return { count: openToday.length, high }
  }, [todayBucketTodos])

  const add = () => {
    const raw = newText.trim()
    if (!raw) return
    const parsed = parseQuickTodoInput(raw)
    if (!parsed.text) return
    const dueDate =
      duePickMode === 'explicit' ? quickDueDate.trim() || null : parsed.dueDate ?? null
    const dueTime =
      duePickMode === 'explicit' ? quickDueTime.trim() || null : parsed.dueTime ?? null
    addTodo({
      text: parsed.text,
      dueDate,
      dueTime,
      priority: draftPriority ?? parsed.priority,
      category: draftCategory ?? parsed.category,
    })
    setNewText('')
    setDuePickMode('inherit')
    setQuickDueDate('')
    setQuickDueTime('')
    setOptionsOpen(false)
    setDraftPriority(null)
    setDraftCategory(null)
  }

  const toggle = (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    toggleTodo(id, !todo.done)
  }

  const optionsDirty =
    Boolean(quickDueDate || quickDueTime) || draftPriority !== null || draftCategory !== null

  if (loading) {
    return <SimplePageSkeleton titleWidth="w-32" />
  }

  const renderList = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'done' ? 'Brak zrobionych' : 'Nic tu nie ma'}
          description={
            tab === 'done'
              ? 'Ukończone zadania pojawią się tutaj.'
              : 'Dodaj zadanie lub zmień filtr obszaru.'
          }
          compact
        />
      )
    }

    if (tab === 'today') {
      const { overdue, todayDated, undated } = partitionTodayTodos(filtered)
      const renderGroup = (label: string | null, items: TodoItem[]) => {
        if (items.length === 0) return null
        return (
          <div key={label ?? 'rest'} className="space-y-2">
            {label && (
              <h3 className="font-gaming text-base tracking-wide text-(--text-muted)">{label}</h3>
            )}
            <AnimatePresence mode="popLayout">
              {items.map((todo) => (
                <TodoTaskCard
                  key={todo.id}
                  todo={todo}
                  compact={!todo.dueDate && !todo.done}
                  onToggle={() => toggle(todo.id)}
                  onRemove={() => removeTodo(todo.id)}
                  onEdit={() => setEditing(todo)}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      }
      return (
        <div className="space-y-6">
          {renderGroup('Po terminie', overdue)}
          {renderGroup('Na dziś', todayDated)}
          {undated.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setUndatedCollapsed((c) => !c)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-1 py-0.5 text-left font-gaming text-base tracking-wide text-(--text-muted) transition-colors hover:border-(--border)/60 hover:bg-(--bg-dark)/40 hover:text-(--text-primary)"
                aria-expanded={!undatedCollapsed}
              >
                <span>
                  Bez terminu ({undated.length})
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${undatedCollapsed ? '-rotate-90' : 'rotate-0'}`}
                  aria-hidden
                />
              </button>
              {!undatedCollapsed && (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {undated.map((todo) => (
                      <TodoTaskCard
                        key={todo.id}
                        todo={todo}
                        compact={!todo.dueDate && !todo.done}
                        onToggle={() => toggle(todo.id)}
                        onRemove={() => removeTodo(todo.id)}
                        onEdit={() => setEditing(todo)}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((todo) => (
            <TodoTaskCard
              key={todo.id}
              todo={todo}
              compact={!todo.dueDate && !todo.done}
              onToggle={() => toggle(todo.id)}
              onRemove={() => removeTodo(todo.id)}
              onEdit={() => setEditing(todo)}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      className="relative space-y-6"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      {!reduceMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -right-20 top-0 h-72 max-w-none overflow-hidden opacity-[0.2] blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(0,229,255,0.08), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 40%, rgba(255,184,0,0.05), transparent 50%)',
          }}
        />
      )}

      <motion.div variants={itemEnter} className="relative flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-gaming text-2xl font-bold tracking-wider text-(--text-primary)">TO-DO</h1>
        {isDemoMode && (
          <span className="font-gaming text-sm tracking-wide text-(--text-muted)">Dane przykładowe</span>
        )}
      </motion.div>

      <motion.div
        variants={itemEnter}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--border)/80 bg-(--bg-card)/25 px-3 py-2"
      >
        <p className="min-w-0 text-base text-(--text-muted)">
          <span className="font-gaming text-(--text-primary)">Dzisiaj:</span>{' '}
          {planStats.todosToday} {tasksWord(planStats.todosToday)} · {planStats.eventsToday}{' '}
          {eventsWord(planStats.eventsToday)} · {planStats.activeHabits} {habitsWord(planStats.activeHabits)}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            to="/calendar"
            className="inline-flex items-center gap-1.5 rounded-md border border-(--border) px-2.5 py-1.5 font-gaming text-sm text-(--text-muted) transition-colors hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Kalendarz
          </Link>
          <Link
            to="/habits"
            className="inline-flex items-center gap-1.5 rounded-md border border-(--border) px-2.5 py-1.5 font-gaming text-sm text-(--text-muted) transition-colors hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)"
          >
            <Target className="h-3.5 w-3.5" />
            Nawyki
          </Link>
        </div>
      </motion.div>

      <motion.div variants={itemEnter} className="space-y-2">
        <div className="flex gap-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Co masz do zrobienia? np. Zapłacić rachunki jutro #finanse !"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
          />
          <TodoQuickParseHint />
          <motion.button
            type="button"
            onClick={add}
            title="Dodaj zadanie"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="flex h-11 min-w-0 max-sm:flex-1 shrink-0 items-center justify-center gap-2 rounded-lg border border-(--accent-cyan)/45 bg-(--accent-cyan)/18 px-4 font-gaming text-sm tracking-wide text-(--accent-cyan) shadow-[0_0_0_1px_rgba(0,229,255,0.08)] transition-colors hover:bg-(--accent-cyan)/26 sm:w-11 sm:max-w-none sm:gap-0 sm:px-0"
            aria-label="Dodaj zadanie"
          >
            <Plus className="h-5 w-5 shrink-0" />
            <span className="sm:hidden">Dodaj</span>
          </motion.button>
        </div>
        <button
          type="button"
          onClick={() => setOptionsOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-(--border) bg-(--bg-card)/30 px-3 py-2 font-gaming text-sm tracking-wide text-(--text-muted) transition-colors hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary) sm:inline-flex sm:w-auto"
          aria-expanded={optionsOpen}
        >
          {optionsOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          <span>Opcje</span>
          {!optionsOpen && optionsDirty && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent-amber)/80" title="Ustawiono termin lub pola z Opcji" />
          )}
        </button>
        {optionsOpen && (
          <div className="space-y-4 rounded-lg border border-(--border)/80 bg-(--bg-card)/25 p-4">
            <TodoDueQuickPick
              mode={duePickMode}
              onModeExplicit={() => setDuePickMode('explicit')}
              hideInheritHint
              quickDueDate={quickDueDate}
              quickDueTime={quickDueTime}
              onChangeQuickDueDate={setQuickDueDate}
              onChangeQuickDueTime={setQuickDueTime}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-base text-(--text-muted)">Priorytet</span>
                <select
                  value={draftPriority ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setDraftPriority(v === '' ? null : (v as TodoPriority))
                  }}
                  className="min-h-11 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
                >
                  <option value="">—</option>
                  {(Object.keys(TODO_PRIORITY_LABEL) as TodoPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {TODO_PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-base text-(--text-muted)">Obszar</span>
                <select
                  value={draftCategory ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setDraftCategory(v === '' ? null : (v as TodoCategory))
                  }}
                  className="min-h-11 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
                >
                  <option value="">—</option>
                  {TODO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {TODO_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        variants={itemEnter}
        className="flex flex-col gap-1.5 rounded-lg border border-(--border)/70 bg-(--bg-card)/20 px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap gap-1">
          {TAB_DEFS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md border px-2.5 py-1.5 font-gaming text-sm tracking-wide transition-colors ${
                tab === t.id
                  ? 'border-(--border) bg-(--bg-dark) text-(--text-primary)'
                  : 'border-transparent bg-transparent text-(--text-muted) hover:bg-(--bg-card-hover)/50 hover:text-(--text-primary)'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {tab === 'done' && todos.some((t) => t.done) && (
            <button
              type="button"
              onClick={() => setClearPrompt(true)}
              className="rounded-md border border-red-500/25 bg-red-500/5 px-2.5 py-1.5 font-gaming text-sm text-red-400/90 hover:bg-red-500/10"
            >
              Wyczyść zrobione
            </button>
          )}
          <label className="flex items-center gap-1.5 whitespace-nowrap font-gaming text-sm text-(--text-muted)">
            Obszar
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value === 'all' ? 'all' : (e.target.value as TodoCategory))
              }
              className="max-w-44 rounded-md border border-(--border) bg-(--bg-dark) px-2 py-1.5 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
            >
              <option value="all">Wszystkie</option>
              {TODO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {TODO_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </motion.div>

      {tab === 'today' && (
        <motion.div variants={itemEnter} className="space-y-0.5">
          <h2 className="font-gaming text-lg font-semibold tracking-wide text-(--text-primary)">Dzisiaj</h2>
          <p className="text-base text-(--text-muted)">
            {todaySummary.count}{' '}
            {todaySummary.count === 1 ? 'zadanie' : todaySummary.count < 5 ? 'zadania' : 'zadań'}
            {todaySummary.high > 0 && <> · {todaySummary.high} wysokie</>}
            {todayDoneCount > 0 && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => setTab('done')}
                  className="font-gaming text-(--text-muted) underline-offset-2 hover:text-(--text-primary) hover:underline"
                  title="Przejdź do zakładki Zrobione"
                >
                  {todayDoneCount} zrobione
                </button>
              </>
            )}
          </p>
        </motion.div>
      )}

      <motion.section variants={itemEnter} className="space-y-3">
        {renderList()}
      </motion.section>

      {editing && (
        <TodoEditModal
          key={editing.id}
          todo={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) =>
            updateTodo(editing.id, {
              text: patch.text,
              dueDate: patch.dueDate,
              dueTime: patch.dueTime,
              priority: patch.priority,
              category: patch.category,
            })
          }
        />
      )}

      <ConfirmDialog
        isOpen={clearPrompt}
        onCancel={() => setClearPrompt(false)}
        onConfirm={() => {
          clearCompletedTodos()
          setClearPrompt(false)
        }}
        title="Wyczyścić zrobione?"
        description="Wszystkie ukończone zadania zostaną trwale usunięte z listy."
        confirmLabel="Wyczyść"
      />
    </motion.div>
  )
}
