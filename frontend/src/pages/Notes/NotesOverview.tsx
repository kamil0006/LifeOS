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

  const noteRow = (n: Note, opts?: { showPin?: boolean }) => {
    const typeLabel =
      n.type === 'inbox' ? 'Inbox' : n.type === 'idea' ? 'Pomysł' : 'Referencja'
    const edited = new Date(n.updatedAt).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
    })
    return (
      <li key={n.id} className="min-w-0">
        <button
          type="button"
          onClick={() => setOpenNoteId(n.id)}
          className="flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-(--border)/70 hover:bg-(--bg-dark)/40"
        >
          {opts?.showPin && n.pinned && (
            <Pin className="mt-0.5 h-4 w-4 shrink-0 fill-current text-(--accent-amber)" aria-hidden />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-medium text-(--text-primary)">
              {getNoteDisplayTitle(n)}
            </span>
            <span className="mt-0.5 block text-sm text-(--text-muted)">
              {typeLabel} · {edited}
            </span>
          </span>
        </button>
      </li>
    )
  }

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
          <Card title="Dodaj" animateEntrance={false} className="max-md:p-4">
            <p className="mb-3 text-base text-(--text-muted)">Nowa notatka, pomysł lub referencja.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setModalType('inbox')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-(--accent-cyan)/45 bg-(--accent-cyan)/18 px-4 font-gaming text-sm tracking-wide text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/26"
              >
                <Plus className="h-4 w-4" />
                Notatka
              </button>
              <button
                type="button"
                onClick={() => setModalType('idea')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-(--border) bg-(--bg-dark) px-4 font-gaming text-sm tracking-wide text-(--text-primary) transition-colors hover:border-(--accent-amber)/40 hover:text-(--accent-amber)"
              >
                <Plus className="h-4 w-4" />
                Pomysł
              </button>
              <button
                type="button"
                onClick={() => setModalType('reference')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-(--border) bg-(--bg-dark) px-4 font-gaming text-sm tracking-wide text-(--text-primary) transition-colors hover:border-(--accent-magenta)/40 hover:text-(--accent-magenta)"
              >
                <Plus className="h-4 w-4" />
                Referencja
              </button>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {stats.map(({ icon: Icon, label, value, color, to }, i) => (
            <motion.div key={label} variants={getOverviewTileVariants(reduceMotion, i + 1)} className="min-w-0">
              <Link to={to} className="block h-full">
                <Card className="h-full max-md:p-4 transition-colors hover:border-(--accent-cyan)/30" animateEntrance={false}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <p className="text-base text-(--text-muted)">{label}</p>
                  </div>
                  <p className={`mt-2 text-2xl font-bold font-gaming ${color}`}>{value}</p>
                  <p className="mt-0.5 text-sm text-(--text-muted)">aktywnych</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {pinned.length > 0 && (
          <motion.div variants={getOverviewTileVariants(reduceMotion, 4)} className="min-w-0">
            <Card title="Przypięte" animateEntrance={false} className="max-md:p-4">
              <ul className="space-y-2">{pinned.map((n) => noteRow(n, { showPin: true }))}</ul>
            </Card>
          </motion.div>
        )}

        <motion.div variants={getOverviewTileVariants(reduceMotion, 5)} className="min-w-0">
          <Card title="Ostatnio edytowane" animateEntrance={false} className="max-md:p-4">
            <ul className="space-y-2">{recent.map((n) => noteRow(n))}</ul>
          </Card>
        </motion.div>

        {tagCounts.length > 0 && (
          <motion.div variants={getOverviewTileVariants(reduceMotion, 6)} className="min-w-0">
            <Card title="Najczęstsze tagi" animateEntrance={false} className="max-md:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <TagIcon className="h-4 w-4 shrink-0 text-(--text-muted)" aria-hidden />
                {tagCounts.map(([tag, count]) => (
                  <Link
                    key={tag}
                    to={`/notes/inbox?tag=${encodeURIComponent(tag)}`}
                    className="rounded-md border border-(--border) bg-(--bg-dark) px-2.5 py-1.5 text-sm text-(--text-muted) transition-colors hover:border-(--accent-cyan)/40 hover:text-(--accent-cyan)"
                  >
                    #{tag} <span className="text-(--text-muted)">({count})</span>
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
