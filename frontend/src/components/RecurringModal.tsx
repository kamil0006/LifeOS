import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useModalMotion } from '../lib/modalMotion'
import { ExpenseCategoryPicker, DEFAULT_NEW_EXPENSE_CATEGORY_COLOR } from './finance/ExpenseCategoryPicker'
import { EXPENSE_CATEGORY_NONE } from '../lib/expenseCategoryConstants'

interface Category {
  id: string
  name: string
  label: string
  color: string
}

interface RecurringModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; amount: number; category: string; dayOfMonth: number }) => void
  categories: Category[]
  onAddCategory?: (name: string, color: string) => Promise<void>
  onDeleteCategory?: (id: string) => Promise<void>
}

export function RecurringModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  onAddCategory,
  onDeleteCategory,
}: RecurringModalProps) {
  const { backdrop, panel } = useModalMotion()
  const buildInitialForm = useCallback(
    () => ({
      name: '',
      amount: '',
      category: categories[0]?.name ?? EXPENSE_CATEGORY_NONE,
      dayOfMonth: 1,
      showAddCategory: false,
      newCategoryName: '',
      newCategoryColor: DEFAULT_NEW_EXPENSE_CATEGORY_COLOR,
    }),
    [categories]
  )
  const [form, setForm] = useState(buildInitialForm)
  const updateField = <K extends keyof ReturnType<typeof buildInitialForm>>(key: K, value: ReturnType<typeof buildInitialForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (isOpen) setForm(buildInitialForm())
  }, [isOpen, buildInitialForm])

  const { name, amount, category, dayOfMonth, showAddCategory, newCategoryName, newCategoryColor } = form

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!name.trim() || isNaN(amt) || amt <= 0) return
    onSubmit({ name: name.trim(), amount: amt, category: category || EXPENSE_CATEGORY_NONE, dayOfMonth })
    onClose()
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="recurring-backdrop"
            {...backdrop}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12 pointer-events-none">
            <motion.div
              key="recurring-panel"
              {...panel}
              className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
            >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              Nowy stały koszt
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
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Kwota (zł)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  required
                  className="no-spinners w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Dzień miesiąca (1-31)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => updateField('dayOfMonth', Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  required
                  className="no-spinners w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>
            <ExpenseCategoryPicker
              categories={categories}
              category={category}
              onCategoryChange={(v) => updateField('category', v)}
              onDeleteCategory={onDeleteCategory}
              onAddCategory={onAddCategory}
              showAddCategory={showAddCategory}
              setShowAddCategory={(v) => updateField('showAddCategory', v)}
              newCategoryName={newCategoryName}
              setNewCategoryName={(v) => updateField('newCategoryName', v)}
              newCategoryColor={newCategoryColor}
              setNewCategoryColor={(v) => updateField('newCategoryColor', v)}
              onAddedCategory={(normalized) => updateField('category', normalized)}
            />
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
                className="px-4 py-2 rounded-lg bg-(--accent-amber)/15 text-(--accent-amber) border border-(--accent-amber)/40 font-gaming hover:bg-(--accent-amber)/25"
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

  return createPortal(modalContent, document.body)
}
