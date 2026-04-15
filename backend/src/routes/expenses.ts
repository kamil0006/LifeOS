import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { unlockAchievement, checkSavingsAchievement } from '../lib/achievements.js'

const createSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
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
  const count = await prisma.expense.count({ where: { userId } })
  if (count === 1) await unlockAchievement(userId, 'first_expense')
  await checkSavingsAchievement(userId)
  res.status(201).json(expense)
})

expensesRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.expense.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
