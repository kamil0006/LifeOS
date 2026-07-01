import { useState, memo } from 'react'
import { useTranslation } from 'react-i18next'
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
import { SafeExternalLink } from '../../components/SafeExternalLink'
import { useLearning } from '../../context/LearningContext'
import type { Project, ProjectStatus } from '../../context/LearningContext'

const STATUS_OPTIONS: { value: ProjectStatus; labelKey: string }[] = [
  { value: 'pomysl', labelKey: 'statusIdea' },
  { value: 'w_trakcie', labelKey: 'statusInProgress' },
  { value: 'mvp', labelKey: 'statusMvp' },
  { value: 'ukonczony', labelKey: 'statusCompleted' },
  { value: 'porzucony', labelKey: 'statusAbandoned' },
]

const PRIORITY_OPTIONS: { value: NonNullable<Project['priority']>; labelKey: string }[] = [
  { value: 'niski', labelKey: 'priorityLow' },
  { value: 'sredni', labelKey: 'priorityMedium' },
  { value: 'wysoki', labelKey: 'priorityHigh' },
]

const STATUS_GROUPS: { status: ProjectStatus; labelKey: string }[] = [
  { status: 'w_trakcie', labelKey: 'groupInProgress' },
  { status: 'mvp', labelKey: 'groupMvp' },
  { status: 'pomysl', labelKey: 'groupIdeas' },
  { status: 'ukonczony', labelKey: 'groupCompleted' },
  { status: 'porzucony', labelKey: 'groupAbandoned' },
]

function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation('learning')
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
      {opt ? t(`projects.${opt.labelKey}`) : status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority?: Project['priority'] }) {
  const { t } = useTranslation('learning')
  if (!priority) return null
  const map: Record<NonNullable<Project['priority']>, string> = {
    niski: 'text-(--text-muted)',
    sredni: 'text-(--accent-amber)',
    wysoki: 'text-(--accent-magenta)',
  }
  const labelKeys: Record<NonNullable<Project['priority']>, string> = {
    niski: 'priorityLowArrow',
    sredni: 'priorityMediumArrow',
    wysoki: 'priorityHighArrow',
  }
  return (
    <span className={`text-xs font-gaming ${map[priority]}`}>{t(`projects.${labelKeys[priority]}`)}</span>
  )
}

// ─── ADD FORM (isolated to prevent list re-renders while typing) ───────────────

interface ProjectAddFormProps {
  onAdd: (p: Omit<Project, 'id'>) => void
  onCancel: () => void
}

const ProjectAddForm = memo(function ProjectAddForm({ onAdd, onCancel }: ProjectAddFormProps) {
  const { t } = useTranslation('learning')
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
          <label className={learningLabelClass}>{t('projects.name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.description')}</label>
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
          <label className={learningLabelClass}>{t('projects.tech')}</label>
          <input
            type="text"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            placeholder={t('projects.techPlaceholder')}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.nextStep')}</label>
          <input
            type="text"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder={t('projects.nextStepPlaceholder')}
            className={learningFieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={learningLabelClass}>{t('projects.url')}</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.github')}</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
      </div>
      <div>
        <label className={learningLabelClass}>{t('projects.status')}</label>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={learningChipClass(status === opt.value)}
            >
              {t(`projects.${opt.labelKey}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={learningLabelClass}>{t('projects.priority')}</label>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={learningChipClass(priority === opt.value)}
            >
              {t(`projects.${opt.labelKey}`)}
            </button>
          ))}
        </div>
      </div>
      <div className={learningFormActionsClass}>
        <button type="submit" className={learningPrimaryBtnClass} disabled={!name.trim()}>
          <Plus className="h-4 w-4 shrink-0" />
          {t('projects.addProject')}
        </button>
        <button type="button" onClick={onCancel} className={learningSecondaryBtnClass}>
          {t('common.cancel')}
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
  const { t } = useTranslation('learning')
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
    <LearningModal isOpen onClose={onClose} title={t('projects.editTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={learningLabelClass}>{t('projects.nameEdit')}</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.description')}</label>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.tech')}</label>
          <input
            type="text"
            value={editTech}
            onChange={(e) => setEditTech(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.nextStep')}</label>
          <input
            type="text"
            value={editNextStep}
            onChange={(e) => setEditNextStep(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={learningLabelClass}>{t('projects.url')}</label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className={learningFieldClass}
            />
          </div>
          <div>
            <label className={learningLabelClass}>{t('projects.github')}</label>
            <input
              type="url"
              value={editGithubUrl}
              onChange={(e) => setEditGithubUrl(e.target.value)}
              className={learningFieldClass}
            />
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.status')}</label>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEditStatus(opt.value)}
                className={learningChipClass(editStatus === opt.value)}
              >
                {t(`projects.${opt.labelKey}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>{t('projects.priority')}</label>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEditPriority(opt.value)}
                className={learningChipClass(editPriority === opt.value)}
              >
                {t(`projects.${opt.labelKey}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={learningFormActionsClass}>
          <button type="submit" className={learningPrimaryBtnClass} disabled={!editName.trim()}>
            {t('common.save')}
          </button>
          <button type="button" onClick={onClose} className={learningSecondaryBtnClass}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </LearningModal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningProjects() {
  const { t } = useTranslation('learning')
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
              <Card key={group.status} title={t(`projects.${group.labelKey}`)} className="max-md:p-4">
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
                            <SafeExternalLink
                              href={p.githubUrl}
                              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                              title="GitHub"
                            >
                              <Github className="w-4 h-4" />
                            </SafeExternalLink>
                          )}
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                              aria-label={t('projects.openAria')}
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
        <Card title={t('projects.emptyList')} className="max-md:p-4">
          <p className="text-base text-(--text-muted)">{t('projects.emptyMessage')}</p>
        </Card>
      )}

      <div className={projects.length > 0 ? 'border-t border-(--border)/60 pt-4' : ''}>
        {showAddForm ? (
          <LearningFormShell
            isOpen
            onClose={() => setShowAddForm(false)}
            title={t('projects.addProject')}
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
            {t('projects.addProject')}
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
