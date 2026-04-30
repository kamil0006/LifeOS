import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../../components/Card'
import { LearningCard } from '../../components/learning/LearningCard'
import { Plus, ExternalLink, ShieldCheck, ShieldAlert, ShieldOff, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLearning } from '../../context/LearningContext'
import { useModalMotion } from '../../lib/modalMotion'
import type { Certification } from '../../context/LearningContext'

type CertStatus = 'wazny' | 'wygasa' | 'wygasly'

function getCertStatus(cert: Certification): CertStatus {
  if (!cert.expiryDate) return 'wazny'
  const now = new Date()
  const expiry = new Date(cert.expiryDate)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'wygasly'
  const reminderDays = cert.renewalReminderDays ?? 90
  if (daysLeft <= reminderDays) return 'wygasa'
  return 'wazny'
}

function getDaysLeft(expiryDate?: string): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function CertStatusBadge({ cert }: { cert: Certification }) {
  const status = getCertStatus(cert)
  const daysLeft = getDaysLeft(cert.expiryDate)

  if (status === 'wygasly') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-gaming bg-[#e74c3c]/10 text-[#e74c3c] border border-[#e74c3c]/30">
        <ShieldOff className="w-3 h-3" />
        Wygasły
      </span>
    )
  }
  if (status === 'wygasa') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-gaming bg-(--accent-amber)/10 text-(--accent-amber) border border-(--accent-amber)/30">
        <ShieldAlert className="w-3 h-3" />
        Wygasa za {daysLeft} dni
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-gaming bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/30">
      <ShieldCheck className="w-3 h-3" />
      Ważny
    </span>
  )
}

/**
 * Lista certyfikatów + formularz dodawania i modal edycji.
 * Refactor (gdy moduł urośnie): wydzielić modal edycji oraz hook stanu formularzy add/edit.
 */
