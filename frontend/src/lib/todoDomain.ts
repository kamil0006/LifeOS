export type TodoPriority = 'low' | 'medium' | 'high'

export type TodoCategory = 'dom' | 'praca' | 'finanse' | 'nauka' | 'zdrowie' | 'inne'

export const TODO_CATEGORIES: TodoCategory[] = ['dom', 'praca', 'finanse', 'nauka', 'zdrowie', 'inne']

export const TODO_CATEGORY_LABEL: Record<TodoCategory, string> = {
  dom: 'Dom',
  praca: 'Praca',
  finanse: 'Finanse',
  nauka: 'Nauka',
  zdrowie: 'Zdrowie',
  inne: 'Inne',
}

export const TODO_PRIORITY_LABEL: Record<TodoPriority, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: string
  dueDate: string | null
  dueTime: string | null
  priority: TodoPriority
  category: TodoCategory
  archivedAt: string | null
  noteId: string | null
}

export function localISODate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalYMD(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Data jest wcześniej niż dziś (kalendarz lokalny). */
export function isTodoOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return parseLocalYMD(dueDate).getTime() < parseLocalYMD(localISODate()).getTime()
}

export function isTodoDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate === localISODate()
}

export type TodoDateStatus = 'none' | 'today' | 'upcoming' | 'overdue'

export function todoDateStatus(dueDate: string | null): TodoDateStatus {
  if (!dueDate) return 'none'
  if (isTodoOverdue(dueDate)) return 'overdue'
  if (isTodoDueToday(dueDate)) return 'today'
  return 'upcoming'
}

const WEEKDAYS_PL = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']

/** Krótka etykieta terminu po polsku (np. „dziś”, „piątek”, „12 kwi”). */
export function formatTodoDueSummary(dueDate: string | null, dueTime: string | null): string {
  if (!dueDate && !dueTime) return 'Bez terminu'
  const today = localISODate()
  const tomorrow = localISODate(new Date(Date.now() + 86400000))
  if (dueDate === today) return dueTime ? `dziś · ${dueTime}` : 'dziś'
  if (dueDate === tomorrow) return dueTime ? `jutro · ${dueTime}` : 'jutro'
  if (dueDate) {
    const dt = parseLocalYMD(dueDate)
    const diffDays = Math.round((dt.getTime() - parseLocalYMD(today).getTime()) / 86400000)
    if (diffDays > 1 && diffDays <= 7) {
      const wd = WEEKDAYS_PL[dt.getDay()]
      return dueTime ? `${wd} · ${dueTime}` : wd
    }
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
    const label = `${dt.getDate()} ${monthNames[dt.getMonth()]}`
    return dueTime ? `${label} · ${dueTime}` : label
  }
  return dueTime ?? 'Bez terminu'
}

export function normalizePriority(v: string | undefined | null): TodoPriority {
  if (v === 'low' || v === 'high') return v
  return 'medium'
}

export function normalizeCategory(v: string | undefined | null): TodoCategory {
  const c = (v ?? '').toLowerCase()
  if (TODO_CATEGORIES.includes(c as TodoCategory)) return c as TodoCategory
  return 'inne'
}

export type TodoTabFilter = 'today' | 'upcoming' | 'all' | 'done'

export function isArchivedTodo(t: TodoItem): boolean {
  return !!t.archivedAt
}

/** Zadanie należy do „kubełka” Dzisiaj (termin dziś lub wcześniej albo brak daty), bez filtrowania po zrobione. */
export function todoInTodayBucket(t: TodoItem): boolean {
  if (isArchivedTodo(t)) return false
  const endToday = parseLocalYMD(localISODate())
  endToday.setHours(23, 59, 59, 999)
  if (!t.dueDate) return true
  return parseLocalYMD(t.dueDate).getTime() <= endToday.getTime()
}

export function todoMatchesTab(t: TodoItem, tab: TodoTabFilter): boolean {
  if (isArchivedTodo(t)) return false
  if (tab === 'done') return t.done
  if (t.done) return false

  if (tab === 'today') {
    return todoInTodayBucket(t)
  }
  if (tab === 'upcoming') {
    if (!t.dueDate) return false
    const endToday = parseLocalYMD(localISODate())
    endToday.setHours(23, 59, 59, 999)
    return parseLocalYMD(t.dueDate).getTime() > endToday.getTime()
  }
  return tab === 'all'
}

export function compareTodosForDisplay(a: TodoItem, b: TodoItem): number {
  const bucket = (t: TodoItem) => {
    if (t.done) return 10
    const st = todoDateStatus(t.dueDate)
    if (st === 'overdue') return 0
    if (st === 'today') return 1
    if (st === 'none') return 2
    return 3
  }
  const ba = bucket(a)
  const bb = bucket(b)
  if (ba !== bb) return ba - bb
  const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2
  const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2
  if (pa !== pb) return pa - pb
  const da = a.dueDate ? parseLocalYMD(a.dueDate).getTime() : Number.POSITIVE_INFINITY
  const db = b.dueDate ? parseLocalYMD(b.dueDate).getTime() : Number.POSITIVE_INFINITY
  if (da !== db) return da - db
  return b.createdAt.localeCompare(a.createdAt)
}
