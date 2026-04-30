import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../../components/Card'
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
import type { ReferenceKind } from '../../lib/notesModel'
import {
  IDEA_STATUS_WORKFLOW_ORDER,
  getNoteDisplayTitle,
  notePlainExcerpt,
} from '../../lib/notesModel'

interface NotesPageProps {
  type: NoteType
}

const TYPE_LABELS: Record<NoteType, string> = {
  inbox: 'Inbox',
  idea: 'Pomysły',
  reference: 'Referencje',
}

const IDEA_LABELS: Record<IdeaStatus, string> = {
  nowy: 'Nowy',
  do_sprawdzenia: 'Do sprawdzenia',
  w_realizacji: 'W realizacji',
  zrobiony: 'Zrobiony',
  odrzucony: 'Odrzucony',
}

const IDEA_STATUS_BADGE: Record<IdeaStatus, string> = {
  nowy: 'border-sky-400/50 bg-sky-400/12 text-sky-200',
  do_sprawdzenia: 'border-(--accent-amber)/55 bg-(--accent-amber)/14 text-(--accent-amber)',
  w_realizacji: 'border-violet-400/45 bg-violet-500/14 text-violet-200',
  zrobiony: 'border-(--accent-green)/50 bg-(--accent-green)/14 text-(--accent-green)',
  odrzucony: 'border-(--border) bg-(--bg-dark)/90 text-(--text-muted)',
}

const IDEA_CARD_ACCENT: Record<IdeaStatus, string> = {
  nowy: 'border-l-sky-400/80',
  do_sprawdzenia: 'border-l-(--accent-amber)',
  w_realizacji: 'border-l-violet-400/75',
  zrobiony: 'border-l-(--accent-green)',
  odrzucony: 'border-l-(--border)',
}

const REF_ICONS: Record<ReferenceKind, typeof LinkIcon> = {
  link: LinkIcon,
  ksiazka: BookOpen,
  artykul: Newspaper,
  wideo: Video,
  cytat: Quote,
  inne: CircleEllipsis,
}

const REF_LABELS: Record<ReferenceKind, string> = {
  link: 'Link',
  ksiazka: 'Książka',
  artykul: 'Artykuł',
  wideo: 'Wideo',
  cytat: 'Cytat',
  inne: 'Inne',
}

