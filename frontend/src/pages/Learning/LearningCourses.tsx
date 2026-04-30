import { useState, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../../components/Card'
import { LearningCard } from '../../components/learning/LearningCard'
import { AnimatePresence } from 'framer-motion'
import { Plus, ExternalLink, TrendingUp, X, ChevronDown, Archive, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearning } from '../../context/LearningContext'
import { useModalMotion } from '../../lib/modalMotion'
import { useUndoDelete } from '../../components/learning/UndoToast'
import type { Course } from '../../context/LearningContext'

const STATUS_OPTIONS: { value: Course['status']; label: string }[] = [
  { value: 'zaplanowany', label: 'Zaplanowany' },
  { value: 'w_trakcie', label: 'W trakcie' },
  { value: 'ukonczony', label: 'Ukończony' },
]

const STATUS_GROUPS: { status: Course['status']; label: string }[] = [
  { status: 'w_trakcie', label: 'W trakcie' },
  { status: 'zaplanowany', label: 'Zaplanowane' },
  { status: 'ukonczony', label: 'Ukończone' },
]

function StatusBadge({ status }: { status: Course['status'] }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status)
  const bgMap: Record<Course['status'], string> = {
    zaplanowany: 'bg-(--bg-dark) text-(--text-muted) border border-(--border)',
    w_trakcie: 'bg-(--accent-cyan)/10 text-(--accent-cyan) border border-(--accent-cyan)/30',
    ukonczony: 'bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-gaming ${bgMap[status]}`}>
      {opt?.label ?? status}
    </span>
  )
}

// ─── ADD FORM (isolated to prevent list re-renders while typing) ───────────────

interface CourseAddFormProps {
  onAdd: (c: Omit<Course, 'id'>) => void
}

