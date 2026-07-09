import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'

export type ConfirmDialogProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  emphasis?: string
  variant?: 'danger' | 'neutral'
  confirmLabel?: string
  cancelLabel?: string
  alertOnly?: boolean
  onConfirm: () => void | Promise<void>
  zBackdrop?: number
  zPanel?: number
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  emphasis,
  variant = 'neutral',
  confirmLabel,
  cancelLabel,
  alertOnly = false,
  onConfirm,
  zBackdrop = 10020,
  zPanel = 10021,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')
  const [busy, setBusy] = useState(false)

  const danger = variant === 'danger'
  const primaryLabel = confirmLabel ?? (alertOnly ? t('ok') : t('confirm'))
  const resolvedCancelLabel = cancelLabel ?? t('cancel')

  const handleConfirm = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={alertOnly ? onClose : undefined}
      maxWidth="max-w-md"
      zBackdrop={zBackdrop}
      zPanel={zPanel}
      backdropKey="confirm-backdrop"
      panelKey="confirm-panel"
    >
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-(--accent)/45 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3
          id="confirm-dialog-title"
          className="text-lg font-bold font-display text-(--text-primary) tracking-wide"
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
          aria-label={t('close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div id="confirm-dialog-desc" className="mb-6 space-y-2">
        {emphasis?.trim() ? (
          <p className="text-base font-display text-(--text-primary)">{emphasis.trim()}</p>
        ) : null}
        <p className="text-base leading-relaxed text-(--text-muted)">{description}</p>
      </div>
      <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${alertOnly ? '' : 'sm:justify-end'}`}>
        {!alertOnly && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full rounded-lg border border-(--border) py-2.5 font-display text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) sm:min-w-28 sm:w-auto"
          >
            {resolvedCancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className={`w-full rounded-lg border py-2.5 font-display transition-colors disabled:opacity-50 sm:min-w-28 sm:w-auto ${
            danger
              ? 'border-[#e74c3c]/50 bg-[#e74c3c]/15 text-[#e74c3c] hover:bg-[#e74c3c]/25'
              : 'border-(--accent)/45 bg-(--accent)/15 text-(--accent) hover:bg-(--accent)/25'
          }`}
        >
          {busy ? '…' : primaryLabel}
        </button>
      </div>
    </ModalShell>
  )
}
