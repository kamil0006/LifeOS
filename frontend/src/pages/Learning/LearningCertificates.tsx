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
} from '../../components/learning/learningFormClasses'
import { Plus, ExternalLink, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react'
import { SafeExternalLink } from '../../components/SafeExternalLink'
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
  const { t } = useTranslation('learning')
  const status = getCertStatus(cert)
  const daysLeft = getDaysLeft(cert.expiryDate)

  if (status === 'wygasly') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display bg-[#e74c3c]/10 text-[#e74c3c] border border-[#e74c3c]/30">
        <ShieldOff className="w-3 h-3" />
        {t('certificates.expired')}
      </span>
    )
  }
  if (status === 'wygasa') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display bg-(--warning)/10 text-(--warning) border border-(--warning)/30">
        <ShieldAlert className="w-3 h-3" />
        {t('certificates.expiringIn', { days: daysLeft })}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display bg-(--positive)/10 text-(--positive) border border-(--positive)/30">
      <ShieldCheck className="w-3 h-3" />
      {t('certificates.valid')}
    </span>
  )
}

// ─── ADD FORM (isolated to prevent list re-renders while typing) ───────────────

interface CertAddFormProps {
  onAdd: (c: Omit<Certification, 'id'>) => void
}

const CertAddForm = memo(function CertAddForm({ onAdd }: CertAddFormProps) {
  const { t } = useTranslation('learning')
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
        <label className={learningLabelClass}>{t('certificates.name')}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      <div>
        <label className={learningLabelClass}>{t('certificates.issuer')}</label>
        <input
          type="text"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={learningLabelClass}>{t('certificates.obtainedDate')}</label>
          <input
            type="date"
            value={date}
            max="9999-12-31"
            onChange={(e) => setDate(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('certificates.expiryDate')}</label>
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
        <label className={learningLabelClass}>{t('certificates.certUrl')}</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      <div>
        <label className={learningLabelClass}>{t('certificates.verificationUrl')}</label>
        <input
          type="url"
          value={verificationUrl}
          onChange={(e) => setVerificationUrl(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      {expiryDate && (
        <div>
          <label className={learningLabelClass}>{t('certificates.reminderDays')}</label>
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
          {t('common.add')}
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
  const { t } = useTranslation('learning')
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
    <LearningModal isOpen onClose={onClose} title={t('certificates.editTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={learningLabelClass}>{t('certificates.nameEdit')}</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('certificates.issuerEdit')}</label>
          <input
            type="text"
            value={editIssuer}
            onChange={(e) => setEditIssuer(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={learningLabelClass}>{t('certificates.obtainedDate')}</label>
            <input
              type="date"
              value={editDate}
              max="9999-12-31"
              onChange={(e) => setEditDate(e.target.value)}
              className={learningFieldClass}
            />
          </div>
          <div>
            <label className={learningLabelClass}>{t('certificates.expiryDateEdit')}</label>
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
          <label className={learningLabelClass}>{t('certificates.certUrlEdit')}</label>
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div>
          <label className={learningLabelClass}>{t('certificates.verificationUrlEdit')}</label>
          <input
            type="url"
            value={editVerificationUrl}
            onChange={(e) => setEditVerificationUrl(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        {editExpiryDate && (
          <div>
            <label className={learningLabelClass}>{t('certificates.reminderDaysEdit')}</label>
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
            {t('common.cancel')}
          </button>
          <button type="submit" className={learningPrimaryBtnClass}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </LearningModal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningCertificates() {
  const { t } = useTranslation('learning')
  const learning = useLearning()
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  if (!learning) return null

  const { certifications, addCertification, updateCertification, deleteCertification } = learning

  const sorted = [...certifications].sort((a, b) => b.date.localeCompare(a.date))

  const expiring = sorted.filter((c) => getCertStatus(c) === 'wygasa')
  const expired = sorted.filter((c) => getCertStatus(c) === 'wygasly')
  const valid = sorted.filter((c) => getCertStatus(c) === 'wazny')

  const certGroups: { key: string; labelKey: string; items: Certification[] }[] = [
    { key: 'expiring', labelKey: 'groupExpiring', items: expiring },
    { key: 'valid', labelKey: 'groupValid', items: valid },
    { key: 'expired', labelKey: 'groupExpired', items: expired },
  ]

  return (
    <div className="space-y-6">
      {sorted.length === 0 ? (
        <Card title={t('certificates.emptyList')}>
          <p className="text-base text-(--text-muted)">{t('certificates.emptyMessage')}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {certGroups.map((group) => {
            if (group.items.length === 0) return null
            return (
              <Card key={group.key} title={t(`certificates.${group.labelKey}`)}>
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
                            ? t('certificates.expiredLabel', { date: c.expiryDate })
                            : t('certificates.validUntilLabel', { date: c.expiryDate })
                          : undefined,
                      ]}
                      quickActions={
                        <div className="flex items-center gap-1">
                          {c.verificationUrl && (
                            <SafeExternalLink
                              href={c.verificationUrl}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display text-(--accent) bg-(--accent)/10 hover:bg-(--accent)/20 transition-colors border border-(--accent)/20"
                              title={t('certificates.verify')}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {t('certificates.verifyShort')}
                            </SafeExternalLink>
                          )}
                          {c.url && (
                            <SafeExternalLink
                              href={c.url}
                              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent) transition-colors"
                              title={t('certificates.openCertificate')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </SafeExternalLink>
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
            {t('certificates.addCertificate')}
          </button>
        )}
        <LearningFormShell
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title={t('certificates.addTitle')}
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
