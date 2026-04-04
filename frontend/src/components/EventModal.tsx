import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import type { DemoEvent } from '../context/EventsContext'
import { EVENT_CATEGORIES } from '../lib/eventCategories'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: Omit<DemoEvent, 'id'>) => void
  onUpdate?: (id: string, data: Partial<Omit<DemoEvent, 'id'>>) => void
  onDelete?: (id: string) => void
  initialDate?: string // YYYY-MM-DD
  event?: DemoEvent | null // gdy edycja
  holidayName?: string // pełna nazwa święta w tym dniu
}

export function EventModal({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  initialDate,
  event,
  holidayName,
}: EventModalProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [category, setCategory] = useState('praca')
  const [notes, setNotes] = useState('')

  const isEdit = !!event

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title)
        setDate(event.date)
        setTime(event.time ?? '')
        setCategory(event.category ?? 'praca')
        setNotes(event.notes ?? '')
      } else {
        setTitle('')
        setDate(initialDate ?? new Date().toISOString().split('T')[0])
        setTime('')
        setCategory('praca')
        setNotes('')
      }
    }
  }, [isOpen, event, initialDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const cat = EVENT_CATEGORIES.find((c) => c.id === category)
    const data = {
      title: title.trim(),
      date,
      time: time || undefined,
      category: category || undefined,
      color: cat?.color,
      notes: notes.trim() || undefined,
    }
    if (isEdit && event && onUpdate) {
      onUpdate(event.id, data)
    } else {
      onAdd(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id)
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
                {isEdit ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
              </h3>
              {holidayName && (
                <p className="text-sm font-mono mt-1" style={{ color: '#e57373' }}>
                  Ten dzień: {holidayName}
                </p>
              )}
            </div>
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
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Godzina</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-2">Kategoria</label>
              <div className="flex gap-2 flex-wrap">
                {EVENT_CATEGORIES.map(({ id, label, color: hex }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-sm font-gaming ${
                      category === id ? 'border-(--accent-cyan)' : 'border-transparent hover:opacity-90'
                    }`}
                    style={{ backgroundColor: `${hex}30`, borderColor: category === id ? 'var(--accent-cyan)' : 'transparent' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatki</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-(--accent-magenta)/40 text-(--accent-magenta) hover:bg-(--accent-magenta)/10 font-gaming transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń
                </button>
              )}
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
                {isEdit ? 'Zapisz' : 'Dodaj'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
