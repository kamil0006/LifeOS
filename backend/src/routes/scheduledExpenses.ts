import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import {
  decryptScheduledExpenseRow,
  decryptScheduledExpenseRows,
  encryptScheduledExpenseWrite,
} from '../lib/financeFields.js'
import { convertToPln, getExchangeRate, isForeignCurrency, type Currency } from '../lib/exchangeRates.js'

const paymentMethodSchema = z.enum(['card', 'cash'])
const currencySchema = z.enum(['PLN', 'USD', 'EUR'])

const createSchema = z.object({
  name: z.string().min(1).max(500),
  /** Kwota w walucie `currency` (dla PLN to jednocześnie kwota końcowa). */
  amount: z.number().positive(),
  currency: currencySchema.default('PLN'),
  category: z.string().max(100),
  dayOfMonth: z.number().min(1).max(31),
  paymentMethod: paymentMethodSchema,
  note: z.string().max(2000).nullable().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  currency: currencySchema.optional(),
  category: z.string().max(100).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  active: z.boolean().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  pausedUntil: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  reminderDaysBefore: z.number().int().min(0).max(31).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
})

/** Przelicza kwotę wpisaną w danej walucie na parę (amount w PLN, originalAmount). */
async function resolveAmounts(amount: number, currency: Currency): Promise<{ amount: number; originalAmount: number | null; currency: Currency }> {
  if (currency === 'PLN') return { amount, originalAmount: null, currency }
  const pln = await convertToPln(amount, currency)
  return { amount: pln, originalAmount: amount, currency }
}

/** Odświeża kwoty PLN dla pozycji w walucie obcej wg aktualnego kursu (na żądanie GET). */
async function refreshForeignAmounts<
  T extends { id: string; amount: number; currency: string; originalAmount: number | null }
>(items: T[]): Promise<T[]> {
  const foreignCurrencies = Array.from(
    new Set(items.filter((i) => isForeignCurrency(i.currency) && i.originalAmount != null).map((i) => i.currency))
  ) as ('USD' | 'EUR')[]
  if (foreignCurrencies.length === 0) return items

  const rates = await Promise.all(foreignCurrencies.map((c) => getExchangeRate(c)))
  const rateByCode = new Map(foreignCurrencies.map((c, i) => [c, rates[i]]))

  const updates: { id: string; amount: number }[] = []
  const refreshed = items.map((item) => {
    if (!isForeignCurrency(item.currency) || item.originalAmount == null) return item
    const rate = rateByCode.get(item.currency)
    if (!rate) return item
    const freshAmount = Math.round(item.originalAmount * rate * 100) / 100
    if (freshAmount === item.amount) return item
    updates.push({ id: item.id, amount: freshAmount })
    return { ...item, amount: freshAmount }
  })

  if (updates.length > 0) {
    await Promise.all(
      updates.map((u) => prisma.scheduledExpense.update({ where: { id: u.id }, data: { amount: u.amount } }))
    ).catch((e) => console.error('Nie udało się zapisać odświeżonych kwot walutowych:', e))
  }

  return refreshed
}

export const scheduledExpensesRouter = Router()

scheduledExpensesRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const items = await prisma.scheduledExpense.findMany({
    where: { userId },
    orderBy: { dayOfMonth: 'asc' },
  })
  const refreshed = await refreshForeignAmounts(items)
  res.json(decryptScheduledExpenseRows(refreshed))
})

scheduledExpensesRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const enc = encryptScheduledExpenseWrite({ name: data.name, note: data.note })
  const resolved = await resolveAmounts(data.amount, data.currency)
  const item = await prisma.scheduledExpense.create({
    data: {
      userId,
      name: enc.name!,
      amount: resolved.amount,
      currency: resolved.currency,
      originalAmount: resolved.originalAmount,
      category: data.category,
      dayOfMonth: data.dayOfMonth,
      paymentMethod: data.paymentMethod,
      note: enc.note ?? null,
    },
  })
  res.status(201).json(decryptScheduledExpenseRow(item))
})

scheduledExpensesRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.scheduledExpense.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const enc = encryptScheduledExpenseWrite({
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.note !== undefined ? { note: data.note } : {}),
  })

  let amountUpdate: { amount: number; currency: string; originalAmount: number | null } | null = null
  if (data.amount !== undefined || data.currency !== undefined) {
    const currency = (data.currency ?? existing.currency) as Currency
    const rawAmount = data.amount ?? existing.originalAmount ?? existing.amount
    amountUpdate = await resolveAmounts(rawAmount, currency)
  }

  const updated = await prisma.scheduledExpense.update({
    where: { id },
    data: {
      ...(enc.name !== undefined ? { name: enc.name } : {}),
      ...(amountUpdate
        ? { amount: amountUpdate.amount, currency: amountUpdate.currency, originalAmount: amountUpdate.originalAmount }
        : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.dayOfMonth !== undefined ? { dayOfMonth: data.dayOfMonth } : {}),
      ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.pausedUntil !== undefined
        ? { pausedUntil: data.pausedUntil ? new Date(data.pausedUntil) : null }
        : {}),
      ...(data.reminderDaysBefore !== undefined ? { reminderDaysBefore: data.reminderDaysBefore } : {}),
      ...(enc.note !== undefined ? { note: enc.note } : {}),
    },
  })
  res.json(decryptScheduledExpenseRow(updated))
})

scheduledExpensesRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const existing = await prisma.scheduledExpense.findFirst({ where: { id, userId } })
  if (!existing) return res.status(204).send()

  // Pierwsze wystąpienie: dzień płatności w miesiącu utworzenia.
  const created = existing.createdAt
  const lastDayOfCreatedMonth = new Date(created.getFullYear(), created.getMonth() + 1, 0).getDate()
  const firstOccurrence = new Date(
    created.getFullYear(),
    created.getMonth(),
    Math.min(existing.dayOfMonth, lastDayOfCreatedMonth),
    23, 59, 59, 999
  )

  if (firstOccurrence > new Date()) {
    // Koszt nie wygenerował jeszcze żadnej płatności — można usunąć na twardo.
    await prisma.scheduledExpense.delete({ where: { id } })
  } else {
    // Soft delete: przeszłe płatności zostają w historii, przyszłe nie są już generowane.
    await prisma.scheduledExpense.update({ where: { id }, data: { endedAt: new Date() } })
  }
  res.status(204).send()
})
