import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { WishStage } from '../context/WishesContext'

const STAGES: { id: WishStage; label: string }[] = [
  { id: 'pomysl', label: 'Pomysł' },
  { id: 'chce_kupic', label: 'Chcę kupić' },
  { id: 'odkladam', label: 'Odkładam' },
  { id: 'kupione', label: 'Kupione' },
]

interface WishModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; estimatedPrice: number; priority: 1 | 2 | 3; stage: WishStage }) => void
}

export function WishModal({ isOpen, onClose, onSubmit }: WishModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [stage, setStage] = useState<WishStage>('pomysl')

  useEffect(() => {
    if (isOpen) {
      setName('')
      setPrice('')
      setPriority(2)
      setStage('pomysl')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(price)
    if (!name.trim() || isNaN(amt) || amt <= 0) return
    onSubmit({ name: name.trim(), estimatedPrice: amt, priority, stage })
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto p-4 pt-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              Nowa zachcianka
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa (pomysł)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Cena (zł)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="no-spinners w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Priorytet</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                >
                  <option value="1">Wysoki</option>
                  <option value="2">Średni</option>
                  <option value="3">Niski</option>
                </select>
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Etap</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as WishStage)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:text-(--text-primary)"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent-magenta)/15 text-(--accent-magenta) border border-(--accent-magenta)/40 font-gaming hover:bg-(--accent-magenta)/25"
              >
                Zapisz
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
