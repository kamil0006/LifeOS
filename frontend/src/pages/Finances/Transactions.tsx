import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { ArrowDownAZ, ArrowUpAZ, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Tooltip } from '../../components/Tooltip'
import { TransactionModal } from '../../components/TransactionModal'
import { MonthSelector } from '../../components/MonthSelector'
import { useAuth } from '../../context/AuthContext'
import { useDemoData, DEMO_EXPENSES, DEMO_INCOME, DEMO_SCHEDULED_EXPENSES } from '../../context/DemoDataContext'
import { useFinanceCategories } from '../../context/FinanceCategoriesContext'
import { useMonth } from '../../context/MonthContext'
import { expensesApi, incomeApi, scheduledExpensesApi } from '../../lib/api'
import { useFinanceListsQuery } from '../../hooks/useFinanceListsQuery'
import { useFinanceUsesApi } from '../../hooks/useFinanceUsesApi'
import { useTransactionsList, type Transaction } from '../../hooks/useTransactionsList'
import { capitalizeFirstPl } from '../../lib/capitalizeFirst'
import { EXPENSE_CATEGORY_NONE, EXPENSE_CATEGORY_DISPLAY_NONE } from '../../lib/expenseCategoryConstants'
import { invalidateFinanceQueries } from '../../lib/invalidateFinanceQueries'
import { useFinanceTransactionSubmit } from '../../hooks/useFinanceTransactionSubmit'
import { TransactionsPageSkeleton } from '../../components/skeletons'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useUndoDelete } from '../../components/learning/UndoToast'

type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

