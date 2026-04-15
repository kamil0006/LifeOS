import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type QuickTransactionType = 'income' | 'expense'

interface QuickAddContextType {
  transactionType: QuickTransactionType | null
  openTransaction: (type: QuickTransactionType) => void
  closeTransaction: () => void
  quickNoteOpen: boolean
  openQuickNote: () => void
  closeQuickNote: () => void
  quickTodoOpen: boolean
  openQuickTodo: () => void
  closeQuickTodo: () => void
}

const QuickAddContext = createContext<QuickAddContextType | null>(null)

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [transactionType, setTransactionType] = useState<QuickTransactionType | null>(null)
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [quickTodoOpen, setQuickTodoOpen] = useState(false)

  const closeTransaction = useCallback(() => {
    setTransactionType(null)
  }, [])

  const closeQuickNote = useCallback(() => {
    setQuickNoteOpen(false)
  }, [])

  const closeQuickTodo = useCallback(() => {
    setQuickTodoOpen(false)
  }, [])

  const openTransaction = useCallback((type: QuickTransactionType) => {
    setQuickNoteOpen(false)
    setQuickTodoOpen(false)
    setTransactionType(type)
  }, [])

  const openQuickNote = useCallback(() => {
    setTransactionType(null)
    setQuickTodoOpen(false)
    setQuickNoteOpen(true)
  }, [])

  const openQuickTodo = useCallback(() => {
    setTransactionType(null)
    setQuickNoteOpen(false)
    setQuickTodoOpen(true)
  }, [])

  return (
    <QuickAddContext.Provider
      value={{
        transactionType,
        openTransaction,
        closeTransaction,
        quickNoteOpen,
        openQuickNote,
        closeQuickNote,
        quickTodoOpen,
        openQuickTodo,
        closeQuickTodo,
      }}
    >
      {children}
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext)
  if (!ctx) {
    throw new Error('useQuickAdd must be used within QuickAddProvider')
  }
  return ctx
}
