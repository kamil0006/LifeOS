import { useState, useCallback, memo } from 'react'
import { Card } from '../../components/Card'
import { LearningCard } from '../../components/learning/LearningCard'
import { LearningFormShell } from '../../components/learning/LearningFormShell'
import {
  learningFieldClass,
  learningLabelClass,
  learningFormActionsClass,
  learningPrimaryBtnClass,
  learningSecondaryBtnClass,
  learningAddBtnClass,
  learningChipClass,
} from '../../components/learning/learningFormClasses'
import { AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useLearning } from '../../context/LearningContext'
import { BookModal } from '../../components/BookModal'
import { useUndoDelete } from '../../components/learning/UndoToast'
import type { Book, ReadingStatus } from '../../context/LearningContext'

const DEFAULT_CATEGORIES = ['Programowanie', 'Biznes', 'Psychologia', 'Rozwój osobisty', 'Inne']

const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'chce_przeczytac', label: 'Chcę przeczytać' },
  { value: 'czytam', label: 'Czytam' },
  { value: 'przeczytane', label: 'Przeczytane' },
]

const STATUS_GROUPS: { status: ReadingStatus; label: string }[] = [
  { status: 'czytam', label: 'Czytam' },
  { status: 'przeczytane', label: 'Przeczytane' },
  { status: 'chce_przeczytac', label: 'Chcę przeczytać' },
]

