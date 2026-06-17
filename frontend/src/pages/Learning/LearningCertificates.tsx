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
} from '../../components/learning/learningFormClasses'
import { Plus, ExternalLink, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react'
import { useLearning } from '../../context/LearningContext'
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

// ─── ADD FORM (isolated to prevent list re-renders while typing) ───────────────

interface CertAddFormProps {
  onAdd: (c: Omit<Certification, 'id'>) => void
}

const CertAddForm = memo(function CertAddForm({ onAdd }: CertAddFormProps) {
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [url, setUrl] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [renewalReminderDays, setRenewalReminderDays] = useState('90')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !issuer.trim()) return
    const reminderDays = parseInt(renewalReminderDays, 10)
    onAdd({
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className={learningLabelClass}>Wystawca *</label>
        <input
          type="text"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={learningLabelClass}>Data zdobycia</label>
          <input
            type="date"
            value={date}
            max="9999-12-31"
            onChange={(e) => setDate(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Data ważności (opcjonalnie)</label>
          <input
            type="date"
            value={expiryDate}
            max="9999-12-31"
            onChange={(e) => setExpiryDate(e.target.value)}
            className={learningFieldClass}
          />
        </div>
      </div>
      <div>
        <label className={learningLabelClass}>URL certyfikatu (opcjonalnie)</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      <div>
        <label className={learningLabelClass}>Link weryfikacji (opcjonalnie)</label>
        <input
          type="url"
          value={verificationUrl}
          onChange={(e) => setVerificationUrl(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      {expiryDate && (
        <div>
          <label className={learningLabelClass}>Powiadom za (dni przed)</label>
          <input
            type="text"
            inputMode="numeric"
            value={renewalReminderDays}
            onChange={(e) => setRenewalReminderDays(e.target.value.replace(/\D/g, ''))}
            className={`${learningFieldClass} max-w-32 font-mono`}
          />
        </div>
      )}
      <div className={learningFormActionsClass}>
        <button
          type="submit"
          className={learningPrimaryBtnClass}
          disabled={!name.trim() || !issuer.trim()}
        >
          <Plus className="h-4 w-4" />
          Dodaj
        </button>
      </div>
    </form>
  )
})

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

interface EditCertModalProps {
  cert: Certification
  onSave: (id: string, u: Partial<Certification>) => void
  onClose: () => void
}

function EditCertModal({ cert, onSave, onClose }: EditCertModalProps) {
  const [editName, setEditName] = useState(cert.name)
  const [editIssuer, setEditIssuer] = useState(cert.issuer)
  const [editDate, setEditDate] = useState(cert.date)
  const [editUrl, setEditUrl] = useState(cert.url ?? '')
  const [editExpiryDate, setEditExpiryDate] = useState(cert.expiryDate ?? '')
  const [editVerificationUrl, setEditVerificationUrl] = useState(cert.verificationUrl ?? '')
  const [editRenewalReminderDays, setEditRenewalReminderDays] = useState(
    String(cert.renewalReminderDays ?? 90),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || !editIssuer.trim()) return
    const reminderDays = parseInt(editRenewalReminderDays, 10)
    onSave(cert.id, {
      name: editName.trim(),
      issuer: editIssuer.trim(),
      date: editDate,
      url: editUrl.trim() || undefined,
      expiryDate: editExpiryDate || undefined,
      verificationUrl: editVerificationUrl.trim() || undefined,
      renewalReminderDays: !isNaN(reminderDays) ? reminderDays : undefined,
    })
    onClose()
  }

  return (
    <LearningModal isOpen onClose={onClose} title="Edytuj certyfikat">
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
          <label className={learningLabelClass}>Wystawca</label>
          <input
            type="text"
            value={editIssuer}
            onChange={(e) => setEditIssuer(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={learningLabelClass}>Data zdobycia</label>
            <input
              type="date"
              value={editDate}
              max="9999-12-31"
              onChange={(e) => setEditDate(e.target.value)}
              className={learningFieldClass}
            />
          </div>
          <div>
            <label className={learningLabelClass}>Data ważności</label>
            <input
              type="date"
              value={editExpiryDate}
              max="9999-12-31"
              onChange={(e) => setEditExpiryDate(e.target.value)}
              className={learningFieldClass}
            />
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>URL certyfikatu</label>
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>Link weryfikacji</label>
          <input
            type="url"
            value={editVerificationUrl}
            onChange={(e) => setEditVerificationUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        {editExpiryDate && (
          <div>
            <label className={learningLabelClass}>Powiadom za (dni przed wygaśnięciem)</label>
            <input
              type="text"
              inputMode="numeric"
              value={editRenewalReminderDays}
              onChange={(e) => setEditRenewalReminderDays(e.target.value.replace(/\D/g, ''))}
              className={`${learningFieldClass} max-w-32 font-mono`}
            />
          </div>
        )}
        <div className={learningFormActionsClass}>
          <button type="button" onClick={onClose} className={learningSecondaryBtnClass}>
            Anuluj
          </button>
          <button type="submit" className={learningPrimaryBtnClass}>
            Zapisz
          </button>
        </div>
      </form>
    </LearningModal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningCertificates() {
  const learning = useLearning()
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  if (!learning) return null

  const { certifications, addCertification, updateCertification, deleteCertification } = learning

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
                      onEdit={() => setEditingCert(c)}
                      onDelete={() => deleteCertification(c.id)}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className={`space-y-3 ${sorted.length > 0 ? 'border-t border-(--border)/60 pt-6' : ''}`}>
        {!showAddForm && (
          <button type="button" onClick={() => setShowAddForm(true)} className={learningAddBtnClass}>
            <Plus className="h-4 w-4" />
            Dodaj certyfikat
          </button>
        )}
        <LearningFormShell
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Nowy certyfikat"
        >
          <CertAddForm
            onAdd={(c) => {
              addCertification(c)
              setShowAddForm(false)
            }}
          />
        </LearningFormShell>
      </div>

      {editingCert && (
        <EditCertModal
          key={editingCert.id}
          cert={editingCert}
          onSave={updateCertification}
          onClose={() => setEditingCert(null)}
        />
      )}
    </div>
  )
}
