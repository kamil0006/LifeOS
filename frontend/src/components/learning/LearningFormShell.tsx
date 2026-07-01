import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ModalShell } from '../ModalShell'
import { useIsMobile } from '../../hooks/useIsMobile'

type LearningFormShellProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  maxWidth?: string
}

/** Dodawanie: bottom sheet na mobile, karta inline na desktopie. */
export function LearningFormShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}: LearningFormShellProps) {
  const { t } = useTranslation('learning')
  const isMobile = useIsMobile()

  if (!isOpen) return null

  if (isMobile) {
    return (
      <ModalShell isOpen onClose={onClose} maxWidth={maxWidth} padding="px-4 pt-2 pb-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-(--text-primary)">{title}</p>
            {subtitle && <p className="text-sm text-(--text-muted)">{subtitle}</p>}
          </div>
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

  return (
    <div className="rounded-lg border border-(--border)/55 bg-(--bg-card)/20 p-4">
      <p className="mb-4 text-base font-medium text-(--text-primary)">{title}</p>
      {subtitle && <p className="mb-4 -mt-2 text-base text-(--text-muted)">{subtitle}</p>}
      {children}
    </div>
  )
}
