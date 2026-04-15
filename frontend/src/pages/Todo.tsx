import { useState } from 'react'
import { Card } from '../components/Card'
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion'
import { Plus, Trash2, Circle, CheckCircle2, ClipboardList } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useTodos } from '../context/TodosContext'
import { SimplePageSkeleton } from '../components/skeletons'
import type { TodoItem } from '../context/TodosContext'
import { TODO_COLUMN_SPRING, TODO_ITEM_SPRING, todoItemEnterVariants } from '../lib/todoMotion'

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Do zrobienia', done: false },
  { id: 'done', label: 'Zrobione', done: true },
] as const

const pageEnter = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const itemEnter = todoItemEnterVariants

function TodoCard({
  todo,
  onToggle,
  onRemove,
}: {
  todo: TodoItem
  onToggle: () => void
  onRemove: () => void
}) {
  const reduceMotion = useReducedMotion()
  const layoutTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.85 } // layoutId — osobny od springów w todoMotion

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
      whileHover={
        reduceMotion
          ? undefined
          : { y: -2, transition: { type: 'spring', stiffness: 500, damping: 28 } }
      }
      whileTap={{ scale: 0.99 }}
      className={`group relative flex items-start gap-3 overflow-hidden rounded-lg border p-3 transition-colors ${
        todo.done
          ? 'bg-(--bg-dark)/50 border-(--border)'
          : 'bg-(--bg-dark) border-(--border) hover:border-(--accent-cyan)/35'
      }`}
    >
      {/* Accent strip — reads as “lane” when card flies between columns */}
      <motion.span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${
          todo.done ? 'bg-(--accent-green)/70' : 'bg-(--accent-cyan)/80'
        }`}
        layout
        initial={false}
        animate={{ opacity: todo.done ? 0.45 : 0.9, scaleY: todo.done ? 0.65 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <button
        type="button"
        onClick={onToggle}
        className={`relative z-1 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
          todo.done
            ? 'text-(--accent-green)'
            : 'border border-(--border) text-(--text-muted) hover:border-(--accent-cyan)/40 hover:text-(--accent-cyan)'
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
      <span
        className={`relative z-1 flex-1 pt-0.5 text-sm leading-tight ${
          todo.done ? 'text-(--text-muted) line-through decoration-(--accent-green)/50' : ''
        }`}
      >
        {todo.text}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="relative z-1 rounded p-1.5 text-(--text-muted) opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function AnimatedCount({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <span className="inline-flex min-w-[2ch] tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="inline-block font-bold text-(--accent-amber) font-gaming drop-shadow-[0_0_8px_rgba(255,184,0,0.3)]"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function Todo() {
  const { isDemoMode } = useAuth()
  const { todos, addTodo, toggleTodo, removeTodo, loading } = useTodos()
  const [newText, setNewText] = useState('')
  const reduceMotion = useReducedMotion()

  const activeCount = todos.filter((t) => !t.done).length

  const add = () => {
    if (!newText.trim()) return
    addTodo(newText.trim())
    setNewText('')
  }

  const toggle = (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    toggleTodo(id, !todo.done)
  }

  const remove = (id: string) => {
    removeTodo(id)
  }

  const todosByColumn = todos.reduce(
    (acc, t) => {
      const key = t.done ? 'done' : 'todo'
      acc[key].push(t)
      return acc
    },
    { todo: [] as TodoItem[], done: [] as TodoItem[] }
  )

  if (loading) {
    return <SimplePageSkeleton titleWidth="w-32" />
  }

  return (
    <motion.div
      className="relative space-y-6"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      {/* Soft ambient layer — depth without clutter */}
      {!reduceMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -right-20 top-0 h-72 max-w-none overflow-hidden opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(0,229,255,0.12), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 40%, rgba(255,184,0,0.08), transparent 50%)',
          }}
        />
      )}

      <motion.div variants={itemEnter} className="relative">
        <motion.h1
          className="font-gaming text-2xl font-bold tracking-wider text-(--text-primary)"
          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          TO-DO
        </motion.h1>
        <p className="mt-1 font-gaming text-base tracking-wide text-(--text-muted)">
          {isDemoMode ? 'Dane przykładowe' : 'Zarządzaj zadaniami w stylu Kanban'}
        </p>
      </motion.div>

      <motion.div variants={itemEnter} className="relative">
        <Card className="border-(--accent-amber)/20">
          <p className="font-gaming text-sm uppercase tracking-widest text-(--text-muted)">Aktywne zadania</p>
          <p className="mt-1 text-2xl">
            <AnimatedCount value={activeCount} />
          </p>
        </Card>
      </motion.div>

      <LayoutGroup id="todo-kanban">
        <motion.div
          variants={itemEnter}
          className="scrollbar-theme relative flex min-h-[320px] gap-4 overflow-x-auto pb-2"
        >
          {KANBAN_COLUMNS.map((col, colIndex) => (
            <motion.div
              key={col.id}
              initial={reduceMotion ? false : { opacity: 0, x: colIndex === 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...TODO_COLUMN_SPRING, delay: 0.08 + colIndex * 0.05 }}
              className="flex w-full min-w-[280px] max-w-[400px] shrink-0 flex-col"
            >
              <div
                className={`rounded-t-lg border-b-2 px-4 py-2 ${
                  col.done
                    ? 'border-(--accent-green)/40 bg-(--accent-green)/5'
                    : 'border-(--accent-cyan)/40 bg-(--accent-cyan)/5'
                }`}
              >
                <h3 className="font-gaming text-sm font-semibold tracking-wider text-(--text-primary)">
                  {col.label}
                </h3>
                <motion.p
                  key={todosByColumn[col.id].length}
                  initial={reduceMotion ? false : { opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="mt-0.5 text-sm text-(--text-muted)"
                >
                  {todosByColumn[col.id].length}{' '}
                  {todosByColumn[col.id].length === 1 ? 'zadanie' : 'zadań'}
                </motion.p>
              </div>
              <div className="min-h-[200px] flex-1 space-y-2 rounded-b-lg border border-t-0 border-(--border) bg-(--bg-card)/50 p-3">
                {col.id === 'todo' && (
                  <motion.div
                    className="mb-3 flex gap-2"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                  >
                    <input
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && add()}
                      className="flex-1 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-cyan) focus:outline-none"
                    />
                    <motion.button
                      type="button"
                      onClick={add}
                      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/15 px-3 py-2 font-gaming tracking-wider text-(--accent-cyan) transition-all hover:shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                    >
                      <Plus className="h-4 w-4" />
                      Dodaj
                    </motion.button>
                  </motion.div>
                )}
                <AnimatePresence mode="popLayout">
                  {todosByColumn[col.id].length === 0 && col.id === 'todo' ? (
                    <EmptyState
                      icon={ClipboardList}
                      title="Brak zadań"
                      description="Dodaj nowe zadanie w polu powyżej."
                      compact
                    />
                  ) : todosByColumn[col.id].length === 0 && col.id === 'done' ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="Brak ukończonych"
                      description="Ukończone zadania pojawią się tutaj."
                      compact
                    />
                  ) : (
                    todosByColumn[col.id].map((todo) => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onToggle={() => toggle(todo.id)}
                        onRemove={() => remove(todo.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </motion.div>
  )
}
