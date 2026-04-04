import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface GlobalSearchContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null)

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape') {
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, close])

  return (
    <GlobalSearchContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </GlobalSearchContext.Provider>
  )
}

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext)
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider')
  }
  return ctx
}
