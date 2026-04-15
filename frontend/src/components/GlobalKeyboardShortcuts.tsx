import { useEffect } from 'react'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import { useQuickAdd } from '../context/QuickAddContext'

/**
 * Skróty globalne (po zalogowaniu):
 * Ctrl/⌘+K paleta · Ctrl+E wydatek · Ctrl+I przychód · Ctrl+Shift+Y szybka notatka · Ctrl+Shift+L to-do
 */
export function GlobalKeyboardShortcuts() {
  const { toggle, close: closeSearch, isOpen: searchOpen } = useGlobalSearch()
  const {
    transactionType,
    openTransaction,
    closeTransaction,
    quickNoteOpen,
    openQuickNote,
    closeQuickNote,
    quickTodoOpen,
    openQuickTodo,
    closeQuickTodo,
  } = useQuickAdd()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (e.key === 'Escape') {
        if (transactionType) {
          e.preventDefault()
          closeTransaction()
        } else if (quickNoteOpen) {
          e.preventDefault()
          closeQuickNote()
        } else if (quickTodoOpen) {
          e.preventDefault()
          closeQuickTodo()
        } else if (searchOpen) {
          e.preventDefault()
          closeSearch()
        }
        return
      }

      if (!mod) return

      if (key === 'k') {
        e.preventDefault()
        toggle()
        return
      }

      if (key === 'e' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        closeSearch()
        openTransaction('expense')
        return
      }

      if (key === 'i' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        closeSearch()
        openTransaction('income')
        return
      }

      // Ctrl+N / ⌥N często przejmowane przez OS lub przeglądarkę — stabilne: Ctrl+Shift+Y
      if (key === 'y' && e.shiftKey && !e.altKey) {
        e.preventDefault()
        closeSearch()
        openQuickNote()
        return
      }

      if (key === 'l' && e.shiftKey && !e.altKey) {
        e.preventDefault()
        closeSearch()
        openQuickTodo()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    toggle,
    closeSearch,
    searchOpen,
    transactionType,
    openTransaction,
    closeTransaction,
    quickNoteOpen,
    quickTodoOpen,
    openQuickNote,
    closeQuickNote,
    openQuickTodo,
    closeQuickTodo,
  ])

  return null
}
