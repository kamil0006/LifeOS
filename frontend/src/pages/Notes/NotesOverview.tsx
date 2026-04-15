import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Zap, Lightbulb, BookMarked, StickyNote } from 'lucide-react'
import { useNotes } from '../../context/NotesContext'
import { getOverviewTileVariants, overviewPageContainerVariants } from '../../lib/layoutSectionMotion'

export function NotesOverview() {
  const notes = useNotes()
  const reduceMotion = useReducedMotion()

  const allNotes = useMemo(() => notes?.notes ?? [], [notes])

  const byType = useMemo(() => {
    const quick = allNotes.filter((n) => n.type === 'quick')
    const ideas = allNotes.filter((n) => n.type === 'idea')
    const refs = allNotes.filter((n) => n.type === 'reference')
    return { quick, ideas, refs }
  }, [allNotes])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    allNotes.forEach((n) => n.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [allNotes])

  if (!notes) return null

  if (allNotes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Brak notatek"
        description="Dodaj pierwszą – notatkę, pomysł lub referencję."
        action={
          <Link
            to="/notes/quick"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/30 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Szybka notatka
          </Link>
        }
      />
    )
  }

  const stats = [
    { icon: Zap, label: 'Szybkie notatki', value: byType.quick.length, color: 'text-(--accent-cyan)' },
    { icon: Lightbulb, label: 'Pomysły', value: byType.ideas.length, color: 'text-(--accent-amber)' },
    { icon: BookMarked, label: 'Referencje', value: byType.refs.length, color: 'text-(--accent-magenta)' },
  ]

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 md:grid-cols-3"
      variants={overviewPageContainerVariants}
      initial="hidden"
      animate="show"
    >
      {stats.map(({ icon: Icon, label, value, color }, i) => (
        <motion.div key={label} variants={getOverviewTileVariants(reduceMotion, i)} className="min-w-0">
          <Card className="border-(--accent-cyan)/20" animateEntrance={false}>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">{label}</p>
            </div>
            <p className={`mt-1 text-2xl font-bold font-gaming ${color}`}>{value}</p>
            <p className="mt-0.5 text-sm text-(--text-muted)">notatek</p>
          </Card>
        </motion.div>
      ))}
      {allTags.length > 0 && (
        <motion.div variants={getOverviewTileVariants(reduceMotion, 3)} className="min-w-0 md:col-span-3">
          <Card title="Tagi" animateEntrance={false}>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-(--border) bg-(--bg-dark) px-2.5 py-1 font-gaming text-sm text-(--text-muted)"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
