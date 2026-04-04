import { useState, useMemo } from 'react'
import { Card } from '../components/Card'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Flame, Pencil, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../context/HabitsContext'

const GRID_DAYS = 14
const DAY_LETTERS = ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'] // niedziela, pon, wt, śr, czw, pt, sob

function sanitizeGoalNumber(val: string): string {
  let s = val.replace(/[^0-9,.]/g, '')
  const parts = s.split(/[.,]/)
  if (parts.length > 2) {
    s = parts[0] + ',' + parts.slice(1).join('')
  } else if (parts.length === 2 && (s.includes(',') && s.includes('.'))) {
    s = parts[0] + ',' + parts[1]
  }
  if (s.length > 1 && s[0] === '0' && s[1] !== '.' && s[1] !== ',') {
    s = s.replace(/^0+/, '') || '0'
  }
  if (/^0+$/.test(s)) s = '0'
  return s
}

function parseGoalNumber(val: string): number {
  return parseFloat(val.replace(',', '.')) || 0
}

export function Habits() {
  const { isDemoMode } = useAuth()
  const {
    habits,
    goals,
    addHabit,
    updateHabit,
    removeHabit,
    toggleCheckIn,
    addGoal,
    updateGoal,
    removeGoal,
    loading,
  } = useHabits() ?? {}

  const [showHabitForm, setShowHabitForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '0', unit: '' })
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingHabitName, setEditingHabitName] = useState('')
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState({ name: '', target: '', unit: '' })
  const [currentInputRaw, setCurrentInputRaw] = useState<{ goalId: string; value: string } | null>(null)

  const { gridDates, gridDayLetters } = useMemo<{
    gridDates: string[]
    gridDayLetters: string[]
  }>(() => {
    const dates: string[] = []
    const letters: string[] = []
    const today = new Date()
    for (let i = GRID_DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
      letters.push(DAY_LETTERS[d.getDay()])
    }
    return { gridDates: dates, gridDayLetters: letters }
  }, [])

  const getStreak = (checkIns: { date: string }[]) => {
    const set = new Set(checkIns.map((c) => c.date))
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let d = new Date(today)
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (set.has(key)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    addHabit?.(newHabitName.trim())
    setNewHabitName('')
    setShowHabitForm(false)
  }

  const handleAddGoal = () => {
    const name = newGoal.name.trim()
    const target = parseGoalNumber(newGoal.target)
    const current = parseGoalNumber(newGoal.current)
    if (!name || isNaN(target) || target <= 0) return
    addGoal?.({ name, target, current, unit: newGoal.unit.trim() || undefined })
    setNewGoal({ name: '', target: '', current: '0', unit: '' })
    setShowGoalForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-base text-(--text-muted)">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-(--text-primary) font-gaming tracking-wider">
          NAWYKI I CELE
        </h1>
        <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
          {isDemoMode ? 'Dane przykładowe' : 'Śledź nawyki i realizuj cele'}
        </p>
      </div>

      {/* Nawyki */}
      <Card title="Nawyki" className="border-(--accent-green)/20">
        <div className="space-y-4">
          {(habits ?? []).map((habit) => {
            const streak = getStreak(habit.checkIns)
            const isEditing = editingHabitId === habit.id

            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-green)/20"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingHabitName}
                          onChange={(e) => setEditingHabitName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateHabit?.(habit.id, editingHabitName.trim())
                              setEditingHabitId(null)
                            }
                            if (e.key === 'Escape') setEditingHabitId(null)
                          }}
                          className="px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-base w-48"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updateHabit?.(habit.id, editingHabitName.trim())
                            setEditingHabitId(null)
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 text-sm hover:bg-(--accent-green)/25"
                        >
                          <Check className="w-4 h-4" />
                          Zapisz
                        </button>
                        <button
                          onClick={() => setEditingHabitId(null)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-(--border) text-(--text-muted) text-sm hover:bg-(--bg-card)"
                        >
                          <X className="w-4 h-4" />
                          Anuluj
                        </button>
                      </div>
                    ) : (
                      <p className="font-medium text-base">{habit.name}</p>
                    )}
                    {!isEditing && streak > 0 && (
                      <span className="flex items-center gap-1 text-sm text-(--accent-amber)">
                        <Flame className="w-4 h-4" />
                        {streak} dni
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingHabitId(habit.id)
                          setEditingHabitName(habit.name)
                        }}
                        className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                        title="Edytuj"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeHabit?.(habit.id)}
                        className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-0.5 text-base text-(--text-muted) leading-none font-medium">
                    {gridDayLetters.map((letter: string, i: number) => (
                      <span key={i} className="w-4 text-center">
                        {letter}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {gridDates.map((date: string) => {
                      const checked = habit.checkIns.some((c) => c.date === date)
                      return (
                        <button
                          key={date}
                          onClick={() => toggleCheckIn?.(habit.id, date)}
                          className={`w-4 h-4 rounded-sm transition-colors ${
                            checked
                              ? 'bg-(--accent-green) hover:bg-(--accent-green)/80'
                              : 'bg-(--border) hover:bg-(--border)/80'
                          }`}
                          title={date}
                        />
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )
          })}

          <AnimatePresence>
            {showHabitForm ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <label className="block text-base text-(--text-muted) font-gaming">Nazwa nawyku</label>
                <div className="flex gap-2">
                  <input
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base focus:border-(--accent-cyan) focus:outline-none"
                    autoFocus
                  />
                <button
                  onClick={handleAddHabit}
                  className="px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming hover:bg-(--accent-green)/25 hover:border-(--accent-green)/50 transition-colors"
                >
                  Dodaj
                </button>
                <button
                  onClick={() => setShowHabitForm(false)}
                  className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) hover:text-(--text-primary) hover:border-(--border) transition-colors"
                >
                  Anuluj
                </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowHabitForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/40 font-gaming hover:bg-(--accent-green)/25 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj nawyk
              </button>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Cele */}
      <Card title="Aktywne cele" className="border-(--accent-cyan)/20">
        <div className="space-y-4">
          {(goals ?? []).map((goal) => {
            const pct = Math.min(100, (goal.current / goal.target) * 100)
            const isEditing = editingGoalId === goal.id

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-(--bg-dark) border border-(--border) hover:border-(--accent-cyan)/20"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm text-(--text-muted) font-gaming mb-0.5">Nazwa</label>
                          <input
                            value={editingGoal.name}
                            onChange={(e) =>
                              setEditingGoal((g) => ({ ...g, name: e.target.value }))
                            }
                            className="w-full px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div>
                            <label className="block text-sm text-(--text-muted) font-gaming mb-0.5">Cel</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editingGoal.target}
                              onChange={(e) =>
                                setEditingGoal((g) => ({
                                  ...g,
                                  target: sanitizeGoalNumber(e.target.value),
                                }))
                              }
                              className="w-20 px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-(--text-muted) font-gaming mb-0.5">Jednostka</label>
                            <input
                              value={editingGoal.unit}
                              onChange={(e) =>
                                setEditingGoal((g) => ({ ...g, unit: e.target.value }))
                              }
                              className="w-24 px-2 py-1 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const target = parseGoalNumber(editingGoal.target)
                              if (editingGoal.name.trim() && !isNaN(target) && target > 0) {
                                updateGoal?.(goal.id, {
                                  name: editingGoal.name.trim(),
                                  target,
                                  unit: editingGoal.unit.trim() || undefined,
                                })
                                setEditingGoalId(null)
                              }
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 text-sm hover:bg-(--accent-cyan)/25"
                          >
                            <Check className="w-4 h-4" />
                            Zapisz
                          </button>
                          <button
                            onClick={() => setEditingGoalId(null)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-(--border) text-(--text-muted) text-sm hover:bg-(--bg-card)"
                          >
                            <X className="w-4 h-4" />
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-base">{goal.name}</p>
                        <p className="text-base text-(--text-muted) font-medium">
                          {goal.current} / {goal.target} {goal.unit ?? ''}
                        </p>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={currentInputRaw?.goalId === goal.id ? currentInputRaw.value : String(goal.current)}
                        onFocus={() => setCurrentInputRaw({ goalId: goal.id, value: String(goal.current) })}
                        onChange={(e) => {
                          const sanitized = sanitizeGoalNumber(e.target.value)
                          setCurrentInputRaw({ goalId: goal.id, value: sanitized })
                          const num = parseGoalNumber(sanitized)
                          if (!Number.isNaN(num) && num <= goal.target) {
                            updateGoal?.(goal.id, { current: num })
                          }
                        }}
                        onBlur={() => setCurrentInputRaw(null)}
                        className="w-16 px-2 py-1.5 rounded-md bg-(--bg-card) border border-(--border)/60 text-(--text-primary) text-sm text-center font-medium focus:border-(--accent-cyan)/60 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/30"
                      />
                      <button
                        onClick={() => {
                          setEditingGoalId(goal.id)
                          setEditingGoal({
                            name: goal.name,
                            target: String(goal.target),
                            unit: goal.unit ?? '',
                          })
                        }}
                        className="p-2 text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                        title="Edytuj"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeGoal?.(goal.id)}
                        className="p-2 text-(--text-muted) hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="h-2 rounded-full bg-(--bg-card) overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-linear-to-r from-(--accent-cyan) to-(--accent-green)"
                    />
                  </div>
                )}
              </motion.div>
            )
          })}

          <AnimatePresence>
            {showGoalForm ? (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddGoal()
                }}
                className="space-y-3 p-3 rounded-lg bg-(--bg-dark) border border-(--border)"
              >
                <div>
                  <label className="block text-base text-(--text-muted) font-gaming mb-1">Nazwa celu</label>
                  <input
                    value={newGoal.name}
                    onChange={(e) => setNewGoal((g) => ({ ...g, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Obecnie</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newGoal.current}
                      onChange={(e) => setNewGoal((g) => ({ ...g, current: sanitizeGoalNumber(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Cel</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal((g) => ({ ...g, target: sanitizeGoalNumber(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base text-(--text-muted) font-gaming mb-1">Jednostka</label>
                    <input
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal((g) => ({ ...g, unit: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/25 hover:border-(--accent-cyan)/50 transition-colors"
                  >
                    Dodaj
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) font-gaming hover:bg-(--bg-card-hover) hover:text-(--text-primary) hover:border-(--border) transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </motion.form>
            ) : (
              <button
                onClick={() => setShowGoalForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--accent-cyan)/15 text-(--accent-cyan) border border-(--accent-cyan)/40 font-gaming hover:bg-(--accent-cyan)/25 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj cel
              </button>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  )
}
