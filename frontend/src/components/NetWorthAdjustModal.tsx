import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import type { NetWorthPositionKey } from '../context/DemoDataContext'

interface NetWorthAdjustModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (position: NetWorthPositionKey, amount: number, isAdd: boolean, description: string) => void
  /** Gdy ustawione – blokuje zmianę pozycji, edytujemy tylko tę kartę */
  initialPosition?: NetWorthPositionKey
  /** Aktualna wartość pozycji – do podglądu przed zatwierdzeniem */
  currentValue?: number
}

export function NetWorthAdjustModal({ isOpen, onClose, onSubmit, initialPosition, currentValue = 0 }: NetWorthAdjustModalProps) {
  const { t } = useTranslation('finances')
  const POSITION_LABELS: Record<NetWorthPositionKey, string> = {
    cash: t('netWorth.position.cash'),
    bankAccount: t('netWorth.position.bankAccount'),
    assets: t('netWorth.position.assets'),
  }
  const [position, setPosition] = useState<NetWorthPositionKey>(initialPosition ?? 'cash')
  const [amount, setAmount] = useState('')
  const [isAdd, setIsAdd] = useState(true)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPosition(initialPosition ?? 'cash')
      setAmount('')
      setIsAdd(true)
      setDescription('')
    }
  }, [isOpen, initialPosition])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount.replace(',', '.'))
    if (isNaN(amt) || amt <= 0) return
    onSubmit(position, amt, isAdd, description.trim())
    onClose()
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      backdropKey="networth-backdrop"
      panelKey="networth-panel"
    >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              {t('netWorthAdjustModal.title', { position: POSITION_LABELS[position] })}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label={t('common:close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">{t('netWorthAdjustModal.positionLabel')}</label>
              {initialPosition != null ? (
                <div className="px-3 py-2 rounded-lg bg-(--bg-dark)/50 border border-(--border) text-(--text-primary) font-gaming">
                  {POSITION_LABELS[position]}
                </div>
              ) : (
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as NetWorthPositionKey)}
                  className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                >
                  <option value="cash">{POSITION_LABELS.cash}</option>
                  <option value="bankAccount">{POSITION_LABELS.bankAccount}</option>
                  <option value="assets">{POSITION_LABELS.assets}</option>
                </select>
              )}
              <p className="text-sm text-(--text-muted) mt-0.5">
                {position === 'cash' && t('netWorthAdjustModal.positionDesc.cash')}
                {position === 'bankAccount' && t('netWorthAdjustModal.positionDesc.bankAccount')}
                {position === 'assets' && t('netWorthAdjustModal.positionDesc.assets')}
              </p>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">{t('netWorthAdjustModal.operationLabel')}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdd(true)}
                  className={`flex-1 py-2 rounded-lg font-gaming text-sm transition-colors ${
                    isAdd
                      ? 'bg-(--accent-green)/20 text-(--accent-green) border border-(--accent-green)/40'
                      : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                  }`}
                >
                  {t('netWorthAdjustModal.addOp')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdd(false)}
                  className={`flex-1 py-2 rounded-lg font-gaming text-sm transition-colors ${
                    !isAdd
                      ? 'bg-[#e74c3c]/20 text-[#e74c3c] border border-[#e74c3c]/40'
                      : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                  }`}
                >
                  {t('netWorthAdjustModal.subtractOp')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">{t('transactionModal.amountLabel')}</label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9,.-]/g, ''))}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>

            {amount.trim() && (() => {
              const amt = parseFloat(amount.replace(',', '.'))
              const newValue = isNaN(amt) ? currentValue : Math.max(0, currentValue + (isAdd ? amt : -amt))
              return (
                <div className="rounded-lg border border-(--border) bg-(--bg-dark)/50 px-3 py-2">
                  <p className="text-sm text-(--text-muted) font-gaming">{t('netWorthAdjustModal.previewLabel')}</p>
                  <p className="text-base font-mono text-(--text-primary) mt-0.5">
                    {currentValue.toLocaleString('pl-PL')} zł → <span className={isAdd ? 'text-(--accent-green)' : 'text-[#e74c3c]'}>{newValue.toLocaleString('pl-PL')} zł</span>
                  </p>
                </div>
              )
            })()}

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">{t('netWorthAdjustModal.descriptionLabel')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder={t('netWorthAdjustModal.descriptionPlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none resize-y min-h-[72px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) transition-colors"
              >
                {t('common:cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={!amount.trim() || parseFloat(amount.replace(',', '.')) <= 0}
              >
                {t('netWorthAdjustModal.apply')}
              </button>
            </div>
          </form>
    </ModalShell>
  )
}
