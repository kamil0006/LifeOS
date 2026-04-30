import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  HelpCircle,
  Pin,
  Archive,
  CheckSquare,
  Target,
  FolderKanban,
  GraduationCap,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { useModalMotion } from '../lib/modalMotion'
import type { Note, NoteType, IdeaStatus } from '../context/NotesContext'
import {
  IDEA_STATUS_WORKFLOW_ORDER,
  type ReferenceKind,
  getNoteDisplayTitle,
  notePlainExcerpt,
} from '../lib/notesModel'
import { useNotes } from '../context/NotesContext'
import { useTodos } from '../context/TodosContext'
import { useLearning } from '../context/LearningContext'
import { useHabits } from '../context/HabitsContext'
import { MarkdownContent } from './MarkdownContent'
import { ConfirmDialog } from './ConfirmDialog'

export interface NoteModalSaveData {
  content: string
  tags: string[]
  title: string | null
  ideaStatus: IdeaStatus
  referenceKind: ReferenceKind
  referenceUrl: string | null
  referenceSource: string | null
}

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  note: Note | null
  type: NoteType
  onSave: (data: NoteModalSaveData) => void
}

const TYPE_LABELS: Record<NoteType, string> = {
  inbox: 'notatkę (Inbox)',
  idea: 'pomysł',
  reference: 'referencję',
}

const IDEA_LABELS_MAP: Record<IdeaStatus, string> = {
  nowy: 'Nowy',
  do_sprawdzenia: 'Do sprawdzenia',
  w_realizacji: 'W realizacji',
  zrobiony: 'Zrobiony',
  odrzucony: 'Odrzucony',
}

const IDEA_OPTIONS: { value: IdeaStatus; label: string }[] = IDEA_STATUS_WORKFLOW_ORDER.map(
  (value) => ({
    value,
    label: IDEA_LABELS_MAP[value],
  })
)

const REF_OPTIONS: { value: ReferenceKind; label: string }[] = [
  { value: 'link', label: 'Link' },
  { value: 'ksiazka', label: 'Książka' },
  { value: 'artykul', label: 'Artykuł' },
  { value: 'wideo', label: 'Wideo' },
  { value: 'cytat', label: 'Cytat' },
  { value: 'inne', label: 'Inne' },
]

type MdMode = 'edit' | 'preview' | 'split'

const MARKDOWN_HINT = (
  <div className="text-sm text-(--text-muted) font-mono space-y-1">
    <p>
      <strong className="text-(--text-primary)">**tekst**</strong> – pogrubienie
    </p>
    <p>
      <strong className="text-(--text-primary)">*tekst*</strong> – kursywa
    </p>
    <p>
      <strong className="text-(--text-primary)">## Nagłówek</strong> – nagłówek 2
    </p>
    <p>
      <strong className="text-(--text-primary)">- element</strong> – lista punktowana
    </p>
    <p>
      <strong className="text-(--text-primary)">[link](url)</strong> – odnośnik
    </p>
    <p>
      <strong className="text-(--text-primary)">`kod`</strong> – kod inline
    </p>
  </div>
)

function buildSyntheticNote(
  type: NoteType,
  content: string,
  title: string | null,
  ideaStatus: IdeaStatus,
  referenceKind: ReferenceKind,
  referenceUrl: string | null,
  referenceSource: string | null
): Note {
  const now = new Date().toISOString()
  return {
    id: '_',
    type,
    content,
    tags: [],
    createdAt: now,
    updatedAt: now,
    title,
    pinned: false,
    archivedAt: null,
    ideaStatus,
    referenceKind,
    referenceUrl,
    referenceSource,
  }
}

