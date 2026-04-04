import { useState, useMemo } from 'react'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Tooltip } from '../../components/Tooltip'
import { Plus, Trash2, Pencil, Search, StickyNote, Lightbulb, BookMarked } from 'lucide-react'
import { useNotes } from '../../context/NotesContext'
import type { Note, NoteType } from '../../context/NotesContext'
import { MarkdownContent } from '../../components/MarkdownContent'
import { NoteModal } from '../../components/NoteModal'

interface NotesPageProps {
  type: NoteType
}

const TYPE_LABELS: Record<NoteType, string> = {
  quick: 'Szybkie notatki',
  idea: 'Pomysły',
  reference: 'Referencje',
}

export function NotesPage({ type }: NotesPageProps) {
  const notesCtx = useNotes()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  if (!notesCtx) return null

  const { notes, addNote, updateNote, deleteNote } = notesCtx

  const filtered = useMemo(() => {
    let list = notes.filter((n) => n.type === type)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (selectedTags.size > 0) {
      list = list.filter((n) =>
        n.tags.some((t) => selectedTags.has(t.toLowerCase()))
      )
    }
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [notes, type, search, selectedTags])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes
      .filter((n) => n.type === type)
      .forEach((n) => n.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [notes, type])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      const key = tag.toLowerCase()
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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
          {allTags.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Filtruj tagi</label>
              <div className="flex flex-wrap gap-2">
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
          <Tooltip content="Dodaj nową notatkę">
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
            icon={type === 'quick' ? StickyNote : type === 'idea' ? Lightbulb : BookMarked}
            title={search || selectedTags.size > 0 ? 'Brak wyników' : 'Brak notatek'}
            description={
              search || selectedTags.size > 0
                ? 'Zmień wyszukiwanie lub odznacz filtry tagów.'
                : `Dodaj pierwszą notatkę w sekcji ${TYPE_LABELS[type]}.`
            }
            action={
              !search && selectedTags.size === 0 ? (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj notatkę
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((note) => (
              <div
                key={note.id}
                className="py-4 px-4 rounded-lg bg-(--bg-dark)/50 border border-(--border) hover:border-(--accent-cyan)/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <MarkdownContent content={note.content} />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-xs bg-(--bg-card) border border-(--border) text-(--text-muted)"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-(--text-muted) mt-2 font-mono">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip content="Edytuj">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                        aria-label="Edytuj"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Usuń">
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
                        aria-label="Usuń"
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

      <NoteModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        note={null}
        type={type}
        onSave={(data: { content: string; tags: string[] }) => {
          addNote({ ...data, type })
          setIsAddOpen(false)
        }}
      />

      <NoteModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        type={type}
        onSave={(data: { content: string; tags: string[] }) => {
          if (editingNote) {
            updateNote(editingNote.id, data)
            setEditingNote(null)
          }
        }}
      />
    </div>
  )
}
