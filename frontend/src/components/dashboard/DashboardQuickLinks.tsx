import { Link } from 'react-router-dom'
import { StickyNote, Calendar, GraduationCap, Target } from 'lucide-react'

export type DashboardQuickLinksProps = {
  notesCount: number
  habitsCount: number
}

export function DashboardQuickLinks({ notesCount, habitsCount }: DashboardQuickLinksProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <Link
        to="/notes"
        className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
        <StickyNote className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
        <p className="text-base font-semibold text-(--text-primary) font-gaming">Notatki</p>
        <p className="text-sm text-(--text-muted) mt-0.5">{notesCount} notatek</p>
      </Link>
      <Link
        to="/calendar"
        className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
        <Calendar className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
        <p className="text-base font-semibold text-(--text-primary) font-gaming">Kalendarz</p>
        <p className="text-sm text-(--text-muted) mt-0.5">Wydarzenia</p>
      </Link>
      <Link
        to="/learning"
        className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
        <GraduationCap className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
        <p className="text-base font-semibold text-(--text-primary) font-gaming">Nauka</p>
        <p className="text-sm text-(--text-muted) mt-0.5">Kursy, projekty</p>
      </Link>
      <Link
        to="/habits"
        className="group relative rounded-lg border border-(--border) bg-(--bg-card) p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
        <Target className="w-8 h-8 text-(--accent-cyan) mb-2 group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
        <p className="text-base font-semibold text-(--text-primary) font-gaming">Nawyki</p>
        <p className="text-sm text-(--text-muted) mt-0.5">{habitsCount} nawyków</p>
      </Link>
    </div>
  )
}
