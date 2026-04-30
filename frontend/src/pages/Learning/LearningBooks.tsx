import { useState, useCallback, memo } from 'react'
import { Card } from '../../components/Card'
import { LearningCard } from '../../components/learning/LearningCard'
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
}

const BookAddForm = memo(function BookAddForm({
  bookCategories,
  onAdd,
  onAddCategory,
  onRemoveCategory,
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
    <Card title="Dodaj książkę">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Tytuł *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Autor</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
        </div>

        {/* Category selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-base text-(--text-muted) font-gaming">Kategoria</label>
            <button
              type="button"
              onClick={() => setShowCatManager((v) => !v)}
              className="text-xs text-(--text-muted) hover:text-(--accent-cyan) font-gaming transition-colors"
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
                className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                  category === cat
                    ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                    : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {showCatManager && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
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
                  className="flex-1 px-3 py-1.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming text-sm focus:border-(--accent-cyan) focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCatInput.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-(--accent-cyan) text-(--accent-cyan) font-gaming text-sm hover:bg-(--accent-cyan)/10 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj
                </button>
              </div>
              {bookCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bookCategories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-(--bg-dark) border border-(--border) text-sm font-gaming text-(--text-muted)"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveCategory(cat)
                          if (category === cat) setCategory('')
                        }}
                        className="hover:text-[#e74c3c] transition-colors"
                        aria-label={`Usuń kategorię ${cat}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
          <div className="flex gap-2 flex-wrap">
            {READING_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-4 py-2 rounded-lg font-gaming text-sm transition-colors ${
                  status === opt.value
                    ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                    : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {(status === 'czytam' || status === 'przeczytane') && (
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Data rozpoczęcia</label>
              <input
                type="date"
                value={startedAt}
                max="9999-12-31"
                onChange={(e) => setStartedAt(e.target.value)}
                className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          )}
          {status === 'przeczytane' && (
            <>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data ukończenia</label>
                <input
                  type="date"
                  value={finishedAt}
                  max="9999-12-31"
                  onChange={(e) => setFinishedAt(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Ocena (1–5)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rating}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    if (v === '' || (parseInt(v, 10) >= 1 && parseInt(v, 10) <= 5)) setRating(v)
                  }}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-16 focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatka (opcjonalnie)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!title.trim()}
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
      </form>
    </Card>
  )
})

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningBooks() {
  const learning = useLearning()
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  const { pendingId, toast, scheduleDelete } = useUndoDelete<Book>(
    useCallback((id) => learning?.deleteBook(id), [learning]),
  )

  if (!learning) return null

  const { books, addBook, updateBook, bookCategories, addBookCategory, removeBookCategory } = learning

  const visibleBooks = books.filter((b) => b.id !== pendingId)

  return (
    <div className="space-y-6">
      {/* Isolated add form – typing here doesn't re-render the list */}
      <BookAddForm
        bookCategories={bookCategories}
        onAdd={addBook}
        onAddCategory={addBookCategory}
        onRemoveCategory={removeBookCategory}
      />

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

      {/* Edit modal */}
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

      {/* Undo delete toast */}
      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
