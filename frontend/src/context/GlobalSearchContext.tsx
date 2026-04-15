import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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
