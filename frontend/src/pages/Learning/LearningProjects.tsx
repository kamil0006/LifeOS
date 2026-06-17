import { useState, memo } from 'react'
import { Card } from '../../components/Card'
import { LearningCard } from '../../components/learning/LearningCard'
import { LearningFormShell } from '../../components/learning/LearningFormShell'
import { LearningModal } from '../../components/learning/LearningModal'
import {
  learningFieldClass,
  learningLabelClass,
  learningFormActionsClass,
  learningPrimaryBtnClass,
  learningSecondaryBtnClass,
  learningAddBtnClass,
  learningChipClass,
} from '../../components/learning/learningFormClasses'
import { Plus, ExternalLink, Github } from 'lucide-react'
import { useLearning } from '../../context/LearningContext'
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

// ─── ADD FORM (isolated to prevent list re-renders while typing) ───────────────

interface ProjectAddFormProps {
  onAdd: (p: Omit<Project, 'id'>) => void
  onCancel: () => void
}

const ProjectAddForm = memo(function ProjectAddForm({ onAdd, onCancel }: ProjectAddFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tech, setTech] = useState('')
  const [url, setUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('w_trakcie')
  const [priority, setPriority] = useState<Project['priority']>('sredni')
  const [nextStep, setNextStep] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={learningLabelClass}>Nazwa *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Opis</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={learningFieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={learningLabelClass}>Technologie</label>
          <input
            type="text"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            placeholder="np. React, Node.js"
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Następny krok</label>
          <input
            type="text"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="np. Dodać autoryzację"
            className={learningFieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={learningLabelClass}>URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>GitHub</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
      </div>
      <div>
        <label className={learningLabelClass}>Status</label>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={learningChipClass(status === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={learningLabelClass}>Priorytet</label>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={learningChipClass(priority === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className={learningFormActionsClass}>
        <button type="submit" className={learningPrimaryBtnClass} disabled={!name.trim()}>
          <Plus className="h-4 w-4 shrink-0" />
          Dodaj projekt
        </button>
        <button type="button" onClick={onCancel} className={learningSecondaryBtnClass}>
          Anuluj
        </button>
      </div>
    </form>
  )
})

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

interface EditProjectModalProps {
  project: Project
  onSave: (id: string, u: Partial<Project>) => void
  onClose: () => void
}

function EditProjectModal({ project, onSave, onClose }: EditProjectModalProps) {
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description ?? '')
  const [editTech, setEditTech] = useState(project.tech ?? '')
  const [editUrl, setEditUrl] = useState(project.url ?? '')
  const [editGithubUrl, setEditGithubUrl] = useState(project.githubUrl ?? '')
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status)
  const [editPriority, setEditPriority] = useState<Project['priority']>(project.priority)
  const [editNextStep, setEditNextStep] = useState(project.nextStep ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    onSave(project.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      tech: editTech.trim() || undefined,
      url: editUrl.trim() || undefined,
      githubUrl: editGithubUrl.trim() || undefined,
      status: editStatus,
      priority: editPriority,
      nextStep: editNextStep.trim() || undefined,
    })
    onClose()
  }

  return (
    <LearningModal isOpen onClose={onClose} title="Edytuj projekt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={learningLabelClass}>Nazwa</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Opis</label>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Technologie</label>
          <input
            type="text"
            value={editTech}
            onChange={(e) => setEditTech(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Następny krok</label>
          <input
            type="text"
            value={editNextStep}
            onChange={(e) => setEditNextStep(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={learningLabelClass}>URL</label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className={learningFieldClass}
            />
          </div>
          <div>
            <label className={learningLabelClass}>GitHub</label>
            <input
              type="url"
              value={editGithubUrl}
              onChange={(e) => setEditGithubUrl(e.target.value)}
              className={learningFieldClass}
            />
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>Status</label>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEditStatus(opt.value)}
                className={learningChipClass(editStatus === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>Priorytet</label>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEditPriority(opt.value)}
                className={learningChipClass(editPriority === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className={learningFormActionsClass}>
          <button type="submit" className={learningPrimaryBtnClass} disabled={!editName.trim()}>
            Zapisz
          </button>
          <button type="button" onClick={onClose} className={learningSecondaryBtnClass}>
            Anuluj
          </button>
        </div>
      </form>
    </LearningModal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningProjects() {
  const learning = useLearning()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  if (!learning) return null

  const { projects, addProject, updateProject, deleteProject } = learning

  return (
    <div className="space-y-6">
      {projects.length > 0 ? (
        <div className="space-y-6">
          {STATUS_GROUPS.map((group) => {
            const items = projects.filter((p) => p.status === group.status)
            if (items.length === 0) return null
            return (
              <Card key={group.status} title={group.label} className="max-md:p-4">
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
                      onEdit={() => setEditingProject(p)}
                      onDelete={() => deleteProject(p.id)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card title="Lista projektów" className="max-md:p-4">
          <p className="text-base text-(--text-muted)">Brak projektów. Dodaj pierwszy.</p>
        </Card>
      )}

      <div className={projects.length > 0 ? 'border-t border-(--border)/60 pt-4' : ''}>
        {showAddForm ? (
          <LearningFormShell
            isOpen
            onClose={() => setShowAddForm(false)}
            title="Dodaj projekt"
          >
            <ProjectAddForm
              onAdd={(p) => {
                addProject(p)
                setShowAddForm(false)
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </LearningFormShell>
        ) : (
          <button type="button" onClick={() => setShowAddForm(true)} className={learningAddBtnClass}>
            <Plus className="h-4 w-4" />
            Dodaj projekt
          </button>
        )}
      </div>

      {editingProject && (
        <EditProjectModal
          key={editingProject.id}
          project={editingProject}
          onSave={updateProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  )
}
