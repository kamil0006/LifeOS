import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from './ConfirmDialog'
import { X, Trash2 } from 'lucide-react'
import { ModalShell } from './ModalShell'

export interface NetWorthAdjustmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initialDescription: string
  /** Kwota korekty (delta salda), jak zapisana w historii */
  initialAmount: number
  onSave: (data: { description: string; amount: number }) => void | Promise<void>
  onDelete: () => void | Promise<void>
}

export function NetWorthAdjustmentEditModal({
  isOpen,
  onClose,
  title,
  initialDescription,
  initialAmount,
  onSave,
  onDelete,
}: NetWorthAdjustmentEditModalProps) {
  const { t } = useTranslation('finances')
  const [text, setText] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setText(initialDescription)
      setAmountStr(String(initialAmount))
      setDeleteConfirmOpen(false)
    }
  }, [isOpen, initialDescription, initialAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(amountStr.replace(',', '.'))
    if (Number.isNaN(amount) || amount === 0) return
    await onSave({ description: text, amount })
    onClose()
  }

  const handleDeleteClick = () => setDeleteConfirmOpen(true)

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-md"
        zBackdrop={10000}
        zPanel={10001}
        backdropKey="nw-adj-edit-backdrop"
        panelKey="nw-adj-edit-panel"
      >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-(--text-primary) font-gaming">{t('netWorthAdjustmentEditModal.title')}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
                  aria-label={t('common:close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-base text-(--text-muted)">{title}</p>
              <p className="mb-4 text-base text-(--text-muted)">
                {t('netWorthAdjustmentEditModal.description')}
              </p>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-base text-(--text-muted) font-gaming">{t('netWorthCorrectionModal.correctionAmountLabel')}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9,.-]/g, ''))}
                    className="w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 font-mono text-base text-(--text-primary) focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-base text-(--text-muted) font-gaming">{t('netWorthAdjustmentEditModal.descriptionLabel')}</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    maxLength={200}
                    className="min-h-[100px] w-full resize-y rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan) focus:outline-none"
                  />
                  <p className="mt-1 text-base text-(--text-muted)">{text.length}/200</p>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#e74c3c]/45 bg-[#e74c3c]/15 py-2.5 font-gaming text-[#e74c3c] transition-colors hover:bg-[#e74c3c]/25"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('netWorthAdjustmentEditModal.deleteEntryButton')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-(--border) py-2.5 font-gaming text-(--text-muted) transition-colors hover:bg-(--bg-card-hover)"
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg border border-(--accent-cyan)/45 bg-(--accent-cyan)/20 py-2.5 font-gaming text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/30 disabled:opacity-50"
                    disabled={
                      !amountStr.trim() ||
                      Number.isNaN(Number(amountStr.replace(',', '.'))) ||
                      Number(amountStr.replace(',', '.')) === 0
                    }
                  >
                    {t('common:save')}
                  </button>
                </div>
              </form>
      </ModalShell>
      <ConfirmDialog
      isOpen={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      zBackdrop={10030}
      zPanel={10031}
      title={t('netWorth.deleteAdjustmentConfirmTitle')}
      description={t('netWorth.deleteAdjustmentConfirmDescriptionApi')}
      variant="danger"
      confirmLabel={t('common:delete')}
      onConfirm={async () => {
        await onDelete()
        onClose()
      }}
    />
    </>
  )
}
