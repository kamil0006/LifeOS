import { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  Programowanie: 'categoryProgramming',
  Biznes: 'categoryBusiness',
  Psychologia: 'categoryPsychology',
  'Rozwój osobisty': 'categoryPersonalGrowth',
  Inne: 'categoryOther',
}

function bookCategoryLabel(cat: string, t: TFunction<'learning'>): string {
  const key = CATEGORY_LABEL_KEYS[cat]
  return key ? t(`books.${key}`) : cat
}

const READING_STATUS_OPTIONS: { value: ReadingStatus; labelKey: string }[] = [
  { value: 'chce_przeczytac', labelKey: 'statusWantToRead' },
  { value: 'czytam', labelKey: 'statusReading' },
  { value: 'przeczytane', labelKey: 'statusRead' },
]

const STATUS_GROUPS: { status: ReadingStatus; labelKey: string }[] = [
  { status: 'czytam', labelKey: 'statusReading' },
  { status: 'przeczytane', labelKey: 'statusRead' },
  { status: 'chce_przeczytac', labelKey: 'statusWantToRead' },
]

function StatusBadge({ status }: { status: ReadingStatus }) {
  const { t } = useTranslation('learning')
  const bgMap: Record<ReadingStatus, string> = {
    chce_przeczytac: 'bg-(--bg-dark) text-(--text-muted) border border-(--border)',
    czytam: 'bg-(--accent)/10 text-(--accent) border border-(--accent)/30',
    przeczytane: 'bg-(--positive)/10 text-(--positive) border border-(--positive)/30',
  }
  const labelKeys: Record<ReadingStatus, string> = {
    chce_przeczytac: 'statusWantToRead',
    czytam: 'statusReading',
    przeczytane: 'statusRead',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-display ${bgMap[status]}`}>
      {t(`books.${labelKeys[status]}`)}
    </span>
  )
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null
  return (
    <span className="text-xs text-(--warning) font-mono">
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
  const { t } = useTranslation('learning')
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
          <label className={learningLabelClass}>{t('books.title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('books.author')}</label>
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
          <label className={learningLabelClass + ' mb-0'}>{t('books.category')}</label>
          <button
            type="button"
            onClick={() => setShowCatManager((v) => !v)}
            className="text-sm text-(--text-muted) transition-colors hover:text-(--accent)"
          >
            {showCatManager ? t('common.closeCategories') : t('common.manageCategories')}
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
              {bookCategoryLabel(cat, t)}
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
                placeholder={t('common.newCategory')}
                className={learningFieldClass}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatInput.trim()}
                className={learningSecondaryBtnClass + ' shrink-0'}
              >
                <Plus className="h-4 w-4" />
                {t('common.add')}
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
                      aria-label={t('common.removeCategoryAria', { name: cat })}
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
        <label className={learningLabelClass}>{t('books.status')}</label>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {READING_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`w-full sm:w-auto ${learningChipClass(status === opt.value)}`}
            >
              {t(`books.${opt.labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      {(status === 'czytam' || status === 'przeczytane') && (
        <div className="space-y-4 sm:flex sm:flex-wrap sm:gap-4 sm:space-y-0">
          <div className="sm:flex-1 sm:min-w-[160px]">
            <label className={learningLabelClass}>{t('books.startDate')}</label>
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
                <label className={learningLabelClass}>{t('books.finishDate')}</label>
                <input
                  type="date"
                  value={finishedAt}
                  max="9999-12-31"
                  onChange={(e) => setFinishedAt(e.target.value)}
                  className={learningFieldClass}
                />
              </div>
              <div className="sm:w-28">
                <label className={learningLabelClass}>{t('books.rating')}</label>
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
        <label className={learningLabelClass}>{t('books.note')}</label>
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
          {t('books.addBook')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={learningSecondaryBtnClass}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  )
})

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningBooks() {
  const { t } = useTranslation('learning')
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
              <Card key={group.status} title={t(`books.${group.labelKey}`)}>
                <div className="space-y-2">
                  {items.map((b) => (
                    <LearningCard
                      key={b.id}
                      title={b.title}
                      subtitle={b.author}
                      badge={<StatusBadge status={b.status} />}
                      meta={[
                        b.category ? bookCategoryLabel(b.category, t) : undefined,
                        b.startedAt ? t('books.startedLabel', { date: b.startedAt }) : undefined,
                        b.finishedAt ? t('books.finishedLabel', { date: b.finishedAt }) : undefined,
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
        <Card title={t('books.emptyList')}>
          <p className="text-base text-(--text-muted)">{t('books.emptyMessage')}</p>
        </Card>
      )}

      <LearningFormShell
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title={t('books.addBook')}
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
            {t('books.addBook')}
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