export function Transactions() {
  const { user } = useAuth()
  const useApiFinance = useFinanceUsesApi()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''
  const demoData = useDemoData()
  const { categories: finCats, getColor, getLabel, addCategory, deleteCategory } = useFinanceCategories()
  const monthCtx = useMonth()
  const {
    expenses: qExpenses,
    income: qIncome,
    scheduledExpenses: qScheduled,
    isLoading: financeLoading,
  } = useFinanceListsQuery()
  const { submit: submitTransaction, submitUpdate } = useFinanceTransactionSubmit()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date_desc')
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null)
  const loading = useApiFinance ? financeLoading : false
  const pendingDeleteRef = useRef<Record<string, Transaction>>({})

  const selectedMonth = monthCtx?.selectedMonth ?? new Date().getMonth()
  const selectedYear = monthCtx?.selectedYear ?? new Date().getFullYear()

  const effectiveExpenses = useApiFinance ? qExpenses : (demoData?.expenses ?? DEMO_EXPENSES)
  const effectiveScheduled = useApiFinance ? qScheduled : (demoData?.scheduledExpenses ?? DEMO_SCHEDULED_EXPENSES)
  const effectiveIncome = useApiFinance ? qIncome : (demoData?.income ?? DEMO_INCOME)

  const {
    filteredTransactions,
    setFilter,
    tabFilter,
    typeFilter,
    drillCategory,
    dateRange,
    clearDrilldown,
    periodLabel,
  } = useTransactionsList({
    effectiveExpenses,
    effectiveScheduled,
    effectiveIncome,
    selectedMonth,
    selectedYear,
    loading,
    monthCtx,
  })

  const categoriesForModal = finCats.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    color: c.color,
  }))

  const commitDelete = async (key: string) => {
    const tx = pendingDeleteRef.current[key]
    if (!tx) return
    if (tx.type === 'income') {
      if (!useApiFinance && demoData) demoData.deleteIncome(tx.id)
      else {
        await incomeApi.delete(tx.id)
        await invalidateFinanceQueries(queryClient, userId)
      }
    } else if (tx.isScheduled && tx.scheduledId) {
      if (!useApiFinance && demoData) demoData.deleteScheduledExpense(tx.scheduledId)
      else {
        await scheduledExpensesApi.delete(tx.scheduledId)
        await invalidateFinanceQueries(queryClient, userId)
      }
    } else if (!useApiFinance && demoData) demoData.deleteExpense(tx.id)
    else {
      await expensesApi.delete(tx.id)
      await invalidateFinanceQueries(queryClient, userId)
    }
    delete pendingDeleteRef.current[key]
  }

  const { pendingId, toast, scheduleDelete } = useUndoDelete<{ id: string }>((key) => {
    void commitDelete(key)
  })

  const handleCreate = async (data: { name: string; amount: number; category?: string; date: string }) => {
    await submitTransaction(formType, data)
    setShowForm(false)
  }

  const handleModalSubmit = async (data: { name: string; amount: number; category?: string; date: string }) => {
    if (!editingTx) {
      await handleCreate(data)
      return
    }
    try {
      if (
        editingTx.type === 'expense' &&
        editingTx.isScheduled &&
        editingTx.scheduledId
      ) {
        const rawDay = parseInt(data.date.split('-')[2] ?? '1', 10)
        const dayOfMonth = Number.isFinite(rawDay) ? Math.min(31, Math.max(1, rawDay)) : 1
        if (!useApiFinance && demoData) {
          demoData.updateScheduledExpense(editingTx.scheduledId, {
            name: data.name,
            amount: data.amount,
            category: data.category ?? EXPENSE_CATEGORY_NONE,
            dayOfMonth,
          })
        } else {
          await scheduledExpensesApi.update(editingTx.scheduledId, {
            name: data.name,
            amount: data.amount,
            category: data.category ?? EXPENSE_CATEGORY_NONE,
            dayOfMonth,
          })
          await invalidateFinanceQueries(queryClient, userId)
        }
      } else {
        await submitUpdate(editingTx.type, editingTx.id, data)
      }
    } catch (err) {
      console.error(err)
      throw err instanceof Error ? err : new Error('Nie udało się zaktualizować transakcji')
    }
    setShowForm(false)
    setEditingTx(null)
  }

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setFormType(tx.type)
    setShowForm(true)
  }

  const handleDeleteRequest = (tx: Transaction) => {
    setDeleteConfirmTx(tx)
  }

  const runConfirmedDelete = () => {
    const tx = deleteConfirmTx
    setDeleteConfirmTx(null)
    if (!tx) return
    const key = `${tx.type}:${tx.id}`
    pendingDeleteRef.current[key] = tx
    scheduleDelete({ id: key }, tx.name)
  }

  const categoryFilterLabel = useCallback(
    (cat: string) => {
      if (cat === 'all') return 'Wszystkie kategorie'
      if (cat === EXPENSE_CATEGORY_NONE) return 'Brak kategorii'
      return getLabel(cat)
    },
    [getLabel]
  )

  const categoryOptions = useMemo(() => {
    const fromTx = new Set(
      filteredTransactions.filter((tx) => tx.type === 'expense').map((tx) => tx.category)
    )
    const activeNames = new Set(finCats.map((c) => c.name))
    const filtered = Array.from(fromTx).filter(
      (c) => c === EXPENSE_CATEGORY_NONE || activeNames.has(c)
    )
    const sorted = filtered.sort((a, b) => {
      if (a === EXPENSE_CATEGORY_NONE && b !== EXPENSE_CATEGORY_NONE) return -1
      if (b === EXPENSE_CATEGORY_NONE && a !== EXPENSE_CATEGORY_NONE) return 1
      return a.localeCompare(b)
    })
    return ['all', ...sorted]
  }, [filteredTransactions, finCats])

  useEffect(() => {
    if (categoryFilter !== 'all' && !categoryOptions.includes(categoryFilter)) {
      setCategoryFilter('all')
    }
  }, [categoryFilter, categoryOptions])

  const filteredAndSortedTransactions = useMemo(() => {
    const minVal = amountMin ? Number(amountMin) : null
    const maxVal = amountMax ? Number(amountMax) : null
    return filteredTransactions
      .filter((tx) => `${tx.type}:${tx.id}` !== pendingId)
      .filter((tx) => (searchText.trim() ? tx.name.toLowerCase().includes(searchText.toLowerCase().trim()) : true))
      .filter((tx) => (categoryFilter === 'all' ? true : tx.category === categoryFilter))
      .filter((tx) => {
        const abs = Math.abs(tx.amount)
        if (minVal != null && !Number.isNaN(minVal) && abs < minVal) return false
        if (maxVal != null && !Number.isNaN(maxVal) && abs > maxVal) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date)
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date)
        if (sortBy === 'amount_asc') return Math.abs(a.amount) - Math.abs(b.amount)
        return Math.abs(b.amount) - Math.abs(a.amount)
      })
  }, [filteredTransactions, pendingId, searchText, categoryFilter, amountMin, amountMax, sortBy])

  if (loading) return <TransactionsPageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {dateRange ? (
          <div className="text-base text-(--text-muted) font-gaming">
            Okres z dashboardu: <span className="text-(--text-primary)">{periodLabel}</span>
          </div>
        ) : (
          <MonthSelector />
        )}
        <div className="flex gap-2">
          <Tooltip content="Dodaj przychód">
            <button
              onClick={() => {
                setEditingTx(null)
                setFormType('income')
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--tx-income)/15 text-(--tx-income) border border-(--tx-income)/35 font-gaming tracking-wider hover:bg-(--tx-income)/22 transition-all"
            >
              <Plus className="w-4 h-4" />
              Przychód
            </button>
          </Tooltip>
          <Tooltip content="Dodaj wydatek">
            <button
              onClick={() => {
                setEditingTx(null)
                setFormType('expense')
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--tx-expense)/15 text-(--tx-expense) border border-(--tx-expense)/35 font-gaming tracking-wider hover:bg-(--tx-expense)/22 transition-all"
            >
              <Plus className="w-4 h-4" />
              Wydatek
            </button>
          </Tooltip>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-(--text-primary) font-gaming tracking-wider">Transakcje</h3>
          {(drillCategory || dateRange) && (
            <div className="flex flex-wrap items-center gap-2">
              {drillCategory && (
                <span className="text-sm px-3 py-1 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/10 text-(--accent-cyan) font-gaming">
                  Kategoria: {getLabel(drillCategory)}
                </span>
              )}
              <button
                type="button"
                onClick={clearDrilldown}
                className="text-sm px-3 py-1 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-gaming transition-colors"
              >
                Wyczyść filtr z dashboardu
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-gaming text-sm transition-all border ${
                tabFilter === f
                  ? f === 'income'
                    ? 'bg-(--tx-income)/18 text-(--tx-income) border-(--tx-income)/40'
                    : f === 'expense'
                      ? 'bg-(--tx-expense)/18 text-(--tx-expense) border-(--tx-expense)/40'
                      : 'bg-(--accent-cyan)/20 text-(--accent-cyan) border-(--accent-cyan)/40'
                  : 'bg-(--bg-dark) text-(--text-muted) border-(--border) hover:text-(--text-primary)'
              }`}
            >
              {f === 'all' ? 'Wszystkie' : f === 'income' ? 'Przychody' : 'Wydatki'}
            </button>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Szukaj po nazwie..."
            className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-sm"
          >
            {categoryOptions.map((cat) => (
              <option key={cat === EXPENSE_CATEGORY_NONE ? '__none__' : cat} value={cat}>
                {categoryFilterLabel(cat)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            placeholder="Kwota od"
            className="no-spinners px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-sm"
          />
          <input
            type="number"
            min="0"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            placeholder="Kwota do"
            className="no-spinners px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-sm"
          />
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'date_desc' ? 'amount_desc' : prev === 'amount_desc' ? 'date_asc' : prev === 'date_asc' ? 'amount_asc' : 'date_desc'))}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-sm"
            title="Przełącz sortowanie"
          >
            {sortBy.includes('asc') ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
            {sortBy.startsWith('date') ? 'Sort: data' : 'Sort: kwota'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--border)">
                <th className="pb-3 text-base text-(--text-muted) font-gaming">Data</th>
                <th className="pb-3 text-base text-(--text-muted) font-gaming">Nazwa</th>
                <th className="pb-3 text-base text-(--text-muted) font-gaming">Kategoria</th>
                <th className="pb-3 text-base text-(--text-muted) font-gaming text-right">Kwota</th>
                <th className="pb-3 w-20" />
              </tr>
            </thead>
            <tbody key={`${selectedMonth}-${selectedYear}`}>
              {filteredAndSortedTransactions.map((tx) => {
                const isIncome = tx.type === 'income'
                const catLabel = isIncome ? '' : getLabel(tx.category)
                const showCategoryPill = !isIncome && catLabel !== EXPENSE_CATEGORY_DISPLAY_NONE
                const color = showCategoryPill ? getColor(tx.category) : '#6b6b8a'
                return (
                  <tr
                    key={`${tx.type}-${tx.id}`}
                    className="border-b border-(--border)/50 hover:bg-(--bg-dark)/50"
                  >
                    <td className="py-3 text-base font-mono text-(--text-primary)">{tx.date}</td>
                    <td className="py-3 text-base text-(--text-primary) font-medium">{capitalizeFirstPl(tx.name)}</td>
                    <td className="py-3">
                      {isIncome ? (
                        <span className="text-base text-(--text-muted)">—</span>
                      ) : showCategoryPill ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-sm"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {catLabel}
                        </span>
                      ) : (
                        <span className="text-(--text-muted) text-sm font-mono">{EXPENSE_CATEGORY_DISPLAY_NONE}</span>
                      )}
                    </td>
                    <td
                      className={`py-3 text-base font-mono text-right font-medium ${
                        tx.amount >= 0 ? 'text-(--tx-income)' : 'text-(--tx-expense)'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('pl-PL')} zł
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(tx)}
                        className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                        title={tx.isScheduled ? 'Edytuj stały koszt' : 'Edytuj'}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(tx)}
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

        {filteredAndSortedTransactions.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Brak transakcji"
            description={`W wybranym okresie (${periodLabel}) nie ma ${drillCategory ? `transakcji w kategorii „${getLabel(drillCategory)}”` : typeFilter === 'income' ? 'przychodów' : typeFilter === 'expense' ? 'wydatków' : 'transakcji'}.`}
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
        onClose={() => {
          setShowForm(false)
          setEditingTx(null)
        }}
        onSubmit={handleModalSubmit}
        type={formType}
        categories={categoriesForModal}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        initialData={
          editingTx
            ? {
                name: editingTx.name,
                amount: Math.abs(editingTx.amount),
                category: editingTx.type === 'expense' ? editingTx.category : undefined,
                date: editingTx.date,
              }
            : null
        }
        submitLabel={editingTx ? 'Zapisz zmiany' : 'Zapisz'}
        title={
          editingTx
            ? editingTx.type === 'income'
              ? 'Edytuj przychód'
              : editingTx.isScheduled
                ? 'Edytuj stały koszt'
                : 'Edytuj wydatek'
            : undefined
        }
      />

      <ConfirmDialog
        isOpen={deleteConfirmTx != null}
        onCancel={() => setDeleteConfirmTx(null)}
        onConfirm={runConfirmedDelete}
        title="Usunąć?"
        description={
          deleteConfirmTx
            ? deleteConfirmTx.type === 'income'
              ? 'Przychód zostanie usunięty. Możesz cofnąć usunięcie z toastu na dole ekranu.'
              : deleteConfirmTx.isScheduled && deleteConfirmTx.scheduledId
                ? 'To pozycja ze stałego kosztu — zniknie cała subskrypcja (wszystkie miesiące), nie tylko ten wpis.'
                : 'Wydatek zostanie usunięty. Możesz cofnąć usunięcie z toastu na dole ekranu.'
            : ''
        }
        emphasis={deleteConfirmTx?.name}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
