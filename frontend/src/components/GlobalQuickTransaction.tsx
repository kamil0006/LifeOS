import { TransactionModal } from './TransactionModal'
import { useQuickAdd } from '../context/QuickAddContext'
import { useFinanceCategories } from '../context/FinanceCategoriesContext'
import { useFinanceTransactionSubmit } from '../hooks/useFinanceTransactionSubmit'

/** Modal dodawania transakcji wywoływany skrótami globalnymi (np. Ctrl+E). */
export function GlobalQuickTransaction() {
  const { transactionType, closeTransaction } = useQuickAdd()
  const { submit } = useFinanceTransactionSubmit()
  const { categories: finCats, customCategories: finCustomCats, addCategory, deleteCategory } =
    useFinanceCategories()

  const categoriesForModal = finCats.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    color: c.color,
  }))
  const customCategoriesForModal = finCustomCats.map((c) => ({
    id: c.id,
    name: c.name,
    label: c.label,
    color: c.color,
  }))

  const handleSubmit = async (data: { name: string; amount: number; category?: string; date: string }) => {
    if (!transactionType) return
    try {
      await submit(transactionType, data)
      closeTransaction()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Nie udało się zapisać transakcji')
    }
  }

  return (
    <TransactionModal
      isOpen={transactionType !== null}
      onClose={closeTransaction}
      onSubmit={handleSubmit}
      type={transactionType ?? 'expense'}
      categories={categoriesForModal}
      customCategories={customCategoriesForModal}
      onAddCategory={addCategory}
      onDeleteCategory={deleteCategory}
    />
  )
}
