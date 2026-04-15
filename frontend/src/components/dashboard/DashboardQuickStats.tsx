import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../Card'
import { dashboardSectionStaggerVariants, getDashboardTileVariants } from '../../lib/dashboardMotion'

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${monthNames[m - 1]} ${y}`
}

export type DashboardQuickStatsProps = {
  upcomingEvents: { id: string; title: string; date: string; time?: string; color?: string }[]
  todoCount: number
  wishesCount: number
  goals: { id: string; name: string; target: number; current: number; unit?: string }[]
  habitsToday: { done: number; total: number }
  reduceMotion: boolean | null
}

const TILE_BASE = 6

export function DashboardQuickStats({
  upcomingEvents,
  todoCount,
  wishesCount,
  goals,
  habitsToday,
  reduceMotion,
}: DashboardQuickStatsProps) {
  return (
    <motion.div
      variants={dashboardSectionStaggerVariants}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch"
    >
      <motion.div variants={getDashboardTileVariants(reduceMotion, TILE_BASE + 0)} className="min-w-0 flex">
        <Card title="Nadchodzące wydarzenia" className="border-(--accent-cyan)/20 p-3 flex flex-col h-full w-full" animateEntrance={false}>
          <div className="flex-1 min-h-0">
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-1.5">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ev.color ?? 'var(--accent-cyan)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/calendar"
                        className="text-sm text-(--text-primary) hover:text-(--accent-cyan) transition-colors truncate block outline-none focus:outline-none"
                      >
                        {ev.title}
                      </Link>
                      <p className="text-xs text-(--text-muted) font-mono">
                        {formatEventDate(ev.date)} {ev.time && `• ${ev.time}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-(--text-muted) text-sm">Brak nadchodzących wydarzeń</p>
            )}
          </div>
          <Link
            to="/calendar"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz kalendarz →
          </Link>
        </Card>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, TILE_BASE + 1)} className="min-w-0 flex">
        <Card title="Do zrobienia" className="border-(--accent-amber)/20 p-3 flex flex-col h-full w-full" animateEntrance={false}>
          <div className="flex-1 min-h-0">
            <p className="text-2xl font-bold text-(--accent-amber) font-gaming drop-shadow-[0_0_10px_rgba(255,184,0,0.3)]">{todoCount}</p>
            <p className="text-sm text-(--text-muted) mt-1">aktywnych zadań</p>
          </div>
          <Link
            to="/todo"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz To-do →
          </Link>
        </Card>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, TILE_BASE + 2)} className="min-w-0 flex">
        <Card title="Zachcianki w kolejce" className="border-(--accent-magenta)/20 p-3 flex flex-col h-full w-full" animateEntrance={false}>
          <div className="flex-1 min-h-0">
            <p className="text-2xl font-bold text-(--accent-magenta) font-gaming drop-shadow-[0_0_10px_rgba(255,0,212,0.3)]">{wishesCount}</p>
            <p className="text-sm text-(--text-muted) mt-1">rzeczy na liście</p>
          </div>
          <Link
            to="/finances/wishes"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz zachcianki →
          </Link>
        </Card>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, TILE_BASE + 3)} className="min-w-0 flex">
        <Card title="Aktywne cele" className="border-(--accent-cyan)/20 p-3 flex flex-col h-full w-full" animateEntrance={false}>
          <div className="flex-1 min-h-0">
            {goals.length > 0 ? (
              <div className="space-y-2">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, (g.current / g.target) * 100)
                  return (
                    <div key={g.id} className="space-y-1">
                      <p className="text-sm text-(--text-primary) truncate font-medium">{g.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-(--bg-card) overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-(--accent-cyan) to-(--accent-green) transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-(--text-muted) shrink-0 font-mono">
                          {g.current}/{g.target} {g.unit ?? ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-(--text-muted) text-sm">Brak aktywnych celów</p>
            )}
          </div>
          <Link
            to="/habits"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            {goals.length > 0 ? 'Zobacz cele →' : 'Dodaj cel →'}
          </Link>
        </Card>
      </motion.div>
      <motion.div variants={getDashboardTileVariants(reduceMotion, TILE_BASE + 4)} className="min-w-0 flex">
        <Card title="Nawyki dziś" className="border-(--accent-green)/20 p-3 flex flex-col h-full w-full" animateEntrance={false}>
          <div className="flex-1 min-h-0">
            {habitsToday.total > 0 ? (
              <>
                <p className="text-2xl font-bold text-(--accent-green) font-gaming drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">
                  {habitsToday.done}/{habitsToday.total}
                </p>
                <p className="text-sm text-(--text-muted) mt-1">odznaczonych dziś</p>
                <div className="mt-2 h-1.5 rounded-full bg-(--bg-dark) overflow-hidden">
                  <div
                    className="h-full rounded-full bg-(--accent-green) transition-all"
                    style={{ width: `${habitsToday.total > 0 ? (habitsToday.done / habitsToday.total) * 100 : 0}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-(--text-muted) text-sm">Brak nawyków</p>
            )}
          </div>
          <Link
            to="/habits"
            className="mt-auto pt-2 inline-block text-sm text-(--accent-cyan) hover:underline outline-none focus:outline-none"
          >
            Zobacz nawyki →
          </Link>
        </Card>
      </motion.div>
    </motion.div>
  )
}
