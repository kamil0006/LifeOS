import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { ModalShell } from './ModalShell'
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
  const { t } = useTranslation('calendar')
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
      setDateError(t('eventModal.invalidDate'))
      return
    }
    const cat = categories.find((c) => c.id === category)
    const recurrenceTypeValue = recurrenceType as RecurrenceType
    const recurrenceUnitValue = recurrenceUnit as RecurrenceUnit
    const normalizedDate = normalizeEventDate(date)
    const normalizedUntil = recurrenceUntil ? normalizeEventDate(recurrenceUntil) : undefined
    if (normalizedUntil && !isValidIsoDate(normalizedUntil)) {
      setRecurrenceUntilError(t('eventModal.invalidUntilDate'))
      return
    }
    if (normalizedUntil && normalizedUntil < normalizedDate) {
      setRecurrenceUntilError(t('eventModal.untilBeforeDate'))
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
    showToast(t('eventModal.categoryAdded'))
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
    showToast(t('eventModal.categorySaved'))
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      backdropKey="event-backdrop"
      panelKey="event-panel"
    >
      {/* relative wrapper needed for internal toast positioning */}
      <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-(--text-primary) font-display">
                {categoryOnlyMode ? t('eventModal.manageCategories') : isEdit ? t('eventModal.editEvent') : t('eventModal.addEvent')}
              </h3>
              {holidayName && (
                <p className="text-sm font-mono mt-1" style={{ color: '#e57373' }}>
                  {t('eventModal.holidayToday', { name: holidayName })}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--text-primary) transition-colors"
              aria-label={t('eventModal.closeAria')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {categoryOnlyMode ? (
            <div className="space-y-4">
              <p className="text-base text-(--text-muted)">
                {t('eventModal.manageIntro')}
              </p>
              <div className="p-3 rounded-lg border border-(--border) bg-(--bg-dark) space-y-3">
                {!editingCategoryId && (
                  <>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder={t('eventModal.categoryNamePlaceholder')}
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
                              newCategoryColor === color ? 'border-(--accent)' : 'border-transparent'
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
                        className="px-3 py-1.5 rounded-lg bg-(--accent) text-(--bg-dark) font-display text-sm"
                      >
                        {t('eventModal.addCategory')}
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
                                  editingCategoryColor === color ? 'border-(--accent)' : 'border-transparent'
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
                              {t('eventModal.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={saveCategoryEdit}
                              className="px-2 py-1 rounded bg-(--accent) text-(--bg-dark)"
                            >
                              {t('eventModal.save')}
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
                                showToast(catItem.isVisible ? t('eventModal.categoryHidden') : t('eventModal.categoryVisible'))
                              }}
                              className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent) transition-colors"
                              title={catItem.isVisible ? t('eventModal.hideInCalendar') : t('eventModal.showInCalendar')}
                            >
                              {catItem.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => startCategoryEdit(catItem)}
                              className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent) transition-colors"
                              title={t('eventModal.edit')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCategory(catItem.id)
                                showToast(t('eventModal.categoryDeleted'))
                              }}
                              className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--danger) transition-colors"
                              title={t('eventModal.delete')}
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
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('eventModal.titleLabel')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-display focus:border-(--accent) focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base text-(--text-muted) font-display mb-1">{t('eventModal.dateLabel')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    updateField('date', e.target.value)
                    setDateError(null)
                  }}
                  min="1900-01-01"
                  max="2100-12-31"
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-display focus:border-(--accent) focus:outline-none"
                />
                {dateError && (
                  <p className="mt-1 text-sm text-(--danger)">{dateError}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-(--text-muted) font-display mb-1">{t('eventModal.timeLabel')}</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateField('time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-display focus:border-(--accent) focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-display mb-2">{t('eventModal.categoryLabel')}</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map(({ id, name, color: hex }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateField('category', id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-sm font-display ${
                      category === id ? 'border-(--accent)' : 'border-transparent hover:opacity-90'
                    }`}
                    style={{ backgroundColor: `${hex}30`, borderColor: category === id ? 'var(--accent)' : 'transparent' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCategoryEditor((current) => !current)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--border) text-base text-(--text-muted) hover:text-(--text-primary)"
                  title={t('eventModal.manageCategories')}
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
                          placeholder={t('eventModal.categoryNamePlaceholder')}
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
                                newCategoryColor === color ? 'border-(--accent)' : 'border-transparent'
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
                          className="px-3 py-1.5 rounded-lg bg-(--accent) text-(--bg-dark) font-display text-sm"
                        >
                          {t('eventModal.addCategory')}
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
                                    editingCategoryColor === color ? 'border-(--accent)' : 'border-transparent'
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
                                {t('eventModal.cancel')}
                              </button>
                              <button
                                type="button"
                                onClick={saveCategoryEdit}
                                className="px-2 py-1 rounded bg-(--accent) text-(--bg-dark)"
                              >
                                {t('eventModal.save')}
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
                                  showToast(catItem.isVisible ? t('eventModal.categoryHidden') : t('eventModal.categoryVisible'))
                                }}
                                className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent) transition-colors"
                                title={catItem.isVisible ? t('eventModal.hideInCalendar') : t('eventModal.showInCalendar')}
                              >
                                {catItem.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => startCategoryEdit(catItem)}
                                className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--accent) transition-colors"
                                title={t('eventModal.edit')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteCategory(catItem.id)
                                  showToast(t('eventModal.categoryDeleted'))
                                }}
                                className="p-1 rounded text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--danger) transition-colors"
                                title={t('eventModal.delete')}
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
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('eventModal.recurrenceLabel')}</label>
              <div className="space-y-2">
                <select
                  value={recurrenceType}
                  onChange={(e) => updateField('recurrenceType', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-display focus:border-(--accent) focus:outline-none"
                >
                  <option value="none">{t('eventModal.recurrenceNone')}</option>
                  <option value="daily">{t('eventModal.recurrenceDaily')}</option>
                  <option value="weekly">{t('eventModal.recurrenceWeekly')}</option>
                  <option value="monthly">{t('eventModal.recurrenceMonthly')}</option>
                  <option value="yearly">{t('eventModal.recurrenceYearly')}</option>
                  <option value="custom">{t('eventModal.recurrenceCustom')}</option>
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
                      <option value="day">{t('eventModal.recurrenceUnitDay')}</option>
                      <option value="week">{t('eventModal.recurrenceUnitWeek')}</option>
                      <option value="month">{t('eventModal.recurrenceUnitMonth')}</option>
                      <option value="year">{t('eventModal.recurrenceUnitYear')}</option>
                    </select>
                  </div>
                )}
                {recurrenceType !== 'none' && (
                  <div>
                    <label className="block text-sm text-(--text-muted) font-display mb-1">{t('eventModal.recurrenceUntilLabel')}</label>
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
                      <p className="mt-1 text-sm text-(--danger)">{recurrenceUntilError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-base text-(--text-muted) font-display mb-1">{t('eventModal.notesLabel')}</label>
              <textarea
                value={notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-(--bg-dark) border border-(--border) text-(--text-primary) text-base font-display focus:border-(--accent) focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-(--danger)/40 text-(--danger) hover:bg-(--danger)/10 font-display transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('eventModal.delete2')}
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:text-(--text-primary) font-display transition-colors"
              >
                {t('eventModal.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-(--accent) text-(--bg-dark) font-display hover:opacity-90 transition-opacity"
              >
                {isEdit ? t('eventModal.update') : t('eventModal.create')}
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
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-(--accent)/40 bg-(--bg-dark) px-3 py-2 text-sm text-(--text-primary) shadow-lg"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  )
}
