import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Clock, GraduationCap, FolderKanban, BookOpen, Award } from 'lucide-react'

const subNavItems = [
  { to: '/nauka', end: true, icon: LayoutDashboard, label: 'Przegląd' },
  { to: '/nauka/godziny', end: false, icon: Clock, label: 'Godziny kodowania' },
  { to: '/nauka/kursy', end: false, icon: GraduationCap, label: 'Kursy' },
  { to: '/nauka/projekty', end: false, icon: FolderKanban, label: 'Projekty' },
  { to: '/nauka/ksiazki', end: false, icon: BookOpen, label: 'Książki' },
  { to: '/nauka/certyfikaty', end: false, icon: Award, label: 'Certyfikaty' },
]

const contentVariants = {
  hidden: { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
  visible: {
    opacity: 1,
    clipPath: 'inset(0 0 0 0)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    clipPath: 'inset(0 0 100% 0)',
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
}

export function NaukaLayout() {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-primary) font-gaming tracking-wider">NAUKA</h1>
        <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
          Godziny kodowania, kursy, projekty i książki
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {subNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-[background-color,color,border-color,box-shadow] duration-200 ease-out font-gaming tracking-wide text-sm ${
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
