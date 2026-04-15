import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'

const PRESET_COLORS = [
  '#00ff9d', '#00e5ff', '#ffb800', '#ff00d4', '#e57373', '#64b5f6', '#9d4edd',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8',
  '#a29bfe', '#6c5ce7', '#00b894', '#e17055',
]

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; amount: number; category?: string; date: string }) => void
  type: 'income' | 'expense'
  categories: { id: string; name: string; label: string; color: string }[]
  customCategories?: { id: string; name: string; label: string; color: string }[]
  onAddCategory?: (name: string, color: string) => Promise<void>
  onDeleteCategory?: (id: string) => Promise<void>
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  categories,
  customCategories = [],
  onAddCategory,
  onDeleteCategory,
}: TransactionModalProps) {
  const initialForm = () => ({
    name: '',
    amount: '',
    category: categories[0]?.name ?? 'Inne',
    date: new Date().toISOString().split('T')[0],
    showAddCategory: false,
    newCategoryName: '',
    newCategoryColor: PRESET_COLORS[0],
  })
  const [form, setForm] = useState(initialForm)
  const updateField = <K extends keyof ReturnType<typeof initialForm>>(key: K, value: ReturnType<typeof initialForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (isOpen) setForm(initialForm())
  }, [isOpen, type, categories])

  const { name, amount, category, date, showAddCategory, newCategoryName, newCategoryColor } = form

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = String(amount).replace(/\s/g, '').replace(',', '.')
    const amt = parseFloat(normalized)
    if (!name.trim() || isNaN(amt)) return
    onSubmit({
      name: name.trim(),
      amount: amt,
      category: type === 'expense' ? (category || 'Inne') : undefined,
      date,
    })
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              {type === 'income' ? 'Nowy przychód' : 'Nowy wydatek'}
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
              <label className="block text-base text-(--text-muted) font-gaming mb-1">
                {type === 'income' ? 'Źródło' : 'Nazwa'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Kwota (zł)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => updateField('amount', e.target.value)}
                required
                className="no-spinners w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            {type === 'expense' && (
              <div className="space-y-2">
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Kategoria</label>
                <select
                  value={category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.label}</option>
                  ))}
                </select>
                {customCategories.length > 0 && onDeleteCategory && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-(--text-muted) self-center">Usuń:</span>
                    {customCategories.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm"
                        style={{ backgroundColor: `${c.color}25`, color: c.color }}
                      >
                        {c.label}
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCategory(c.id)
                            if (category === c.name) updateField('category', categories[0]?.name ?? 'Inne')
                          }}
                          className="p-0.5 rounded hover:bg-black/20 text-(--text-muted) hover:text-red-400"
                          title="Usuń kategorię"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {onAddCategory && (
                  <>
                    {!showAddCategory ? (
                      <button
                        type="button"
                        onClick={() => updateField('showAddCategory', true)}
                        className="flex items-center gap-2 text-sm text-(--accent-cyan) hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Dodaj własną kategorię
                      </button>
                    ) : (
                      <div className="p-3 rounded-lg bg-(--bg-dark) border border-(--border) space-y-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => updateField('newCategoryName', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm focus:border-(--accent-cyan) focus:outline-none"
                        />
                        <div className="flex gap-2 flex-wrap items-center">
                          <span className="text-sm text-(--text-muted)">Kolor:</span>
                          {PRESET_COLORS.map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => updateField('newCategoryColor', col)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                newCategoryColor === col ? 'border-(--accent-cyan) scale-110' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: col }}
                              title={col}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (newCategoryName.trim() && onAddCategory) {
                                await onAddCategory(newCategoryName.trim(), newCategoryColor)
                                setForm((f) => ({ ...f, category: f.newCategoryName.trim(), showAddCategory: false, newCategoryName: '' }))
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) text-sm font-gaming"
                          >
                            Zapisz
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, showAddCategory: false, newCategoryName: '' }))}
                            className="px-3 py-1.5 rounded-lg border border-(--border) text-(--text-muted) text-sm"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:text-(--text-primary)"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming hover:opacity-90"
              >
                Zapisz
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
