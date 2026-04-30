import { localISODate } from '../../lib/todoDomain'

export type TodoDuePickMode = 'inherit' | 'explicit'

export interface TodoDueQuickPickProps {
  /** „inherit” — przy dodawaniu termin z tekstu (parser); „explicit” — tylko presety/pola. */
  mode: TodoDuePickMode
  onModeExplicit: () => void
  quickDueDate: string
  quickDueTime: string
  onChangeQuickDueDate: (v: string) => void
  onChangeQuickDueTime: (v: string) => void
  /** Ukryj tekst o dziedziczeniu z pola treści (np. w modalu edycji). */
  hideInheritHint?: boolean
}

function addDaysFromToday(delta: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + delta)
  return localISODate(d)
}

/** Presety + natywne pola daty/godziny przy szybkim dodawaniu / edycji zadania. */
export function TodoDueQuickPick({
  mode,
  onModeExplicit,
  quickDueDate,
  quickDueTime,
  onChangeQuickDueDate,
  onChangeQuickDueTime,
  hideInheritHint,
}: TodoDueQuickPickProps) {
  const preset = (fn: () => void) => () => {
    onModeExplicit()
    fn()
  }

  const chip =
    'rounded-lg border px-3 py-1.5 font-gaming text-sm tracking-wide transition-colors shrink-0'

  return (
    <div className="space-y-3 rounded-lg border border-(--border)/60 bg-(--bg-card)/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-base text-(--text-muted) sm:w-auto sm:mr-1">Termin:</span>
        <button
          type="button"
          className={`${chip} border-(--border) text-(--text-muted) hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)`}
          onClick={preset(() => {
            onChangeQuickDueDate('')
            onChangeQuickDueTime('')
          })}
        >
          Bez terminu
        </button>
        <button
          type="button"
          className={`${chip} border-(--border) bg-(--bg-dark) text-(--text-primary) hover:bg-(--bg-card-hover)`}
          onClick={preset(() => {
            onChangeQuickDueDate(localISODate())
          })}
        >
          Dziś
        </button>
        <button
          type="button"
          className={`${chip} border-(--border) text-(--text-muted) hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)`}
          onClick={preset(() => {
            onChangeQuickDueDate(addDaysFromToday(1))
          })}
        >
          Jutro
        </button>
        <button
          type="button"
          className={`${chip} border-(--border) text-(--text-muted) hover:border-(--border) hover:bg-(--bg-dark) hover:text-(--text-primary)`}
          onClick={preset(() => {
            onChangeQuickDueDate(addDaysFromToday(7))
          })}
        >
          Za tydzień
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-base text-(--text-muted)">Data</span>
          <input
            type="date"
            value={quickDueDate}
            onChange={(e) => {
              onModeExplicit()
              onChangeQuickDueDate(e.target.value)
            }}
            className="min-h-[44px] rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-base text-(--text-muted)">Godzina</span>
          <input
            type="time"
            value={quickDueTime}
            onChange={(e) => {
              onModeExplicit()
              onChangeQuickDueTime(e.target.value)
            }}
            className="min-h-[44px] rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2 text-base text-(--text-primary) focus:border-(--border) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/15"
          />
        </label>
      </div>
      {!hideInheritHint && mode === 'inherit' && (
        <p className="text-base text-(--text-muted)">
          Albo zostaw pola puste i wpisz w treści np. <strong className="text-(--text-primary)">jutro</strong>,{' '}
          <strong className="text-(--text-primary)">14:30</strong>,{' '}
          <strong className="text-(--text-primary)">2026-05-01</strong>.
        </p>
      )}
      {!hideInheritHint && mode === 'explicit' && (
        <p className="text-base text-(--text-muted)">
          Wybrano termin z poniższych pól — ma pierwszeństwo przed słowami w treści zadania.
        </p>
      )}
    </div>
  )
}
