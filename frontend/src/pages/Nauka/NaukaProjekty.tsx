import { useState } from 'react'
import { Card } from '../../components/Card'
import { Plus, Trash2, ExternalLink, Github } from 'lucide-react'
import { useNauka } from '../../context/NaukaContext'

const STATUS_LABELS = { w_trakcie: 'W trakcie', ukonczony: 'Ukończony', zaplanowany: 'Zaplanowany' }

export function NaukaProjekty() {
  const nauka = useNauka()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tech, setTech] = useState('')
  const [url, setUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  if (!nauka) return null

  const { projects, addProject, deleteProject } = nauka

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      tech: tech.trim() || undefined,
      url: url.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      status: 'w_trakcie',
    })
    setName('')
    setDescription('')
    setTech('')
    setUrl('')
    setGithubUrl('')
  }

  return (
    <div className="space-y-6">
      <Card title="Dodaj projekt">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Opis</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Technologie</label>
            <input
              type="text"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">GitHub</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
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

      <Card title="Lista projektów">
        {projects.length === 0 ? (
          <p className="text-base text-(--text-muted)">Brak projektów. Dodaj pierwszy.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-(--bg-dark)/50 border border-(--border)"
              >
                <div>
                  <p className="font-gaming text-(--text-primary)">{p.name}</p>
                  {p.description && <p className="text-sm text-(--text-muted) mt-0.5">{p.description}</p>}
                  <p className="text-sm text-(--text-muted) mt-0.5">
                    {p.tech && `${p.tech} • `}
                    {STATUS_LABELS[p.status]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => deleteProject(p.id)}
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
    </div>
  )
}