export function LearningCertificates() {
  const learning = useLearning()
  const { backdrop, panel } = useModalMotion()

  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [url, setUrl] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [renewalReminderDays, setRenewalReminderDays] = useState('90')

  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [editName, setEditName] = useState('')
  const [editIssuer, setEditIssuer] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editExpiryDate, setEditExpiryDate] = useState('')
  const [editVerificationUrl, setEditVerificationUrl] = useState('')
  const [editRenewalReminderDays, setEditRenewalReminderDays] = useState('90')
  const [showAddForm, setShowAddForm] = useState(false)

  if (!learning) return null

  const { certifications, addCertification, updateCertification, deleteCertification } = learning

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !issuer.trim()) return
    const reminderDays = parseInt(renewalReminderDays, 10)
    addCertification({
      name: name.trim(),
      issuer: issuer.trim(),
      date,
      url: url.trim() || undefined,
      expiryDate: expiryDate || undefined,
      verificationUrl: verificationUrl.trim() || undefined,
      renewalReminderDays: !isNaN(reminderDays) ? reminderDays : undefined,
    })
    setName('')
    setIssuer('')
    setDate(new Date().toISOString().split('T')[0])
    setUrl('')
    setExpiryDate('')
    setVerificationUrl('')
    setRenewalReminderDays('90')
  }

  const openEdit = (c: Certification) => {
    setEditingCert(c)
    setEditName(c.name)
    setEditIssuer(c.issuer)
    setEditDate(c.date)
    setEditUrl(c.url ?? '')
    setEditExpiryDate(c.expiryDate ?? '')
    setEditVerificationUrl(c.verificationUrl ?? '')
    setEditRenewalReminderDays(String(c.renewalReminderDays ?? 90))
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCert || !editName.trim() || !editIssuer.trim()) return
    const reminderDays = parseInt(editRenewalReminderDays, 10)
    updateCertification(editingCert.id, {
      name: editName.trim(),
      issuer: editIssuer.trim(),
      date: editDate,
      url: editUrl.trim() || undefined,
      expiryDate: editExpiryDate || undefined,
      verificationUrl: editVerificationUrl.trim() || undefined,
      renewalReminderDays: !isNaN(reminderDays) ? reminderDays : undefined,
    })
    setEditingCert(null)
  }

  const sorted = [...certifications].sort((a, b) => b.date.localeCompare(a.date))

  const expiring = sorted.filter((c) => getCertStatus(c) === 'wygasa')
  const expired = sorted.filter((c) => getCertStatus(c) === 'wygasly')
  const valid = sorted.filter((c) => getCertStatus(c) === 'wazny')

  const certGroups: { key: string; label: string; items: Certification[] }[] = [
    { key: 'expiring', label: 'Wygasają wkrótce', items: expiring },
    { key: 'valid', label: 'Ważne', items: valid },
    { key: 'expired', label: 'Wygasłe', items: expired },
  ]

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
          {showAddForm ? 'Anuluj' : 'Dodaj certyfikat'}
        </button>
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="cert-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card title="Nowy certyfikat">
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
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Wystawca *</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming w-32 focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Data zdobycia</label>
              <input
                type="date"
                value={date}
                max="9999-12-31"
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">
                Data ważności (opcjonalnie)
              </label>
              <input
                type="date"
                value={expiryDate}
                max="9999-12-31"
                onChange={(e) => setExpiryDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">
                URL certyfikatu (opcjonalnie)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-base text-(--text-muted) font-gaming mb-1">
                Link weryfikacji (opcjonalnie)
              </label>
              <input
                type="url"
                value={verificationUrl}
                onChange={(e) => setVerificationUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            {expiryDate && (
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">
                  Powiadom za (dni przed)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={renewalReminderDays}
                  onChange={(e) => setRenewalReminderDays(e.target.value.replace(/\D/g, ''))}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!name.trim() || !issuer.trim()}
            onClick={() => setShowAddForm(false)}
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </form>
            </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {sorted.length === 0 ? (
        <Card title="Lista certyfikatów">
          <p className="text-base text-(--text-muted)">Brak certyfikatów. Dodaj pierwszy.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {certGroups.map((group) => {
            if (group.items.length === 0) return null
            return (
              <Card key={group.key} title={group.label}>
                <div className="space-y-2">
                  {group.items.map((c) => (
                    <LearningCard
                      key={c.id}
                      title={c.name}
                      badge={<CertStatusBadge cert={c} />}
                      meta={[
                        `${c.issuer} · ${c.date}`,
                        c.expiryDate
                          ? getCertStatus(c) === 'wygasly'
                            ? `Wygasł: ${c.expiryDate}`
                            : `Ważny do: ${c.expiryDate}`
                          : undefined,
                      ]}
                      quickActions={
                        <div className="flex items-center gap-1">
                          {c.verificationUrl && (
                            <a
                              href={c.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-gaming text-(--accent-cyan) bg-(--accent-cyan)/10 hover:bg-(--accent-cyan)/20 transition-colors border border-(--accent-cyan)/20"
                              title="Zweryfikuj certyfikat"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Weryfikuj
                            </a>
                          )}
                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                              aria-label="Otwórz certyfikat"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      }
                      onEdit={() => openEdit(c)}
                      onDelete={() => deleteCertification(c.id)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {createPortal(
        <AnimatePresence>
          {editingCert && (
            <>
              <motion.div
                key="cert-edit-backdrop"
                {...backdrop}
                className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
                onClick={() => setEditingCert(null)}
              />
              <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12 pointer-events-none">
                <motion.div
                  key="cert-edit-panel"
                  {...panel}
                  className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Edytuj certyfikat</h3>
                    <button
                      onClick={() => setEditingCert(null)}
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
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-base text-(--text-muted) font-gaming mb-1">Wystawca</label>
                        <input
                          type="text"
                          value={editIssuer}
                          onChange={(e) => setEditIssuer(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base text-(--text-muted) font-gaming mb-1">Data zdobycia</label>
                        <input
                          type="date"
                          value={editDate}
                          max="9999-12-31"
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-base text-(--text-muted) font-gaming mb-1">Data ważności</label>
                        <input
                          type="date"
                          value={editExpiryDate}
                          max="9999-12-31"
                          onChange={(e) => setEditExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">
                        URL certyfikatu
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-base text-(--text-muted) font-gaming mb-1">
                        Link weryfikacji
                      </label>
                      <input
                        type="url"
                        value={editVerificationUrl}
                        onChange={(e) => setEditVerificationUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                      />
                    </div>
                    {editExpiryDate && (
                      <div>
                        <label className="block text-base text-(--text-muted) font-gaming mb-1">
                          Powiadom za (dni przed wygaśnięciem)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editRenewalReminderDays}
                          onChange={(e) =>
                            setEditRenewalReminderDays(e.target.value.replace(/\D/g, ''))
                          }
                          className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCert(null)}
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
