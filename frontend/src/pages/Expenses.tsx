import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '../components/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CalendarClock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDemoData, DEMO_EXPENSES } from '../context/DemoDataContext'
import { useMonth, inMonth } from '../context/MonthContext'
import { MonthSelector } from '../components/MonthSelector'
import { expensesApi, scheduledExpensesApi } from '../lib/api'
import { useFinanceListsQuery } from '../hooks/useFinanceListsQuery'
import { invalidateFinanceQueries } from '../lib/invalidateFinanceQueries'
import { mergeExpensesWithScheduled } from '../lib/expensesUtils'

const categories = ['Jedzenie', 'Mieszkanie', 'Transport', 'Rozrywka', 'Inne']

export function Expenses() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const demoData = useDemoData()
  const monthCtx = useMonth()
  const {
    expenses: qExpenses,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()
  const [showForm, setShowForm] = useState(false)
  const [showScheduledForm, setShowScheduledForm] = useState(false)
  const loading = isDemoMode ? false : financeLoading

  const selectedMonth = monthCtx?.selectedMonth ?? new Date().getMonth()
  const selectedYear = monthCtx?.selectedYear ?? new Date().getFullYear()

  const allExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const allScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? []) : qScheduled
  const realInMonth = allExpenses.filter((e) => inMonth(e.date, selectedMonth, selectedYear))
  const displayExpenses = mergeExpensesWithScheduled(realInMonth, allScheduled, selectedMonth, selectedYear)
  const total = displayExpenses.reduce((sum, e) => sum + e.amount, 0)

  const handleAdd = async (name: string, amount: number, category: string, date?: string) => {
    const expenseDate = date ?? new Date().toISOString().split('T')[0]
    if (isDemoMode && demoData) {
      demoData.addExpense({ name, amount, category, date: expenseDate })
      return
    }
    try {
      await expensesApi.create({ name, amount, category, date: expenseDate })
      await invalidateFinanceQueries(queryClient, userId)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    if (isDemoMode && demoData) {
      demoData.deleteExpense(id)
      return
    }
    try {
      await expensesApi.delete(id)
      await invalidateFinanceQueries(queryClient, userId)
    } catch {
      // ignore
    }
  }

  const handleAddScheduled = async (
    name: string,
    amount: number,
    category: string,
    dayOfMonth: number
  ) => {
    if (isDemoMode && demoData) {
      demoData.addScheduledExpense({ name, amount, category, dayOfMonth, active: true })
      return
    }
    try {
      await scheduledExpensesApi.create({ name, amount, category, dayOfMonth })
      await invalidateFinanceQueries(queryClient, userId)
    } catch {
      // ignore
    }
  }

  const handleDeleteScheduled = async (id: string) => {
    if (isDemoMode && demoData) {
      demoData.deleteScheduledExpense(id)
      return
    }
    try {
      await scheduledExpensesApi.delete(id)
      await invalidateFinanceQueries(queryClient, userId)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-base text-(--text-muted)">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary) font-gaming tracking-wider">
            WYDATKI
          </h1>
          <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
            {isDemoMode ? 'Dane przykładowe' : 'Śledź swoje wydatki'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MonthSelector />
          <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming tracking-wider hover:bg-(--accent-cyan)/25 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
        </div>
      </div>

      <Card className="border-(--accent-magenta)/20">
        <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Suma w {monthCtx?.monthNames[selectedMonth] ?? ''} {selectedYear}</p>
        <p className="text-2xl font-bold text-(--accent-magenta) font-gaming drop-shadow-[0_0_8px_rgba(255,0,212,0.3)]">
          {total.toFixed(2)} zł
        </p>
      </Card>

      <Card title="Przyszłe wydatki (co miesiąc)" className="border-(--accent-amber)/20">
        <p className="text-base text-(--text-muted) mb-3">
          Wydatki dodawane automatycznie każdego miesiąca w wybranym dniu.
        </p>
        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {allScheduled.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-amber)/20 transition-colors"
              >
                <div>
                  <p className="font-medium text-base">{s.name}</p>
                  <p className="text-base text-(--text-muted)">
                    {s.category} • dzień {s.dayOfMonth} każdego miesiąca
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-base text-(--accent-amber)">
                    -{s.amount.toFixed(2)} zł
                  </span>
                  <button
                    onClick={() => handleDeleteScheduled(s.id)}
                    className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                    title="Usuń z planu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {showScheduledForm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const name = (form.elements.namedItem('schedName') as HTMLInputElement).value
              const amount = parseFloat((form.elements.namedItem('schedAmount') as HTMLInputElement).value)
              const category = (form.elements.namedItem('schedCategory') as HTMLSelectElement).value
              const dayOfMonth = parseInt((form.elements.namedItem('schedDay') as HTMLInputElement).value, 10)
              handleAddScheduled(name, amount, category, dayOfMonth)
              setShowScheduledForm(false)
              form.reset()
            }}
            className="space-y-3 p-3 rounded-lg bg-(--bg-dark) border border-(--border)"
          >
            <div>
              <label className="block text-base text-(--text-muted) mb-1">Nazwa</label>
              <input
                name="schedName"
                required
                className="w-full px-4 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Kwota (zł)</label>
                <input
                  name="schedAmount"
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Dzień miesiąca (1-31)</label>
                <input
                  name="schedDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={1}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Kategoria</label>
                <select
                  name="schedCategory"
                  className="w-full px-4 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent-amber)/15 text-(--accent-amber) border border-(--accent-amber)/40 font-gaming"
              >
                Zapisz
              </button>
              <button
                type="button"
                onClick={() => setShowScheduledForm(false)}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming"
              >
                Anuluj
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowScheduledForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-amber)/15 text-(--accent-amber) border border-(--accent-amber)/40 font-gaming hover:bg-(--accent-amber)/25 transition-colors"
          >
            <CalendarClock className="w-4 h-4" />
            Dodaj przyszły wydatek
          </button>
        )}
      </Card>

      <Card title="Lista wydatków">
        <div className="space-y-2">
          <AnimatePresence>
            {displayExpenses.map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-magenta)/20 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-base">{expense.name}</p>
                    {expense.isScheduled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--accent-amber)/20 text-(--accent-amber) font-mono">
                        zaplanowany
                      </span>
                    )}
                  </div>
                  <p className="text-base text-(--text-muted)">
                    {expense.category} • {expense.date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-base text-(--accent-magenta)">
                    -{expense.amount.toFixed(2)} zł
                  </span>
                  {expense.isScheduled ? (
                    <button
                      onClick={() => expense.scheduledId && handleDeleteScheduled(expense.scheduledId)}
                      className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                      title="Usuń z planu (zniknie we wszystkich miesiącach)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {showForm && (
        <Card title="Nowy wydatek">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const name = (form.elements.namedItem('name') as HTMLInputElement).value
              const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value)
              const category = (form.elements.namedItem('category') as HTMLSelectElement).value
              const date = (form.elements.namedItem('date') as HTMLInputElement)?.value
              handleAdd(name, amount, category, date)
              setShowForm(false)
              form.reset()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-base text-(--text-muted) mb-1">Nazwa</label>
              <input
                name="name"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Data</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Kwota (zł)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) mb-1">Kategoria</label>
                <select
                  name="category"
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming tracking-wider hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all"
            >
              Zapisz
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
