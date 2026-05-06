import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const createSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().max(100),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().max(100).optional(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
})

export const expensesRouter = Router()

expensesRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  res.json(expenses)
})

expensesRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const expense = await prisma.expense.create({
    data: {
      userId,
      name: data.name,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
    },
  })
  res.status(201).json(expense)
})

expensesRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.expense.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
    },
  })
  res.json(updated)
})

expensesRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.expense.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
