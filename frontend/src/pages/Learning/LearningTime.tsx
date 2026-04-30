import { useState, useMemo, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../../components/Card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Plus,
  Trash2,
  Target,
  Clock,
  X,
  Pencil,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLearning } from '../../context/LearningContext'
import { ChartPeriodSelector } from '../../components/ChartPeriodSelector'
import { useChartPeriod, getMonthsInQuarter } from '../../context/ChartPeriodContext'
import { useModalMotion } from '../../lib/modalMotion'
import { useUndoDelete } from '../../components/learning/UndoToast'
import { SESSION_TYPE_OPTIONS, formatMinutes } from './learningUtils'
import { PomodoroInlineButton } from '../../components/learning/PomodoroTimer'
import type { LearningSession, SessionType } from '../../context/LearningContext'

export { SESSION_TYPE_OPTIONS, formatMinutes }

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

// ─── FORM COMPONENT (isolated to prevent re-renders of list/chart) ────────────

interface SessionFormProps {
  sessionCategories: string[]
  onAdd: (s: Omit<LearningSession, 'id'>) => void
  onAddCategory: (name: string) => void
  onRemoveCategory: (name: string) => void
}

const SessionForm = memo(function SessionForm({
  sessionCategories,
  onAdd,
  onAddCategory,
  onRemoveCategory,
}: SessionFormProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [minutes, setMinutes] = useState('')
  const [topic, setTopic] = useState('')
  const [type, setType] = useState<SessionType>('inne')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [newCatInput, setNewCatInput] = useState('')
  const [showCatManager, setShowCatManager] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseInt(minutes, 10)
    if (isNaN(m) || m <= 0) return
    onAdd({
      date,
      minutes: m,
      topic: topic.trim() || 'Nauka',
      type,
      category: category || undefined,
      note: note.trim() || undefined,
    })
    setMinutes('')
    setTopic('')
    setType('inne')
    setCategory('')
    setNote('')
  }

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim()
    if (!trimmed) return
    onAddCategory(trimmed)
    setCategory(trimmed)
    setNewCatInput('')
  }

  return (
    <Card title="Dodaj sesję">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
            <input
              type="date"
              value={date}
              max="9999-12-31"
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Czas (min)</label>
            <input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
              placeholder="np. 90"
              className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-24 focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-base text-(--text-muted) font-gaming mb-1">Temat</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="np. React hooks"
              className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
            />
          </div>
        </div>

        {/* Category selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-base text-(--text-muted) font-gaming">Kategoria</label>
            <button
              type="button"
              onClick={() => setShowCatManager((v) => !v)}
              className="text-xs text-(--text-muted) hover:text-(--accent-cyan) font-gaming transition-colors"
            >
              {showCatManager ? 'Zamknij' : 'Zarządzaj'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                category === ''
                  ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                  : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
              }`}
            >
              Bez kategorii
            </button>
            {sessionCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                  category === cat
                    ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                    : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {showCatManager && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="Nowa kategoria"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming text-sm focus:border-(--accent-cyan) focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCatInput.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-(--accent-cyan) text-(--accent-cyan) font-gaming text-sm hover:bg-(--accent-cyan)/10 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj
                </button>
              </div>
              {sessionCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sessionCategories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-(--bg-dark) border border-(--border) text-sm font-gaming text-(--text-muted)"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveCategory(cat)
                          if (category === cat) setCategory('')
                        }}
                        className="hover:text-[#e74c3c] transition-colors"
                        aria-label={`Usuń kategorię ${cat}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Session type */}
        <div>
          <label className="block text-base text-(--text-muted) font-gaming mb-2">Typ sesji</label>
          <div className="flex flex-wrap gap-2">
            {SESSION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                  type === opt.value
                    ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                    : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatka (opcjonalnie)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!minutes.trim() || parseInt(minutes, 10) <= 0}
        >
          <Plus className="w-4 h-4" />
          Dodaj sesję
        </button>
      </form>
    </Card>
  )
})

// ─── QUICK ADD MODAL ──────────────────────────────────────────────────────────

