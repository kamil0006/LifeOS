import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/Card'
import { RecurringModal } from '../../components/RecurringModal'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarClock, Pause, Play, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_SCHEDULED_EXPENSES } from '../../context/DemoDataContext'
import { useFinanceCategories } from '../../context/FinanceCategoriesContext'
import { scheduledExpensesApi } from '../../lib/api'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'
import { useFinanceUsesApi } from '../../hooks/useFinanceUsesApi'
import { FinanceListPageSkeleton } from '../../components/skeletons'
import { invalidateFinanceQueries } from '../../lib/invalidateFinanceQueries'

export function Recurring() {
  const { user } = useAuth()
  const useApiFinance = useFinanceUsesApi()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const demoData = useDemoData()
  const { categories, getColor, addCategory, deleteCategory } = useFinanceCategories()
  const [showForm, setShowForm] = useState(false)
  const { scheduledExpenses: qScheduled, isLoading: financeLoading } = useFinanceListsQuery()
  const loading = useApiFinance ? financeLoading : false

  const allScheduled = useApiFinance ? qScheduled : (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES)
  const total = allScheduled.reduce((s, e) => s + e.amount, 0)
  const annualTotal = total * 12

  const nextPaymentLabel = (dayOfMonth: number) => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth(), Math.min(dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()))
    if (target < now) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()))
      return next.toLocaleDateString('pl-PL')
    }
    return target.toLocaleDateString('pl-PL')
  }

  const handleAdd = async (data: { name: string; amount: number; category: string; dayOfMonth: number }) => {
    if (!useApiFinance && demoData) {
      demoData.addScheduledExpense({ ...data, active: true, pausedUntil: null, reminderDaysBefore: null })
    } else {
      await scheduledExpensesApi.create(data)
      await invalidateFinanceQueries(queryClient, userId)
    }
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!useApiFinance && demoData) {
      demoData.deleteScheduledExpense(id)
    } else {
      await scheduledExpensesApi.delete(id)
      await invalidateFinanceQueries(queryClient, userId)
    }
  }

  const handleUpdate = async (
    id: string,
    updates: {
      active?: boolean
      pausedUntil?: string | null
      reminderDaysBefore?: number | null
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
    <div className="space-y-6">
      <Card className="border-(--accent-amber)/20">
        <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Suma miesięczna</p>
        <p className="text-2xl font-bold text-(--accent-amber) mt-1 font-gaming drop-shadow-[0_0_8px_rgba(255,184,0,0.3)]">
          {total.toLocaleString('pl-PL')} zł
        </p>
        <p className="text-base text-(--text-muted) mt-1">Rocznie: {annualTotal.toLocaleString('pl-PL')} zł</p>
      </Card>

      <Card title="Subskrypcje i stałe koszty">
        <p className="text-base text-(--text-muted) mb-4">
          Wydatki dodawane automatycznie każdego miesiąca w wybranym dniu.
        </p>
        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {allScheduled.map((s) => {
              const color = getColor(s.category)
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-amber)/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <p className="font-medium text-base text-(--text-primary)">{s.name}</p>
                      <p className="text-base text-(--text-muted)">
                        {s.category} • dzień {s.dayOfMonth} każdego miesiąca
                      </p>
                      <p className="text-sm text-(--text-muted) mt-0.5 inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Następna płatność: {nextPaymentLabel(s.dayOfMonth)}
                      </p>
                      {s.pausedUntil && <p className="text-sm text-(--text-muted)">Wstrzymane do: {s.pausedUntil.slice(0, 10)}</p>}
                      <p className="text-sm text-(--text-muted)">
                        Przypomnienie: {s.reminderDaysBefore != null ? `${s.reminderDaysBefore} dni przed` : 'wyłączone'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdate(s.id, { active: !s.active })}
                      className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                      title={s.active ? 'Wyłącz koszt' : 'Włącz koszt'}
                    >
                      {s.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <input
                      type="date"
                      value={s.pausedUntil ? s.pausedUntil.slice(0, 10) : ''}
                      onChange={(e) => {
                        void handleUpdate(s.id, { pausedUntil: e.target.value || null, active: e.target.value ? false : s.active })
                      }}
                      className="px-2 py-1 rounded-lg bg-(--bg-card) border border-(--border) text-xs text-(--text-muted)"
                      title="Pauza do daty"
                    />
                    <input
                      type="number"
                      min={0}
                      max={31}
                      value={s.reminderDaysBefore ?? ''}
                      onChange={(e) => void handleUpdate(s.id, { reminderDaysBefore: e.target.value === '' ? null : Number(e.target.value) })}
                      className="no-spinners w-16 px-2 py-1 rounded-lg bg-(--bg-card) border border-(--border) text-xs text-(--text-muted)"
                      placeholder="dni"
                      title="Przypomnienie (dni przed)"
                    />
                    <span className="font-mono text-base text-(--accent-amber)">
                      -{s.amount.toLocaleString('pl-PL')} zł
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
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
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-amber)/15 text-(--accent-amber) border border-(--accent-amber)/40 font-gaming hover:bg-(--accent-amber)/25 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Dodaj subskrypcję / stały koszt
        </button>

        <RecurringModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleAdd}
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />
      </Card>
    </div>
  )
}
