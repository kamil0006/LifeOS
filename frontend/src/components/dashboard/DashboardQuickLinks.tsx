import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StickyNote, Calendar, GraduationCap, Target } from 'lucide-react'
import { dashboardSectionStaggerVariants, getDashboardTileVariants } from '../../lib/dashboardMotion'

export type DashboardQuickLinksProps = {
  notesCount: number
  habitsCount: number
  reduceMotion: boolean | null
}

const LINK_BASE = 11

const linkShell =
  'group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden block'

export function DashboardQuickLinks({ notesCount, habitsCount, reduceMotion }: DashboardQuickLinksProps) {
  return (
    <motion.div
      variants={dashboardSectionStaggerVariants}
      className="grid grid-cols-2 md:grid-cols-4 gap-6"
    >
      <motion.div variants={getDashboardTileVariants(reduceMotion, LINK_BASE + 0)} className="min-w-0">
        <Link to="/notes" className={linkShell}>
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <StickyNote className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Notatki</p>
          <p className="text-sm text-(--text-muted) mt-0.5">{notesCount} notatek</p>
        </Link>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, LINK_BASE + 1)} className="min-w-0">
        <Link to="/calendar" className={linkShell}>
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <Calendar className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Kalendarz</p>
          <p className="text-sm text-(--text-muted) mt-0.5">Wydarzenia</p>
        </Link>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, LINK_BASE + 2)} className="min-w-0">
        <Link to="/learning" className={linkShell}>
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <GraduationCap className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Nauka</p>
          <p className="text-sm text-(--text-muted) mt-0.5">Sesje, kursy, projekty</p>
        </Link>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, LINK_BASE + 3)} className="min-w-0">
        <Link to="/habits" className={linkShell}>
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
          <Target className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <p className="text-base font-semibold text-(--text-primary) font-gaming">Nawyki</p>
          <p className="text-sm text-(--text-muted) mt-0.5">{habitsCount} nawyków</p>
        </Link>
      </motion.div>
    </motion.div>
  )
}
