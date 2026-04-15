import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, HelpCircle } from 'lucide-react'
import type { Note, NoteType } from '../context/NotesContext'

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  note: Note | null
  type: NoteType
  onSave: (data: { content: string; tags: string[] }) => void
}

const TYPE_LABELS: Record<NoteType, string> = {
  quick: 'Szybka notatka',
  idea: 'Pomysł',
  reference: 'Referencja',
}

const MARKDOWN_HINT = (
  <div className="text-sm text-(--text-muted) font-mono space-y-1">
    <p><strong className="text-(--text-primary)">**tekst**</strong> – pogrubienie</p>
    <p><strong className="text-(--text-primary)">*tekst*</strong> – kursywa</p>
    <p><strong className="text-(--text-primary)">## Nagłówek</strong> – nagłówek 2</p>
    <p><strong className="text-(--text-primary)">- element</strong> – lista punktowana</p>
    <p><strong className="text-(--text-primary)">[link](url)</strong> – odnośnik</p>
    <p><strong className="text-(--text-primary)">`kod`</strong> – kod inline</p>
  </div>
)

export function NoteModal({ isOpen, onClose, note, type, onSave }: NoteModalProps) {
  const getInitialForm = useCallback(
    () => ({
      content: note?.content ?? '',
      tagsInput: note?.tags.join(', ') ?? '',
      showMarkdownHelp: false,
      error: '',
    }),
    [note]
  )
  const [form, setForm] = useState(getInitialForm)
  const updateField = <K extends keyof ReturnType<typeof getInitialForm>>(key: K, value: ReturnType<typeof getInitialForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (isOpen) setForm(getInitialForm())
  }, [isOpen, getInitialForm])

  const { content, tagsInput, showMarkdownHelp, error } = form
  const isEdit = !!note

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateField('error', '')
    const trimmed = content.trim()
    if (!trimmed) {
      updateField('error', 'Treść nie może być pusta.')
      return
    }
    const tags = tagsInput
      .split(/[,\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    onSave({ content: trimmed, tags })
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              {isEdit ? 'Edytuj notatkę' : `Dodaj ${TYPE_LABELS[type].toLowerCase()}`}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-[#e74c3c] font-gaming px-3 py-2 rounded-lg bg-[#e74c3c]/10 border border-[#e74c3c]/30">
                {error}
              </p>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-base text-(--text-muted) font-gaming">
                  Treść (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, showMarkdownHelp: !f.showMarkdownHelp }))}
                  className="p-1 rounded text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                  title="Składnia Markdown"
                  aria-label="Pokaż składnię Markdown"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {showMarkdownHelp && (
                <div className="mb-2 p-3 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-muted)">
                  {MARKDOWN_HINT}
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => updateField('content', e.target.value)}
                rows={8}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono text-sm focus:border-(--accent-cyan) focus:outline-none resize-y"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">
                Tagi (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => updateField('tagsInput', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-gaming transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming hover:opacity-90 transition-opacity"
              >
                {isEdit ? 'Zapisz' : 'Dodaj'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