export function NoteModal({ isOpen, onClose, note, type, onSave }: NoteModalProps) {
  const navigate = useNavigate()
  const notesCtx = useNotes()
  const { addTodo } = useTodos()
  const learningCtx = useLearning()
  const { addGoal } = useHabits()
  const { backdrop, panel } = useModalMotion()
  const [archivePromptOpen, setArchivePromptOpen] = useState(false)

  const getInitialForm = useCallback(() => {
    const titleVal = note?.title?.trim() ?? ''
    return {
      titleInput: titleVal,
      content: note?.content ?? '',
      tagsInput: note?.tags.join(', ') ?? '',
      ideaStatus: (note?.ideaStatus ?? 'nowy') as IdeaStatus,
      referenceKind: (note?.referenceKind ?? 'link') as ReferenceKind,
      referenceUrl: note?.referenceUrl ?? '',
      referenceSourceInput: note?.referenceSource ?? '',
      showMarkdownHelp: false,
      error: '',
      mdMode: 'edit' as MdMode,
      convertOpen: false,
      goalTarget: '1',
      goalUnit: '',
    }
  }, [note])

  const [form, setForm] = useState(getInitialForm)
  const updateField = <K extends keyof ReturnType<typeof getInitialForm>>(
    key: K,
    value: ReturnType<typeof getInitialForm>[K]
  ) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (isOpen) {
      setForm(getInitialForm())
      setArchivePromptOpen(false)
    }
  }, [isOpen, getInitialForm])

  const {
    titleInput,
    content,
    tagsInput,
    ideaStatus,
    referenceKind,
    referenceUrl,
    referenceSourceInput,
    showMarkdownHelp,
    error,
    mdMode,
    convertOpen,
    goalTarget,
    goalUnit,
  } = form
  const isEdit = !!note

  const synthetic = useMemo(
    () =>
      buildSyntheticNote(
        type,
        content,
        titleInput.trim() ? titleInput.trim() : null,
        ideaStatus,
        referenceKind,
        referenceUrl.trim() ? referenceUrl.trim() : null,
        referenceSourceInput.trim() ? referenceSourceInput.trim() : null
      ),
    [type, content, titleInput, ideaStatus, referenceKind, referenceUrl, referenceSourceInput]
  )

  const displayTitle = getNoteDisplayTitle(synthetic)

  const parseTags = () =>
    tagsInput
      .split(/[,\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

  const gatherSaveData = (): NoteModalSaveData => ({
    content: content.trim(),
    tags: parseTags(),
    title: titleInput.trim() ? titleInput.trim() : null,
    ideaStatus,
    referenceKind,
    referenceUrl: referenceUrl.trim() ? referenceUrl.trim() : null,
    referenceSource: referenceSourceInput.trim() ? referenceSourceInput.trim() : null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateField('error', '')
    const trimmed = content.trim()
    if (!trimmed) {
      updateField('error', 'Treść nie może być pusta.')
      return
    }
    onSave(gatherSaveData())
    onClose()
  }

  const handlePin = () => {
    if (!note || !notesCtx) return
    notesCtx.togglePin(note.id)
    onClose()
  }

  const handleArchiveClick = () => {
    if (!note || !notesCtx) return
    setArchivePromptOpen(true)
  }

  const handleConvertTodo = () => {
    if (!note) return
    const text = notePlainExcerpt(displayTitle + '\n' + content, 200)
    addTodo({ text: text || displayTitle, noteId: note.id })
    navigate('/todo')
    onClose()
  }

  const handleConvertGoal = async () => {
    const target = Math.max(1, parseInt(goalTarget, 10) || 1)
    const unit = goalUnit.trim() || undefined
    await addGoal({
      name: displayTitle,
      target,
      current: 0,
      unit,
    })
    navigate('/habits')
    onClose()
  }

  const handleConvertProject = () => {
    learningCtx?.addProject({
      name: displayTitle,
      description: content.trim(),
      status: 'pomysl',
    })
    navigate('/learning/projects')
    onClose()
  }

  const handleConvertCourse = () => {
    const url = referenceUrl.trim() || undefined
    learningCtx?.addCourse({
      name: displayTitle,
      progress: 0,
      status: 'zaplanowany',
      platformUrl: url,
    })
    navigate('/learning/courses')
    onClose()
  }

  const handleConvertBook = () => {
    learningCtx?.addBook({
      title: displayTitle,
      status: 'chce_przeczytac',
      notes: notePlainExcerpt(content, 400) || undefined,
    })
    navigate('/learning/books')
    onClose()
  }

  const showSplit = mdMode === 'split'
  const showPreviewOnly = mdMode === 'preview'
  const panelMax = showSplit ? 'max-w-5xl' : 'max-w-lg'

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="note-backdrop"
            {...backdrop}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              key="note-panel"
              {...panel}
              className={`pointer-events-auto relative my-8 w-full ${panelMax} rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
                  {isEdit ? 'Edytuj notatkę' : `Dodaj ${TYPE_LABELS[type]}`}
                </h3>
                <button
                  type="button"
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
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Tytuł (opcjonalnie)</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => updateField('titleInput', e.target.value)}
                    placeholder="Puste = pierwsza linia treści"
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>

                {type === 'idea' && (
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Status pomysłu</label>
                    <select
                      value={ideaStatus}
                      onChange={(e) => updateField('ideaStatus', e.target.value as IdeaStatus)}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                    >
                      {IDEA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {type === 'reference' && (
                  <>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">Typ referencji</label>
                      <select
                        value={referenceKind}
                        onChange={(e) => updateField('referenceKind', e.target.value as ReferenceKind)}
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      >
                        {REF_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">URL (opcjonalnie)</label>
                      <input
                        type="url"
                        value={referenceUrl}
                        onChange={(e) => updateField('referenceUrl', e.target.value)}
                        placeholder="https://…"
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono text-sm focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">
                        Źródło (opcjonalnie)
                      </label>
                      <input
                        type="text"
                        value={referenceSourceInput}
                        onChange={(e) => updateField('referenceSourceInput', e.target.value)}
                        placeholder="Np. autor, książka, wydawca – przydatne przy cytacie"
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-base text-(--text-muted) font-gaming">Treść (Markdown)</span>
                    <div className="flex rounded-lg border border-(--border) overflow-hidden">
                      {(['edit', 'preview', 'split'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateField('mdMode', m)}
                          className={`px-3 py-1.5 text-sm font-gaming capitalize ${
                            mdMode === m
                              ? 'bg-(--accent-cyan)/20 text-(--accent-cyan)'
                              : 'text-(--text-muted) hover:bg-(--bg-dark)'
                          }`}
                        >
                          {m === 'edit' ? 'Edycja' : m === 'preview' ? 'Podgląd' : 'Split'}
                        </button>
                      ))}
                    </div>
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
                  <div
                    className={
                      showSplit ? 'grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[220px]' : 'min-h-[220px]'
                    }
                  >
                    {(mdMode === 'edit' || showSplit) && (
                      <textarea
                        value={content}
                        onChange={(e) => updateField('content', e.target.value)}
                        rows={showSplit ? 12 : 8}
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono text-sm focus:border-(--accent-cyan) focus:outline-none resize-y min-h-[180px]"
                      />
                    )}
                    {(showPreviewOnly || showSplit) && (
                      <div
                        className={`rounded-lg border border-(--border) bg-(--bg-dark)/80 px-4 py-3 overflow-y-auto max-h-[320px] ${
                          showPreviewOnly ? '' : 'min-h-[180px]'
                        }`}
                      >
                        <MarkdownContent content={content || '*Brak treści*'} />
                      </div>
                    )}
                  </div>
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

                {isEdit && notesCtx && note && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-(--border)">
                    <button
                      type="button"
                      onClick={handlePin}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--accent-amber) font-gaming text-sm"
                    >
                      <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current text-(--accent-amber)' : ''}`} />
                      {note.pinned ? 'Odepnij' : 'Przypnij'}
                    </button>
                    <button
                      type="button"
                      onClick={handleArchiveClick}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--accent-magenta) font-gaming text-sm"
                    >
                      <Archive className="w-4 h-4" />
                      Archiwizuj
                    </button>
                  </div>
                )}

                <div className="border-t border-(--border) pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => updateField('convertOpen', !convertOpen)}
                    className="flex items-center gap-2 text-base text-(--accent-cyan) font-gaming hover:underline"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${convertOpen ? 'rotate-180' : ''}`} />
                    Przekształć w…
                  </button>
                  {convertOpen && (
                    <div className="flex flex-col gap-3 pl-1">
                      {type === 'inbox' && (
                        <>
                          <button
                            type="button"
                            onClick={handleConvertTodo}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming text-sm hover:border-(--accent-cyan)/50 w-fit"
                          >
                            <CheckSquare className="w-4 h-4 text-(--accent-cyan)" />
                            Zadanie (To-do)
                          </button>
                          <div className="rounded-lg border border-(--border) bg-(--bg-dark)/50 p-3 space-y-2 max-w-md">
                            <p className="text-base text-(--text-muted) font-gaming">Cel (nawyki)</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              <label className="text-base text-(--text-muted)">Wartość docelowa</label>
                              <input
                                type="number"
                                min={1}
                                value={goalTarget}
                                onChange={(e) => updateField('goalTarget', e.target.value)}
                                className="w-24 px-2 py-1 rounded bg-(--bg-dark) border border-(--border) font-mono text-sm"
                              />
                              <input
                                type="text"
                                value={goalUnit}
                                onChange={(e) => updateField('goalUnit', e.target.value)}
                                placeholder="jednostka (np. książek)"
                                className="flex-1 min-w-[120px] px-2 py-1 rounded bg-(--bg-dark) border border-(--border) text-sm font-gaming"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleConvertGoal()}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming text-sm"
                            >
                              <Target className="w-4 h-4" />
                              Utwórz cel
                            </button>
                          </div>
                        </>
                      )}
                      {type === 'idea' && (
                        <button
                          type="button"
                          onClick={handleConvertProject}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming text-sm hover:border-(--accent-cyan)/50 w-fit"
                        >
                          <FolderKanban className="w-4 h-4 text-(--accent-amber)" />
                          Projekt (Nauka)
                        </button>
                      )}
                      {type === 'reference' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleConvertCourse}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming text-sm hover:border-(--accent-cyan)/50"
                          >
                            <GraduationCap className="w-4 h-4 text-(--accent-magenta)" />
                            Kurs
                          </button>
                          <button
                            type="button"
                            onClick={handleConvertBook}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming text-sm hover:border-(--accent-cyan)/50"
                          >
                            <BookOpen className="w-4 h-4 text-(--accent-green)" />
                            Książka
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 flex-wrap">
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
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {createPortal(modalContent, document.body)}
      <ConfirmDialog
        zLayer="stacked"
        isOpen={archivePromptOpen && !!note && !!notesCtx}
        title="Zarchiwizować notatkę?"
        description="Notatka zniknie z aktywnej listy. Możesz ją przywrócić z zakładki Archiwum."
        emphasis={note ? getNoteDisplayTitle(note) : undefined}
        confirmLabel="Archiwizuj"
        onCancel={() => setArchivePromptOpen(false)}
        onConfirm={() => {
          if (note && notesCtx) {
            notesCtx.archiveNote(note.id)
            setArchivePromptOpen(false)
            onClose()
          }
        }}
      />
    </>
  )
}
