import { useState, useEffect } from 'react'
import { Card } from '../../components/Card'
import { WishModal } from '../../components/WishModal'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useWishes } from '../../context/WishesContext'
import { SimplePageSkeleton } from '../../components/skeletons'
import type { Wish, WishStage } from '../../context/WishesContext'

const STAGES: { id: WishStage; label: string }[] = [
  { id: 'pomysl', label: 'Pomysł' },
  { id: 'chce_kupic', label: 'Chcę kupić' },
  { id: 'odkladam', label: 'Odkładam' },
  { id: 'kupione', label: 'Kupione' },
]

const PRIORITY_LABELS: Record<number, string> = {
  1: 'wysoki',
  2: 'średni',
  3: 'niski',
}

function WishCard({
  wish,
  onUpdate,
  onDelete,
}: {
  wish: Wish
  onUpdate: (id: string, updates: Partial<Wish>) => void
  onDelete: () => void
}) {
  const [localSaved, setLocalSaved] = useState<string | number>(wish.savedAmount)
  useEffect(() => {
    setLocalSaved(wish.savedAmount)
  }, [wish.savedAmount])

  const progress = wish.estimatedPrice > 0 ? Math.min(100, (wish.savedAmount / wish.estimatedPrice) * 100) : 0

  const handleBlur = () => {
    const num = typeof localSaved === 'string' ? parseFloat(localSaved) : localSaved
    const parsed = isNaN(num) ? 0 : Math.max(0, Math.min(num, wish.estimatedPrice))
    onUpdate(wish.id, { savedAmount: parsed })
    setLocalSaved(parsed)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative p-4 rounded-lg border border-(--border) bg-(--bg-dark) hover:border-(--accent-magenta)/30 transition-all"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-base text-(--text-primary)">{wish.name}</p>
          <p className="text-base text-(--accent-magenta) font-mono mt-0.5">
            {wish.estimatedPrice.toLocaleString('pl-PL')} zł
          </p>
          <p className="text-sm text-(--text-muted) mt-1">
            priorytet: {PRIORITY_LABELS[wish.priority]}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-(--text-muted)">oszczędzone:</span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={wish.estimatedPrice}
              value={localSaved}
              onChange={(e) => setLocalSaved(e.target.value)}
              onBlur={handleBlur}
              className="no-spinners w-24 px-2 py-1 rounded text-sm bg-(--bg-card) border border-(--border) text-(--accent-green) font-mono focus:border-(--accent-cyan) focus:outline-none"
            />
            <span className="text-sm text-(--text-muted)">zł</span>
          </div>
        </div>
        <select
          value={wish.stage}
          onChange={(e) => onUpdate(wish.id, { stage: e.target.value as WishStage })}
          className="shrink-0 px-2 py-1 rounded text-sm bg-(--bg-card) border border-(--border) text-(--text-primary) focus:border-(--accent-cyan) focus:outline-none"
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="p-2 text-(--text-muted) hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Usuń"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-(--bg-card) overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-(--accent-cyan) to-(--accent-green)"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function FinancesWishes() {
  const { isDemoMode } = useAuth()
  const { wishes, addWish, updateWish, removeWish, loading } = useWishes() ?? {}
  const [showForm, setShowForm] = useState(false)

  const wishesByStage = (wishes ?? []).reduce(
    (acc, w) => {
      acc[w.stage] = acc[w.stage] || []
      acc[w.stage].push(w)
      return acc
    },
    {} as Record<WishStage, Wish[]>
  )

  const handleAdd = (name: string, estimatedPrice: number, priority: 1 | 2 | 3, stage: WishStage = 'pomysl') => {
    addWish?.({ name, estimatedPrice, priority, stage, savedAmount: 0 })
  }

  if (loading) {
    return <SimplePageSkeleton titleWidth="w-44" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-semibold text-(--text-primary) font-gaming tracking-wider">Zachcianki</h3>
          <p className="text-base text-(--text-muted) mt-1">
            {isDemoMode ? 'Dane przykładowe' : 'Pomysły, cele zakupowe i oszczędzanie'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-magenta)/15 text-(--accent-magenta) border border-(--accent-magenta)/40 font-gaming tracking-wider hover:bg-(--accent-magenta)/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
      </div>

      <Card className="border-(--accent-magenta)/20">
        <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Łączna wartość listy</p>
        <p className="text-2xl font-bold text-(--accent-magenta) font-gaming mt-1">
          {(wishes ?? []).reduce((s, w) => s + w.estimatedPrice, 0).toLocaleString('pl-PL')} zł
        </p>
      </Card>

      <div className="space-y-6">
        {STAGES.map((stage) => {
          const items = wishesByStage[stage.id] ?? []
          return (
            <div key={stage.id}>
              <h4 className="text-sm font-semibold text-(--text-muted) font-gaming tracking-wider mb-3">
                {stage.label}
              </h4>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {items.length === 0 ? (
                    <p className="text-sm text-(--text-muted) py-4 text-center border border-dashed border-(--border) rounded-lg">
                      Brak pozycji
                    </p>
                  ) : (
                    items.map((wish) => (
                      <WishCard
                        key={wish.id}
                        wish={wish}
                        onUpdate={(id, updates) => updateWish?.(id, updates)}
                        onDelete={() => removeWish?.(wish.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      <WishModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => {
          handleAdd(data.name, data.estimatedPrice, data.priority, data.stage)
          setShowForm(false)
        }}
      />
    </div>
  )
}
