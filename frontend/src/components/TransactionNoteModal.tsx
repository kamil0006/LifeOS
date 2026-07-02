import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'

export interface TransactionNoteModalProps {
  isOpen: boolean
  onClose: () => void
  /** Nazwa transakcji, do której należy notatka. */
  title: string
  initialNote: string
  onSave: (note: string) => void | Promise<void>
}

export function TransactionNoteModal({ isOpen, onClose, title, initialNote, onSave }: TransactionNoteModalProps) {
  const { t } = useTranslation('finances')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setText(initialNote)
  }, [isOpen, initialNote])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(text.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      zBackdrop={10000}
      zPanel={10001}
      backdropKey="tx-note-backdrop"
      panelKey="tx-note-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-(--text-primary) font-gaming">{t('transactionNoteModal.title')}</h3>
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
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={2000}
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none resize-y min-h-[110px]"
          />
          <p className="text-base text-(--text-muted) mt-1">{text.length}/2000</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) transition-colors"
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/45 font-gaming hover:bg-(--accent-cyan)/30 transition-colors disabled:opacity-50"
          >
            {t('common:save')}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
