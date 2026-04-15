import { NoteModal } from './NoteModal'
import { useQuickAdd } from '../context/QuickAddContext'
import { useNotes } from '../context/NotesContext'

/** Szybka notatka (Ctrl+Shift+Y) — typ „quick”, jak w zakładce Szybkie notatki. */
export function GlobalQuickNote() {
  const { quickNoteOpen, closeQuickNote } = useQuickAdd()
  const notesCtx = useNotes()

  if (!notesCtx) return null

  const handleSave = (data: { content: string; tags: string[] }) => {
    notesCtx.addNote({ type: 'quick', content: data.content, tags: data.tags })
  }

  return (
    <NoteModal
      isOpen={quickNoteOpen}
      onClose={closeQuickNote}
      note={null}
      type="quick"
      onSave={handleSave}
    />
  )
}
