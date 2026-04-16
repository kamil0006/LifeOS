import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileDrawer } from './MobileDrawer'
import { GlobalSearch } from './GlobalSearch'
import { GlobalKeyboardShortcuts } from './GlobalKeyboardShortcuts'
import { GlobalQuickTransaction } from './GlobalQuickTransaction'
import { GlobalQuickNote } from './GlobalQuickNote'
import { GlobalQuickTodo } from './GlobalQuickTodo'
import { Onboarding } from './Onboarding'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isWide =
    pathname === '/dashboard' ||
    pathname === '/' ||
    pathname === '/calendar' ||
    pathname.startsWith('/finances') ||
    pathname.startsWith('/learning') ||
    pathname.startsWith('/notes') ||
    pathname.startsWith('/habits')
  const sectionKey = pathname.split('/').filter(Boolean)[0] || 'dashboard'

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-(--bg-dark) bg-grid">
      <GlobalKeyboardShortcuts />
      <GlobalQuickTransaction />
      <GlobalQuickNote />
      <GlobalQuickTodo />
      <GlobalSearch />
      <Onboarding />
      <Sidebar />
      <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="scrollbar-theme relative flex-1 overflow-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:p-10">
          <motion.div
            key={sectionKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className={`mx-auto ${isWide ? 'max-w-6xl' : 'max-w-4xl'}`}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
