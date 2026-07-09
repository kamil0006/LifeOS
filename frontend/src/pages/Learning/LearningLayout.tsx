import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { LayoutDashboard, Clock, GraduationCap, FolderKanban, BookOpen, Award } from 'lucide-react'
import { getSubpageOutletVariants } from '../../lib/layoutSectionMotion'

const subNavItems = [
  { to: '/learning', end: true, icon: LayoutDashboard, labelKey: 'navOverview' },
  { to: '/learning/hours', end: false, icon: Clock, labelKey: 'navHours' },
  { to: '/learning/courses', end: false, icon: GraduationCap, labelKey: 'navCourses' },
  { to: '/learning/projects', end: false, icon: FolderKanban, labelKey: 'navProjects' },
  { to: '/learning/books', end: false, icon: BookOpen, labelKey: 'navBooks' },
  { to: '/learning/certificates', end: false, icon: Award, labelKey: 'navCertificates' },
] as const

export function LearningLayout() {
  const { t } = useTranslation('learning')
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const contentVariants = getSubpageOutletVariants(reduceMotion)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-primary) font-display tracking-wider sm:text-3xl">
          {t('layout.title')}
        </h1>
        <p className="mt-1 text-base text-(--text-muted)">{t('layout.subtitle')}</p>
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
                  ? 'border-(--border) bg-(--bg-dark) font-display tracking-wide text-(--text-primary)'
                  : 'border-transparent text-(--text-muted) hover:bg-(--bg-card-hover)/60 hover:text-(--text-primary)'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {t(`layout.${item.labelKey}`)}
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
          className="space-y-5 sm:space-y-6"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
