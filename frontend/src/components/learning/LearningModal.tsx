import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ModalShell } from '../ModalShell'

type LearningModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

/** Edycja / szybkie akcje — ModalShell na wszystkich szerokościach. */
export function LearningModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: LearningModalProps) {
  const { t } = useTranslation('learning')
  if (!isOpen) return null

  return (
    <ModalShell isOpen onClose={onClose} maxWidth={maxWidth} padding="px-4 pt-2 pb-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
        <p className="text-lg font-semibold text-(--text-primary)">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-(--text-muted) hover:bg-(--bg-card) hover:text-(--text-primary)"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </ModalShell>
  )
}
