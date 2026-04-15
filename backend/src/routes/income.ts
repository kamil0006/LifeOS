import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { unlockAchievement, checkSavingsAchievement } from '../lib/achievements.js'

const createSchema = z.object({
  source: z.string().min(1),
  amount: z.number().positive(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  recurring: z.boolean().optional(),
})

export const incomeRouter = Router()

incomeRouter.get('/', async (req, res) => {
  const userId = req.user!.userId
  const income = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  res.json(income)
})

incomeRouter.post('/', async (req, res) => {
  const userId = req.user!.userId
  const data = createSchema.parse(req.body)
  const income = await prisma.income.create({
    data: {
      userId,
      source: data.source,
      amount: data.amount,
      date: new Date(data.date),
      recurring: data.recurring ?? false,
    },
  })
  const count = await prisma.income.count({ where: { userId } })
  if (count === 1) await unlockAchievement(userId, 'first_income')
  await checkSavingsAchievement(userId)
  res.status(201).json(income)
})

incomeRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  await prisma.income.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
