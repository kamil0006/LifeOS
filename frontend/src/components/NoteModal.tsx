import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ModalShell } from './ModalShell'
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

const REF_KINDS: ReferenceKind[] = ['link', 'ksiazka', 'artykul', 'wideo', 'cytat', 'inne']

type MdMode = 'edit' | 'preview' | 'split'

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
  const { t } = useTranslation('notes')
  const navigate = useNavigate()
  const notesCtx = useNotes()
  const { addTodo } = useTodos()
  const learningCtx = useLearning()
  const { addGoal } = useHabits()
  const [archivePromptOpen, setArchivePromptOpen] = useState(false)

  const TYPE_LABELS: Record<NoteType, string> = {
    inbox: t('noteModal.typeInbox'),
    idea: t('noteModal.typeIdea'),
    reference: t('noteModal.typeReference'),
  }

  const markdownHint = (
    <div className="text-sm text-(--text-muted) font-mono space-y-1">
      <p>
        <strong className="text-(--text-primary)">**text**</strong> – {t('noteModal.markdown.bold')}
      </p>
      <p>
        <strong className="text-(--text-primary)">*text*</strong> – {t('noteModal.markdown.italic')}
      </p>
      <p>
        <strong className="text-(--text-primary)">## Heading</strong> – {t('noteModal.markdown.heading')}
      </p>
      <p>
        <strong className="text-(--text-primary)">- item</strong> – {t('noteModal.markdown.list')}
      </p>
      <p>
        <strong className="text-(--text-primary)">[link](url)</strong> – {t('noteModal.markdown.link')}
      </p>
      <p>
        <strong className="text-(--text-primary)">`code`</strong> – {t('noteModal.markdown.code')}
      </p>
    </div>
  )

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
      updateField('error', t('noteModal.contentRequired'))
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

  const modeLabel = (m: MdMode) =>
    m === 'edit' ? t('noteModal.modeEdit') : m === 'preview' ? t('noteModal.modePreview') : t('noteModal.modeSplit')

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={panelMax}
      backdropKey="note-backdrop"
      panelKey="note-panel"
    >
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-(--text-primary) font-display">
                  {isEdit ? t('noteModal.editTitle') : `${t('noteModal.addTitlePrefix')} ${TYPE_LABELS[type]}`}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
                  aria-label={t('noteModal.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-[#e74c3c] font-display px-3 py-2 rounded-lg bg-[#e74c3c]/10 border border-[#e74c3c]/30">
                    {error}
                  </p>
                )}

                <div>
                  <label className="block text-base text-(--text-muted) font-display mb-1">{t('noteModal.titleLabel')}</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => updateField('titleInput', e.target.value)}
                    placeholder={t('noteModal.titlePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                  />
                </div>

                {type === 'idea' && (
                  <div>
                    <label className="block text-base text-(--text-muted) font-display mb-1">{t('noteModal.ideaStatusLabel')}</label>
                    <select
                      value={ideaStatus}
                      onChange={(e) => updateField('ideaStatus', e.target.value as IdeaStatus)}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                    >
                      {IDEA_STATUS_WORKFLOW_ORDER.map((value) => (
                        <option key={value} value={value}>
                          {t(`ideaStatus.${value}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {type === 'reference' && (
                  <>
                    <div>
                      <label className="block text-base text-(--text-muted) font-display mb-1">{t('noteModal.referenceKindLabel')}</label>
                      <select
                        value={referenceKind}
                        onChange={(e) => updateField('referenceKind', e.target.value as ReferenceKind)}
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                      >
                        {REF_KINDS.map((value) => (
                          <option key={value} value={value}>
                            {t(`referenceKind.${value}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-display mb-1">{t('noteModal.urlLabel')}</label>
                      <input
                        type="url"
                        value={referenceUrl}
                        onChange={(e) => updateField('referenceUrl', e.target.value)}
                        placeholder="https://…"
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono text-sm focus:border-(--accent) focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-display mb-1">
                        {t('noteModal.sourceLabel')}
                      </label>
                      <input
                        type="text"
                        value={referenceSourceInput}
                        onChange={(e) => updateField('referenceSourceInput', e.target.value)}
                        placeholder={t('noteModal.sourcePlaceholder')}
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-base text-(--text-muted) font-display">{t('noteModal.contentLabel')}</span>
                    <div className="flex rounded-lg border border-(--border) overflow-hidden">
                      {(['edit', 'preview', 'split'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateField('mdMode', m)}
                          className={`px-3 py-1.5 text-sm font-display capitalize ${
                            mdMode === m
                              ? 'bg-(--accent)/20 text-(--accent)'
                              : 'text-(--text-muted) hover:bg-(--bg-dark)'
                          }`}
                        >
                          {modeLabel(m)}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, showMarkdownHelp: !f.showMarkdownHelp }))}
                      className="p-1 rounded text-(--text-muted) hover:text-(--accent) hover:bg-(--accent)/10 transition-colors"
                      title={t('noteModal.markdownSyntax')}
                      aria-label={t('noteModal.showMarkdownSyntax')}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  {showMarkdownHelp && (
                    <div className="mb-2 p-3 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-muted)">
                      {markdownHint}
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
                        className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono text-sm focus:border-(--accent) focus:outline-none resize-y min-h-[180px]"
                      />
                    )}
                    {(showPreviewOnly || showSplit) && (
                      <div
                        className={`rounded-lg border border-(--border) bg-(--bg-dark)/80 px-4 py-3 overflow-y-auto max-h-[320px] ${
                          showPreviewOnly ? '' : 'min-h-[180px]'
                        }`}
                      >
                        <MarkdownContent content={content || t('noteModal.noContentPreview')} />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base text-(--text-muted) font-display mb-1">
                    {t('noteModal.tagsLabel')}
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => updateField('tagsInput', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display focus:border-(--accent) focus:outline-none"
                  />
                </div>

                {isEdit && notesCtx && note && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-(--border)">
                    <button
                      type="button"
                      onClick={handlePin}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--warning) font-display text-sm"
                    >
                      <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current text-(--warning)' : ''}`} />
                      {note.pinned ? t('noteModal.unpin') : t('noteModal.pin')}
                    </button>
                    <button
                      type="button"
                      onClick={handleArchiveClick}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--accent-2) font-display text-sm"
                    >
                      <Archive className="w-4 h-4" />
                      {t('noteModal.archive')}
                    </button>
                  </div>
                )}

                <div className="border-t border-(--border) pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => updateField('convertOpen', !convertOpen)}
                    className="flex items-center gap-2 text-base text-(--accent) font-display hover:underline"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${convertOpen ? 'rotate-180' : ''}`} />
                    {t('noteModal.convertTo')}
                  </button>
                  {convertOpen && (
                    <div className="flex flex-col gap-3 pl-1">
                      {type === 'inbox' && (
                        <>
                          <button
                            type="button"
                            onClick={handleConvertTodo}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display text-sm hover:border-(--accent)/50 w-fit"
                          >
                            <CheckSquare className="w-4 h-4 text-(--accent)" />
                            {t('noteModal.convertTodo')}
                          </button>
                          <div className="rounded-lg border border-(--border) bg-(--bg-dark)/50 p-3 space-y-2 max-w-md">
                            <p className="text-base text-(--text-muted) font-display">{t('noteModal.convertGoalTitle')}</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              <label className="text-base text-(--text-muted)">{t('noteModal.goalTargetLabel')}</label>
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
                                placeholder={t('noteModal.goalUnitPlaceholder')}
                                className="flex-1 min-w-[120px] px-2 py-1 rounded bg-(--bg-dark) border border-(--border) text-sm font-display"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleConvertGoal()}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--accent)/15 text-(--accent) border border-(--accent)/40 font-display text-sm"
                            >
                              <Target className="w-4 h-4" />
                              {t('noteModal.createGoal')}
                            </button>
                          </div>
                        </>
                      )}
                      {type === 'idea' && (
                        <button
                          type="button"
                          onClick={handleConvertProject}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display text-sm hover:border-(--accent)/50 w-fit"
                        >
                          <FolderKanban className="w-4 h-4 text-(--warning)" />
                          {t('noteModal.convertProject')}
                        </button>
                      )}
                      {type === 'reference' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleConvertCourse}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display text-sm hover:border-(--accent)/50"
                          >
                            <GraduationCap className="w-4 h-4 text-(--accent-2)" />
                            {t('noteModal.convertCourse')}
                          </button>
                          <button
                            type="button"
                            onClick={handleConvertBook}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-display text-sm hover:border-(--accent)/50"
                          >
                            <BookOpen className="w-4 h-4 text-(--positive)" />
                            {t('noteModal.convertBook')}
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
                    className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-display transition-colors"
                  >
                    {t('noteModal.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-(--accent) text-(--bg-dark) font-display hover:opacity-90 transition-opacity"
                  >
                    {isEdit ? t('noteModal.save') : t('noteModal.add')}
                  </button>
                </div>
              </form>
    </ModalShell>
  )

  return (
    <>
      {modalContent}
      <ConfirmDialog
        zBackdrop={10030}
        zPanel={10031}
        isOpen={archivePromptOpen && !!note && !!notesCtx}
        title={t('noteModal.archiveConfirmTitle')}
        description={t('noteModal.archiveConfirmDescription')}
        emphasis={note ? getNoteDisplayTitle(note) : undefined}
        confirmLabel={t('noteModal.archiveConfirmLabel')}
        onClose={() => setArchivePromptOpen(false)}
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
