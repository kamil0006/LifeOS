import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../components/EmptyState'
import { Tooltip } from '../../components/Tooltip'
import {
  Plus,
  Pencil,
  Search,
  StickyNote,
  Lightbulb,
  BookMarked,
  Pin,
  PinOff,
  Archive,
  Link as LinkIcon,
  BookOpen,
  Newspaper,
  Video,
  Quote,
  CircleEllipsis,
  ExternalLink,
} from 'lucide-react'
import { useNotes } from '../../context/NotesContext'
import type { Note, NoteType, IdeaStatus } from '../../context/NotesContext'
import { NoteModal } from '../../components/NoteModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SafeExternalLink } from '../../components/SafeExternalLink'
import type { ReferenceKind } from '../../lib/notesModel'
import {
  IDEA_STATUS_WORKFLOW_ORDER,
  getNoteDisplayTitle,
  notePlainExcerpt,
} from '../../lib/notesModel'

interface NotesPageProps {
  type: NoteType
}

const IDEA_STATUS_BADGE: Record<IdeaStatus, string> = {
  nowy: 'border-sky-400/30 bg-sky-400/8 text-sky-300',
  do_sprawdzenia: 'border-(--accent-amber)/40 bg-(--accent-amber)/10 text-(--accent-amber)',
  w_realizacji: 'border-violet-400/35 bg-violet-500/10 text-violet-300',
  zrobiony: 'border-(--accent-green)/40 bg-(--accent-green)/10 text-(--accent-green)',
  odrzucony: 'border-(--border) bg-(--bg-dark)/80 text-(--text-muted)',
}

const REF_ICONS: Record<ReferenceKind, typeof LinkIcon> = {
  link: LinkIcon,
  ksiazka: BookOpen,
  artykul: Newspaper,
  wideo: Video,
  cytat: Quote,
  inne: CircleEllipsis,
}

