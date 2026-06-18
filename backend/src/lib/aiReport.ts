import OpenAI from 'openai'
import { prisma } from './prisma.js'
import { isOpenAiReportEnabled } from './config.js'

export interface WeeklyReportResult {
  summary: string
  generatedAt: string
  model: string
  source: 'ai' | 'fallback'
}

interface Aggregated {
  range: { from: string; to: string }
  finance: {
    expenses30: number
    income30: number
    balance30: number
    topCategories: { category: string; amount: number }[]
    netWorth: number
  }
  productivity: {
    todosOpen: number
    todosDone: number
    todosOverdue: number
  }
  habits: {
    activeHabits: number
    checkInsLast7: number
    consistencyPct: number
  }
  learning: {
    minutesLast7: number
    weeklyGoalMinutes: number
    goalPct: number
  }
  goals: { name: string; current: number; target: number; unit: string | null }[]
}

/** Minimalny zestaw danych wysyłany do OpenAI — bez treści notatek ani pojedynczych transakcji. */
type AiSafePayload = {
  range: Aggregated['range']
  finance: {
    expenses30: number
    income30: number
    balance30: number
    topCategories: { category: string; amount: number }[]
    netWorthRounded: number
  }
  productivity: Aggregated['productivity']
  habits: Aggregated['habits']
  learning: Aggregated['learning']
  goalsCount: number
  goalsProgressPct: number[]
}

function toAiSafePayload(data: Aggregated): AiSafePayload {
  return {
    range: data.range,
    finance: {
      expenses30: data.finance.expenses30,
      income30: data.finance.income30,
      balance30: data.finance.balance30,
      topCategories: data.finance.topCategories.slice(0, 5),
      netWorthRounded: Math.round(data.finance.netWorth / 100) * 100,
    },
    productivity: data.productivity,
    habits: data.habits,
    learning: data.learning,
    goalsCount: data.goals.length,
    goalsProgressPct: data.goals.map((g) =>
      g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
    ),
  }
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export async function aggregateUserData(userId: string): Promise<Aggregated> {
  const now = new Date()
  const thirty = daysAgo(30)
  const seven = daysAgo(7)
  const todayStr = isoDay(now)
  const sevenStr = isoDay(seven)

  const [expenses, income, todos, habits, checkIns, goals, accounts, sessions, settings] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: thirty } } }),
    prisma.income.findMany({ where: { userId, date: { gte: thirty } } }),
    prisma.todo.findMany({ where: { userId, archivedAt: null } }),
    prisma.habit.findMany({ where: { userId, archivedAt: null } }),
    prisma.habitCheckIn.findMany({ where: { userId, date: { gte: seven }, status: 'done' } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.netWorthAccount.findMany({ where: { userId } }),
    prisma.learningSession.findMany({ where: { userId, date: { gte: sevenStr } } }),
    prisma.learningSettings.findUnique({ where: { userId } }),
  ])

  const expenses30 = expenses.reduce((s, e) => s + e.amount, 0)
  const income30 = income.reduce((s, i) => s + i.amount, 0)

  const byCategory = new Map<string, number>()
  for (const e of expenses) {
    byCategory.set(e.category || 'inne', (byCategory.get(e.category || 'inne') ?? 0) + e.amount)
  }
  const topCategories = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount: round(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const netWorth = accounts.reduce(
    (s, a) => s + (a.kind === 'liability' ? -a.balance : a.balance),
    0,
  )

  const openTodos = todos.filter((t) => !t.done)
  const todosOverdue = openTodos.filter((t) => t.dueDate && isoDay(new Date(t.dueDate)) < todayStr).length

  const activeHabits = habits.length
  const consistencyPct =
    activeHabits > 0 ? round((checkIns.length / (activeHabits * 7)) * 100) : 0

  const minutesLast7 = sessions.reduce((s, x) => s + x.minutes, 0)
  const weeklyGoalMinutes = settings?.weeklyGoalMinutes ?? 600
  const goalPct = weeklyGoalMinutes > 0 ? round((minutesLast7 / weeklyGoalMinutes) * 100) : 0

  return {
    range: { from: isoDay(seven), to: todayStr },
    finance: {
      expenses30: round(expenses30),
      income30: round(income30),
      balance30: round(income30 - expenses30),
      topCategories,
      netWorth: round(netWorth),
    },
    productivity: {
      todosOpen: openTodos.length,
      todosDone: todos.filter((t) => t.done).length,
      todosOverdue,
    },
    habits: {
      activeHabits,
      checkInsLast7: checkIns.length,
      consistencyPct,
    },
    learning: {
      minutesLast7,
      weeklyGoalMinutes,
      goalPct,
    },
    goals: goals.map((g) => ({ name: g.name, current: g.current, target: g.target, unit: g.unit })),
  }
}

