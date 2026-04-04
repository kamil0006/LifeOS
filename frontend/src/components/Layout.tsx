import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { GlobalSearch } from './GlobalSearch'
import { Onboarding } from './Onboarding'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()
  const isWide = pathname === '/dashboard' || pathname === '/' || pathname === '/calendar' || pathname.startsWith('/finances') || pathname.startsWith('/nauka') || pathname.startsWith('/notes')
  const sectionKey = pathname.split('/').filter(Boolean)[0] || 'dashboard'

  return (
    <div className="flex min-h-screen bg-(--bg-dark) bg-grid">
      <GlobalSearch />
      <Onboarding />
      <Sidebar />
      <main className="scrollbar-theme flex-1 p-8 lg:p-10 overflow-auto relative">
        <motion.div
          key={sectionKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`mx-auto ${isWide ? 'max-w-6xl' : 'max-w-4xl'}`}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
