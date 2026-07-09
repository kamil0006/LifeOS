import { TransactionModal } from './TransactionModal'
import { useQuickAdd } from '../context/QuickAddContext'
import { useFinanceCategories } from '../context/FinanceCategoriesContext'
import { useFinanceTransactionSubmit, type TransactionFormData } from '../hooks/useFinanceTransactionSubmit'

/** Transaction-adding modal invoked via global shortcuts (e.g. Ctrl+E). */
export function GlobalQuickTransaction() {
  const { transactionType, closeTransaction } = useQuickAdd()
  const { submit } = useFinanceTransactionSubmit()
  const { categories: finCats, addCategory, deleteCategory } = useFinanceCategories()

  const categoriesForModal = finCats.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    color: c.color,
  }))

  const handleSubmit = async (data: TransactionFormData) => {
    if (!transactionType) return
    await submit(transactionType, data)
  }

  return (
    <TransactionModal
      isOpen={transactionType !== null}
      onClose={closeTransaction}
      onSubmit={handleSubmit}
      type={transactionType ?? 'expense'}
      categories={categoriesForModal}
      onAddCategory={addCategory}
      onDeleteCategory={deleteCategory}
    />
  )
}