export function NotesPage({ type }: NotesPageProps) {
  const { t, i18n } = useTranslation('notes')
  const notesCtx = useNotes()
  const [searchParams, setSearchParams] = useSearchParams()
  const tagFromUrl = searchParams.get('tag') ?? ''

  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<IdeaStatus | 'wszystkie'>('wszystkie')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [notePendingArchive, setNotePendingArchive] = useState<Note | null>(null)

  useEffect(() => {
    if (!tagFromUrl) return
    const key = tagFromUrl.toLowerCase()
    setSelectedTags(new Set([key]))
  }, [tagFromUrl])

  const ctxNotes = useMemo(() => notesCtx?.notes ?? [], [notesCtx])

  const filtered = useMemo(() => {
    let list = ctxNotes.filter((n) => n.type === type && !n.archivedAt)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          (n.title?.toLowerCase().includes(q) ?? false) ||
          getNoteDisplayTitle(n).toLowerCase().includes(q) ||
          (n.referenceSource?.toLowerCase().includes(q) ?? false) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (selectedTags.size > 0) {
      list = list.filter((n) => n.tags.some((t) => selectedTags.has(t.toLowerCase())))
    }
    if (type === 'idea' && ideaStatusFilter !== 'wszystkie') {
      list = list.filter((n) => n.ideaStatus === ideaStatusFilter)
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [ctxNotes, type, search, selectedTags, ideaStatusFilter])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    ctxNotes
      .filter((n) => n.type === type && !n.archivedAt)
      .forEach((n) => n.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [ctxNotes, type])

  if (!notesCtx) return null

  const { addNote, archiveNote, togglePin } = notesCtx

  const toggleTag = (tag: string) => {
    const key = tag.toLowerCase()
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const clearUrlTag = () => {
    setSearchParams((p) => {
      const n = new URLSearchParams(p)
      n.delete('tag')
      return n
    })
    setSelectedTags(new Set())
  }

  const formatDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString(i18n.language === 'pl' ? 'pl-PL' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const emptyIcon = type === 'inbox' ? StickyNote : type === 'idea' ? Lightbulb : BookMarked
  const typeLabelPlural = t(`typeLabelPlural.${type}`)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--text-muted)" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('notesPage.searchPlaceholder')}
            className="min-h-11 w-full rounded-lg border border-(--border) bg-(--bg-dark) py-2 pr-4 pl-10 text-base text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-cyan)/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-(--accent-cyan)/45 bg-(--accent-cyan)/18 px-4 font-gaming text-sm tracking-wide text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/26"
        >
          <Plus className="h-4 w-4" />
          {t('notesPage.add')}
        </button>
      </div>

      {(type === 'idea' || allTags.length > 0) && (
        <div className="space-y-3 rounded-lg border border-(--border)/70 bg-(--bg-card)/20 px-3 py-3 sm:px-4">
          {type === 'idea' && (
            <label className="flex flex-col gap-1.5 sm:max-w-xs">
              <span className="text-base text-(--text-muted)">{t('notesPage.ideaStatusLabel')}</span>
              <select
                value={ideaStatusFilter}
                onChange={(e) => setIdeaStatusFilter(e.target.value as IdeaStatus | 'wszystkie')}
                className="min-h-11 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none"
              >
                <option value="wszystkie">{t('notesPage.allStatuses')}</option>
                {IDEA_STATUS_WORKFLOW_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {t(`ideaStatus.${k}`)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base text-(--text-muted)">{t('notesPage.tagsLabel')}</span>
                {tagFromUrl && (
                  <button
                    type="button"
                    onClick={clearUrlTag}
                    className="text-sm text-(--accent-cyan) hover:underline"
                  >
                    {t('notesPage.clearUrlFilter')}
                  </button>
                )}
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-theme sm:flex-wrap sm:overflow-visible">
                {allTags.map((tag) => {
                  const active = selectedTags.has(tag.toLowerCase())
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`shrink-0 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? 'border-(--accent-cyan)/50 bg-(--accent-cyan)/15 text-(--accent-cyan)'
                          : 'border-(--border) bg-(--bg-dark) text-(--text-muted) hover:border-(--accent-cyan)/30 hover:text-(--text-primary)'
                      }`}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base text-(--text-muted)">
          <span className="font-gaming text-(--text-primary)">{typeLabelPlural}</span>
          {' · '}
          {filtered.length} {t('notesPage.countSuffix', { count: filtered.length })}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={search || selectedTags.size > 0 ? t('notesPage.emptyResultsTitle') : t('notesPage.emptyTitle')}
          description={
            search || selectedTags.size > 0
              ? t('notesPage.emptyResultsDescription')
              : t('notesPage.emptyDescription', { type: typeLabelPlural })
          }
          action={
            !search && selectedTags.size === 0 ? (
              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/15 px-4 py-2 font-gaming text-sm text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/25"
              >
                <Plus className="h-4 w-4" />
                {t('notesPage.add')}
              </button>
            ) : undefined
          }
          compact
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => {
            const RefIcon = note.type === 'reference' ? REF_ICONS[note.referenceKind] : LinkIcon
            return (
              <article
                key={note.id}
                className="rounded-lg border border-(--border)/80 bg-(--bg-card)/25 p-4 transition-colors hover:border-(--accent-cyan)/25"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-start gap-2">
                    {note.pinned && (
                      <Pin
                        className="mt-0.5 h-4 w-4 shrink-0 fill-current text-(--accent-amber)"
                        aria-label={t('notesPage.pinnedAria')}
                      />
                    )}
                    <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-(--text-primary)">
                      {getNoteDisplayTitle(note)}
                    </h3>
                    {note.type === 'idea' && (
                      <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${IDEA_STATUS_BADGE[note.ideaStatus]}`}
                      >
                        {t(`ideaStatus.${note.ideaStatus}`)}
                      </span>
                    )}
                    {note.type === 'reference' && (
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-(--border) bg-(--bg-dark)/80 px-2 py-0.5 text-xs text-(--text-muted)"
                        title={t(`referenceKind.${note.referenceKind}`)}
                      >
                        <RefIcon className="h-3.5 w-3.5" />
                        {t(`referenceKind.${note.referenceKind}`)}
                      </span>
                    )}
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
                          className="inline-flex items-center gap-1.5 text-(--accent-cyan) hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {t('notesPage.openLink')}
                        </SafeExternalLink>
                      ) : (
                        <span className="text-(--text-muted)">{t('notesPage.noUrl')}</span>
                      )}
                      {note.referenceSource ? (
                        <p className="text-(--text-muted)">
                          <span className="text-(--text-primary)/90">{t('notesPage.source')}</span> {note.referenceSource}
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
                      <span>{note.tags.length > 0 ? '· ' : ''}{t('notesPage.editedOn', { date: formatDate(note.updatedAt) })}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                      <Tooltip content={note.pinned ? t('notesPage.unpin') : t('notesPage.pin')}>
                        <button
                          type="button"
                          onClick={() => togglePin(note.id)}
                          className={`rounded-lg p-2 transition-colors ${
                            note.pinned
                              ? 'bg-(--accent-amber)/10 text-(--accent-amber)'
                              : 'text-(--text-muted) hover:bg-(--bg-dark) hover:text-(--text-primary)'
                          }`}
                          aria-label={note.pinned ? t('notesPage.unpin') : t('notesPage.pin')}
                        >
                          {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                      </Tooltip>
                      <Tooltip content={t('notesPage.edit')}>
                        <button
                          type="button"
                          onClick={() => setEditingNote(note)}
                          className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-dark) hover:text-(--accent-cyan)"
                          aria-label={t('notesPage.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t('notesPage.archive')}>
                        <button
                          type="button"
                          onClick={() => setNotePendingArchive(note)}
                          className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-dark) hover:text-(--accent-magenta)"
                          aria-label={t('notesPage.archive')}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!notePendingArchive}
        title={t('notesPage.archiveConfirmTitle')}
        description={t('notesPage.archiveConfirmDescription')}
        emphasis={notePendingArchive ? getNoteDisplayTitle(notePendingArchive) : undefined}
        confirmLabel={t('notesPage.archiveConfirmLabel')}
        onClose={() => setNotePendingArchive(null)}
        onConfirm={() => {
          if (notePendingArchive) {
            archiveNote(notePendingArchive.id)
            setNotePendingArchive(null)
          }
        }}
      />

      <NoteModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        note={null}
        type={type}
        onSave={(data) => {
          addNote({
            type,
            content: data.content,
            tags: data.tags,
            title: data.title || null,
            ideaStatus: type === 'idea' ? data.ideaStatus : undefined,
            referenceKind: type === 'reference' ? data.referenceKind : undefined,
            referenceUrl: type === 'reference' ? data.referenceUrl : undefined,
            referenceSource: type === 'reference' ? data.referenceSource : undefined,
          })
          setIsAddOpen(false)
        }}
      />

      <NoteModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        type={type}
        onSave={(data) => {
          if (editingNote) {
            notesCtx.updateNote(editingNote.id, {
              content: data.content,
              tags: data.tags,
              title: data.title ?? null,
              ideaStatus: type === 'idea' ? data.ideaStatus : undefined,
              referenceKind: type === 'reference' ? data.referenceKind : undefined,
              referenceUrl: type === 'reference' ? data.referenceUrl : undefined,
              referenceSource: type === 'reference' ? data.referenceSource : undefined,
            })
            setEditingNote(null)
          }
        }}
      />
    </div>
  )
}
