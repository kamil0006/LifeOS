import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
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
import { useFinanceTransactionSubmit, type TransactionFormData } from '../../hooks/useFinanceTransactionSubmit'
import { TransactionsPageSkeleton } from '../../components/skeletons'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PaymentMethodBadge } from '../../components/finance/PaymentMethodPicker'
import { useUndoDelete } from '../../components/learning/UndoToast'
import type { PaymentMethod } from '../../lib/paymentMethod'

type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

function formatTxDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | PaymentMethod | 'unset'>('all')
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

  const handleCreate = async (data: TransactionFormData) => {
    await submitTransaction(formType, data)
    setShowForm(false)
  }

  const handleModalSubmit = async (data: TransactionFormData) => {
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
            paymentMethod: data.paymentMethod,
          })
        } else {
          await scheduledExpensesApi.update(editingTx.scheduledId, {
            name: data.name,
            amount: data.amount,
            category: data.category ?? EXPENSE_CATEGORY_NONE,
            dayOfMonth,
            paymentMethod: data.paymentMethod,
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
    const fromTx = new Set(filteredTransactions.map((tx) => tx.category))
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
        if (paymentMethodFilter === 'all') return true
        if (paymentMethodFilter === 'unset') return !tx.paymentMethod
        return tx.paymentMethod === paymentMethodFilter
      })
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
  }, [filteredTransactions, pendingId, searchText, categoryFilter, paymentMethodFilter, amountMin, amountMax, sortBy])

  if (loading) return <TransactionsPageSkeleton />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="w-full min-w-0 sm:w-auto">
          {dateRange ? (
            <p className="text-base text-(--text-muted)">
              Okres: <span className="text-(--text-primary)">{periodLabel}</span>
            </p>
          ) : (
            <MonthSelector />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingTx(null)
              setFormType('income')
              setShowForm(true)
            }}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-(--tx-income)/35 bg-(--tx-income)/15 px-3 font-gaming text-sm tracking-wide text-(--tx-income) transition-colors hover:bg-(--tx-income)/22 sm:flex-none sm:px-4"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Przychód</span>
          </button>
          <button
            onClick={() => {
              setEditingTx(null)
              setFormType('expense')
              setShowForm(true)
            }}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-(--tx-expense)/35 bg-(--tx-expense)/15 px-3 font-gaming text-sm tracking-wide text-(--tx-expense) transition-colors hover:bg-(--tx-expense)/22 sm:flex-none sm:px-4"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Wydatek</span>
          </button>
        </div>
      </div>

      <Card className="max-md:p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <h3 className="text-base font-semibold text-(--text-primary) font-gaming tracking-wide">Transakcje</h3>
          {(drillCategory || dateRange) && (
            <div className="flex flex-wrap items-center gap-2">
              {drillCategory && (
                <span className="rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/10 px-2.5 py-1 text-sm text-(--accent-cyan)">
                  {getLabel(drillCategory)}
                </span>
              )}
              <button
                type="button"
                onClick={clearDrilldown}
                className="rounded-lg border border-(--border) px-2.5 py-1 text-sm text-(--text-muted) transition-colors hover:text-(--text-primary)"
              >
                Wyczyść filtr
              </button>
            </div>
          )}
        </div>

        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-theme">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors ${
                tabFilter === f
                  ? f === 'income'
                    ? 'border-(--tx-income)/40 bg-(--tx-income)/18 text-(--tx-income)'
                    : f === 'expense'
                      ? 'border-(--tx-expense)/40 bg-(--tx-expense)/18 text-(--tx-expense)'
                      : 'border-(--accent-cyan)/40 bg-(--accent-cyan)/20 text-(--accent-cyan)'
                  : 'border-(--border) bg-(--bg-dark) text-(--text-muted) hover:text-(--text-primary)'
              }`}
            >
              {f === 'all' ? 'Wszystkie' : f === 'income' ? 'Przychody' : 'Wydatki'}
            </button>
          ))}
        </div>

        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Szukaj…"
              className="col-span-2 min-h-11 min-w-0 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) md:col-span-1"
            />
            <input
              type="number"
              min="0"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="Kwota od"
              className="no-spinners min-h-11 min-w-0 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary)"
            />
            <input
              type="number"
              min="0"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="Kwota do"
              className="no-spinners min-h-11 min-w-0 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary)"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-h-11 min-w-0 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary)"
              aria-label="Filtr kategorii"
            >
              {categoryOptions.map((cat) => (
                <option key={cat === EXPENSE_CATEGORY_NONE ? '__none__' : cat} value={cat}>
                  {categoryFilterLabel(cat)}
                </option>
              ))}
            </select>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as typeof paymentMethodFilter)}
              className="min-h-11 min-w-0 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary)"
              aria-label="Filtr sposobu płatności"
            >
              <option value="all">Wszystkie płatności</option>
              <option value="card">Karta</option>
              <option value="cash">Gotówka</option>
              <option value="unset">Bez oznaczenia</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="min-h-11 min-w-0 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
              aria-label="Sortowanie po dacie lub kwocie"
            >
              <option value="date_desc">Data: najnowsze</option>
              <option value="date_asc">Data: najstarsze</option>
              <option value="amount_desc">Kwota: malejąco</option>
              <option value="amount_asc">Kwota: rosnąco</option>
            </select>
          </div>
        </div>

        <p className="mb-3 text-sm text-(--text-muted) md:hidden">
          {filteredAndSortedTransactions.length}{' '}
          {filteredAndSortedTransactions.length === 1 ? 'pozycja' : 'pozycji'}
        </p>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--border)">
                <th className="pb-3 text-base text-(--text-muted)">Data</th>
                <th className="pb-3 text-base text-(--text-muted)">Nazwa</th>
                <th className="pb-3 text-base text-(--text-muted)">Kategoria</th>
                <th className="pb-3 text-base text-(--text-muted)">Płatność</th>
                <th className="pb-3 text-base text-(--text-muted) text-right">Kwota</th>
                <th className="pb-3 w-20" />
              </tr>
            </thead>
            <tbody key={`${selectedMonth}-${selectedYear}-desktop`}>
              {filteredAndSortedTransactions.map((tx) => {
                const catLabel = getLabel(tx.category)
                const showCategoryPill = catLabel !== EXPENSE_CATEGORY_DISPLAY_NONE
                const color = showCategoryPill ? getColor(tx.category) : '#6b6b8a'
                return (
                  <tr
                    key={`${tx.type}-${tx.id}`}
                    className="border-b border-(--border)/50 hover:bg-(--bg-dark)/50"
                  >
                    <td className="py-3 text-base font-mono text-(--text-primary)">{tx.date}</td>
                    <td className="py-3 text-base font-medium text-(--text-primary)">{capitalizeFirstPl(tx.name)}</td>
                    <td className="py-3">
                      {showCategoryPill ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          {catLabel}
                        </span>
                      ) : (
                        <span className="text-sm text-(--text-muted) font-mono">{EXPENSE_CATEGORY_DISPLAY_NONE}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <PaymentMethodBadge method={tx.paymentMethod} />
                    </td>
                    <td
                      className={`py-3 text-right text-base font-medium font-mono ${
                        tx.amount >= 0 ? 'text-(--tx-income)' : 'text-(--tx-expense)'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount.toLocaleString('pl-PL')} zł
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(tx)}
                        className="p-2 text-(--text-muted) transition-colors hover:text-(--accent-cyan)"
                        title={tx.isScheduled ? 'Edytuj stały koszt' : 'Edytuj'}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(tx)}
                        className="p-2 text-(--text-muted) transition-colors hover:text-red-400"
                        title="Usuń"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredAndSortedTransactions.map((tx) => {
            const catLabel = getLabel(tx.category)
            const showCategoryPill = catLabel !== EXPENSE_CATEGORY_DISPLAY_NONE
            const color = showCategoryPill ? getColor(tx.category) : '#6b6b8a'
            return (
              <article
                key={`${tx.type}-${tx.id}-mobile`}
                className="rounded-lg border border-(--border)/80 bg-(--bg-card)/25 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-snug text-(--text-primary)">
                      {capitalizeFirstPl(tx.name)}
                    </p>
                    <p className="mt-0.5 text-sm text-(--text-muted)">{formatTxDate(tx.date)}</p>
                  </div>
                  <p
                    className={`shrink-0 text-base font-semibold tabular-nums ${
                      tx.amount >= 0 ? 'text-(--tx-income)' : 'text-(--tx-expense)'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.amount.toLocaleString('pl-PL')} zł
                  </p>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-(--border)/50 pt-2.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {showCategoryPill ? (
                    <span
                      className="inline-flex max-w-full items-center gap-1.5 truncate rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${color}25`, color }}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      {catLabel}
                    </span>
                  ) : (
                    <span className="text-xs text-(--text-muted)">{EXPENSE_CATEGORY_DISPLAY_NONE}</span>
                  )}
                  <PaymentMethodBadge method={tx.paymentMethod} />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(tx)}
                      className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-dark) hover:text-(--accent-cyan)"
                      aria-label={tx.isScheduled ? 'Edytuj stały koszt' : 'Edytuj'}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(tx)}
                      className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-dark) hover:text-red-400"
                      aria-label="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
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
                category: editingTx.category,
                date: editingTx.date,
                paymentMethod: editingTx.paymentMethod,
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
        onClose={() => setDeleteConfirmTx(null)}
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
        variant="danger"
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
