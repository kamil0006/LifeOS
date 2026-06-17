import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { LayoutDashboard, Inbox, Lightbulb, BookMarked, Archive } from 'lucide-react'
import { getSubpageOutletVariants } from '../../lib/layoutSectionMotion'

const subNavItems = [
  { to: '/notes', end: true, icon: LayoutDashboard, label: 'Przegląd' },
  { to: '/notes/inbox', end: false, icon: Inbox, label: 'Inbox' },
  { to: '/notes/ideas', end: false, icon: Lightbulb, label: 'Pomysły' },
  { to: '/notes/references', end: false, icon: BookMarked, label: 'Referencje' },
  { to: '/notes/archive', end: false, icon: Archive, label: 'Archiwum' },
]

export function NotesLayout() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const contentVariants = getSubpageOutletVariants(reduceMotion)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-gaming text-2xl font-bold tracking-wider text-(--text-primary)">NOTATKI</h1>
        <p className="mt-1 text-base text-(--text-muted)">Inbox, pomysły i referencje w jednym miejscu</p>
      </div>

      <nav className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-theme sm:gap-2 md:flex-wrap">
        {subNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm transition-colors sm:px-4 ${
                isActive
                  ? 'border-(--border) bg-(--bg-dark) font-gaming tracking-wide text-(--text-primary)'
                  : 'border-transparent text-(--text-muted) hover:bg-(--bg-card-hover)/60 hover:text-(--text-primary)'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-6"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
