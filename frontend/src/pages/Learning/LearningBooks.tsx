import { useState, useMemo } from 'react'
import { Card } from '../../components/Card'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useLearning } from '../../context/LearningContext'
import { BookModal } from '../../components/BookModal'

const DEFAULT_CATEGORIES = ['Programowanie', 'Biznes', 'Psychologia', 'Rozwój osobisty', 'Inne']

export function LearningBooks() {
  const learning = useLearning()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('Programowanie')
  const [customCategory, setCustomCategory] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [finishedAt, setFinishedAt] = useState(() => new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState('')
  const [editingBook, setEditingBook] = useState<NonNullable<ReturnType<typeof useLearning>>['books'][0] | null>(null)

  const books = learning?.books ?? []
  const bookCategories = learning?.bookCategories ?? []

  const allCategories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES, ...bookCategories]
    return [...new Set(combined)]
  }, [bookCategories])

  if (!learning) return null

  const { addBook, updateBook, deleteBook, addBookCategory } = learning

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = rating ? parseInt(rating, 10) : undefined
    if (!title.trim() || !author.trim()) return
    const cat = category === 'Inne' ? customCategory.trim() : category.trim()
    if (cat && category === 'Inne') addBookCategory(cat)
    addBook({
      title: title.trim(),
      author: author.trim(),
      category: cat || undefined,
      finishedAt,
      rating: r != null && r >= 1 && r <= 5 ? r : undefined,
    })
    setTitle('')
    setAuthor('')
    setCategory('Programowanie')
    setCustomCategory('')
    setFinishedAt(new Date().toISOString().split('T')[0])
    setRating('')
  }

  const booksByCategory = useMemo(() => {
    const byCat: Record<string, typeof books> = {}
    books.forEach((b) => {
      const cat = b.category || 'Bez kategorii'
      if (!byCat[cat]) byCat[cat] = []
      byCat[cat].push(b)
    })
    Object.keys(byCat).forEach((cat) => {
      byCat[cat].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    })
    return byCat
  }, [books])

  return (
    <div className="space-y-6">
      <Card title="Dodaj książkę">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Tytuł</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Autor</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="basis-full">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Kategoria</label>
            <div className="flex flex-wrap gap-2 items-end">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Wpisz kategorię"
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none min-w-[140px]"
                />
              )}
            </div>
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nowa kategoria"
                className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none min-w-[140px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (newCategoryName.trim()) {
                    addBookCategory(newCategoryName.trim())
                    setCategory(newCategoryName.trim())
                    setNewCategoryName('')
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-(--accent-cyan) text-(--accent-cyan) font-gaming text-sm hover:bg-(--accent-cyan)/10 transition-colors disabled:opacity-50"
                disabled={!newCategoryName.trim()}
              >
                <Plus className="w-3.5 h-3.5" />
                Dodaj kategorię
              </button>
            </div>
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Data ukończenia</label>
            <input
              type="date"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Ocena (1-5)</label>
            <input
              type="text"
              inputMode="numeric"
              value={rating}
              onChange={(e) => setRating(e.target.value.replace(/\D/g, ''))}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!title.trim() || !author.trim()}
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </form>
      </Card>

      <Card title="Przeczytane książki">
        {books.length === 0 ? (
          <p className="text-base text-(--text-muted)">Brak książek. Dodaj pierwszą.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(booksByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase mb-2">{cat}</p>
                <div className="space-y-2">
                  {items.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-(--bg-dark)/50 border border-(--border)"
                    >
                      <div>
                        <p className="font-gaming text-(--text-primary)">{b.title}</p>
                        <p className="text-sm text-(--text-muted) mt-0.5">
                          {b.author} • {b.finishedAt}
                          {b.rating != null && ` • ${b.rating}/5`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingBook(b)}
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                          aria-label="Edytuj"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBook(b.id)}
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
                          aria-label="Usuń"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BookModal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        book={editingBook}
        allCategories={allCategories}
        onUpdate={updateBook}
        onDelete={deleteBook}
        addBookCategory={addBookCategory}
      />
    </div>
  )
}
