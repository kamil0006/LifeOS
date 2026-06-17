import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { RecurringModal } from '../../components/RecurringModal'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarClock, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_SCHEDULED_EXPENSES } from '../../context/DemoDataContext'
import { useFinanceCategories } from '../../context/FinanceCategoriesContext'
import { scheduledExpensesApi } from '../../lib/api'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'
import { useFinanceUsesApi } from '../../hooks/useFinanceUsesApi'
import { FinanceListPageSkeleton } from '../../components/skeletons'
import { invalidateFinanceQueries } from '../../lib/invalidateFinanceQueries'
import type { ScheduledExpenseRow } from '../../lib/financeTypes'

/** Kolejna data płatności (ta sama logika co dotychczasowy podgląd daty). */
function getNextPaymentDate(dayOfMonth: number): Date {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const target = new Date(y, m, Math.min(dayOfMonth, new Date(y, m + 1, 0).getDate()))
  if (target < now) {
    return new Date(y, m + 1, Math.min(dayOfMonth, new Date(y, m + 2, 0).getDate()))
  }
  return target
}

type RecurringSortBy = 'payment' | 'amount' | 'category'

export function Recurring() {
  const { user } = useAuth()
  const useApiFinance = useFinanceUsesApi()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const demoData = useDemoData()
  const { categories, getColor, addCategory, deleteCategory } = useFinanceCategories()
  const [recurringModalOpen, setRecurringModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<ScheduledExpenseRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduledExpenseRow | null>(null)
  const [sortBy, setSortBy] = useState<RecurringSortBy>('payment')

  const closeRecurringModal = () => {
    setRecurringModalOpen(false)
    setEditingRecurring(null)
  }
  const { scheduledExpenses: qScheduled, isLoading: financeLoading } = useFinanceListsQuery()
  const loading = useApiFinance ? financeLoading : false

  const allScheduled = useApiFinance ? qScheduled : (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES)
  const total = allScheduled.reduce((s, e) => s + e.amount, 0)
  const annualTotal = total * 12

  const nextPaymentLabel = (dayOfMonth: number) => getNextPaymentDate(dayOfMonth).toLocaleDateString('pl-PL')

  const sortedScheduled = useMemo(() => {
    const list = [...allScheduled]
    list.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      if (sortBy === 'payment')
        return (
          getNextPaymentDate(a.dayOfMonth).getTime() - getNextPaymentDate(b.dayOfMonth).getTime() ||
          a.name.localeCompare(b.name, 'pl')
        )
      if (sortBy === 'amount')
        return b.amount - a.amount || a.name.localeCompare(b.name, 'pl')
      return a.category.localeCompare(b.category, 'pl') || a.name.localeCompare(b.name, 'pl')
    })
    return list
  }, [allScheduled, sortBy])

  const sortButtonClass = (key: RecurringSortBy) =>
    `rounded-lg border px-3 py-2 text-sm font-gaming transition-colors ${
      sortBy === key
        ? 'border-(--accent-amber)/45 bg-(--accent-amber)/15 text-(--accent-amber)'
        : 'border-(--border) bg-(--bg-dark) text-(--text-muted) hover:border-(--accent-amber)/25 hover:text-(--text-primary)'
    }`

  const handleAdd = async (data: { name: string; amount: number; category: string; dayOfMonth: number }) => {
    if (!useApiFinance && demoData) {
      demoData.addScheduledExpense({ ...data, active: true, pausedUntil: null, reminderDaysBefore: null })
    } else {
      await scheduledExpensesApi.create(data)
      await invalidateFinanceQueries(queryClient, userId)
    }
    closeRecurringModal()
  }

  const handleDelete = async (id: string) => {
    if (!useApiFinance && demoData) {
      demoData.deleteScheduledExpense(id)
    } else {
      await scheduledExpensesApi.delete(id)
      await invalidateFinanceQueries(queryClient, userId)
    }
  }

  const runConfirmedDelete = () => {
    const t = deleteTarget
    setDeleteTarget(null)
    if (!t) return
    if (editingRecurring?.id === t.id) closeRecurringModal()
    void handleDelete(t.id)
  }

  const handleUpdate = async (
    id: string,
    updates: {
      active?: boolean
      pausedUntil?: string | null
      reminderDaysBefore?: number | null
      name?: string
      amount?: number
      category?: string
      dayOfMonth?: number
    }
  ) => {
    if (!useApiFinance && demoData) demoData.updateScheduledExpense(id, updates)
    else {
      await scheduledExpensesApi.update(id, updates)
      await invalidateFinanceQueries(queryClient, userId)
    }
  }

  if (loading) {
    return <FinanceListPageSkeleton rows={5} />
  }

  return (
    <div className="space-y-5">
      <Card className="border-(--accent-amber)/20 max-md:p-4">
        <p className="text-base text-(--text-muted)">Suma miesięczna</p>
        <p className="mt-1 text-2xl font-bold font-gaming text-(--accent-amber)">
          {total.toLocaleString('pl-PL')} zł
        </p>
        <p className="mt-1 text-sm text-(--text-muted) sm:text-base">Rocznie: {annualTotal.toLocaleString('pl-PL')} zł</p>
      </Card>

      <Card title="Subskrypcje i stałe koszty" className="max-md:p-4">
        <p className="mb-4 text-base text-(--text-muted)">
          Wydatki dodawane automatycznie każdego miesiąca w wybranym dniu.
        </p>
        <label className="mb-4 flex flex-col gap-1.5 md:hidden">
          <span className="text-base text-(--text-muted)">Sortuj</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RecurringSortBy)}
            className="min-h-11 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-amber)/50 focus:outline-none"
          >
            <option value="payment">Najbliższa płatność</option>
            <option value="amount">Kwota</option>
            <option value="category">Kategoria</option>
          </select>
        </label>
        <div className="mb-4 hidden flex-wrap items-center gap-2 md:flex">
          <span className="text-base text-(--text-muted)">Sortuj:</span>
          <button type="button" className={sortButtonClass('payment')} onClick={() => setSortBy('payment')}>
            Najbliższa płatność
          </button>
          <button type="button" className={sortButtonClass('amount')} onClick={() => setSortBy('amount')}>
            Kwota
          </button>
          <button type="button" className={sortButtonClass('category')} onClick={() => setSortBy('category')}>
            Kategoria
          </button>
        </div>
        <div className="mb-4 space-y-3">
          <AnimatePresence>
            {sortedScheduled.map((s) => {
              const color = getColor(s.category)
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3 rounded-lg border border-(--border) bg-(--bg-dark) p-3.5 transition-colors hover:border-(--accent-amber)/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-3"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className="mt-1.5 h-3 w-3 shrink-0 rounded-full sm:mt-2"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-(--text-primary)">{s.name}</p>
                      <p className="text-sm text-(--text-muted) sm:text-base">
                        {s.category} · dzień {s.dayOfMonth}
                      </p>
                      <p className="mt-1.5 font-mono text-lg tabular-nums leading-none text-(--accent-amber)">
                        −{s.amount.toLocaleString('pl-PL')} zł{' '}
                        <span className="text-sm font-sans font-normal text-(--text-muted)">/ mies.</span>
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-(--text-muted)">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                        Następna: {nextPaymentLabel(s.dayOfMonth)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-(--border)/50 pt-2.5 sm:flex-none sm:border-0 sm:pt-0">
                    <button
                      type="button"
                      onClick={() =>
                        void handleUpdate(s.id, { active: !s.active, pausedUntil: null })
                      }
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-(--border) bg-(--bg-card) px-3 text-sm text-(--text-primary) font-gaming shadow-sm hover:border-(--accent-cyan)/45 hover:bg-(--accent-cyan)/12 hover:text-(--accent-cyan) transition-colors"
                      title={s.active ? 'Wstrzymaj stały koszt' : 'Wznów stały koszt'}
                    >
                      {s.active ? <Pause className="h-4 w-4 shrink-0" /> : <Play className="h-4 w-4 shrink-0" />}
                      <span>{s.active ? 'Pauza' : 'Wznów'}</span>
                    </button>
                    <div
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-(--border) bg-(--bg-card) px-2.5"
                      title="Przypomnienie X dni przed płatnością"
                    >
                      <span className="whitespace-nowrap text-base text-(--text-muted)">Przypomnij:</span>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={s.reminderDaysBefore ?? ''}
                        onChange={(e) =>
                          void handleUpdate(s.id, {
                            reminderDaysBefore: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="no-spinners h-7 w-10 rounded bg-(--bg-dark) border border-(--border) px-1 text-center text-base text-(--text-primary) focus:border-(--accent-cyan) focus:outline-none"
                        aria-label="Liczba dni przed płatnością"
                      />
                      <span className="whitespace-nowrap text-base text-(--text-muted)">dni</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecurring(s)
                        setRecurringModalOpen(true)
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-(--text-muted) hover:bg-(--accent-amber)/10 hover:text-(--accent-amber) transition-colors"
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-(--text-muted) hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRecurring(null)
            setRecurringModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-amber)/15 text-(--accent-amber) border border-(--accent-amber)/40 font-gaming hover:bg-(--accent-amber)/25 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Dodaj subskrypcję / stały koszt
        </button>

        <RecurringModal
          isOpen={recurringModalOpen}
          onClose={closeRecurringModal}
          onSubmit={handleAdd}
          onUpdate={async (id, data) => {
            await handleUpdate(id, data)
          }}
          editing={
            editingRecurring
              ? {
                  id: editingRecurring.id,
                  name: editingRecurring.name,
                  amount: editingRecurring.amount,
                  category: editingRecurring.category,
                  dayOfMonth: editingRecurring.dayOfMonth,
                }
              : null
          }
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />

        <ConfirmDialog
          isOpen={deleteTarget != null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={runConfirmedDelete}
          title="Usunąć?"
          description="Stały koszt zostanie usunięty z listy. Tej operacji nie można cofnąć."
          emphasis={deleteTarget?.name}
          variant="danger"
          confirmLabel="Usuń"
          cancelLabel="Anuluj"
        />
      </Card>
    </div>
  )
}
