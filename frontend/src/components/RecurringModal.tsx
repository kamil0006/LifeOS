import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import { ExpenseCategoryPicker, DEFAULT_NEW_EXPENSE_CATEGORY_COLOR } from './finance/ExpenseCategoryPicker'
import { EXPENSE_CATEGORY_NONE } from '../lib/expenseCategoryConstants'

function leadingUpperPl(s: string) {
  const t = s.trim()
  if (!t) return ''
  return t[0].toLocaleUpperCase('pl-PL') + t.slice(1)
}

export type RecurringFormPayload = {
  name: string
  amount: number
  category: string
  dayOfMonth: number
}

export type RecurringModalEditing = {
  id: string
  name: string
  amount: number
  category: string
  dayOfMonth: number
}

interface Category {
  id: string
  name: string
  label: string
  color: string
}

interface RecurringModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RecurringFormPayload) => void | Promise<void>
  onUpdate?: (id: string, data: RecurringFormPayload) => void | Promise<void>
  editing?: RecurringModalEditing | null
  categories: Category[]
  onAddCategory?: (name: string, color: string) => Promise<void>
  onDeleteCategory?: (id: string) => Promise<void>
}

export function RecurringModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editing,
  categories,
  onAddCategory,
  onDeleteCategory,
}: RecurringModalProps) {
  const buildInitialForm = useCallback(
    () => ({
      name: '',
      amount: '',
      category: categories[0]?.name ?? EXPENSE_CATEGORY_NONE,
      dayOfMonthStr: '',
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
    if (!isOpen) return
    if (editing) {
      setForm({
        name: leadingUpperPl(editing.name),
        amount: String(editing.amount),
        category: editing.category,
        dayOfMonthStr: String(editing.dayOfMonth),
        showAddCategory: false,
        newCategoryName: '',
        newCategoryColor: DEFAULT_NEW_EXPENSE_CATEGORY_COLOR,
      })
    } else {
      setForm(buildInitialForm())
    }
  }, [isOpen, editing, buildInitialForm])

  const { name, amount, category, dayOfMonthStr, showAddCategory, newCategoryName, newCategoryColor } = form

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    const day = parseInt(dayOfMonthStr.trim(), 10)
    const displayName = leadingUpperPl(name)
    if (!displayName || isNaN(amt) || amt <= 0 || isNaN(day) || day < 1 || day > 31) return
    const payload: RecurringFormPayload = {
      name: displayName,
      amount: amt,
      category: category || EXPENSE_CATEGORY_NONE,
      dayOfMonth: day,
    }
    if (editing && onUpdate) {
      await onUpdate(editing.id, payload)
    } else {
      await onSubmit(payload)
    }
    onClose()
  }

  const isEdit = Boolean(editing)

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      backdropKey="recurring-backdrop"
      panelKey="recurring-panel"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-(--text-primary) font-gaming">
          {isEdit ? 'Edytuj stały koszt' : 'Nowy stały koszt'}
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
            onChange={(e) => {
              const v = e.target.value
              updateField('name', v.length ? v[0].toLocaleUpperCase('pl-PL') + v.slice(1) : '')
            }}
            required
            autoFocus={!isEdit}
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={dayOfMonthStr}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
                updateField('dayOfMonthStr', digits)
              }}
              placeholder=""
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
            {isEdit ? 'Zapisz zmiany' : 'Zapisz'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
