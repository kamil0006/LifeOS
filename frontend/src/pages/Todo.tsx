import { useState } from 'react'
import { Card } from '../components/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Circle, CheckCircle2, ClipboardList } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useTodos } from '../context/TodosContext'
import { SimplePageSkeleton } from '../components/skeletons'
import type { TodoItem } from '../context/TodosContext'

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Do zrobienia', done: false },
  { id: 'done', label: 'Zrobione', done: true },
] as const

function TodoCard({
  todo,
  onToggle,
  onRemove,
}: {
  todo: TodoItem
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
        todo.done
          ? 'bg-(--bg-dark)/50 border-(--border)'
          : 'bg-(--bg-dark) border-(--border) hover:border-(--accent-cyan)/30'
      }`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
          todo.done
            ? 'text-(--accent-green)'
            : 'text-(--text-muted) hover:text-(--accent-cyan) border border-(--border) hover:border-(--accent-cyan)/40 w-6 h-6'
        }`}
      >
        {todo.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <span
        className={`flex-1 text-sm leading-tight pt-0.5 ${
          todo.done ? 'line-through text-(--text-muted)' : ''
        }`}
      >
        {todo.text}
      </span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-(--text-muted) hover:text-red-400 transition-all rounded"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function Todo() {
  const { isDemoMode } = useAuth()
  const { todos, addTodo, toggleTodo, removeTodo, loading } = useTodos()
  const [newText, setNewText] = useState('')

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-primary) font-gaming tracking-wider">TO-DO</h1>
        <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
          {isDemoMode ? 'Dane przykładowe' : 'Zarządzaj zadaniami w stylu Kanban'}
        </p>
      </div>

      <Card className="border-(--accent-amber)/20">
        <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Aktywne zadania</p>
        <p className="text-2xl font-bold text-(--accent-amber) font-gaming drop-shadow-[0_0_8px_rgba(255,184,0,0.3)]">{activeCount}</p>
      </Card>

      {/* Kanban board */}
      <div className="scrollbar-theme flex gap-4 overflow-x-auto pb-2 min-h-[320px]">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.id}
            className="shrink-0 w-full min-w-[280px] max-w-[400px] flex flex-col"
          >
            <div
              className={`rounded-t-lg border-b-2 px-4 py-2 ${
                col.done
                  ? 'border-(--accent-green)/40 bg-(--accent-green)/5'
                  : 'border-(--accent-cyan)/40 bg-(--accent-cyan)/5'
              }`}
            >
              <h3 className="text-sm font-semibold font-gaming tracking-wider text-(--text-primary)">
                {col.label}
              </h3>
              <p className="text-sm text-(--text-muted) mt-0.5">
                {todosByColumn[col.id].length} {todosByColumn[col.id].length === 1 ? 'zadanie' : 'zadań'}
              </p>
            </div>
            <div className="flex-1 rounded-b-lg border border-t-0 border-(--border) bg-(--bg-card)/50 p-3 space-y-2 min-h-[200px]">
              {col.id === 'todo' && (
                <div className="flex gap-2 mb-3">
                  <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                    className="flex-1 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-cyan) focus:outline-none"
                  />
                  <button
                    onClick={add}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming tracking-wider hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj
                  </button>
                </div>
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
          </div>
        ))}
      </div>
    </div>
  )
}
