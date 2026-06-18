import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import {
  decryptScheduledExpenseRow,
  decryptScheduledExpenseRows,
  encryptScheduledExpenseWrite,
} from '../lib/financeFields.js'

const paymentMethodSchema = z.enum(['card', 'cash'])

const createSchema = z.object({
  name: z.string().min(1).max(500),
  amount: z.number().positive(),
  category: z.string().max(100),
  dayOfMonth: z.number().min(1).max(31),
  paymentMethod: paymentMethodSchema,
})

const updateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  category: z.string().max(100).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  active: z.boolean().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  pausedUntil: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  reminderDaysBefore: z.number().int().min(0).max(31).nullable().optional(),
})

export const scheduledExpensesRouter = Router()

scheduledExpensesRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const items = await prisma.scheduledExpense.findMany({
    where: { userId },
    orderBy: { dayOfMonth: 'asc' },
  })
  res.json(decryptScheduledExpenseRows(items))
})

scheduledExpensesRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const enc = encryptScheduledExpenseWrite({ name: data.name })
  const item = await prisma.scheduledExpense.create({
    data: {
      userId,
      name: enc.name!,
      amount: data.amount,
      category: data.category,
      dayOfMonth: data.dayOfMonth,
      paymentMethod: data.paymentMethod,
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
  const enc = encryptScheduledExpenseWrite(data.name !== undefined ? { name: data.name } : {})
  const updated = await prisma.scheduledExpense.update({
    where: { id },
    data: {
      ...(enc.name !== undefined ? { name: enc.name } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.dayOfMonth !== undefined ? { dayOfMonth: data.dayOfMonth } : {}),
      ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.pausedUntil !== undefined
        ? { pausedUntil: data.pausedUntil ? new Date(data.pausedUntil) : null }
        : {}),
      ...(data.reminderDaysBefore !== undefined ? { reminderDaysBefore: data.reminderDaysBefore } : {}),
    },
  })
  res.json(decryptScheduledExpenseRow(updated))
})

scheduledExpensesRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.scheduledExpense.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
