import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../../components/Card'
import { LearningCard } from '../../components/learning/LearningCard'
import { Plus, ExternalLink, Github, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLearning } from '../../context/LearningContext'
import { useModalMotion } from '../../lib/modalMotion'
import type { Project, ProjectStatus } from '../../context/LearningContext'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'pomysl', label: 'Pomysł' },
  { value: 'w_trakcie', label: 'W trakcie' },
  { value: 'mvp', label: 'MVP' },
  { value: 'ukonczony', label: 'Ukończony' },
  { value: 'porzucony', label: 'Porzucony' },
]

const PRIORITY_OPTIONS: { value: NonNullable<Project['priority']>; label: string }[] = [
  { value: 'niski', label: 'Niski' },
  { value: 'sredni', label: 'Średni' },
  { value: 'wysoki', label: 'Wysoki' },
]

const STATUS_GROUPS: { status: ProjectStatus; label: string }[] = [
  { status: 'w_trakcie', label: 'W trakcie' },
  { status: 'mvp', label: 'MVP' },
  { status: 'pomysl', label: 'Pomysły' },
  { status: 'ukonczony', label: 'Ukończone' },
  { status: 'porzucony', label: 'Porzucone' },
]

function StatusBadge({ status }: { status: ProjectStatus }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status)
  const bgMap: Record<ProjectStatus, string> = {
    pomysl: 'bg-(--bg-dark) text-(--text-muted) border border-(--border)',
    w_trakcie: 'bg-(--accent-cyan)/10 text-(--accent-cyan) border border-(--accent-cyan)/30',
    mvp: 'bg-(--accent-amber)/10 text-(--accent-amber) border border-(--accent-amber)/30',
    ukonczony: 'bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/30',
    porzucony: 'bg-[#e74c3c]/10 text-[#e74c3c] border border-[#e74c3c]/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-gaming ${bgMap[status]}`}>
      {opt?.label ?? status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority?: Project['priority'] }) {
  if (!priority) return null
  const map: Record<NonNullable<Project['priority']>, string> = {
    niski: 'text-(--text-muted)',
    sredni: 'text-(--accent-amber)',
    wysoki: 'text-(--accent-magenta)',
  }
  const labels = { niski: '↓ Niski', sredni: '→ Średni', wysoki: '↑ Wysoki' }
  return (
    <span className={`text-xs font-gaming ${map[priority]}`}>{labels[priority]}</span>
  )
}

export function LearningProjects() {
  const learning = useLearning()
  const { backdrop, panel } = useModalMotion()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tech, setTech] = useState('')
  const [url, setUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('w_trakcie')
  const [priority, setPriority] = useState<Project['priority']>('sredni')
  const [nextStep, setNextStep] = useState('')

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTech, setEditTech] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editGithubUrl, setEditGithubUrl] = useState('')
  const [editStatus, setEditStatus] = useState<ProjectStatus>('w_trakcie')
  const [editPriority, setEditPriority] = useState<Project['priority']>('sredni')
  const [editNextStep, setEditNextStep] = useState('')

  if (!learning) return null

  const { projects, addProject, updateProject, deleteProject } = learning

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      tech: tech.trim() || undefined,
      url: url.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      status,
      priority,
      nextStep: nextStep.trim() || undefined,
    })
    setName('')
    setDescription('')
    setTech('')
    setUrl('')
    setGithubUrl('')
    setStatus('w_trakcie')
    setPriority('sredni')
    setNextStep('')
  }

  const openEdit = (p: Project) => {
    setEditingProject(p)
    setEditName(p.name)
    setEditDescription(p.description ?? '')
    setEditTech(p.tech ?? '')
    setEditUrl(p.url ?? '')
    setEditGithubUrl(p.githubUrl ?? '')
    setEditStatus(p.status)
    setEditPriority(p.priority)
    setEditNextStep(p.nextStep ?? '')
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || !editName.trim()) return
    updateProject(editingProject.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      tech: editTech.trim() || undefined,
      url: editUrl.trim() || undefined,
      githubUrl: editGithubUrl.trim() || undefined,
      status: editStatus,
      priority: editPriority,
      nextStep: editNextStep.trim() || undefined,
    })
    setEditingProject(null)
  }

  return (
    <div className="space-y-6">
      <Card title="Dodaj projekt">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Opis</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Technologie</label>
              <input
                type="text"
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                placeholder="np. React, Node.js"
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Następny krok</label>
              <input
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="np. Dodać autoryzację"
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">GitHub</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
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
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Priorytet</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                    priority === opt.value
                      ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                      : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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

      {/* Grouped project list */}
      {projects.length > 0 ? (
        <div className="space-y-6">
          {STATUS_GROUPS.map((group) => {
            const items = projects.filter((p) => p.status === group.status)
            if (items.length === 0) return null
            return (
              <Card key={group.status} title={group.label}>
                <div className="space-y-2">
                  {items.map((p) => (
                    <LearningCard
                      key={p.id}
                      title={p.name}
                      subtitle={p.nextStep ? `→ ${p.nextStep}` : p.description}
                      badge={
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={p.status} />
                          <PriorityBadge priority={p.priority} />
                        </div>
                      }
                      meta={[p.tech ?? undefined, p.description && p.nextStep ? p.description : undefined]}
                      quickActions={
                        <div className="flex items-center gap-1">
                          {p.githubUrl && (
                            <a
                              href={p.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                              aria-label="GitHub"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                              aria-label="Otwórz"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      }
                      onEdit={() => openEdit(p)}
                      onDelete={() => deleteProject(p.id)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card title="Lista projektów">
          <p className="text-base text-(--text-muted)">Brak projektów. Dodaj pierwszy.</p>
        </Card>
      )}

      {/* Edit modal */}
      {createPortal(
        <AnimatePresence>
          {editingProject && (
            <>
              <motion.div
                key="project-edit-backdrop"
                {...backdrop}
                className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
                onClick={() => setEditingProject(null)}
              />
              <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12 pointer-events-none">
                <motion.div
                  key="project-edit-panel"
                  {...panel}
                  className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Edytuj projekt</h3>
                    <button
                      onClick={() => setEditingProject(null)}
                      className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted)"
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
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">Opis</label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">Technologie</label>
                      <input
                        type="text"
                        value={editTech}
                        onChange={(e) => setEditTech(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">
                        Następny krok
                      </label>
                      <input
                        type="text"
                        value={editNextStep}
                        onChange={(e) => setEditNextStep(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base text-(--text-muted) font-gaming mb-1">URL</label>
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-base text-(--text-muted) font-gaming mb-1">GitHub</label>
                        <input
                          type="url"
                          value={editGithubUrl}
                          onChange={(e) => setEditGithubUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">Status</label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setEditStatus(opt.value)}
                            className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
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
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">Priorytet</label>
                      <div className="flex gap-2">
                        {PRIORITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setEditPriority(opt.value)}
                            className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                              editPriority === opt.value
                                ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                                : 'bg-(--bg-dark) text-(--text-muted) border border-(--border)'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProject(null)}
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
        document.body,
      )}
    </div>
  )
}
