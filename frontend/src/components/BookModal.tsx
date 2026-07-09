import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import type { Book, ReadingStatus } from '../context/LearningContext'

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

interface BookModalProps {
  book: Book
  bookCategories: string[]
  onSave: (data: Partial<Book>) => void
  onClose: () => void
}

const READING_STATUS_OPTIONS: { value: ReadingStatus; labelKey: string }[] = [
  { value: 'chce_przeczytac', labelKey: 'statusWantToRead' },
  { value: 'czytam', labelKey: 'statusReading' },
  { value: 'przeczytane', labelKey: 'statusRead' },
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
  const { t } = useTranslation('learning')
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

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      backdropKey="book-backdrop"
      panelKey="book-panel"
    >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-display">{t('books.editTitle')}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.title')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.author')}</label>
              <input
                type="text"
                value={author}
                onChange={(e) => updateField('author', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
              />
            </div>

            {/* Reading status */}
            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.status')}</label>
              <div className="flex flex-wrap gap-2">
                {READING_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('status', opt.value)}
                    className={`px-3 py-1.5 rounded-lg font-display text-sm transition-colors ${
                      status === opt.value
                        ? 'bg-(--accent)/20 text-(--accent) border border-(--accent)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border)'
                    }`}
                  >
                    {t(`books.${opt.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.category')}</label>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('category', cat)}
                    className={`px-3 py-1.5 rounded-lg font-display text-sm transition-colors ${
                      category === cat
                        ? 'bg-(--accent)/20 text-(--accent) border border-(--accent)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border)'
                    }`}
                  >
                    {bookCategoryLabel(cat, t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates & rating depending on status */}
            {(status === 'czytam' || status === 'przeczytane') && (
              <div>
                <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.startDate')}</label>
                <input
                  type="date"
                  value={startedAt}
                  max="9999-12-31"
                  onChange={(e) => updateField('startedAt', e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                />
              </div>
            )}
            {status === 'przeczytane' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.finishDate')}</label>
                  <input
                    type="date"
                    value={finishedAt}
                    max="9999-12-31"
                    onChange={(e) => updateField('finishedAt', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.rating')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rating}
                    onChange={(e) => updateField('rating', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono focus:border-(--accent) focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.keyTakeaway')}</label>
              <input
                type="text"
                value={keyTakeaway}
                onChange={(e) => updateField('keyTakeaway', e.target.value)}
                placeholder={t('books.keyTakeawayPlaceholder')}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('books.notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                placeholder={t('books.notesPlaceholder')}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-display transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-(--accent) text-(--bg-dark) font-display font-bold hover:opacity-90 transition-opacity"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
    </ModalShell>
  )
}
