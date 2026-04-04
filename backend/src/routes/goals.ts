import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createSchema = z.object({
  name: z.string().min(1),
  target: z.number().positive(),
  current: z.number().min(0).optional(),
  unit: z.string().optional(),
})

const updateSchema = z.object({
  current: z.number().min(0).optional(),
  target: z.number().positive().optional(),
  name: z.string().min(1).optional(),
  unit: z.string().optional(),
})

export const goalsRouter = Router()

goalsRouter.get('/', async (req, res) => {
  const userId = (req as any).user.userId
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  res.json(goals)
})

goalsRouter.post('/', async (req, res) => {
  const userId = (req as any).user.userId
  const data = createSchema.parse(req.body)
  const goal = await prisma.goal.create({
    data: {
      userId,
      name: data.name,
      target: data.target,
      current: data.current ?? 0,
      unit: data.unit ?? null,
    },
  })
  res.status(201).json(goal)
})

goalsRouter.patch('/:id', async (req, res) => {
  const userId = (req as any).user.userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(data.current !== undefined && { current: data.current }),
      ...(data.target !== undefined && { target: data.target }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.unit !== undefined && { unit: data.unit ?? null }),
    },
  })
  res.json(updated)
})

goalsRouter.delete('/:id', async (req, res) => {
  const userId = (req as any).user.userId
  const { id } = req.params
  await prisma.goal.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
