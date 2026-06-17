import { useState } from 'react'
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
  cancelLabel = 'Anuluj',
  alertOnly = false,
  onConfirm,
  zBackdrop = 10020,
  zPanel = 10021,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const danger = variant === 'danger'
  const primaryLabel = confirmLabel ?? (alertOnly ? 'OK' : 'Potwierdź')

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
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-(--accent-cyan)/45 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3
          id="confirm-dialog-title"
          className="text-lg font-bold font-gaming text-(--text-primary) tracking-wide"
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
          aria-label="Zamknij"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div id="confirm-dialog-desc" className="mb-6 space-y-2">
        {emphasis?.trim() ? (
          <p className="text-base font-gaming text-(--text-primary)">{emphasis.trim()}</p>
        ) : null}
        <p className="text-base leading-relaxed text-(--text-muted)">{description}</p>
      </div>
      <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${alertOnly ? '' : 'sm:justify-end'}`}>
        {!alertOnly && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full rounded-lg border border-(--border) py-2.5 font-gaming text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) sm:min-w-28 sm:w-auto"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className={`w-full rounded-lg border py-2.5 font-gaming transition-colors disabled:opacity-50 sm:min-w-28 sm:w-auto ${
            danger
              ? 'border-[#e74c3c]/50 bg-[#e74c3c]/15 text-[#e74c3c] hover:bg-[#e74c3c]/25'
              : 'border-(--accent-cyan)/45 bg-(--accent-cyan)/15 text-(--accent-cyan) hover:bg-(--accent-cyan)/25'
          }`}
        >
          {busy ? '…' : primaryLabel}
        </button>
      </div>
    </ModalShell>
  )
}
