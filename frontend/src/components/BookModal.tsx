import { useState, useEffect, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { useModalMotion } from '../lib/modalMotion'
import type { Book } from '../context/LearningContext'

interface BookModalProps {
  isOpen: boolean
  onClose: () => void
  book: Book | null
  allCategories: string[]
  onUpdate: (id: string, data: Partial<Book>) => void
  onDelete: (id: string) => void
  addBookCategory: (name: string) => void
}

export function BookModal({
  isOpen,
  onClose,
  book,
  allCategories,
  onUpdate,
  onDelete,
  addBookCategory,
}: BookModalProps) {
  const { backdrop, panel } = useModalMotion()
  const getInitialForm = useCallback(() => {
    if (!book) return { title: '', author: '', category: 'Programowanie', customCategory: '', finishedAt: '', rating: '' }
    const cat = book.category || 'Programowanie'
    const isInList = allCategories.includes(cat)
    return {
      title: book.title,
      author: book.author,
      category: isInList ? cat : 'Inne',
      customCategory: isInList ? '' : cat,
      finishedAt: book.finishedAt,
      rating: book.rating != null ? String(book.rating) : '',
    }
  }, [book, allCategories])
  const [form, setForm] = useState(getInitialForm)
  const updateField = <K extends keyof ReturnType<typeof getInitialForm>>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (isOpen && book) setForm(getInitialForm())
  }, [isOpen, book, getInitialForm])

  const { title, author, category, customCategory, finishedAt, rating } = form

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!book || !title.trim() || !author.trim()) return
    const cat = category === 'Inne' ? customCategory.trim() : category.trim()
    if (cat && category === 'Inne') addBookCategory(cat)
    const r = rating ? parseInt(rating, 10) : undefined
    onUpdate(book.id, {
      title: title.trim(),
      author: author.trim(),
      category: cat || undefined,
      finishedAt,
      rating: r != null && r >= 1 && r <= 5 ? r : undefined,
    })
    onClose()
  }

  const handleDelete = () => {
    if (book) {
      onDelete(book.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && book && (
        <>
          <motion.div
            key="book-backdrop"
            {...backdrop}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="book-panel"
              {...panel}
              className="pointer-events-auto relative w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
            >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              Edytuj książkę
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Tytuł *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Autor *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => updateField('author', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Kategoria</label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none min-w-[160px]"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {category === 'Inne' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => updateField('customCategory', e.target.value)}
                    placeholder="Wpisz kategorię"
                    className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none min-w-[140px]"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data ukończenia</label>
                <input
                  type="date"
                  value={finishedAt}
                  onChange={(e) => updateField('finishedAt', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Ocena (1-5)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rating}
                  onChange={(e) => updateField('rating', e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-(--accent-magenta)/40 text-(--accent-magenta) hover:bg-(--accent-magenta)/10 font-gaming transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Usuń
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-gaming transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming hover:opacity-90 transition-opacity"
              >
                Zapisz
              </button>
            </div>
          </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

}
