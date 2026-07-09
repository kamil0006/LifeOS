import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../components/EmptyState'
import { Tooltip } from '../../components/Tooltip'
import { RotateCcw, Trash2, Search, Archive, ExternalLink } from 'lucide-react'
import { useNotes } from '../../context/NotesContext'
import type { Note, NoteType } from '../../context/NotesContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SafeExternalLink } from '../../components/SafeExternalLink'
import { getNoteDisplayTitle, notePlainExcerpt } from '../../lib/notesModel'

const ARCHIVE_TYPE_BADGE: Record<NoteType, string> = {
  inbox: 'border-sky-400/30 bg-sky-400/8 text-sky-300',
  idea: 'border-(--warning)/40 bg-(--warning)/10 text-(--warning)',
  reference: 'border-(--accent-2)/40 bg-(--accent-2)/10 text-(--accent-2)',
}

export function NotesArchive() {
  const { t, i18n } = useTranslation('notes')
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
    return d.toLocaleDateString(i18n.language === 'pl' ? 'pl-PL' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-5">
      <div className="relative max-w-xl">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--text-muted)" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('archive.searchPlaceholder')}
          className="min-h-11 w-full rounded-lg border border-(--border) bg-(--bg-dark) py-2 pr-4 pl-10 text-base text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent)/50 focus:outline-none"
        />
      </div>

      <p className="text-base text-(--text-muted)">
        <span className="font-display text-(--text-primary)">{t('archive.title')}</span>
        {' · '}
        {archived.length} {t('archive.countSuffix', { count: archived.length })}
      </p>

      {archived.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={search ? t('archive.emptyResultsTitle') : t('archive.emptyTitle')}
          description={
            search
              ? t('archive.emptyResultsDescription')
              : t('archive.emptyDescription')
          }
          compact
        />
      ) : (
        <div className="space-y-3">
          {archived.map((note: Note) => (
            <article
              key={note.id}
              className="rounded-lg border border-(--border)/80 bg-(--bg-card)/25 p-4 transition-colors hover:border-(--accent)/25"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-start gap-2">
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${ARCHIVE_TYPE_BADGE[note.type]}`}
                  >
                    {t(`typeLabel.${note.type}`)}
                  </span>
                  <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-(--text-primary)">
                    {getNoteDisplayTitle(note)}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-(--text-muted) line-clamp-3">
                  {notePlainExcerpt(note.content)}
                </p>
                {note.type === 'reference' && (
                  <div className="space-y-1 text-sm">
                    {note.referenceUrl ? (
                      <SafeExternalLink
                        href={note.referenceUrl}
                        title={note.referenceUrl}
                        className="inline-flex items-center gap-1.5 text-(--accent) hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {t('archive.openLink')}
                      </SafeExternalLink>
                    ) : null}
                    {note.referenceSource ? (
                      <p className="text-(--text-muted)">
                        <span className="text-(--text-primary)/90">{t('archive.source')}</span> {note.referenceSource}
                      </p>
                    ) : null}
                  </div>
                )}
                <div className="flex flex-col gap-2 border-t border-(--border)/50 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-(--text-muted)">
                    {note.tags.map((tag) => (
                      <span key={tag} className="rounded border border-(--border)/70 bg-(--bg-dark)/60 px-1.5 py-0.5">
                        #{tag}
                      </span>
                    ))}
                    <span>
                      {note.tags.length > 0 ? '· ' : ''}
                      {t('archive.archivedOn', { date: note.archivedAt ? formatDate(note.archivedAt) : '—' })}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                    <Tooltip content={t('archive.restore')}>
                      <button
                        type="button"
                        onClick={() => restoreNote(note.id)}
                        className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-dark) hover:text-(--accent)"
                        aria-label={t('archive.restore')}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content={t('archive.deletePermanently')}>
                      <button
                        type="button"
                        onClick={() => setNotePendingPermanentDelete(note)}
                        className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-dark) hover:text-[#e74c3c]"
                        aria-label={t('archive.deletePermanently')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!notePendingPermanentDelete}
        title={t('archive.deleteConfirmTitle')}
        description={t('archive.deleteConfirmDescription')}
        emphasis={
          notePendingPermanentDelete ? getNoteDisplayTitle(notePendingPermanentDelete) : undefined
        }
        confirmLabel={t('archive.deleteConfirmLabel')}
        variant="danger"
        onClose={() => setNotePendingPermanentDelete(null)}
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
