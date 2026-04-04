import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  dayOfMonth: z.number().min(1).max(31),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  active: z.boolean().optional(),
})

export const scheduledExpensesRouter = Router()

scheduledExpensesRouter.get('/', async (req, res) => {
  const userId = (req as any).user.userId
  const items = await prisma.scheduledExpense.findMany({
    where: { userId },
    orderBy: { dayOfMonth: 'asc' },
  })
  res.json(items)
})

scheduledExpensesRouter.post('/', async (req, res) => {
  const userId = (req as any).user.userId
  const data = createSchema.parse(req.body)
  const item = await prisma.scheduledExpense.create({
    data: {
      userId,
      name: data.name,
      amount: data.amount,
      category: data.category,
      dayOfMonth: data.dayOfMonth,
    },
  })
  res.status(201).json(item)
})

scheduledExpensesRouter.patch('/:id', async (req, res) => {
  const userId = (req as any).user.userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.scheduledExpense.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.scheduledExpense.update({
    where: { id },
    data,
  })
  res.json(updated)
})

scheduledExpensesRouter.delete('/:id', async (req, res) => {
  const userId = (req as any).user.userId
  const { id } = req.params
  await prisma.scheduledExpense.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
