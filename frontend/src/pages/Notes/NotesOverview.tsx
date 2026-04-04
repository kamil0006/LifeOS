import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Zap, Lightbulb, BookMarked, StickyNote } from 'lucide-react'
import { useNotes } from '../../context/NotesContext'

export function NotesOverview() {
  const notes = useNotes()
  if (!notes) return null

  const { notes: allNotes } = notes

  if (allNotes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Brak notatek"
        description="Dodaj pierwszą notatkę – szybką, pomysł lub referencję."
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

  const stats = [
    { icon: Zap, label: 'Szybkie notatki', value: byType.quick.length, color: 'text-(--accent-cyan)' },
    { icon: Lightbulb, label: 'Pomysły', value: byType.ideas.length, color: 'text-(--accent-amber)' },
    { icon: BookMarked, label: 'Referencje', value: byType.refs.length, color: 'text-(--accent-magenta)' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="border-(--accent-cyan)/20">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">{label}</p>
            </div>
            <p className={`text-2xl font-bold mt-1 font-gaming ${color}`}>{value}</p>
            <p className="text-sm text-(--text-muted) mt-0.5">notatek</p>
          </Card>
        ))}
      </div>
      {allTags.length > 0 && (
        <Card title="Tagi">
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-(--bg-dark) border border-(--border) text-sm text-(--text-muted) font-gaming"
              >
                #{tag}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
