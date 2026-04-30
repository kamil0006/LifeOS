import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import {
  Inbox,
  Lightbulb,
  BookMarked,
  StickyNote,
  Pin,
  Plus,
  Tag as TagIcon,
} from 'lucide-react'
import { useNotes } from '../../context/NotesContext'
import type { Note } from '../../context/NotesContext'
import { NoteModal } from '../../components/NoteModal'
import type { NoteType } from '../../lib/notesModel'
import { getNoteDisplayTitle } from '../../lib/notesModel'
import { getOverviewTileVariants, overviewPageContainerVariants } from '../../lib/layoutSectionMotion'

const TOP_TAGS = 10
const RECENT_N = 8

export function NotesOverview() {
  const notes = useNotes()
  const reduceMotion = useReducedMotion()
  const [modalType, setModalType] = useState<NoteType | null>(null)
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)

  const activeNotes = useMemo(() => (notes?.notes ?? []).filter((n) => !n.archivedAt), [notes])

  const byType = useMemo(() => {
    const inbox = activeNotes.filter((n) => n.type === 'inbox')
    const ideas = activeNotes.filter((n) => n.type === 'idea')
    const refs = activeNotes.filter((n) => n.type === 'reference')
    return { inbox, ideas, refs }
  }, [activeNotes])

  const pinned = useMemo(
    () =>
      [...activeNotes]
        .filter((n) => n.pinned)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [activeNotes]
  )

  const recent = useMemo(
    () =>
      [...activeNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_N),
    [activeNotes]
  )

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    activeNotes.forEach((n) => {
      n.tags.forEach((t) => {
        const k = t.toLowerCase()
        m.set(k, (m.get(k) ?? 0) + 1)
      })
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_TAGS)
  }, [activeNotes])

  if (!notes) return null

  const { addNote, updateNote } = notes

  const noteRow = (n: Note, opts?: { showPin?: boolean }) => (
    <li key={n.id} className="flex items-start gap-2 min-w-0">
      {opts?.showPin && n.pinned && (
        <Pin className="w-4 h-4 shrink-0 text-(--accent-amber) mt-0.5 fill-current opacity-60" aria-hidden />
      )}
      <button
        type="button"
        onClick={() => setOpenNoteId(n.id)}
        className="text-left text-base text-(--text-primary) font-gaming truncate hover:text-(--accent-cyan) transition-colors"
      >
        {getNoteDisplayTitle(n)}
      </button>
    </li>
  )

  const editingNote = openNoteId ? activeNotes.find((x) => x.id === openNoteId) ?? null : null

  const addModal = modalType ? (
    <NoteModal
      isOpen
      onClose={() => setModalType(null)}
      note={null}
      type={modalType}
      onSave={(data) => {
        addNote({
          type: modalType,
          content: data.content,
          tags: data.tags,
          title: data.title,
          ideaStatus: modalType === 'idea' ? data.ideaStatus : undefined,
          referenceKind: modalType === 'reference' ? data.referenceKind : undefined,
          referenceUrl: modalType === 'reference' ? data.referenceUrl : undefined,
          referenceSource: modalType === 'reference' ? data.referenceSource : undefined,
        })
        setModalType(null)
      }}
    />
  ) : null

  if (activeNotes.length === 0) {
    return (
      <>
        <EmptyState
          icon={StickyNote}
          title="Brak notatek"
          description="Zacznij od Inbox – szybkie wrzutki do późniejszego porządkowania."
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/notes/inbox"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/30 transition-colors"
              >
                <Inbox className="w-4 h-4" />
                Otwórz Inbox
              </Link>
              <button
                type="button"
                onClick={() => setModalType('inbox')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming hover:border-(--accent-cyan)/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj notatkę
              </button>
              <button
                type="button"
                onClick={() => setModalType('idea')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming hover:border-(--accent-amber)/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj pomysł
              </button>
              <button
                type="button"
                onClick={() => setModalType('reference')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming hover:border-(--accent-magenta)/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj referencję
              </button>
            </div>
          }
        />
        {addModal}
      </>
    )
  }

  const stats = [
    { icon: Inbox, label: 'Inbox', value: byType.inbox.length, color: 'text-(--accent-cyan)', to: '/notes/inbox' },
    { icon: Lightbulb, label: 'Pomysły', value: byType.ideas.length, color: 'text-(--accent-amber)', to: '/notes/ideas' },
    {
      icon: BookMarked,
      label: 'Referencje',
      value: byType.refs.length,
      color: 'text-(--accent-magenta)',
      to: '/notes/references',
    },
  ]

  return (
    <>
      <motion.div
        className="space-y-6"
        variants={overviewPageContainerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={getOverviewTileVariants(reduceMotion, 0)} className="min-w-0">
          <Card
            title="Szybkie akcje"
            className="border-(--accent-cyan)/35 shadow-[0_0_28px_rgba(0,229,255,0.07)]"
            animateEntrance={false}
          >
            <p className="text-base text-(--text-muted) font-gaming mb-4">
              Dodaj notatkę, pomysł lub referencję — bez zmiany zakładki.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModalType('inbox')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-(--accent-cyan) text-(--bg-dark) border border-(--accent-cyan)/60 font-gaming text-base font-bold tracking-wide hover:opacity-92 transition-opacity shadow-[0_0_20px_rgba(0,229,255,0.25)]"
              >
                <Plus className="w-5 h-5" />
                Notatka
              </button>
              <button
                type="button"
                onClick={() => setModalType('idea')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-(--accent-amber)/20 text-(--accent-amber) border border-(--accent-amber)/50 font-gaming text-base font-bold tracking-wide hover:bg-(--accent-amber)/28 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Pomysł
              </button>
              <button
                type="button"
                onClick={() => setModalType('reference')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-(--accent-magenta)/15 text-(--accent-magenta) border border-(--accent-magenta)/45 font-gaming text-base font-bold tracking-wide hover:bg-(--accent-magenta)/22 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Referencja
              </button>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map(({ icon: Icon, label, value, color, to }, i) => (
            <motion.div key={label} variants={getOverviewTileVariants(reduceMotion, i + 1)} className="min-w-0">
              <Link to={to} className="block h-full">
                <Card className="border-(--accent-cyan)/20 h-full hover:border-(--accent-cyan)/40 transition-colors" animateEntrance={false}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">{label}</p>
                  </div>
                  <p className={`mt-1 text-2xl font-bold font-gaming ${color}`}>{value}</p>
                  <p className="mt-0.5 text-base text-(--text-muted)">aktywnych</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {pinned.length > 0 && (
          <motion.div variants={getOverviewTileVariants(reduceMotion, 4)} className="min-w-0">
            <Card title="Przypięte" animateEntrance={false}>
              <ul className="space-y-2">{pinned.map((n) => noteRow(n, { showPin: true }))}</ul>
            </Card>
          </motion.div>
        )}

        <motion.div variants={getOverviewTileVariants(reduceMotion, 5)} className="min-w-0">
          <Card title="Ostatnio edytowane" animateEntrance={false}>
            <ul className="space-y-2">{recent.map((n) => noteRow(n))}</ul>
          </Card>
        </motion.div>

        {tagCounts.length > 0 && (
          <motion.div variants={getOverviewTileVariants(reduceMotion, 6)} className="min-w-0">
            <Card title="Najczęstsze tagi" animateEntrance={false}>
              <div className="flex flex-wrap gap-2 items-center">
                <TagIcon className="w-4 h-4 text-(--text-muted) shrink-0" aria-hidden />
                {tagCounts.map(([tag, count]) => (
                  <Link
                    key={tag}
                    to={`/notes/inbox?tag=${encodeURIComponent(tag)}`}
                    className="rounded-md border border-(--border) bg-(--bg-dark) px-2.5 py-1 font-gaming text-sm text-(--text-muted) hover:border-(--accent-cyan)/50 hover:text-(--accent-cyan) transition-colors"
                  >
                    #{tag}{' '}
                    <span className="text-base text-(--text-muted) opacity-80">({count})</span>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {addModal}

      {editingNote && (
        <NoteModal
          isOpen={!!editingNote}
          onClose={() => setOpenNoteId(null)}
          note={editingNote}
          type={editingNote.type}
          onSave={(data) => {
            updateNote(editingNote.id, {
              content: data.content,
              tags: data.tags,
              title: data.title,
              ideaStatus: editingNote.type === 'idea' ? data.ideaStatus : undefined,
              referenceKind: editingNote.type === 'reference' ? data.referenceKind : undefined,
              referenceUrl: editingNote.type === 'reference' ? data.referenceUrl : undefined,
              referenceSource: editingNote.type === 'reference' ? data.referenceSource : undefined,
            })
            setOpenNoteId(null)
          }}
        />
      )}
    </>
  )
}
