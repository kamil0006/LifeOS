import { useState } from 'react'
import { Card } from '../../components/Card'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { useNauka } from '../../context/NaukaContext'

export function NaukaCertyfikaty() {
  const nauka = useNauka()
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [url, setUrl] = useState('')

  if (!nauka) return null

  const { certifications, addCertification, deleteCertification } = nauka

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !issuer.trim()) return
    addCertification({
      name: name.trim(),
      issuer: issuer.trim(),
      date,
      url: url.trim() || undefined,
    })
    setName('')
    setIssuer('')
    setDate(new Date().toISOString().split('T')[0])
    setUrl('')
  }

  const sorted = [...certifications].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-6">
      <Card title="Dodaj certyfikat">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
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
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Wystawca</label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming w-32 focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">URL (opcjonalnie)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!name.trim() || !issuer.trim()}
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </form>
      </Card>

      <Card title="Lista certyfikatów">
        {sorted.length === 0 ? (
          <p className="text-base text-(--text-muted)">Brak certyfikatów. Dodaj pierwszy.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-(--bg-dark)/50 border border-(--border)"
              >
                <div>
                  <p className="font-gaming text-(--text-primary)">{c.name}</p>
                  <p className="text-sm text-(--text-muted) mt-0.5">{c.issuer} • {c.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                      aria-label="Otwórz"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteCertification(c.id)}
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