interface QuickAddModalProps {
  minutes: number
  sessionCategories: string[]
  onAdd: (s: Omit<LearningSession, 'id'>) => void
  onClose: () => void
}

function QuickAddModal({ minutes, sessionCategories, onAdd, onClose }: QuickAddModalProps) {
  const { backdrop, panel } = useModalMotion()
  const [topic, setTopic] = useState('')
  const [type, setType] = useState<SessionType>('inne')
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      date: new Date().toISOString().split('T')[0],
      minutes,
      topic: topic.trim() || 'Nauka',
      type,
      category: category || undefined,
    })
    onClose()
  }

  return createPortal(
    <>
      <motion.div
        key="quick-add-backdrop"
        {...backdrop}
        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="quick-add-panel"
          {...panel}
          className="pointer-events-auto relative w-full max-w-sm rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
              + {formatMinutes(minutes)}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted)"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Temat</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="np. React hooks"
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            {sessionCategories.length > 0 && (
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-2">Kategoria</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                      category === ''
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                    }`}
                  >
                    —
                  </button>
                  {sessionCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                        category === cat
                          ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                          : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-2">Typ</label>
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                      type === opt.value
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover)"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90"
              >
                Dodaj
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

// ─── EDIT SESSION MODAL ───────────────────────────────────────────────────────

interface EditSessionModalProps {
  session: LearningSession
  sessionCategories: string[]
  onSave: (id: string, u: Partial<LearningSession>) => void
  onClose: () => void
}

function EditSessionModal({ session, sessionCategories, onSave, onClose }: EditSessionModalProps) {
  const { backdrop, panel } = useModalMotion()
  const [date, setDate] = useState(session.date)
  const [minutes, setMinutes] = useState(String(session.minutes))
  const [topic, setTopic] = useState(session.topic)
  const [type, setType] = useState<SessionType>(session.type)
  const [category, setCategory] = useState(session.category ?? '')
  const [note, setNote] = useState(session.note ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseInt(minutes, 10)
    if (isNaN(m) || m <= 0) return
    onSave(session.id, {
      date,
      minutes: m,
      topic: topic.trim() || 'Nauka',
      type,
      category: category || undefined,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return createPortal(
    <>
      <motion.div
        key="edit-session-backdrop"
        {...backdrop}
        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="edit-session-panel"
          {...panel}
          className="pointer-events-auto relative w-full max-w-sm rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Edytuj sesję</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted)"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  max="9999-12-31"
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Min</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
                  className="px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono w-20 focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Temat</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            {sessionCategories.length > 0 && (
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-2">Kategoria</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                      category === ''
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                    }`}
                  >
                    —
                  </button>
                  {sessionCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                        category === cat
                          ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                          : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-2">Typ</label>
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-gaming text-sm transition-colors ${
                      type === opt.value
                        ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border border-(--accent-cyan)/40'
                        : 'bg-(--bg-dark) text-(--text-muted) border border-(--border) hover:border-(--accent-cyan)/40'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatka</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-gaming focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover)"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90"
              >
                Zapisz
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

// ─── GOAL EDIT MODAL ──────────────────────────────────────────────────────────

interface GoalEditModalProps {
  currentGoalMinutes: number
  onSave: (minutes: number) => void
  onClose: () => void
}

function GoalEditModal({ currentGoalMinutes, onSave, onClose }: GoalEditModalProps) {
  const { backdrop, panel } = useModalMotion()
  const [value, setValue] = useState(String(Math.round(currentGoalMinutes / 60)))

  return createPortal(
    <>
      <motion.div
        key="goal-edit-backdrop"
        {...backdrop}
        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="goal-edit-panel"
          {...panel}
          className="pointer-events-auto relative w-full max-w-sm rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-(--text-primary) font-gaming">Cel tygodniowy</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted)">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const hours = parseFloat(value.replace(',', '.'))
              if (!isNaN(hours) && hours > 0) onSave(Math.round(hours * 60))
              onClose()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Godzin na tydzień</label>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9,.]/g, ''))}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) font-mono focus:border-(--accent-cyan) focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming font-bold hover:opacity-90"
            >
              Zapisz
            </button>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningTime() {
  const learning = useLearning()
  const chartPeriod = useChartPeriod()

  const [quickMinutes, setQuickMinutes] = useState<number | null>(null)
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [editingSession, setEditingSession] = useState<LearningSession | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const { pendingId, toast, scheduleDelete } = useUndoDelete<LearningSession>(
    useCallback((id) => learning?.deleteSession(id), [learning]),
  )

  const sessions = useMemo(() => learning?.sessions ?? [], [learning])

  const weekProgress = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    const startStr = startOfWeek.toISOString().split('T')[0]
    const endStr = now.toISOString().split('T')[0]
    return sessions
      .filter((s) => s.date >= startStr && s.date <= endStr)
      .reduce((sum, s) => sum + s.minutes, 0)
  }, [sessions])

  const trendData = useMemo(() => {
    if (chartPeriod?.period.type === 'year') {
      const y = chartPeriod.period.year
      return Array.from({ length: 12 }, (_, m) => {
        const total = sessions
          .filter((s) => {
            const [sy, sm] = s.date.split('-').map(Number)
            return sy === y && sm - 1 === m
          })
          .reduce((sum, s) => sum + s.minutes, 0)
        return { label: monthNames[m], minuty: total }
      })
    }
    if (chartPeriod?.period.type === 'quarter') {
      const { quarter, year } = chartPeriod.period
      const months = getMonthsInQuarter(quarter, year)
      return months.map(({ month: m, year: y }) => {
        const total = sessions
          .filter((s) => {
            const [sy, sm] = s.date.split('-').map(Number)
            return sy === y && sm - 1 === m
          })
          .reduce((sum, s) => sum + s.minutes, 0)
        return { label: `${monthNames[m]} ${y}`, minuty: total }
      })
    }
    if (chartPeriod?.period.type === 'month') {
      const m = chartPeriod.period.month
      const y = chartPeriod.period.year
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      return Array.from({ length: daysInMonth }, (_, i) => {
        const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
        const total = sessions.filter((s) => s.date === dayStr).reduce((sum, s) => sum + s.minutes, 0)
        return { label: String(i + 1), minuty: total }
      })
    }
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return Array.from({ length: m + 1 }, (_, i) => {
      const total = sessions
        .filter((s) => {
          const [sy, sm] = s.date.split('-').map(Number)
          return sy === y && sm - 1 === i
        })
        .reduce((sum, s) => sum + s.minutes, 0)
      return { label: `${monthNames[i]}-${y}`, minuty: total }
    })
  }, [sessions, chartPeriod])

  if (!learning) return null

  const {
    addSession,
    updateSession,
    sessionCategories,
    addSessionCategory,
    removeSessionCategory,
    weeklyGoalMinutes,
    setWeeklyGoalMinutes,
  } = learning

  const goalPercent = Math.min(100, Math.round((weekProgress / weeklyGoalMinutes) * 100))
  const sorted = [...sessions]
    .filter((s) => s.id !== pendingId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  return (
    <div className="space-y-6">
      {/* Weekly goal bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-(--accent-cyan)" />
            <span className="font-gaming text-(--text-primary) tracking-wide">Ten tydzień</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGoalEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-cyan)/50 text-(--text-muted) hover:text-(--accent-cyan) transition-colors font-gaming text-sm"
            title="Zmień cel tygodniowy"
          >
            <Target className="w-3.5 h-3.5" />
            Cel: {formatMinutes(weeklyGoalMinutes)}
            <Pencil className="w-3 h-3 opacity-60" />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2.5 rounded-full bg-(--bg-dark) overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${goalPercent}%`,
                background:
                  goalPercent >= 100
                    ? 'var(--accent-green)'
                    : goalPercent >= 50
                      ? 'var(--accent-cyan)'
                      : 'var(--accent-amber)',
              }}
            />
          </div>
          <span className="text-sm font-mono text-(--text-muted) whitespace-nowrap">
            {formatMinutes(weekProgress)} / {formatMinutes(weeklyGoalMinutes)}
          </span>
          <span className="text-sm font-gaming text-(--accent-cyan) w-10 text-right">{goalPercent}%</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[30, 60, 120].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setQuickMinutes(mins)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent-cyan)/10 border border-(--accent-cyan)/30 text-(--accent-cyan) font-gaming text-sm hover:bg-(--accent-cyan)/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {mins < 60 ? `${mins} min` : `${mins / 60} h`}
            </button>
          ))}
          <PomodoroInlineButton />
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-gaming text-sm transition-colors ${
              showAddForm
                ? 'bg-(--accent-cyan)/20 text-(--accent-cyan) border-(--accent-cyan)/40'
                : 'bg-(--bg-dark) text-(--text-muted) border-(--border) hover:border-(--accent-cyan)/40 hover:text-(--text-primary)'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Dodaj ręcznie
          </button>
        </div>
      </Card>

      {/* Collapsible manual add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="session-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <SessionForm
              sessionCategories={sessionCategories}
              onAdd={(s) => { addSession(s); setShowAddForm(false) }}
              onAddCategory={addSessionCategory}
              onRemoveCategory={removeSessionCategory}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session history */}
      <Card title="Historia sesji">
        {sorted.length === 0 ? (
          <p className="text-base text-(--text-muted)">Brak sesji. Dodaj pierwszą.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((s) => {
              const typeOpt = SESSION_TYPE_OPTIONS.find((o) => o.value === s.type)
              const TypeIcon = typeOpt?.icon ?? Clock
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-(--bg-dark)/50 border border-(--border)"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TypeIcon className="w-4 h-4 text-(--accent-cyan) shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-gaming text-(--text-primary) truncate max-w-[220px]"
                          title={s.topic}
                        >
                          {s.topic}
                        </p>
                        {s.category && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-(--bg-card) text-(--text-muted) border border-(--border) font-gaming">
                            {s.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-(--text-muted)">
                        <span className="font-mono text-(--accent-cyan)">{formatMinutes(s.minutes)}</span>
                        <span className="ml-2">{s.date}</span>
                        {typeOpt && <span className="ml-2 opacity-60">• {typeOpt.label}</span>}
                        {s.note && <span className="ml-2">• {s.note}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingSession(s)}
                      className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
                      aria-label="Edytuj"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scheduleDelete(s, s.topic)}
                      className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
                      aria-label="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Trend chart */}
      {trendData.length > 0 && (
        <Card
          title={`Trend czasu nauki${
            chartPeriod?.period.type === 'quarter'
              ? ` (Q${chartPeriod.period.quarter} ${chartPeriod.period.year})`
              : chartPeriod?.period.type === 'year'
                ? ` (${chartPeriod.period.year})`
                : chartPeriod?.period.type === 'month'
                  ? ` (${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year})`
                  : ' (ten rok)'
          }`}
          action={chartPeriod ? <ChartPeriodSelector /> : undefined}
        >
          <div className="h-60 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMinuty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${Math.round(v / 60)} h`} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => [
                    value != null ? formatMinutes(value) : '',
                    'Czas nauki',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="minuty"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMinuty)"
                  name="Czas nauki"
                  baseValue={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Quick add modal */}
      <AnimatePresence>
        {quickMinutes !== null && (
          <QuickAddModal
            key={quickMinutes}
            minutes={quickMinutes}
            sessionCategories={sessionCategories}
            onAdd={addSession}
            onClose={() => setQuickMinutes(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit session modal */}
      <AnimatePresence>
        {editingSession && (
          <EditSessionModal
            key={editingSession.id}
            session={editingSession}
            sessionCategories={sessionCategories}
            onSave={updateSession}
            onClose={() => setEditingSession(null)}
          />
        )}
      </AnimatePresence>

      {/* Goal edit modal */}
      <AnimatePresence>
        {showGoalEdit && (
          <GoalEditModal
            key="goal-edit"
            currentGoalMinutes={weeklyGoalMinutes}
            onSave={setWeeklyGoalMinutes}
            onClose={() => setShowGoalEdit(false)}
          />
        )}
      </AnimatePresence>

      {/* Undo delete toast */}
      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
