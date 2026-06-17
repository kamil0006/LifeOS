import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import { useQuickAdd } from '../context/QuickAddContext'
import { useTodos } from '../context/TodosContext'
import { parseQuickTodoInput } from '../lib/todoQuickParse'

/** Jednolinijkowe dodanie zadania To-do (Ctrl+Shift+L). */
export function GlobalQuickTodo() {
  const { quickTodoOpen, closeQuickTodo } = useQuickAdd()
  const { addTodo } = useTodos()
  const [text, setText] = useState('')

  useEffect(() => {
    if (quickTodoOpen) setText('')
  }, [quickTodoOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const raw = text.trim()
    if (!raw) return
    const parsed = parseQuickTodoInput(raw)
    if (!parsed.text) return
    addTodo({
      text: parsed.text,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      priority: parsed.priority,
      category: parsed.category,
    })
    closeQuickTodo()
  }

  return (
    <ModalShell
      isOpen={quickTodoOpen}
      onClose={closeQuickTodo}
      maxWidth="max-w-md"
      backdropKey="todo-quick-backdrop"
      panelKey="todo-quick-panel"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Nowe zadanie</h3>
        <button
          type="button"
          onClick={closeQuickTodo}
          className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
          aria-label="Zamknij"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-base text-(--text-muted) font-gaming">Treść</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Np. Spotkanie jutro 10:00 #praca !"
            className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-4 py-2.5 text-base font-gaming text-(--text-primary) focus:border-(--accent-cyan) focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeQuickTodo}
            className="w-full rounded-lg border border-(--border) px-4 py-2.5 font-gaming text-(--text-muted) hover:text-(--text-primary) sm:w-auto"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--accent-cyan) px-4 py-2.5 font-gaming font-bold text-(--bg-dark) hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Dodaj
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
