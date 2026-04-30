import { NoteModal } from './NoteModal'
import { useQuickAdd } from '../context/QuickAddContext'
import { useNotes } from '../context/NotesContext'

/** Szybka notatka (Ctrl+Shift+Y) — trafia do Inbox. */
export function GlobalQuickNote() {
  const { quickNoteOpen, closeQuickNote } = useQuickAdd()
  const notesCtx = useNotes()

  if (!notesCtx) return null

  const handleSave = (data: { content: string; tags: string[]; title: string | null }) => {
    notesCtx.addNote({ type: 'inbox', content: data.content, tags: data.tags, title: data.title })
  }

  return (
    <NoteModal
      isOpen={quickNoteOpen}
      onClose={closeQuickNote}
      note={null}
      type="inbox"
      onSave={handleSave}
    />
  )
}
