import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Zap, Lightbulb, BookMarked } from 'lucide-react'

const subNavItems = [
  { to: '/notes', end: true, icon: LayoutDashboard, label: 'Przegląd' },
  { to: '/notes/quick', end: false, icon: Zap, label: 'Szybkie notatki' },
  { to: '/notes/ideas', end: false, icon: Lightbulb, label: 'Pomysły' },
  { to: '/notes/references', end: false, icon: BookMarked, label: 'Referencje' },
]

const contentVariants = {
  hidden: { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
  visible: {
    opacity: 1,
    clipPath: 'inset(0 0 0 0)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    clipPath: 'inset(0 0 100% 0)',
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function NotesLayout() {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-primary) font-gaming tracking-wider">NOTATKI</h1>
        <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
          Szybkie notatki, pomysły i referencje – Markdown, tagi, wyszukiwarka
        </p>
      </div>

      <nav className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 scrollbar-theme md:flex-wrap">
        {subNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 transition-[background-color,color,border-color,box-shadow] duration-200 ease-out font-gaming tracking-wide text-sm ${
                isActive
                  ? 'bg-(--glow-cyan) text-(--accent-cyan) border border-(--accent-cyan)/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary) border border-transparent'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
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