function StatusBadge({ status }: { status: ReadingStatus }) {
  const bgMap: Record<ReadingStatus, string> = {
    chce_przeczytac: 'bg-(--bg-dark) text-(--text-muted) border border-(--border)',
    czytam: 'bg-(--accent-cyan)/10 text-(--accent-cyan) border border-(--accent-cyan)/30',
    przeczytane: 'bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/30',
  }
  const labels: Record<ReadingStatus, string> = {
    chce_przeczytac: 'Chcę przeczytać',
    czytam: 'Czytam',
    przeczytane: 'Przeczytane',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-gaming ${bgMap[status]}`}>
      {labels[status]}
    </span>
  )
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null
  return (
    <span className="text-xs text-(--accent-amber) font-mono">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

// ─── ADD FORM (isolated to prevent list re-renders while typing) ───────────────

interface BookAddFormProps {
  bookCategories: string[]
  onAdd: (b: Omit<Book, 'id'>) => void
  onAddCategory: (name: string) => void
  onRemoveCategory: (name: string) => void
  onCancel?: () => void
}

const BookAddForm = memo(function BookAddForm({
  bookCategories,
  onAdd,
  onAddCategory,
  onRemoveCategory,
  onCancel,
}: BookAddFormProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<ReadingStatus>('chce_przeczytac')
  const [rating, setRating] = useState('')
  const [finishedAt, setFinishedAt] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [newCatInput, setNewCatInput] = useState('')
  const [showCatManager, setShowCatManager] = useState(false)

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...bookCategories])]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      author: author.trim() || undefined,
      category: category || 'Inne',
      status,
      rating: status === 'przeczytane' && rating ? parseInt(rating, 10) : undefined,
      finishedAt: status === 'przeczytane' && finishedAt ? finishedAt : undefined,
      startedAt: (status === 'czytam' || status === 'przeczytane') && startedAt ? startedAt : undefined,
      notes: notes.trim() || undefined,
    })
    setTitle('')
    setAuthor('')
    setCategory('')
    setStatus('chce_przeczytac')
    setRating('')
    setFinishedAt('')
    setStartedAt('')
    setNotes('')
  }

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim()
    if (!trimmed) return
    onAddCategory(trimmed)
    setCategory(trimmed)
    setNewCatInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className={learningLabelClass}>Tytuł *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Autor</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={learningFieldClass}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className={learningLabelClass + ' mb-0'}>Kategoria</label>
          <button
            type="button"
            onClick={() => setShowCatManager((v) => !v)}
            className="text-sm text-(--text-muted) transition-colors hover:text-(--accent-cyan)"
          >
            {showCatManager ? 'Zamknij' : 'Zarządzaj'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={learningChipClass(category === cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        {showCatManager && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCategory()
                  }
                }}
                placeholder="Nowa kategoria"
                className={learningFieldClass}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatInput.trim()}
                className={learningSecondaryBtnClass + ' shrink-0'}
              >
                <Plus className="h-4 w-4" />
                Dodaj
              </button>
            </div>
            {bookCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bookCategories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1 rounded-lg border border-(--border) bg-(--bg-dark) px-2 py-1.5 text-sm text-(--text-muted)"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveCategory(cat)
                        if (category === cat) setCategory('')
                      }}
                      className="transition-colors hover:text-[#e74c3c]"
                      aria-label={`Usuń kategorię ${cat}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={learningLabelClass}>Status</label>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {READING_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`w-full sm:w-auto ${learningChipClass(status === opt.value)}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {(status === 'czytam' || status === 'przeczytane') && (
        <div className="space-y-4 sm:flex sm:flex-wrap sm:gap-4 sm:space-y-0">
          <div className="sm:flex-1 sm:min-w-[160px]">
            <label className={learningLabelClass}>Data rozpoczęcia</label>
            <input
              type="date"
              value={startedAt}
              max="9999-12-31"
              onChange={(e) => setStartedAt(e.target.value)}
              className={learningFieldClass}
            />
          </div>
          {status === 'przeczytane' && (
            <>
              <div className="sm:flex-1 sm:min-w-[160px]">
                <label className={learningLabelClass}>Data ukończenia</label>
                <input
                  type="date"
                  value={finishedAt}
                  max="9999-12-31"
                  onChange={(e) => setFinishedAt(e.target.value)}
                  className={learningFieldClass}
                />
              </div>
              <div className="sm:w-28">
                <label className={learningLabelClass}>Ocena (1–5)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rating}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    if (v === '' || (parseInt(v, 10) >= 1 && parseInt(v, 10) <= 5)) setRating(v)
                  }}
                  className={learningFieldClass + ' font-mono'}
                />
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <label className={learningLabelClass}>Notatka (opcjonalnie)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={learningFieldClass}
        />
      </div>

      <div className={learningFormActionsClass}>
        <button type="submit" className={learningPrimaryBtnClass} disabled={!title.trim()}>
          <Plus className="h-4 w-4" />
          Dodaj książkę
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={learningSecondaryBtnClass}>
            Anuluj
          </button>
        )}
      </div>
    </form>
  )
})

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningBooks() {
  const learning = useLearning()
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const { pendingId, toast, scheduleDelete } = useUndoDelete<Book>(
    useCallback((id) => learning?.deleteBook(id), [learning]),
  )

  if (!learning) return null

  const { books, addBook, updateBook, bookCategories, addBookCategory, removeBookCategory } = learning

  const visibleBooks = books.filter((b) => b.id !== pendingId)

  return (
    <div className="space-y-6">
      {visibleBooks.length > 0 ? (
        <div className="space-y-6">
          {STATUS_GROUPS.map((group) => {
            const items = visibleBooks.filter((b) => b.status === group.status)
            if (items.length === 0) return null
            return (
              <Card key={group.status} title={group.label}>
                <div className="space-y-2">
                  {items.map((b) => (
                    <LearningCard
                      key={b.id}
                      title={b.title}
                      subtitle={b.author}
                      badge={<StatusBadge status={b.status} />}
                      meta={[
                        b.category,
                        b.startedAt ? `Rozpoczęto: ${b.startedAt}` : undefined,
                        b.finishedAt ? `Ukończono: ${b.finishedAt}` : undefined,
                        b.notes ? `📝 ${b.notes}` : undefined,
                        b.keyTakeaway ? `💡 ${b.keyTakeaway}` : undefined,
                      ]}
                      quickActions={<StarRating rating={b.rating} />}
                      onEdit={() => setEditingBook(b)}
                      onDelete={() => scheduleDelete(b, b.title)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card title="Lista książek">
          <p className="text-base text-(--text-muted)">Brak książek. Dodaj pierwszą.</p>
        </Card>
      )}

      <LearningFormShell
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Dodaj książkę"
        maxWidth="max-w-2xl"
      >
        <BookAddForm
          bookCategories={bookCategories}
          onAdd={(b) => {
            addBook(b)
            setShowAddForm(false)
          }}
          onAddCategory={addBookCategory}
          onRemoveCategory={removeBookCategory}
          onCancel={() => setShowAddForm(false)}
        />
      </LearningFormShell>

      {!showAddForm && (
        <div className={visibleBooks.length > 0 ? 'border-t border-(--border)/60 pt-4' : undefined}>
          <button type="button" onClick={() => setShowAddForm(true)} className={learningAddBtnClass}>
            <Plus className="h-4 w-4" />
            Dodaj książkę
          </button>
        </div>
      )}

      {editingBook && (
        <BookModal
          book={editingBook}
          bookCategories={bookCategories}
          onSave={(updates: Partial<Book>) => {
            updateBook(editingBook.id, updates)
            setEditingBook(null)
          }}
          onClose={() => setEditingBook(null)}
        />
      )}

      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
