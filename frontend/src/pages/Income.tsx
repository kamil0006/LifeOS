import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '../components/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDemoData, DEMO_INCOME } from '../context/DemoDataContext'
import { useMonth, inMonth } from '../context/MonthContext'
import { MonthSelector } from '../components/MonthSelector'
import { incomeApi } from '../lib/api'
import { useFinanceListsQuery } from '../hooks/useFinanceListsQuery'
import { invalidateFinanceQueries } from '../lib/invalidateFinanceQueries'

export function Income() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const demoData = useDemoData()
  const monthCtx = useMonth()
  const { income: qIncome, isLoading: financeLoading } = useFinanceListsQuery()
  const [showForm, setShowForm] = useState(false)
  const loading = isDemoMode ? false : financeLoading

  const selectedMonth = monthCtx?.selectedMonth ?? new Date().getMonth()
  const selectedYear = monthCtx?.selectedYear ?? new Date().getFullYear()

  const allIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome
  const displayIncome = allIncome.filter((i) => inMonth(i.date, selectedMonth, selectedYear))
  const total = displayIncome.reduce((sum, i) => sum + i.amount, 0)

  const handleAdd = async (source: string, amount: number, recurring: boolean, date?: string) => {
    const incomeDate = date ?? new Date().toISOString().split('T')[0]
    if (isDemoMode && demoData) {
      demoData.addIncome({ source, amount, date: incomeDate, recurring })
      return
    }
    try {
      await incomeApi.create({ source, amount, date: incomeDate, recurring })
      await invalidateFinanceQueries(queryClient, userId)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    if (isDemoMode && demoData) {
      demoData.deleteIncome(id)
      return
    }
    try {
      await incomeApi.delete(id)
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
          <h1 className="text-2xl font-bold text-(--text-primary) font-gaming tracking-wider">PRZYCHODY</h1>
          <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
            {isDemoMode ? 'Dane przykładowe' : 'Źródła i historia przychodów'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MonthSelector />
          <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming tracking-wider hover:bg-(--accent-green)/25 hover:shadow-[0_0_15px_rgba(0,255,157,0.2)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
        </div>
      </div>

      <Card className="border-(--accent-green)/20">
        <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Suma w {monthCtx?.monthNames[selectedMonth] ?? ''} {selectedYear}</p>
        <p className="text-2xl font-bold text-(--accent-green) font-gaming drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]">{total.toFixed(2)} zł</p>
      </Card>

      <Card title="Lista przychodów">
        <div className="space-y-2">
          <AnimatePresence>
            {displayIncome.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-green)/20 transition-colors"
              >
                <div>
                  <p className="font-medium text-base">{item.source}</p>
                  <p className="text-base text-(--text-muted)">
                    {item.date}
                    {item.recurring && (
                      <span className="ml-2 text-(--accent-cyan)">• Stały</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-base text-(--accent-green)">
                    +{item.amount.toFixed(2)} zł
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {showForm && (
        <Card title="Nowy przychód">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const source = (form.elements.namedItem('source') as HTMLInputElement).value
              const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value)
              const recurring = (form.elements.namedItem('recurring') as HTMLInputElement).checked
              const date = (form.elements.namedItem('date') as HTMLInputElement)?.value
              handleAdd(source, amount, recurring, date)
              setShowForm(false)
              form.reset()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-base text-(--text-muted) mb-1">Źródło</label>
              <input
                name="source"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="recurring" type="checkbox" className="rounded" />
              <span className="text-base text-(--text-muted)">Stały przychód (co miesiąc)</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming tracking-wider hover:shadow-[0_0_12px_rgba(0,255,157,0.2)] transition-all"
            >
              Zapisz
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
