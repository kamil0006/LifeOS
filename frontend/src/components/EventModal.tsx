import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useModalMotion } from '../lib/modalMotion'
import { normalizeEventDate, type DemoEvent, type RecurrenceType, type RecurrenceUnit } from '../context/EventsContext'
import { EVENT_CATEGORY_COLOR_OPTIONS, type EventCategory } from '../lib/eventCategories'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: Omit<DemoEvent, 'id'>) => void
  onUpdate?: (id: string, data: Partial<Omit<DemoEvent, 'id'>>) => void
  onDelete?: (id: string) => void
  initialDate?: string // YYYY-MM-DD
  event?: DemoEvent | null // gdy edycja
  holidayName?: string // pełna nazwa święta w tym dniu
  categories: EventCategory[]
  onAddCategory: (name: string, color: string) => void
  onUpdateCategory: (id: string, updates: Partial<Pick<EventCategory, 'name' | 'color'>>) => void
  onDeleteCategory: (id: string) => void
  onToggleCategoryVisibility: (id: string) => void
  openCategoryManager?: boolean
}

export function EventModal({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  initialDate,
  event,
  holidayName,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryVisibility,
  openCategoryManager,
}: EventModalProps) {
  const isValidIsoDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return false
    const parsed = new Date(year, month - 1, day)
    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    )
  }

  const { backdrop, panel } = useModalMotion()
  const getInitialForm = useCallback(
    () =>
      event
        ? {
            title: event.title,
            date: event.date,
            time: event.time ?? '',
            category: event.category ?? '',
            notes: event.notes ?? '',
            recurrenceType: event.recurrenceType ?? 'none',
            recurrenceInterval: String(event.recurrenceInterval ?? 1),
            recurrenceUnit: event.recurrenceUnit ?? 'week',
            recurrenceUntil: event.recurrenceUntil ?? '',
          }
        : {
            title: '',
            date: initialDate ?? new Date().toISOString().split('T')[0],
            time: '',
            category: 'praca',
            notes: '',
            recurrenceType: 'none',
            recurrenceInterval: '1',
            recurrenceUnit: 'week',
            recurrenceUntil: '',
          },
    [event, initialDate]
  )

  const [form, setForm] = useState(getInitialForm)
  const [showCategoryEditor, setShowCategoryEditor] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState<string>(EVENT_CATEGORY_COLOR_OPTIONS[0])
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingCategoryColor, setEditingCategoryColor] = useState<string>(EVENT_CATEGORY_COLOR_OPTIONS[0])
  const [dateError, setDateError] = useState<string | null>(null)
  const [recurrenceUntilError, setRecurrenceUntilError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [categoryOnlyMode, setCategoryOnlyMode] = useState(false)
  const toastTimerRef = useRef<number | null>(null)
  const updateField = <K extends keyof ReturnType<typeof getInitialForm>>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const showToast = (message: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToastMessage(message)
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 2400)
  }

  useEffect(() => {
    if (isOpen) {
      setForm(getInitialForm())
      setShowCategoryEditor(!!openCategoryManager)
      setNewCategoryName('')
      setNewCategoryColor(EVENT_CATEGORY_COLOR_OPTIONS[0])
      setEditingCategoryId(null)
      setEditingCategoryName('')
      setEditingCategoryColor(EVENT_CATEGORY_COLOR_OPTIONS[0])
      setDateError(null)
      setRecurrenceUntilError(null)
      setToastMessage(null)
      setCategoryOnlyMode(!!openCategoryManager)
    }
  }, [isOpen, getInitialForm, openCategoryManager])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    }
  }, [])

  const { title, date, time, category, notes, recurrenceType, recurrenceInterval, recurrenceUnit, recurrenceUntil } = form
  const isEdit = !!event

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!isValidIsoDate(date)) {
      setDateError('Podaj poprawną datę (format RRRR-MM-DD).')
      return
    }
    const cat = categories.find((c) => c.id === category)
    const recurrenceTypeValue = recurrenceType as RecurrenceType
    const recurrenceUnitValue = recurrenceUnit as RecurrenceUnit
    const normalizedDate = normalizeEventDate(date)
    const normalizedUntil = recurrenceUntil ? normalizeEventDate(recurrenceUntil) : undefined
    if (normalizedUntil && !isValidIsoDate(normalizedUntil)) {
      setRecurrenceUntilError('Data zakończenia cykliczności jest niepoprawna.')
      return
    }
    if (normalizedUntil && normalizedUntil < normalizedDate) {
      setRecurrenceUntilError('Data zakończenia cykliczności nie może być wcześniejsza niż data wydarzenia.')
      return
    }
    setDateError(null)
    setRecurrenceUntilError(null)
    const data = {
      title: title.trim(),
      date: normalizedDate,
      time: time || undefined,
      category: category || undefined,
      color: cat?.color,
      notes: notes.trim() || undefined,
      recurrenceType: recurrenceTypeValue === 'none' ? undefined : recurrenceTypeValue,
      recurrenceInterval:
        recurrenceTypeValue === 'custom' ? Math.max(1, Number.parseInt(recurrenceInterval, 10) || 1) : undefined,
      recurrenceUnit: recurrenceTypeValue === 'custom' ? recurrenceUnitValue : undefined,
      recurrenceUntil: recurrenceTypeValue === 'none' ? undefined : normalizedUntil,
    }
    if (isEdit && event && onUpdate) {
      onUpdate(event.id, data)
    } else {
      onAdd(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id)
      onClose()
    }
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    onAddCategory(newCategoryName, newCategoryColor)
    setNewCategoryName('')
    showToast('Kategoria dodana')
  }

  const startCategoryEdit = (categoryToEdit: EventCategory) => {
    setEditingCategoryId(categoryToEdit.id)
    setEditingCategoryName(categoryToEdit.name)
    setEditingCategoryColor(categoryToEdit.color)
  }

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null)
    setEditingCategoryName('')
    setEditingCategoryColor(EVENT_CATEGORY_COLOR_OPTIONS[0])
  }

  const saveCategoryEdit = () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return
    onUpdateCategory(editingCategoryId, {
      name: editingCategoryName.trim(),
      color: editingCategoryColor,
    })
    cancelCategoryEdit()
    showToast('Kategoria zapisana')
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="event-backdrop"
            {...backdrop}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="event-panel"
              {...panel}
              className="pointer-events-auto relative w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
            >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-(--text-primary) font-gaming">
                {categoryOnlyMode ? 'Zarządzaj kategoriami' : isEdit ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
              </h3>
              {holidayName && (
                <p className="text-sm font-mono mt-1" style={{ color: '#e57373' }}>
                  Ten dzień: {holidayName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {categoryOnlyMode ? (
            <div className="space-y-4">
              <p className="text-base text-(--text-muted)">
                Dodawaj, edytuj i ukrywaj kategorie bez tworzenia wydarzenia.
              </p>
              <div className="p-3 rounded-lg border border-(--border) bg-(--bg-dark) space-y-3">
                {!editingCategoryId && (
                  <>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="Nazwa kategorii"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                      />
                      <div className="flex flex-wrap gap-2">
                        {EVENT_CATEGORY_COLOR_OPTIONS.map((color) => (
                          <button
                            key={`manager-${color}`}
                            type="button"
                            onClick={() => setNewCategoryColor(color)}
                            className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                              newCategoryColor === color ? 'border-(--accent-cyan)' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                            {newCategoryColor === color && (
                              <Check className="w-3.5 h-3.5 text-[#000000] drop-shadow-[0_0_2px_rgba(0,0,0,0.55)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-1.5 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming text-sm"
                      >
                        Dodaj kategorię
                      </button>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  {categories.map((catItem) => (
                    <div key={`manager-row-${catItem.id}`} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-(--bg-card)">
                      {editingCategoryId === catItem.id ? (
                        <div className="w-full space-y-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                          />
                          <div className="flex flex-wrap gap-2">
                            {EVENT_CATEGORY_COLOR_OPTIONS.map((color) => (
                              <button
                                key={`manager-${catItem.id}-${color}`}
                                type="button"
                                onClick={() => setEditingCategoryColor(color)}
                                className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                                  editingCategoryColor === color ? 'border-(--accent-cyan)' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                              >
                                {editingCategoryColor === color && (
                                  <Check className="w-3 h-3 text-[#000000] drop-shadow-[0_0_2px_rgba(0,0,0,0.55)]" />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelCategoryEdit}
                              className="px-2 py-1 rounded border border-(--border) text-(--text-muted) hover:text-(--text-primary) transition-colors"
                            >
                              Anuluj
                            </button>
                            <button
                              type="button"
                              onClick={saveCategoryEdit}
                              className="px-2 py-1 rounded bg-(--accent-cyan) text-(--bg-dark)"
                            >
                              Zapisz
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catItem.color }} />
                            <span>{catItem.name}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onToggleCategoryVisibility(catItem.id)
                                showToast(catItem.isVisible ? 'Kategoria ukryta w kalendarzu' : 'Kategoria widoczna w kalendarzu')
                              }}
                              className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent-cyan) transition-colors"
                              title={catItem.isVisible ? 'Ukryj w kalendarzu' : 'Pokaż w kalendarzu'}
                            >
                              {catItem.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => startCategoryEdit(catItem)}
                              className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent-cyan) transition-colors"
                              title="Edytuj"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCategory(catItem.id)
                                showToast('Kategoria usunięta')
                              }}
                              className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent-magenta) transition-colors"
                              title="Usuń"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Tytuł *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    updateField('date', e.target.value)
                    setDateError(null)
                  }}
                  min="1900-01-01"
                  max="2100-12-31"
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
                {dateError && (
                  <p className="mt-1 text-sm text-(--accent-magenta)">{dateError}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-gaming mb-1">Godzina</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateField('time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-2">Kategoria</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map(({ id, name, color: hex }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateField('category', id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-sm font-gaming ${
                      category === id ? 'border-(--accent-cyan)' : 'border-transparent hover:opacity-90'
                    }`}
                    style={{ backgroundColor: `${hex}30`, borderColor: category === id ? 'var(--accent-cyan)' : 'transparent' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCategoryEditor((current) => !current)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--border) text-base text-(--text-muted) hover:text-(--text-primary)"
                  title="Zarządzaj kategoriami"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showCategoryEditor && (
                <div className="mt-3 p-3 rounded-lg border border-(--border) bg-(--bg-dark) space-y-3">
                  {!editingCategoryId && (
                    <>
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          placeholder="Nazwa kategorii"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                        />
                        <div className="flex flex-wrap gap-2">
                          {EVENT_CATEGORY_COLOR_OPTIONS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewCategoryColor(color)}
                              className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                                newCategoryColor === color ? 'border-(--accent-cyan)' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            >
                              {newCategoryColor === color && (
                                <Check className="w-3.5 h-3.5 text-[#000000] drop-shadow-[0_0_2px_rgba(0,0,0,0.55)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="px-3 py-1.5 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming text-sm"
                        >
                          Dodaj kategorię
                        </button>
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    {categories.map((catItem) => (
                      <div key={catItem.id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-(--bg-card)">
                        {editingCategoryId === catItem.id ? (
                          <div className="w-full space-y-2">
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-(--bg-card) border border-(--border) text-(--text-primary) text-base"
                            />
                            <div className="flex flex-wrap gap-2">
                              {EVENT_CATEGORY_COLOR_OPTIONS.map((color) => (
                                <button
                                  key={`${catItem.id}-${color}`}
                                  type="button"
                                  onClick={() => setEditingCategoryColor(color)}
                                  className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                                    editingCategoryColor === color ? 'border-(--accent-cyan)' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: color }}
                                >
                                  {editingCategoryColor === color && (
                                    <Check className="w-3 h-3 text-[#000000] drop-shadow-[0_0_2px_rgba(0,0,0,0.55)]" />
                                  )}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelCategoryEdit}
                                className="px-2 py-1 rounded border border-(--border) text-(--text-muted) hover:text-(--text-primary) transition-colors"
                              >
                                Anuluj
                              </button>
                              <button
                                type="button"
                                onClick={saveCategoryEdit}
                                className="px-2 py-1 rounded bg-(--accent-cyan) text-(--bg-dark)"
                              >
                                Zapisz
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catItem.color }} />
                              <span>{catItem.name}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleCategoryVisibility(catItem.id)
                                  showToast(catItem.isVisible ? 'Kategoria ukryta w kalendarzu' : 'Kategoria widoczna w kalendarzu')
                                }}
                                className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent-cyan) transition-colors"
                                title={catItem.isVisible ? 'Ukryj w kalendarzu' : 'Pokaż w kalendarzu'}
                              >
                                {catItem.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => startCategoryEdit(catItem)}
                                className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent-cyan) transition-colors"
                                title="Edytuj"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteCategory(catItem.id)
                                  showToast('Kategoria usunięta')
                                }}
                                className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent-magenta) transition-colors"
                                title="Usuń"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Cykliczność</label>
              <div className="space-y-2">
                <select
                  value={recurrenceType}
                  onChange={(e) => updateField('recurrenceType', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none"
                >
                  <option value="none">Brak</option>
                  <option value="daily">Codziennie</option>
                  <option value="weekly">Co tydzień</option>
                  <option value="monthly">Co miesiąc</option>
                  <option value="yearly">Co rok</option>
                  <option value="custom">Własny interwał</option>
                </select>
                {recurrenceType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={recurrenceInterval}
                      onChange={(e) => updateField('recurrenceInterval', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
                    />
                    <select
                      value={recurrenceUnit}
                      onChange={(e) => updateField('recurrenceUnit', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
                    >
                      <option value="day">dni</option>
                      <option value="week">tygodni</option>
                      <option value="month">miesięcy</option>
                      <option value="year">lat</option>
                    </select>
                  </div>
                )}
                {recurrenceType !== 'none' && (
                  <div>
                    <label className="block text-sm text-(--text-muted) font-gaming mb-1">Powtarzaj do (opcjonalnie)</label>
                    <input
                      type="date"
                      value={recurrenceUntil}
                      onChange={(e) => {
                        updateField('recurrenceUntil', e.target.value)
                        setRecurrenceUntilError(null)
                      }}
                      min={date || '1900-01-01'}
                      max="2100-12-31"
                      className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base"
                    />
                    {recurrenceUntilError && (
                      <p className="mt-1 text-sm text-(--accent-magenta)">{recurrenceUntilError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-gaming mb-1">Notatki</label>
              <textarea
                value={notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-gaming focus:border-(--accent-cyan) focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-(--accent-magenta)/40 text-(--accent-magenta) hover:bg-(--accent-magenta)/10 font-gaming transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-gaming transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent-cyan) text-(--bg-dark) font-gaming hover:opacity-90 transition-opacity"
              >
                {isEdit ? 'Zapisz' : 'Dodaj'}
              </button>
            </div>
          </form>
          )}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-(--accent-cyan)/40 bg-(--bg-dark) px-3 py-2 text-sm text-(--text-primary) shadow-lg"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
