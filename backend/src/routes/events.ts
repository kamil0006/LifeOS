import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createSchema = z.object({
  title: z.string().min(1),
  date: z.string(), // ISO date "YYYY-MM-DD"
  time: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
})

const updateSchema = createSchema.partial()

export const eventsRouter = Router()

eventsRouter.get('/', async (req, res) => {
  const userId = (req as any).user.userId
  const events = await prisma.event.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  })
  res.json(events)
})

eventsRouter.post('/', async (req, res) => {
  const userId = (req as any).user.userId
  const data = createSchema.parse(req.body)
  const event = await prisma.event.create({
    data: {
      userId,
      title: data.title,
      date: new Date(data.date),
      time: data.time ?? null,
      category: data.category ?? null,
      color: data.color ?? null,
      notes: data.notes ?? null,
    },
  })
  res.status(201).json(event)
})

eventsRouter.patch('/:id', async (req, res) => {
  const userId = (req as any).user.userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.event.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(data.title != null && { title: data.title }),
      ...(data.date != null && { date: new Date(data.date) }),
      ...(data.time !== undefined && { time: data.time ?? null }),
      ...(data.category !== undefined && { category: data.category ?? null }),
      ...(data.color !== undefined && { color: data.color ?? null }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
    },
  })
  res.json(updated)
})

eventsRouter.delete('/:id', async (req, res) => {
  const userId = (req as any).user.userId
  const { id } = req.params
  await prisma.event.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
