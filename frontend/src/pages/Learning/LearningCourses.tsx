import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../../components/Card'
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useLearning } from '../../context/LearningContext'
import { useModalMotion } from '../../lib/modalMotion'
import type { Course } from '../../context/LearningContext'

const STATUS_OPTIONS: { value: Course['status']; label: string }[] = [
  { value: 'zaplanowany', label: 'Zaplanowany' },
  { value: 'w_trakcie', label: 'W trakcie' },
  { value: 'ukonczony', label: 'Ukończony' },
]

export function LearningCourses() {
  const learning = useLearning()
  const { backdrop, panel } = useModalMotion()
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('')
  const [platformUrl, setPlatformUrl] = useState('')
  const [status, setStatus] = useState<Course['status']>('zaplanowany')
  const [progress, setProgress] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPlatform, setEditPlatform] = useState('')
  const [editPlatformUrl, setEditPlatformUrl] = useState('')
  const [editStatus, setEditStatus] = useState<Course['status']>('zaplanowany')
  const [editProgress, setEditProgress] = useState('')

  if (!learning) return null

  const { courses, addCourse, updateCourse, deleteCourse } = learning

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const p = status === 'ukonczony' ? 100 : Math.min(99, Math.max(0, parseInt(progress, 10) || 0))
    addCourse({
      name: name.trim(),
      platform: platform.trim() || undefined,
      platformUrl: platformUrl.trim() || undefined,
      progress: status === 'zaplanowany' ? 0 : p,
      status: status === 'zaplanowany' ? 'zaplanowany' : status === 'ukonczony' ? 'ukonczony' : 'w_trakcie',
    })
    setName('')
    setPlatform('')
    setPlatformUrl('')
    setStatus('zaplanowany')
    setProgress('')
  }

  const openEdit = (c: Course) => {
    setEditingId(c.id)
    setEditName(c.name)
    setEditPlatform(c.platform ?? '')
    setEditPlatformUrl(c.platformUrl ?? '')
    setEditStatus(c.status)
    setEditProgress(c.progress.toString())
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const p = editStatus === 'ukonczony' ? 100 : Math.min(99, Math.max(0, parseInt(editProgress, 10) || 0))
    updateCourse(editingId, {
      name: editName.trim(),
      platform: editPlatform.trim() || undefined,
      platformUrl: editPlatformUrl.trim() || undefined,
      progress: editStatus === 'zaplanowany' ? 0 : p,
      status: editStatus,
    })
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <Card title="Dodaj kurs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa</label>
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
            <div className="flex-1 min-w-[200px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">URL platformy</label>
              <input
                type="url"
                value={platformUrl}
                onChange={(e) => setPlatformUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
            <div className="flex gap-2">
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
                className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none disabled:opacity-60"
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

      <Card title="Lista kursów">
        {courses.length === 0 ? (
          <p className="text-base text-(--text-muted)">Brak kursów. Dodaj pierwszy.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-(--bg-dark)/50 border border-(--border)"
              >
                <div>
                  <p className="font-gaming text-(--text-primary)">{c.name}</p>
                  <p className="text-sm text-(--text-muted) mt-0.5">
                    {c.platform && (
                      c.platformUrl ? (
                        <a href={c.platformUrl} target="_blank" rel="noopener noreferrer" className="text-(--accent-cyan) hover:underline">
                          {c.platform}
                        </a>
                      ) : (
                        c.platform
                      )
                    )}
                    {c.platform && ' • '}
                    {c.progress}% • {STATUS_OPTIONS.find((o) => o.value === c.status)?.label ?? c.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.platformUrl && (
                    <a
                      href={c.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                      aria-label="Otwórz kurs"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <div className="w-24 h-2 rounded-full bg-(--bg-card) overflow-hidden">
                    <div
                      className="h-full bg-(--accent-cyan) rounded-full transition-all"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                    aria-label="Edytuj"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCourse(c.id)}
                    className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
                    aria-label="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {createPortal(
        <AnimatePresence>
          {editingId && (
            <>
              <motion.div
                key="course-edit-backdrop"
                {...backdrop}
                className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
                onClick={() => setEditingId(null)}
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
                  onClick={() => setEditingId(null)}
                  className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary)"
                  aria-label="Zamknij"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Platforma</label>
                  <input
                    type="text"
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                  />
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
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
                  <div className="flex gap-2">
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
                      onChange={(e) => editStatus === 'w_trakcie' && setEditProgress(e.target.value.replace(/\D/g, ''))}
                      readOnly={editStatus === 'ukonczony'}
                      className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
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
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
