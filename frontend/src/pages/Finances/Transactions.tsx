import { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Tooltip } from '../../components/Tooltip'
import { TransactionModal } from '../../components/TransactionModal'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { MonthSelector } from '../../components/MonthSelector'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES } from '../../context/DemoDataContext'
import { useFinanceCategories } from '../../context/FinanceCategoriesContext'
import { mergeExpensesWithScheduled } from '../../lib/expensesUtils'
import { useMonth, inMonth } from '../../context/MonthContext'
import { expensesApi, incomeApi, scheduledExpensesApi } from '../../lib/api'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'
import { invalidateFinanceQueries } from '../../lib/invalidateFinanceQueries'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

type FilterType = 'all' | 'income' | 'expense'

interface Transaction {
  id: string
  date: string
  name: string
  category: string
  amount: number
  type: 'income' | 'expense'
  isScheduled?: boolean
  scheduledId?: string
}

export function Transactions() {
  const { isDemoMode, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const demoData = useDemoData()
  const financeCats = useFinanceCategories()
  const monthCtx = useMonth()
  const [filter, setFilter] = useState<FilterType>('all')
  const {
    expenses: qExpenses,
    income: qIncome,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const loading = isDemoMode ? false : financeLoading
  const wasLoadingRef = useRef(loading)

  const selectedMonth = monthCtx?.selectedMonth ?? new Date().getMonth()
  const selectedYear = monthCtx?.selectedYear ?? new Date().getFullYear()

  const effectiveExpenses = isDemoMode ? (demoData?.expenses ?? DEMO_EXPENSES) : qExpenses
  const effectiveScheduled = isDemoMode ? (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES) : qScheduled
  const effectiveIncome = isDemoMode ? (demoData?.income ?? DEMO_INCOME) : qIncome

  const transactions = useMemo((): Transaction[] => {
    const monthExp = effectiveExpenses.filter((e) => inMonth(e.date, selectedMonth, selectedYear))
    const merged = mergeExpensesWithScheduled(monthExp, effectiveScheduled, selectedMonth, selectedYear)
    const monthInc = effectiveIncome.filter((i) => inMonth(i.date, selectedMonth, selectedYear))

    const expenseTx: Transaction[] = merged.map((e) => ({
      id: e.id,
      date: e.date,
      name: e.name,
      category: e.category,
      amount: -e.amount,
      type: 'expense',
      isScheduled: e.isScheduled,
      scheduledId: e.scheduledId,
    }))

    const incomeTx: Transaction[] = monthInc.map((i) => ({
      id: i.id,
      date: i.date,
      name: i.source,
      category: 'Dochód',
      amount: i.amount,
      type: 'income',
    }))

    return [...expenseTx, ...incomeTx].sort((a, b) => b.date.localeCompare(a.date))
  }, [effectiveExpenses, effectiveScheduled, effectiveIncome, selectedMonth, selectedYear])

  const filteredTransactions = useMemo(() => {
    if (filter === 'income') return transactions.filter((t) => t.type === 'income')
    if (filter === 'expense') return transactions.filter((t) => t.type === 'expense')
    return transactions
  }, [transactions, filter])

  useEffect(() => {
    setFilter('all')
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      setFilter('all')
    }
    wasLoadingRef.current = loading
  }, [loading])

  const categoriesForModal = financeCats?.categories.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    color: c.color,
  })) ?? [{ id: 'Inne', name: 'Inne', label: 'Inne', color: '#9d4edd' }]
  const customCategoriesForModal = financeCats?.customCategories.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    color: c.color,
  })) ?? []
  const getColor = financeCats?.getColor ?? (() => '#9d4edd')
  const getLabel = financeCats?.getLabel ?? ((s: string) => s)

  const handleDelete = async (tx: Transaction) => {
    if (tx.type === 'income') {
      if (isDemoMode && demoData) demoData.deleteIncome(tx.id)
      else {
        await incomeApi.delete(tx.id)
        await invalidateFinanceQueries(queryClient, userId)
      }
    } else if (tx.isScheduled && tx.scheduledId) {
      if (isDemoMode && demoData) demoData.deleteScheduledExpense(tx.scheduledId)
      else {
        await scheduledExpensesApi.delete(tx.scheduledId)
        await invalidateFinanceQueries(queryClient, userId)
      }
    } else {
      if (isDemoMode && demoData) demoData.deleteExpense(tx.id)
      else {
        await expensesApi.delete(tx.id)
        await invalidateFinanceQueries(queryClient, userId)
      }
    }
  }

  const handleAdd = async (data: { name: string; amount: number; category?: string; date: string }) => {
    const date = data.date ?? new Date().toISOString().split('T')[0]
    try {
      if (formType === 'income') {
        if (isDemoMode) {
          if (demoData) {
            demoData.addIncome({ source: data.name, amount: data.amount, date, recurring: false })
          } else {
            console.warn('DemoDataProvider brak – przychód nie został zapisany')
          }
        } else {
          await incomeApi.create({ source: data.name, amount: data.amount, date })
          await invalidateFinanceQueries(queryClient, userId)
        }
      } else {
        if (isDemoMode) {
          if (demoData) {
            demoData.addExpense({ name: data.name, amount: data.amount, category: data.category ?? 'Inne', date })
          } else {
            console.warn('DemoDataProvider brak – wydatek nie został zapisany')
          }
        } else {
          await expensesApi.create({ name: data.name, amount: data.amount, category: data.category ?? 'Inne', date })
          await invalidateFinanceQueries(queryClient, userId)
        }
      }
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Nie udało się zapisać transakcji')
      return
    }
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center min-h-[200px] items-center text-base text-(--text-muted)">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <MonthSelector />
        <div className="flex gap-2">
          <Tooltip content="Dodaj przychód">
            <button
              onClick={() => {
                setFormType('income')
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming tracking-wider hover:bg-(--accent-green)/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Przychód
            </button>
          </Tooltip>
          <Tooltip content="Dodaj wydatek">
            <button
              onClick={() => {
                setFormType('expense')
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-magenta)/15 text-(--accent-magenta) border border-(--accent-magenta)/40 font-gaming tracking-wider hover:bg-(--accent-magenta)/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Wydatek
            </button>
          </Tooltip>
        </div>
      </div>

      <Card>
        <h3 className="text-base font-semibold text-(--text-primary) mb-4 font-gaming tracking-wider">Transakcje</h3>

        <div className="flex gap-2 mb-4">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-gaming text-sm transition-all ${
                filter === f
                  ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                  : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:text-(--text-primary)'
              }`}
            >
              {f === 'all' ? 'Wszystkie' : f === 'income' ? 'Przychody' : 'Wydatki'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--border)">
                <th className="pb-3 text-base text-(--text-muted) font-gaming">Data</th>
                <th className="pb-3 text-base text-(--text-muted) font-gaming">Nazwa</th>
                <th className="pb-3 text-base text-(--text-muted) font-gaming">Kategoria</th>
                <th className="pb-3 text-base text-(--text-muted) font-gaming text-right">Kwota</th>
                <th className="pb-3 w-10" />
              </tr>
            </thead>
            <tbody key={`${selectedMonth}-${selectedYear}`}>
              {filteredTransactions.map((tx) => {
                const color = getColor(tx.category)
                return (
                  <tr
                    key={`${tx.type}-${tx.id}`}
                    className="border-b border-(--border)/50 hover:bg-(--bg-dark)/50"
                  >
                    <td className="py-3 text-base font-mono text-(--text-primary)">{tx.date}</td>
                    <td className="py-3 text-base text-(--text-primary) font-medium">{tx.name}</td>
                    <td className="py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-sm"
                        style={{ backgroundColor: `${color}25`, color }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {getLabel(tx.category)}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-base font-mono text-right font-medium ${
                        tx.amount >= 0 ? 'text-(--accent-green)' : 'text-(--accent-magenta)'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('pl-PL')} zł
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(tx)}
                        className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Brak transakcji"
            description={`W wybranym okresie (${monthNames[selectedMonth]} ${selectedYear}) nie ma ${filter === 'income' ? 'przychodów' : filter === 'expense' ? 'wydatków' : 'transakcji'}.`}
            action={
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj transakcję
              </button>
            }
          />
        )}
      </Card>

      <TransactionModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleAdd}
        type={formType}
        categories={categoriesForModal}
        customCategories={customCategoriesForModal}
        onAddCategory={financeCats?.addCategory}
        onDeleteCategory={financeCats?.deleteCategory}
      />
    </div>
  )
}
