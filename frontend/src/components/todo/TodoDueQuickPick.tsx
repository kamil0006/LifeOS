import { useTranslation } from 'react-i18next'
import { localISODate } from '../../lib/todoDomain'

export type TodoDuePickMode = 'inherit' | 'explicit'

export interface TodoDueQuickPickProps {
  /** "inherit" — when adding, the due date comes from the text (parser); "explicit" — presets/fields only. */
  mode: TodoDuePickMode
  onModeExplicit: () => void
  quickDueDate: string
  quickDueTime: string
  onChangeQuickDueDate: (v: string) => void
  onChangeQuickDueTime: (v: string) => void
  /** Hide the text about inheriting from the content field (e.g. in the edit modal). */
  hideInheritHint?: boolean
  /** No own border — when the component sits inside a larger panel (e.g. Options). */
  embedded?: boolean
}

function addDaysFromToday(delta: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + delta)
  return localISODate(d)
}

/** Presets + native date/time fields for quick add / task editing. */
export function TodoDueQuickPick({
  mode,
  onModeExplicit,
  quickDueDate,
  quickDueTime,
  onChangeQuickDueDate,
  onChangeQuickDueTime,
  hideInheritHint,
  embedded,
}: TodoDueQuickPickProps) {
  const { t } = useTranslation('todo')
  const preset = (fn: () => void) => () => {
    onModeExplicit()
    fn()
  }

  const chip =
    'min-h-11 w-full rounded-lg border px-3 py-2 font-display text-sm tracking-wide transition-colors sm:w-auto sm:min-h-0 sm:py-1.5 shrink-0'

  return (
    <div
      className={
        embedded
          ? 'space-y-3'
          : 'space-y-3 rounded-lg border border-(--border)/60 bg-(--bg-card)/20 p-3'
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <span className="col-span-2 text-base text-(--text-muted) sm:col-span-1 sm:mr-1 sm:w-auto">{t('quickPick.dueLabel')}</span>
        <button
          type="button"
          className={`${chip} border-(--border) text-(--text-muted) hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)`}
          onClick={preset(() => {
            onChangeQuickDueDate('')
            onChangeQuickDueTime('')
          })}
        >
          {t('quickPick.noDue')}
        </button>
        <button
          type="button"
          className={`${chip} border-(--border) bg-(--bg-dark) text-(--text-primary) hover:bg-(--bg-card-hover)`}
          onClick={preset(() => {
            onChangeQuickDueDate(localISODate())
          })}
        >
          {t('quickPick.today')}
        </button>
        <button
          type="button"
          className={`${chip} border-(--border) text-(--text-muted) hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)`}
          onClick={preset(() => {
            onChangeQuickDueDate(addDaysFromToday(1))
          })}
        >
          {t('quickPick.tomorrow')}
        </button>
        <button
          type="button"
          className={`${chip} border-(--border) text-(--text-muted) hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)`}
          onClick={preset(() => {
            onChangeQuickDueDate(addDaysFromToday(7))
          })}
        >
          {t('quickPick.inAWeek')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 flex-col gap-1 sm:flex-1">
          <span className="text-base text-(--text-muted)">{t('quickPick.dateLabel')}</span>
          <input
            type="date"
            value={quickDueDate}
            onChange={(e) => {
              onModeExplicit()
              onChangeQuickDueDate(e.target.value)
            }}
            className="min-h-11 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 sm:flex-1">
          <span className="text-base text-(--text-muted)">{t('quickPick.timeLabel')}</span>
          <input
            type="time"
            value={quickDueTime}
            onChange={(e) => {
              onModeExplicit()
              onChangeQuickDueTime(e.target.value)
            }}
            className="min-h-11 w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
          />
        </label>
      </div>
      {!hideInheritHint && mode === 'inherit' && (
        <p className="text-base text-(--text-muted)">
          {t('quickPick.inheritHint')}
        </p>
      )}
      {!hideInheritHint && mode === 'explicit' && (
        <p className="text-base text-(--text-muted)">
          {t('quickPick.explicitHint')}
        </p>
      )}
    </div>
  )
}
