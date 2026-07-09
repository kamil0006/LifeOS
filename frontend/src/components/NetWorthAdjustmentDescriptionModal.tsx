import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'

export interface NetWorthAdjustmentDescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  /** Heading, e.g. account or position name */
  title: string
  initialDescription: string
  onSave: (description: string) => void | Promise<void>
}

export function NetWorthAdjustmentDescriptionModal({
  isOpen,
  onClose,
  title,
  initialDescription,
  onSave,
}: NetWorthAdjustmentDescriptionModalProps) {
  const { t } = useTranslation('finances')
  const [text, setText] = useState('')

  useEffect(() => {
    if (isOpen) setText(initialDescription)
  }, [isOpen, initialDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(text)
    onClose()
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      zBackdrop={10000}
      zPanel={10001}
      backdropKey="nw-desc-backdrop"
      panelKey="nw-desc-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-(--text-primary) font-display">{t('netWorthAdjustmentDescriptionModal.title')}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
          aria-label={t('common:close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-base text-(--text-muted) mb-3">{title}</p>
      <p className="text-base text-(--text-muted) mb-3">
        {t('netWorthAdjustmentDescriptionModal.infoText')}
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-base text-(--text-muted) font-display mb-1">{t('netWorthAdjustmentEditModal.descriptionLabel')}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent) focus:outline-none resize-y min-h-[100px]"
          />
          <p className="text-base text-(--text-muted) mt-1">{text.length}/200</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--text-muted) font-display hover:bg-(--bg-card-hover) transition-colors"
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-lg bg-(--accent)/20 text-(--accent) border border-(--accent)/45 font-display hover:bg-(--accent)/30 transition-colors"
          >
            {t('common:save')}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
