import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { unlockAchievement } from '../lib/achievements.js'

const STAGES = ['pomysl', 'chce_kupic', 'odkladam', 'kupione'] as const

const createSchema = z.object({
  name: z.string().min(1),
  estimatedPrice: z.number().positive(),
  priority: z.number().min(1).max(3),
  stage: z.enum(STAGES).optional(),
  savedAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  estimatedPrice: z.number().positive().optional(),
  priority: z.number().min(1).max(3).optional(),
  stage: z.enum(STAGES).optional(),
  savedAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const wishesRouter = Router()

wishesRouter.get('/', async (req, res) => {
  const userId = req.user!.userId
  const wishes = await prisma.wish.findMany({
    where: { userId },
    orderBy: [{ stage: 'asc' }, { priority: 'asc' }],
  })
  res.json(wishes)
})

wishesRouter.post('/', async (req, res) => {
  const userId = req.user!.userId
  const data = createSchema.parse(req.body)
  const wish = await prisma.wish.create({
    data: {
      userId,
      name: data.name,
      estimatedPrice: data.estimatedPrice,
      priority: data.priority,
      stage: data.stage ?? 'pomysl',
      savedAmount: data.savedAmount ?? 0,
      notes: data.notes,
    },
  })
  const count = await prisma.wish.count({ where: { userId } })
  if (count === 1) await unlockAchievement(userId, 'first_wish')
  if (count === 5) await unlockAchievement(userId, 'wishes_5')
  res.status(201).json(wish)
})

wishesRouter.patch('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const wish = await prisma.wish.updateMany({
    where: { id, userId },
    data: data as { name?: string; estimatedPrice?: number; priority?: number; stage?: string; savedAmount?: number; notes?: string },
  })
  if (wish.count === 0) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.wish.findFirst({ where: { id, userId } })
  res.json(updated)
})

wishesRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  await prisma.wish.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
