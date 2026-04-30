import { localISODate, type TodoCategory, type TodoPriority } from './todoDomain'

export interface QuickParsedTodo {
  text: string
  dueDate: string | null
  dueTime: string | null
  priority: TodoPriority
  category: TodoCategory
}

const CATEGORY_PATTERN = /#(dom|praca|finanse|nauka|zdrowie|inne)\b/gi

/** Parsuje naturalny wpis: „… jutro #finanse !” — bez pełnego NLP, heurystyki. */
export function parseQuickTodoInput(raw: string): QuickParsedTodo {
  let s = raw.trim()
  let category: TodoCategory = 'inne'
  const catMatch = s.match(CATEGORY_PATTERN)
  if (catMatch?.[0]) {
    category = catMatch[0].slice(1).toLowerCase() as TodoCategory
    s = s.replace(CATEGORY_PATTERN, '').replace(/\s+/g, ' ').trim()
  }

  let priority: TodoPriority = 'medium'
  if (/\?\s*$/.test(s)) {
    priority = 'low'
    s = s.replace(/\?+\s*$/, '').trim()
  } else if (/!\s*$/.test(s)) {
    priority = 'high'
    s = s.replace(/!+\s*$/, '').trim()
  }

  let dueTime: string | null = null
  const timeMatch = s.match(/\b(\d{1,2}):(\d{2})\b/)
  if (timeMatch) {
    const hh = Math.min(23, Math.max(0, parseInt(timeMatch[1], 10)))
    const mm = Math.min(59, Math.max(0, parseInt(timeMatch[2], 10)))
    dueTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    s = s.replace(timeMatch[0], '').replace(/\s+/g, ' ').trim()
  }

  let dueDate: string | null = null
  const today = new Date()
  const addDays = (n: number) => localISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n))

  const lower = s.toLowerCase()
  if (/\b(dzisiaj|dziś)\b/i.test(lower)) {
    dueDate = addDays(0)
    s = s.replace(/\b(dzisiaj|dziś)\b/gi, '').replace(/\s+/g, ' ').trim()
  } else if (/\bjutro\b/i.test(lower)) {
    dueDate = addDays(1)
    s = s.replace(/\bjutro\b/gi, '').trim()
  } else if (/\bpojutrze\b/i.test(lower)) {
    dueDate = addDays(2)
    s = s.replace(/\bpojutrze\b/gi, '').trim()
  }

  const isoDMY = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (isoDMY) {
    dueDate = `${isoDMY[1]}-${isoDMY[2]}-${isoDMY[3]}`
    s = s.replace(isoDMY[0], '').replace(/\s+/g, ' ').trim()
  }

  return {
    text: s.trim(),
    dueDate,
    dueTime,
    priority,
    category,
  }
}
