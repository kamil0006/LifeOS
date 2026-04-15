import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const createHabitSchema = z.object({ name: z.string().min(1) })
const checkInSchema = z.object({ date: z.string() }) // YYYY-MM-DD

export const habitsRouter = Router()

habitsRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { checkIns: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(habits)
})

habitsRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createHabitSchema.parse(req.body)
  const habit = await prisma.habit.create({
    data: { userId, name: data.name },
  })
  res.status(201).json(habit)
})

habitsRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = z.object({ name: z.string().min(1) }).parse(req.body)
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.habit.update({
    where: { id },
    data: { name: data.name },
  })
  res.json(updated)
})

habitsRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.habit.deleteMany({ where: { id, userId } })
  res.status(204).send()
})

habitsRouter.post('/:id/check-in', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = checkInSchema.parse(req.body)
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return res.status(404).json({ error: 'Nie znaleziono' })
  const checkIn = await prisma.habitCheckIn.upsert({
    where: {
      habitId_date: { habitId: id, date: new Date(data.date) },
    },
    create: { habitId: id, userId, date: new Date(data.date) },
    update: {},
  })
  res.status(201).json(checkIn)
})

habitsRouter.delete('/:id/check-in', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const { date } = req.query
  if (!date || typeof date !== 'string') return res.status(400).json({ error: 'Brak daty' })
  await prisma.habitCheckIn.deleteMany({
    where: {
      habitId: id,
      habit: { userId },
      date: new Date(date),
    },
  })
  res.status(204).send()
})