function fmtPln(n: number): string {
  return `${n.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`
}

function fmtMinutes(n: number): string {
  const h = Math.floor(n / 60)
  const m = n % 60
  if (h === 0) return `${m} min`
  return `${h} h ${m} min`
}

/** Deterministyczne podsumowanie bez AI — używane gdy brak klucza OpenAI. */
export function buildFallbackReport(data: Aggregated): string {
  const lines: string[] = []
  lines.push(`## Podsumowanie tygodnia (${data.range.from} – ${data.range.to})`)
  lines.push('')
  lines.push('### Finanse (30 dni)')
  lines.push(`- Przychody: **${fmtPln(data.finance.income30)}**`)
  lines.push(`- Wydatki: **${fmtPln(data.finance.expenses30)}**`)
  lines.push(`- Bilans: **${fmtPln(data.finance.balance30)}**`)
  if (data.finance.topCategories.length) {
    const top = data.finance.topCategories
      .map((c) => `${c.category} (${fmtPln(c.amount)})`)
      .join(', ')
    lines.push(`- Największe kategorie: ${top}`)
  }
  lines.push(`- Wartość netto: **${fmtPln(data.finance.netWorth)}**`)
  lines.push('')
  lines.push('### Produktywność')
  lines.push(`- Zadania otwarte: **${data.productivity.todosOpen}** (po terminie: ${data.productivity.todosOverdue})`)
  lines.push(`- Zadania ukończone: **${data.productivity.todosDone}**`)
  lines.push('')
  lines.push('### Nawyki')
  lines.push(`- Aktywne nawyki: **${data.habits.activeHabits}**`)
  lines.push(`- Wykonania w 7 dni: **${data.habits.checkInsLast7}** (regularność ~${data.habits.consistencyPct}%)`)
  lines.push('')
  lines.push('### Nauka')
  lines.push(
    `- Czas w 7 dni: **${fmtMinutes(data.learning.minutesLast7)}** z celu ${fmtMinutes(data.learning.weeklyGoalMinutes)} (${data.learning.goalPct}%)`,
  )
  if (data.goals.length) {
    lines.push('')
    lines.push('### Cele')
    for (const g of data.goals) {
      const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
      lines.push(`- ${g.name}: ${g.current}/${g.target}${g.unit ? ` ${g.unit}` : ''} (${pct}%)`)
    }
  }
  lines.push('')
  lines.push('_Raport wygenerowany lokalnie (bez AI). Dodaj `OPENAI_API_KEY` w `backend/.env`, aby uzyskać analizę i rekomendacje._')
  return lines.join('\n')
}

const DEFAULT_SYSTEM_PROMPT = `Jesteś asystentem osobistego dashboardu. Tworzysz zwięzły tygodniowy raport po polsku na podstawie danych w formacie JSON. Pisz w Markdown, odwołuj się do konkretnych liczb, zaproponuj kilka praktycznych kroków i nie wymyślaj danych, których nie ma.`

function getSystemPrompt(): string {
  const fromEnv = process.env.AI_SYSTEM_PROMPT?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_SYSTEM_PROMPT
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReportResult> {
  const data = await aggregateUserData(userId)
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const generatedAt = new Date().toISOString()

  if (!isOpenAiReportEnabled()) {
    return { summary: buildFallbackReport(data), generatedAt, model: 'fallback', source: 'fallback' }
  }

  const apiKey = process.env.OPENAI_API_KEY!.trim()

  try {
    const client = new OpenAI({ apiKey })
    const safePayload = toAiSafePayload(data)
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        {
          role: 'user',
          content: `Zagregowane dane tygodniowe (JSON, bez treści notatek i pojedynczych transakcji):\n${JSON.stringify(safePayload, null, 2)}`,
        },
      ],
    })
    const summary = completion.choices[0]?.message?.content?.trim()
    if (!summary) {
      return { summary: buildFallbackReport(data), generatedAt, model: 'fallback', source: 'fallback' }
    }
    return { summary, generatedAt, model, source: 'ai' }
  } catch (e) {
    console.error('[AI] OpenAI error, fallback do raportu regułowego:', e)
    return { summary: buildFallbackReport(data), generatedAt, model: 'fallback', source: 'fallback' }
  }
}
