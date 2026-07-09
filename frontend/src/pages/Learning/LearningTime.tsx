import { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
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
import { AnimatePresence } from 'framer-motion'
import { useLearning } from '../../context/LearningContext'
import { ChartPeriodSelector } from '../../components/ChartPeriodSelector'
import { useChartPeriod, getMonthsInQuarter } from '../../context/ChartPeriodContext'
import { useUndoDelete } from '../../components/learning/UndoToast'
import { LearningFormShell } from '../../components/learning/LearningFormShell'
import { LearningModal } from '../../components/learning/LearningModal'
import {
  learningFieldClass,
  learningLabelClass,
  learningFormActionsClass,
  learningPrimaryBtnClass,
  learningSecondaryBtnClass,
  learningAddBtnClass,
  learningChipClass,
} from '../../components/learning/learningFormClasses'
import { useIsMobile } from '../../hooks/useIsMobile'
import { SESSION_TYPE_OPTIONS, formatMinutes } from './learningUtils'
import { PomodoroInlineButton } from '../../components/learning/PomodoroTimer'
import type { LearningSession, SessionType } from '../../context/LearningContext'

export { SESSION_TYPE_OPTIONS, formatMinutes }

const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

const QUICK_SESSION_OPTIONS = [
  { mins: 30, label: '30 min' },
  { mins: 60, label: '1 h' },
  { mins: 90, label: '1,5 h' },
] as const

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
  const { t } = useTranslation('learning')
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
      topic: topic.trim() || t('overview.quickSession'),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-auto">
          <label className={learningLabelClass}>{t('time.date')}</label>
          <input
            type="date"
            value={date}
            max="9999-12-31"
            onChange={(e) => setDate(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className={learningLabelClass}>{t('time.minutes')}</label>
          <input
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
            placeholder={t('time.minutesPlaceholder')}
            className={`${learningFieldClass} sm:w-28`}
          />
        </div>
        <div className="w-full min-w-0 sm:flex-1 sm:min-w-[160px]">
          <label className={learningLabelClass}>{t('time.topic')}</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('time.topicPlaceholder')}
            className={learningFieldClass}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={learningLabelClass}>{t('time.category')}</label>
          <button
            type="button"
            onClick={() => setShowCatManager((v) => !v)}
            className="text-sm text-(--text-muted) transition-colors hover:text-(--accent)"
          >
            {showCatManager ? t('common.closeCategories') : t('common.manageCategories')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={learningChipClass(category === '')}
          >
            {t('common.noCategory')}
          </button>
          {sessionCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={learningChipClass(category === cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        {showCatManager && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
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
                placeholder={t('common.newCategory')}
                className={learningFieldClass}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatInput.trim()}
                className={`${learningSecondaryBtnClass} shrink-0`}
              >
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </button>
            </div>
            {sessionCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sessionCategories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1 rounded border border-(--border) bg-(--bg-dark) px-2 py-1 text-sm text-(--text-muted)"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveCategory(cat)
                        if (category === cat) setCategory('')
                      }}
                      className="transition-colors hover:text-[#e74c3c]"
                      aria-label={t('common.removeCategoryAria', { name: cat })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={learningLabelClass}>{t('time.sessionType')}</label>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`${learningChipClass(type === opt.value)} flex items-center gap-1.5`}
            >
              <opt.icon className="h-3.5 w-3.5" />
              {t(`sessionType.${opt.value}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={learningLabelClass}>{t('time.note')}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={learningFieldClass}
        />
      </div>
      <button
        type="submit"
        className={learningPrimaryBtnClass}
        disabled={!minutes.trim() || parseInt(minutes, 10) <= 0}
      >
        <Plus className="h-4 w-4" />
        {t('overview.addSession')}
      </button>
    </form>
  )
})

// ─── QUICK ADD MODAL ──────────────────────────────────────────────────────────

interface QuickAddModalProps {
  isOpen: boolean
  minutes: number
  sessionCategories: string[]
  onAdd: (s: Omit<LearningSession, 'id'>) => void
  onClose: () => void
}

function QuickAddModal({ isOpen, minutes, sessionCategories, onAdd, onClose }: QuickAddModalProps) {
  const { t } = useTranslation('learning')
  const [topic, setTopic] = useState('')
  const [type, setType] = useState<SessionType>('inne')
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      date: new Date().toISOString().split('T')[0],
      minutes,
      topic: topic.trim() || t('overview.quickSession'),
      type,
      category: category || undefined,
    })
    onClose()
  }

  return (
    <LearningModal isOpen={isOpen} onClose={onClose} title={`+ ${formatMinutes(minutes)}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={learningLabelClass}>{t('time.topic')}</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('time.topicPlaceholder')}
            autoFocus
            className={learningFieldClass}
          />
        </div>
        {sessionCategories.length > 0 && (
          <div>
            <label className={learningLabelClass}>{t('time.category')}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={learningChipClass(category === '')}
              >
                —
              </button>
              {sessionCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={learningChipClass(category === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className={learningLabelClass}>{t('time.sessionType')}</label>
          <div className="flex flex-wrap gap-2">
            {SESSION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`${learningChipClass(type === opt.value)} flex items-center gap-1.5`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {t(`sessionType.${opt.value}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={learningFormActionsClass}>
          <button type="button" onClick={onClose} className={learningSecondaryBtnClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={learningPrimaryBtnClass}>
            {t('common.add')}
          </button>
        </div>
      </form>
    </LearningModal>
  )
}

// ─── EDIT SESSION MODAL ───────────────────────────────────────────────────────

interface EditSessionModalProps {
  isOpen: boolean
  session: LearningSession
  sessionCategories: string[]
  onSave: (id: string, u: Partial<LearningSession>) => void
  onClose: () => void
}

function EditSessionModal({
  isOpen,
  session,
  sessionCategories,
  onSave,
  onClose,
}: EditSessionModalProps) {
  const { t } = useTranslation('learning')
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
      topic: topic.trim() || t('overview.quickSession'),
      type,
      category: category || undefined,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <LearningModal isOpen={isOpen} onClose={onClose} title={t('time.editSessionTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="w-full sm:w-auto">
            <label className={learningLabelClass}>{t('time.date')}</label>
            <input
              type="date"
              value={date}
              max="9999-12-31"
              onChange={(e) => setDate(e.target.value)}
              className={learningFieldClass}
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className={learningLabelClass}>{t('time.min')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
              className={`${learningFieldClass} sm:w-24`}
            />
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>{t('time.topic')}</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            autoFocus
            className={learningFieldClass}
          />
        </div>
        {sessionCategories.length > 0 && (
          <div>
            <label className={learningLabelClass}>{t('time.category')}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={learningChipClass(category === '')}
              >
                —
              </button>
              {sessionCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={learningChipClass(category === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className={learningLabelClass}>{t('time.sessionType')}</label>
          <div className="flex flex-wrap gap-2">
            {SESSION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`${learningChipClass(type === opt.value)} flex items-center gap-1.5`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {t(`sessionType.${opt.value}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={learningLabelClass}>{t('time.noteEdit')}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={learningFieldClass}
          />
        </div>
        <div className={learningFormActionsClass}>
          <button type="button" onClick={onClose} className={learningSecondaryBtnClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={learningPrimaryBtnClass}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </LearningModal>
  )
}

// ─── GOAL EDIT MODAL ──────────────────────────────────────────────────────────

interface GoalEditModalProps {
  isOpen: boolean
  currentGoalMinutes: number
  onSave: (minutes: number) => void
  onClose: () => void
}

function GoalEditModal({ isOpen, currentGoalMinutes, onSave, onClose }: GoalEditModalProps) {
  const { t } = useTranslation('learning')
  const [value, setValue] = useState(String(Math.round(currentGoalMinutes / 60)))

  return (
    <LearningModal isOpen={isOpen} onClose={onClose} title={t('time.goalEditTitle')}>
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
          <label className={learningLabelClass}>{t('time.hoursPerWeek')}</label>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9,.]/g, ''))}
            autoFocus
            className={learningFieldClass}
          />
        </div>
        <button type="submit" className={`${learningPrimaryBtnClass} w-full sm:w-auto`}>
          {t('common.save')}
        </button>
      </form>
    </LearningModal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function LearningTime() {
  const { t } = useTranslation('learning')
  const learning = useLearning()
  const chartPeriod = useChartPeriod()
  const isMobile = useIsMobile()

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

  const chartHeight = isMobile ? 192 : 240

  const trendTitleSuffix =
    chartPeriod?.period.type === 'quarter'
      ? ` (Q${chartPeriod.period.quarter} ${chartPeriod.period.year})`
      : chartPeriod?.period.type === 'year'
        ? ` (${chartPeriod.period.year})`
        : chartPeriod?.period.type === 'month'
          ? ` (${monthNames[chartPeriod.period.month]} ${chartPeriod.period.year})`
          : t('time.trendThisYear')

  return (
    <div className="space-y-6">
      {/* Weekly goal bar */}
      <Card className="max-md:p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-(--accent)" />
            <span className="font-display tracking-wide text-(--text-primary)">{t('time.weekGoalTitle')}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGoalEdit(true)}
            className="flex min-h-11 items-center gap-1.5 self-start rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-sm text-(--text-muted) transition-colors hover:border-(--accent)/50 hover:text-(--accent) sm:min-h-0 sm:py-1.5"
            title={t('time.changeGoal')}
          >
            <Target className="h-3.5 w-3.5" />
            {t('time.goalLabel', { goal: formatMinutes(weeklyGoalMinutes) })}
            <Pencil className="h-3 w-3 opacity-60" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-(--bg-dark)">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${goalPercent}%`,
                background:
                  goalPercent >= 100
                    ? 'var(--positive)'
                    : goalPercent >= 50
                      ? 'var(--accent)'
                      : 'var(--warning)',
              }}
            />
          </div>
          <span className="whitespace-nowrap text-sm font-mono text-(--text-muted)">
            {formatMinutes(weekProgress)} / {formatMinutes(weeklyGoalMinutes)}
          </span>
          <span className="w-10 text-right text-sm font-display text-(--accent)">{goalPercent}%</span>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {QUICK_SESSION_OPTIONS.map(({ mins, label }) => (
              <button
                key={mins}
                type="button"
                onClick={() => setQuickMinutes(mins)}
                className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border border-(--accent)/30 bg-(--accent)/10 px-2 py-2 text-sm font-display text-(--accent) transition-colors hover:bg-(--accent)/20 sm:flex-row sm:gap-1.5 sm:px-3"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PomodoroInlineButton
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-(--accent)/30 bg-(--accent)/10 px-3 py-2 text-sm font-display text-(--accent) transition-colors hover:bg-(--accent)/20${showAddForm ? ' col-span-2' : ''}`}
            />
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className={`${learningAddBtnClass} mt-0 min-h-11 w-full justify-center`}
              >
                <Plus className="h-4 w-4" />
                {t('overview.addSession')}
              </button>
            )}
          </div>
        </div>
      </Card>

      <LearningFormShell
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title={t('overview.addSession')}
      >
        <SessionForm
          sessionCategories={sessionCategories}
          onAdd={(s) => {
            addSession(s)
            setShowAddForm(false)
          }}
          onAddCategory={addSessionCategory}
          onRemoveCategory={removeSessionCategory}
        />
      </LearningFormShell>

      {/* Session history */}
      <Card title={t('time.sessionHistoryTitle')} className="max-md:p-4">
        {sorted.length === 0 ? (
          <p className="text-base text-(--text-muted)">{t('time.noSessionsYet')}</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((s) => {
              const typeOpt = SESSION_TYPE_OPTIONS.find((o) => o.value === s.type)
              const TypeIcon = typeOpt?.icon ?? Clock
              return (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-(--border) bg-(--bg-dark)/50 px-3 py-2.5 sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <TypeIcon className="mt-0.5 h-4 w-4 shrink-0 text-(--accent) sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 truncate font-display text-(--text-primary)" title={s.topic}>
                          {s.topic}
                        </p>
                        {s.category && (
                          <span className="shrink-0 rounded border border-(--border) bg-(--bg-card) px-1.5 py-0.5 text-xs text-(--text-muted)">
                            {s.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-(--text-muted)">
                        <span className="font-mono text-(--accent)">{formatMinutes(s.minutes)}</span>
                        <span className="ml-2">{s.date}</span>
                        {typeOpt && <span className="ml-2 opacity-60">• {t(`sessionType.${typeOpt.value}`)}</span>}
                        {s.note && <span className="ml-2">• {s.note}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditingSession(s)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:bg-(--accent)/10 hover:text-(--accent) sm:min-h-0 sm:min-w-0 sm:p-1.5"
                      aria-label={t('time.editAria')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => scheduleDelete(s, s.topic)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-(--text-muted) transition-colors hover:bg-[#e74c3c]/10 hover:text-[#e74c3c] sm:min-h-0 sm:min-w-0 sm:p-1.5"
                      aria-label={t('time.deleteAria')}
                    >
                      <Trash2 className="h-4 w-4" />
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
          title={`${t('time.trendTitle')}${trendTitleSuffix}`}
          action={chartPeriod ? <ChartPeriodSelector /> : undefined}
          className="max-md:p-4"
        >
          <div className={`w-full ${isMobile ? 'h-48' : 'h-60'} min-h-[160px]`}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMinuty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82a7cf" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#82a7cf" stopOpacity={0} />
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
                    t('time.chartLabel'),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="minuty"
                  stroke="#82a7cf"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMinuty)"
                  name={t('time.chartLabel')}
                  baseValue={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <QuickAddModal
        key={quickMinutes ?? 'closed'}
        isOpen={quickMinutes !== null}
        minutes={quickMinutes ?? 0}
        sessionCategories={sessionCategories}
        onAdd={addSession}
        onClose={() => setQuickMinutes(null)}
      />

      {editingSession && (
        <EditSessionModal
          key={editingSession.id}
          isOpen
          session={editingSession}
          sessionCategories={sessionCategories}
          onSave={updateSession}
          onClose={() => setEditingSession(null)}
        />
      )}

      <GoalEditModal
        isOpen={showGoalEdit}
        currentGoalMinutes={weeklyGoalMinutes}
        onSave={setWeeklyGoalMinutes}
        onClose={() => setShowGoalEdit(false)}
      />

      <AnimatePresence>{toast}</AnimatePresence>
    </div>
  )
}
