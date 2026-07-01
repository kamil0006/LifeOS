import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface SettingsContextType {
  isOpen: boolean
  open: () => void
  close: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <SettingsContext.Provider value={{ isOpen, open, close }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return ctx
}
