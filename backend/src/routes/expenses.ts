import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import {
  decryptExpenseRow,
  decryptExpenseRows,
  encryptExpenseWrite,
} from '../lib/financeFields.js'

const paymentMethodSchema = z.enum(['card', 'cash'])

const createSchema = z.object({
  name: z.string().min(1).max(500),
  amount: z.number().positive(),
  category: z.string().max(100),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  paymentMethod: paymentMethodSchema,
  note: z.string().max(2000).nullable().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  category: z.string().max(100).optional(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  paymentMethod: paymentMethodSchema.optional(),
  note: z.string().max(2000).nullable().optional(),
})

export const expensesRouter = Router()

expensesRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  res.json(decryptExpenseRows(expenses))
})

expensesRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const enc = encryptExpenseWrite({ name: data.name, note: data.note })
  const expense = await prisma.expense.create({
    data: {
      userId,
      name: enc.name!,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod,
      note: enc.note ?? null,
    },
  })
  res.status(201).json(decryptExpenseRow(expense))
})

expensesRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.expense.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const enc = encryptExpenseWrite({
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.note !== undefined ? { note: data.note } : {}),
  })
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(enc.name !== undefined ? { name: enc.name } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
      ...(enc.note !== undefined ? { note: enc.note } : {}),
    },
  })
  res.json(decryptExpenseRow(updated))
})

expensesRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.expense.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
