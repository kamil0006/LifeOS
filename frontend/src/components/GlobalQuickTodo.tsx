import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useModalMotion } from '../lib/modalMotion'
import { useQuickAdd } from '../context/QuickAddContext'
import { useTodos } from '../context/TodosContext'

/** Jednolinijkowe dodanie zadania To-do (Ctrl+Shift+L). */
export function GlobalQuickTodo() {
  const { quickTodoOpen, closeQuickTodo } = useQuickAdd()
  const { addTodo } = useTodos()
  const { backdrop, panel } = useModalMotion()
  const [text, setText] = useState('')

  useEffect(() => {
    if (quickTodoOpen) setText('')
  }, [quickTodoOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    addTodo(t)
    closeQuickTodo()
  }

  const modalContent = (
    <AnimatePresence>
      {quickTodoOpen && (
        <>
          <motion.div
            key="todo-quick-backdrop"
            {...backdrop}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
            onClick={closeQuickTodo}
          />
          <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12 pointer-events-none">
            <motion.div
              key="todo-quick-panel"
              {...panel}
              className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Nowe zadanie</h3>
                <button
                  type="button"
                  onClick={closeQuickTodo}
                  className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
                  aria-label="Zamknij"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Treść</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                    placeholder="Co masz do zrobienia?"
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeQuickTodo}
                    className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:text-(--text-primary)"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
