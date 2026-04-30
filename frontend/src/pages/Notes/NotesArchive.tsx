import { useMemo, useState } from 'react'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Tooltip } from '../../components/Tooltip'
import { RotateCcw, Trash2, Search, Archive, ExternalLink } from 'lucide-react'
import { useNotes } from '../../context/NotesContext'
import type { Note, NoteType } from '../../context/NotesContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { getNoteDisplayTitle, notePlainExcerpt } from '../../lib/notesModel'

const ARCHIVE_TYPE_LABEL: Record<NoteType, string> = {
  inbox: 'Inbox',
  idea: 'Pomysł',
  reference: 'Referencja',
}

const ARCHIVE_TYPE_BADGE: Record<NoteType, string> = {
  inbox: 'border-sky-400/45 bg-sky-400/10 text-sky-200',
  idea: 'border-(--accent-amber)/45 bg-(--accent-amber)/12 text-(--accent-amber)',
  reference: 'border-(--accent-magenta)/45 bg-(--accent-magenta)/12 text-(--accent-magenta)',
}

export function NotesArchive() {
  const notesCtx = useNotes()
  const [search, setSearch] = useState('')
  const [notePendingPermanentDelete, setNotePendingPermanentDelete] = useState<Note | null>(null)

  const archived = useMemo(() => {
    const list = (notesCtx?.notes ?? []).filter((n) => n.archivedAt)
    if (!search.trim()) return [...list].sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''))
    const q = search.trim().toLowerCase()
    return list
      .filter(
        (n) =>
          getNoteDisplayTitle(n).toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.title?.toLowerCase().includes(q) ?? false) ||
          (n.referenceSource?.toLowerCase().includes(q) ?? false) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
      .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''))
  }, [notesCtx?.notes, search])

  if (!notesCtx) return null

  const { restoreNote, deleteNotePermanently } = notesCtx

  const formatDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <Card title="Wyszukaj w archiwum">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po tytule, treści, tagach…"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
          />
        </div>
      </Card>

      <Card title="Archiwum">
        {archived.length === 0 ? (
          <EmptyState
            icon={Archive}
            title={search ? 'Brak wyników' : 'Archiwum jest puste'}
            description={
              search
                ? 'Zmień frazę wyszukiwania.'
                : 'Zarchiwizowane notatki pojawią się tutaj. Usuń trwale tylko stąd.'
            }
          />
        ) : (
          <div className="space-y-2">
            {archived.map((note: Note) => (
              <div
                key={note.id}
                className="rounded-lg border border-(--border) bg-(--bg-dark)/50 px-3.5 py-2.5 hover:border-(--accent-cyan)/25 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-md border font-gaming tracking-wide uppercase ${ARCHIVE_TYPE_BADGE[note.type]}`}
                      >
                        {ARCHIVE_TYPE_LABEL[note.type]}
                      </span>
                      <p className="font-semibold text-(--text-primary) font-gaming truncate min-w-0 flex-1 basis-[min(100%,12rem)]">
                        {getNoteDisplayTitle(note)}
                      </p>
                    </div>
                    <p className="text-base text-(--text-muted) mt-1 line-clamp-2">{notePlainExcerpt(note.content)}</p>
                    {note.type === 'reference' && (
                      <div className="mt-2 flex flex-col gap-1">
                        {note.referenceUrl ? (
                          <a
                            href={note.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={note.referenceUrl}
                            className="inline-flex items-center gap-1.5 text-sm font-gaming text-(--accent-cyan) hover:underline w-fit"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            Otwórz link
                          </a>
                        ) : null}
                        {note.referenceSource ? (
                          <p className="text-base text-(--text-muted)">
                            <span className="font-gaming text-(--text-primary)/90">Źródło:</span>{' '}
                            {note.referenceSource}
                          </p>
                        ) : null}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-sm bg-(--bg-card) border border-(--border) text-(--text-muted)"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-base text-(--text-muted) mt-2">
                      Zarchiwizowano {note.archivedAt ? formatDate(note.archivedAt) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip content="Przywróć">
                      <button
                        type="button"
                        onClick={() => restoreNote(note.id)}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                        aria-label="Przywróć"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Usuń trwale">
                      <button
                        type="button"
                        onClick={() => setNotePendingPermanentDelete(note)}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
                        aria-label="Usuń trwale"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!notePendingPermanentDelete}
        title="Usunąć notatkę na stałe?"
        description="Ta operacja jest nieodwracalna. Notatka zostanie trwale usunięta z archiwum."
        emphasis={
          notePendingPermanentDelete ? getNoteDisplayTitle(notePendingPermanentDelete) : undefined
        }
        confirmLabel="Usuń na stałe"
        onCancel={() => setNotePendingPermanentDelete(null)}
        onConfirm={() => {
          if (notePendingPermanentDelete) {
            deleteNotePermanently(notePendingPermanentDelete.id)
            setNotePendingPermanentDelete(null)
          }
        }}
      />
    </div>
  )
}
