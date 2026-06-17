import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { ModalShell } from './ModalShell'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  getNetWorthAccountIcon,
  getNetWorthAccountIconKey,
  NW_ASSET_ICON_OPTIONS,
  NW_LIABILITY_ICON_OPTIONS,
} from '../lib/netWorthAccountIcons'
import {
  DEFAULT_NW_ASSET_ACCENT_KEY,
  getNwAssetAccentClasses,
  NW_ASSET_ACCENT_OPTIONS,
} from '../lib/netWorthAssetAccent'

export interface NetWorthAccountCreateModalProps {
  isOpen: boolean
  onClose: () => void
  kind: 'asset' | 'liability' | null
  onSubmit: (data: {
    name: string
    balance: number
    kind: 'asset' | 'liability'
    iconKey: string
    accentKey: string | null
  }) => void | Promise<void>
}

function capitalizeFirstLetter(value: string): string {
  const t = value.trimStart()
  if (t.length === 0) return value.trim()
  const lead = value.length - t.length
  return value.slice(0, lead) + t.charAt(0).toLocaleUpperCase('pl-PL') + t.slice(1)
}

export function NetWorthAccountCreateModal({ isOpen, onClose, kind, onSubmit }: NetWorthAccountCreateModalProps) {
  const isMobile = useIsMobile()
  const lastKindRef = useRef<'asset' | 'liability'>('asset')
  if (kind != null) lastKindRef.current = kind
  const resolvedKind = kind ?? lastKindRef.current

  const [name, setName] = useState('')
  const [balanceStr, setBalanceStr] = useState('')
  const [iconKey, setIconKey] = useState('circleDollar')
  const [accentKey, setAccentKey] = useState(DEFAULT_NW_ASSET_ACCENT_KEY)

  useEffect(() => {
    if (isOpen && kind != null) {
      setName('')
      setBalanceStr('')
      setIconKey(getNetWorthAccountIconKey(kind))
      setAccentKey(DEFAULT_NW_ASSET_ACCENT_KEY)
    }
  }, [isOpen, kind])

  const title = resolvedKind === 'asset' ? 'Nowe aktywo' : 'Nowy dług / kredyt'
  const submitLabel = resolvedKind === 'asset' ? 'Dodaj aktywo' : 'Dodaj zobowiązanie'
  const iconOptions = resolvedKind === 'asset' ? NW_ASSET_ICON_OPTIONS : NW_LIABILITY_ICON_OPTIONS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (kind == null) return
    const trimmed = name.trim()
    if (!trimmed) return
    const bal = balanceStr.trim() === '' ? 0 : Number(balanceStr.replace(',', '.'))
    if (Number.isNaN(bal) || bal < 0) return
    const payload = {
      name: capitalizeFirstLetter(trimmed),
      balance: bal,
      kind,
      iconKey,
      accentKey: kind === 'asset' ? accentKey : null,
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    try {
      await onSubmit(payload)
      onClose()
    } catch {
      /* błąd API — modal zostaje otwarty */
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      backdropKey="nw-acc-backdrop"
      panelKey="nw-acc-panel"
    >
              <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-(--text-primary) font-gaming">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
                  aria-label="Zamknij"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">
                    {resolvedKind === 'asset' ? 'Nazwa aktywa' : 'Nazwa (np. kredyt hipoteczny, karta)'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setName((n) => (n.trim() ? capitalizeFirstLetter(n) : n))}
                    autoFocus={!isMobile}
                    className="w-full px-3 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                  />
                  <p className="mt-1 text-base text-(--text-muted)">Pierwsza litera zostanie zapisana jako wielka.</p>
                </div>
                <div>
                  <span className="mb-2 block text-base text-(--text-muted) font-gaming">Ikona na liście</span>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map(({ key, label }) => {
                      const Icon = getNetWorthAccountIcon(key)
                      const selected = iconKey === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIconKey(key)}
                          title={label}
                          aria-label={label}
                          aria-pressed={selected}
                          className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                            selected
                              ? resolvedKind === 'asset'
                                ? 'border-(--accent-cyan)/55 bg-(--accent-cyan)/20 text-(--accent-cyan)'
                                : 'border-[#e74c3c]/50 bg-[#e74c3c]/15 text-[#e74c3c]'
                              : 'border-(--border) bg-(--bg-dark) text-(--text-muted) hover:border-(--accent-cyan)/35 hover:text-(--text-primary)'
                          }`}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </button>
                      )
                    })}
                  </div>
                </div>
                {resolvedKind === 'asset' ? (
                  <div>
                    <span className="mb-2 block text-base text-(--text-muted) font-gaming">Kolor na liście</span>
                    <div className="flex flex-wrap gap-3">
                      {NW_ASSET_ACCENT_OPTIONS.map(({ key, label }) => {
                        const { swatch } = getNwAssetAccentClasses(key)
                        const selected = accentKey === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setAccentKey(key)}
                            title={label}
                            aria-label={label}
                            aria-pressed={selected}
                            className={`relative h-10 w-10 rounded-full ${swatch} transition-transform ${
                              selected
                                ? 'ring-2 ring-(--text-primary) ring-offset-2 ring-offset-(--bg-card) scale-105'
                                : 'opacity-80 hover:opacity-100 hover:scale-[1.02]'
                            }`}
                          />
                        )
                      })}
                    </div>
                    <p className="mt-1.5 text-base text-(--text-muted)">
                      Ikona i kwota aktywa będą w tym kolorze.
                    </p>
                  </div>
                ) : null}
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">
                    {resolvedKind === 'asset' ? 'Wartość początkowa (zł)' : 'Saldo zadłużenia (zł)'}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={balanceStr}
                    onChange={(e) => setBalanceStr(e.target.value.replace(/[^0-9,.]/g, ''))}
                    placeholder="np. 15000"
                    className="w-full px-3 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-mono focus:border-(--accent-cyan) focus:outline-none"
                  />
                </div>
                <p className="text-base text-(--text-muted)">
                  {resolvedKind === 'liability'
                    ? 'Kwota to wielkość zobowiązania. Późniejsze spłaty zapisujesz korektą ujemną.'
                    : 'Saldo początkowe; zmiany wprowadzisz przez korektę na karcie pozycji.'}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-lg font-gaming font-medium transition-colors ${
                      resolvedKind === 'asset'
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/45 hover:bg-(--accent-cyan)/30'
                        : 'bg-[#e74c3c]/15 text-[#e74c3c] border border-[#e74c3c]/45 hover:bg-[#e74c3c]/25'
                    }`}
                  >
                    {submitLabel}
                  </button>
                </div>
              </form>
    </ModalShell>
  )
}