export function NotesPage({ type }: NotesPageProps) {
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
    return d.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const emptyIcon = type === 'inbox' ? StickyNote : type === 'idea' ? Lightbulb : BookMarked

  return (
    <div className="space-y-6">
      <Card title="Wyszukaj i filtruj">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Wyszukaj</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          </div>
          {type === 'idea' && (
            <div className="min-w-[200px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
              <select
                value={ideaStatusFilter}
                onChange={(e) =>
                  setIdeaStatusFilter(e.target.value as IdeaStatus | 'wszystkie')
                }
                className="w-full px-4 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              >
                <option value="wszystkie">Wszystkie</option>
                {IDEA_STATUS_WORKFLOW_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {IDEA_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          )}
          {allTags.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Filtruj tagi</label>
              <div className="flex flex-wrap gap-2 items-center">
                {tagFromUrl && (
                  <button
                    type="button"
                    onClick={clearUrlTag}
                    className="text-sm text-(--accent-cyan) font-gaming underline-offset-2 hover:underline"
                  >
                    Wyczyść z URL
                  </button>
                )}
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-md text-sm font-gaming transition-colors ${
                      selectedTags.has(tag.toLowerCase())
                        ? 'bg-(--accent-cyan) text-(--bg-dark)'
                        : 'bg-(--bg-dark) border border-(--border) text-(--text-muted) hover:border-(--accent-cyan)/50'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Tooltip content="Dodaj">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Dodaj
            </button>
          </Tooltip>
        </div>
      </Card>

      <Card title={TYPE_LABELS[type]}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={search || selectedTags.size > 0 ? 'Brak wyników' : 'Brak notatek'}
            description={
              search || selectedTags.size > 0
                ? 'Zmień wyszukiwanie lub odznacz filtry tagów.'
                : `Dodaj pierwszą pozycję w ${TYPE_LABELS[type]}.`
            }
            action={
              !search && selectedTags.size === 0 ? (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((note) => {
              const RefIcon = note.type === 'reference' ? REF_ICONS[note.referenceKind] : LinkIcon
              const ideaAccent =
                note.type === 'idea' ? IDEA_CARD_ACCENT[note.ideaStatus] : ''
              return (
                <div
                  key={note.id}
                  className={`rounded-lg border border-(--border) bg-(--bg-dark)/50 px-3.5 py-2.5 hover:border-(--accent-cyan)/30 transition-colors ${
                    note.type === 'idea' ? `border-l-4 ${ideaAccent}` : ''
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2 flex-wrap">
                        {note.pinned && (
                          <Pin
                            className="w-3.5 h-3.5 shrink-0 text-(--accent-amber) mt-1 fill-current opacity-90"
                            aria-hidden
                          />
                        )}
                        <h3 className="font-semibold text-(--text-primary) font-gaming truncate min-w-0 flex-1">
                          {getNoteDisplayTitle(note)}
                        </h3>
                        {note.type === 'idea' && (
                          <span
                            className={`shrink-0 text-sm px-3 py-1 rounded-md font-gaming font-semibold border ${IDEA_STATUS_BADGE[note.ideaStatus]}`}
                          >
                            {IDEA_LABELS[note.ideaStatus]}
                          </span>
                        )}
                        {note.type === 'reference' && (
                          <span
                            className="shrink-0 inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-md bg-(--bg-card) border border-(--border) text-(--text-muted) font-gaming"
                            title={REF_LABELS[note.referenceKind]}
                          >
                            <RefIcon className="w-3.5 h-3.5" />
                            {REF_LABELS[note.referenceKind]}
                          </span>
                        )}
                      </div>
                      <p className="text-base text-(--text-muted) mt-1 line-clamp-2">
                        {notePlainExcerpt(note.content)}
                      </p>
                      {note.type === 'reference' && (
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {note.referenceUrl ? (
                              <a
                                href={note.referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={note.referenceUrl}
                                className="inline-flex items-center gap-1.5 text-sm font-gaming font-semibold text-(--accent-cyan) hover:underline"
                              >
                                <ExternalLink className="w-4 h-4 shrink-0" />
                                Otwórz link
                              </a>
                            ) : (
                              <span className="text-base text-(--text-muted) font-gaming">
                                Brak adresu URL
                              </span>
                            )}
                          </div>
                          {note.referenceSource ? (
                            <p className="text-base text-(--text-muted)">
                              <span className="font-gaming text-(--text-primary)/90">Źródło:</span>{' '}
                              {note.referenceSource}
                            </p>
                          ) : null}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-sm bg-(--bg-card) border border-(--border) text-(--text-muted)"
                          >
                            #{tag}
                          </span>
                        ))}
                        <span className="text-base text-(--text-muted)">
                          · edytowano {formatDate(note.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip content={note.pinned ? 'Odepnij' : 'Przypnij'}>
                        <button
                          type="button"
                          onClick={() => togglePin(note.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            note.pinned
                              ? 'text-(--accent-amber) bg-(--accent-amber)/10'
                              : 'text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10'
                          }`}
                          aria-label={note.pinned ? 'Odepnij' : 'Przypnij'}
                        >
                          {note.pinned ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          )}
                        </button>
                      </Tooltip>
                      <Tooltip content="Edytuj">
                        <button
                          type="button"
                          onClick={() => setEditingNote(note)}
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                          aria-label="Edytuj"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Archiwizuj">
                        <button
                          type="button"
                          onClick={() => setNotePendingArchive(note)}
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-magenta) hover:bg-(--accent-magenta)/10 transition-colors"
                          aria-label="Archiwizuj"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!notePendingArchive}
        title="Zarchiwizować notatkę?"
        description="Notatka zniknie z aktywnej listy. Możesz ją przywrócić z zakładki Archiwum."
        emphasis={notePendingArchive ? getNoteDisplayTitle(notePendingArchive) : undefined}
        confirmLabel="Archiwizuj"
        onCancel={() => setNotePendingArchive(null)}
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
