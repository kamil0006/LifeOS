import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useModalMotion } from '../lib/modalMotion'
import type { Book, ReadingStatus } from '../context/LearningContext'

const DEFAULT_CATEGORIES = ['Programowanie', 'Biznes', 'Psychologia', 'Rozwój osobisty', 'Inne']

interface BookModalProps {
  book: Book
  bookCategories: string[]
  onSave: (data: Partial<Book>) => void
  onClose: () => void
}

const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'chce_przeczytac', label: 'Chcę przeczytać' },
  { value: 'czytam', label: 'Czytam' },
  { value: 'przeczytane', label: 'Przeczytane' },
]

type BookFormState = {
  title: string
  author: string
  category: string
  status: ReadingStatus
  finishedAt: string
  startedAt: string
  rating: string
  notes: string
  keyTakeaway: string
}

function buildInitialForm(book: Book): BookFormState {
  return {
    title: book.title,
    author: book.author ?? '',
    category: book.category || 'Programowanie',
    status: book.status || ('przeczytane' as ReadingStatus),
    finishedAt: book.finishedAt || '',
    startedAt: book.startedAt || '',
    rating: book.rating != null ? String(book.rating) : '',
    notes: book.notes || '',
    keyTakeaway: book.keyTakeaway || '',
  }
}

export function BookModal({ book, bookCategories, onSave, onClose }: BookModalProps) {
  const { backdrop, panel } = useModalMotion()

  /** Mała lista — koszt budowy Set przy każdym renderze jest znikomy; useMemo i tak często się przelicza przy nowej referencji `bookCategories`. */
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...bookCategories])]

  const [form, setForm] = useState<BookFormState>(() => buildInitialForm(book))

  useEffect(() => {
    setForm(buildInitialForm(book))
  }, [book])

  const updateField = <K extends keyof BookFormState>(key: K, value: BookFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const { title, author, category, status, finishedAt, startedAt, rating, notes, keyTakeaway } = form

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const r = rating ? parseInt(rating, 10) : undefined
    onSave({
      title: title.trim(),
      author: author.trim() || undefined,
      category: category || undefined,
      status,
      finishedAt: status === 'przeczytane' ? finishedAt || undefined : undefined,
      startedAt:
        status === 'czytam' || status === 'przeczytane' ? startedAt || undefined : undefined,
      rating: r != null && r >= 1 && r <= 5 ? r : undefined,
      notes: notes.trim() || undefined,
      keyTakeaway: keyTakeaway.trim() || undefined,
    })
  }

  return createPortal(
    <>
      <motion.div
        key="book-backdrop"
        {...backdrop}
        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12 pointer-events-none">
        <motion.div
          key="book-panel"
          {...panel}
          className="pointer-events-auto relative w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Edytuj książkę</h3>
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
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Autor</label>
              <input
                type="text"
                value={author}
                onChange={(e) => updateField('author', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>

            {/* Reading status */}
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
              <div className="flex flex-wrap gap-2">
                {READING_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('status', opt.value)}
                    className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                      status === opt.value
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border)'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Kategoria</label>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('category', cat)}
                    className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                      category === cat
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border)'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates & rating depending on status */}
            {(status === 'czytam' || status === 'przeczytane') && (
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data rozpoczęcia</label>
                <input
                  type="date"
                  value={startedAt}
                  max="9999-12-31"
                  onChange={(e) => updateField('startedAt', e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            )}
            {status === 'przeczytane' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Data ukończenia</label>
                  <input
                    type="date"
                    value={finishedAt}
                    max="9999-12-31"
                    onChange={(e) => updateField('finishedAt', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Ocena (1–5)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rating}
                    onChange={(e) => updateField('rating', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Kluczowy wniosek</label>
              <input
                type="text"
                value={keyTakeaway}
                onChange={(e) => updateField('keyTakeaway', e.target.value)}
                placeholder="Najważniejsza myśl z tej książki"
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatki</label>
              <textarea
                value={notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                placeholder="Twoje notatki, cytaty, przemyślenia..."
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-gaming transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity"
              >
                Zapisz
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}