const CourseAddForm = memo(function CourseAddForm({ onAdd }: CourseAddFormProps) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('')
  const [platformUrl, setPlatformUrl] = useState('')
  const [status, setStatus] = useState<Course['status']>('zaplanowany')
  const [progress, setProgress] = useState('')
  const [nextLesson, setNextLesson] = useState('')
  const [startedAt, setStartedAt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const p = status === 'ukonczony' ? 100 : Math.min(99, Math.max(0, parseInt(progress, 10) || 0))
    onAdd({
      name: name.trim(),
      platform: platform.trim() || undefined,
      platformUrl: platformUrl.trim() || undefined,
      progress: status === 'zaplanowany' ? 0 : p,
      status,
      nextLesson: nextLesson.trim() || undefined,
      startedAt: startedAt || undefined,
    })
    setName('')
    setPlatform('')
    setPlatformUrl('')
    setStatus('zaplanowany')
    setProgress('')
    setNextLesson('')
    setStartedAt('')
  }

  return (
    <Card title="Dodaj kurs">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Platforma</label>
            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming w-32 focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">URL platformy</label>
            <input
              type="url"
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Następna lekcja</label>
            <input
              type="text"
              value={nextLesson}
              onChange={(e) => setNextLesson(e.target.value)}
              placeholder="np. Middleware i autoryzacja"
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Data rozpoczęcia</label>
            <input
              type="date"
              value={startedAt}
              max="9999-12-31"
              onChange={(e) => setStartedAt(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-4 py-2 rounded-lg font-gaming text-sm transition-colors ${
                  status === opt.value
                    ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                    : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {(status === 'w_trakcie' || status === 'ukonczony') && (
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">
              Postęp % {status === 'ukonczony' && '(automatycznie 100)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={status === 'ukonczony' ? '100' : progress}
              onChange={(e) => status === 'w_trakcie' && setProgress(e.target.value.replace(/\D/g, ''))}
              readOnly={status === 'ukonczony'}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!name.trim()}
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
      </form>
    </Card>
  )
})

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

interface EditCourseModalProps {
  course: Course
  onSave: (id: string, u: Partial<Course>) => void
  onClose: () => void
}

function EditCourseModal({ course, onSave, onClose }: EditCourseModalProps) {
  const { backdrop, panel } = useModalMotion()
  const [editName, setEditName] = useState(course.name)
  const [editPlatform, setEditPlatform] = useState(course.platform ?? '')
  const [editPlatformUrl, setEditPlatformUrl] = useState(course.platformUrl ?? '')
  const [editStatus, setEditStatus] = useState<Course['status']>(course.status)
  const [editProgress, setEditProgress] = useState(course.progress.toString())
  const [editNextLesson, setEditNextLesson] = useState(course.nextLesson ?? '')
  const [editStartedAt, setEditStartedAt] = useState(course.startedAt ?? '')
  const [editCompletedAt, setEditCompletedAt] = useState(course.completedAt ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = editStatus === 'ukonczony' ? 100 : Math.min(99, Math.max(0, parseInt(editProgress, 10) || 0))
    const completedDate =
      editStatus === 'ukonczony'
        ? editCompletedAt || new Date().toISOString().split('T')[0]
        : editCompletedAt || undefined
    onSave(course.id, {
      name: editName.trim(),
      platform: editPlatform.trim() || undefined,
      platformUrl: editPlatformUrl.trim() || undefined,
      progress: editStatus === 'zaplanowany' ? 0 : p,
      status: editStatus,
      nextLesson: editNextLesson.trim() || undefined,
      startedAt: editStartedAt || undefined,
      completedAt: completedDate,
    })
    onClose()
  }

  return createPortal(
    <>
      <motion.div
        key="course-edit-backdrop"
        {...backdrop}
        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12 pointer-events-none">
        <motion.div
          key="course-edit-panel"
          {...panel}
          className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Edytuj kurs</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted)"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Platforma</label>
                <input
                  type="text"
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">URL platformy</label>
              <input
                type="url"
                value={editPlatformUrl}
                onChange={(e) => setEditPlatformUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Następna lekcja</label>
              <input
                type="text"
                value={editNextLesson}
                onChange={(e) => setEditNextLesson(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditStatus(opt.value)}
                    className={`px-4 py-2 rounded-lg font-gaming text-sm transition-colors ${
                      editStatus === opt.value
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border)'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {(editStatus === 'w_trakcie' || editStatus === 'ukonczony') && (
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Postęp %</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editStatus === 'ukonczony' ? '100' : editProgress}
                  onChange={(e) =>
                    editStatus === 'w_trakcie' && setEditProgress(e.target.value.replace(/\D/g, ''))
                  }
                  readOnly={editStatus === 'ukonczony'}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data rozpoczęcia</label>
                <input
                  type="date"
                  value={editStartedAt}
                  max="9999-12-31"
                  onChange={(e) => setEditStartedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data ukończenia</label>
                <input
                  type="date"
                  value={editCompletedAt}
                  max="9999-12-31"
                  onChange={(e) => setEditCompletedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover)"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90"
              >
                Zapisz
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

function CourseCard({
  c,
  onEdit,
  onDelete,
  onIncrement,
  onResume,
}: {
  c: Course
  onEdit: () => void
  onDelete: () => void
  onIncrement: () => void
  onResume?: () => void
}) {
  return (
    <LearningCard
      title={c.name}
      subtitle={c.nextLesson ? `→ ${c.nextLesson}` : undefined}
      badge={<StatusBadge status={c.status} />}
      progress={c.status !== 'zaplanowany' ? c.progress : undefined}
      meta={[
        c.platform && !c.platformUrl ? c.platform : undefined,
        c.startedAt ? `Rozpoczęto: ${c.startedAt}` : undefined,
        c.completedAt ? `Ukończono: ${c.completedAt}` : undefined,
      ]}
      quickActions={
        <div className="flex items-center gap-1">
          {c.status === 'w_trakcie' && (
            <button
              type="button"
              onClick={onIncrement}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-gaming text-(--accent-cyan) bg-(--accent-cyan)/10 hover:bg-(--accent-cyan)/20 transition-colors border border-(--accent-cyan)/20"
              title="Dodaj 10%"
            >
              <TrendingUp className="w-3 h-3" />
              +10%
            </button>
          )}
          {c.status === 'ukonczony' && onResume && (
            <button
              type="button"
              onClick={onResume}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-gaming text-(--accent-amber) bg-(--accent-amber)/10 hover:bg-(--accent-amber)/20 transition-colors border border-(--accent-amber)/20"
              title="Wznów kurs"
            >
              <RotateCcw className="w-3 h-3" />
              Wznów
            </button>
          )}
          {c.platformUrl && (
            <a
              href={c.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
              aria-label="Otwórz kurs"
              title={c.platform || 'Otwórz kurs'}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      }
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

export function LearningCourses() {
  const learning = useLearning()
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const { pendingId, toast, scheduleDelete } = useUndoDelete<Course>(
    useCallback((id) => learning?.deleteCourse(id), [learning]),
  )

  if (!learning) return null

  const { courses, addCourse, updateCourse } = learning

  const handleIncrementProgress = (c: Course) => {
    const newProgress = Math.min(100, c.progress + 10)
    const newStatus = newProgress === 100 ? 'ukonczony' : c.status
    updateCourse(c.id, {
      progress: newProgress,
      status: newStatus,
      completedAt:
        newStatus === 'ukonczony' ? (c.completedAt ?? new Date().toISOString().split('T')[0]) : c.completedAt,
    })
  }

  const handleResume = (c: Course) => {
    updateCourse(c.id, { status: 'w_trakcie', progress: 99, completedAt: undefined })
  }

  const activeCourses = courses.filter((c) => c.status !== 'ukonczony' && c.id !== pendingId)
  const completedCourses = courses.filter((c) => c.status === 'ukonczony' && c.id !== pendingId)
  const activeGroups = STATUS_GROUPS.filter((g) => g.status !== 'ukonczony')

  return (
    <div className="space-y-6">
      {/* Collapsed add form */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-gaming text-sm transition-colors ${
            showAddForm
              ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border-(--accent-cyan)/40'
              : 'bg-(--bg-dark) text-(--text-muted) border-(--border) hover:border-(--accent-cyan)/40 hover:text-(--text-primary)'
          }`}
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Anuluj' : 'Dodaj kurs'}
        </button>
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="course-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CourseAddForm onAdd={(c) => { addCourse(c); setShowAddForm(false) }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeCourses.length > 0 ? (
        <div className="space-y-6">
          {activeGroups.map((group) => {
            const items = activeCourses.filter((c) => c.status === group.status)
            if (items.length === 0) return null
            return (
              <Card key={group.status} title={group.label}>
                <div className="space-y-2">
                  {items.map((c) => (
                    <CourseCard
                      key={c.id}
                      c={c}
                      onEdit={() => setEditingCourse(c)}
                      onDelete={() => scheduleDelete(c, c.name)}
                      onIncrement={() => handleIncrementProgress(c)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        courses.filter((c) => c.id !== pendingId).length === 0 && (
          <Card title="Lista kursów">
            <p className="text-base text-(--text-muted)">Brak kursów. Dodaj pierwszy.</p>
          </Card>
        )
      )}

      {/* Collapsible archive of completed courses */}
      {completedCourses.length > 0 && (
        <Card>
          <button
            type="button"
            onClick={() => setArchiveOpen((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-(--accent-green)" />
              <span className="font-gaming text-(--text-primary) tracking-wide">
                Archiwum ukończonych
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-gaming bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/20">
                {completedCourses.length}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-(--text-muted) transition-transform duration-200 ${archiveOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {archiveOpen && (
              <motion.div
                key="archive"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-4 pt-4 border-t border-(--border)">
                  {completedCourses.map((c) => (
                    <CourseCard
                      key={c.id}
                      c={c}
                      onEdit={() => setEditingCourse(c)}
                      onDelete={() => scheduleDelete(c, c.name)}
                      onIncrement={() => handleIncrementProgress(c)}
                      onResume={() => handleResume(c)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editingCourse && (
          <EditCourseModal
            key={editingCourse.id}
            course={editingCourse}
            onSave={updateCourse}
            onClose={() => setEditingCourse(null)}
          />
        )}
      </AnimatePresence>

      {/* Undo delete toast */}
      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
