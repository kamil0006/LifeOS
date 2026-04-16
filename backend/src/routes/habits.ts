import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const createHabitSchema = z.object({
  name: z.string().min(1),
  unit: z.union([z.string().max(32), z.null()]).optional(),
  targetPerDay: z.union([z.number().nonnegative(), z.null()]).optional(),
})

const patchHabitSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.union([z.string().max(32), z.null()]).optional(),
  targetPerDay: z.union([z.number().nonnegative(), z.null()]).optional(),
})

const checkInSchema = z.object({
  date: z.string(),
  value: z.union([z.number().nonnegative(), z.null()]).optional(),
})

function defaultCheckInValue(habit: {
  unit: string | null
  targetPerDay: number | null
}): number | null {
  if (habit.targetPerDay != null) return habit.targetPerDay
  if (habit.unit?.trim()) return 1
  return null
}

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
    data: {
      userId,
      name: data.name,
      unit: data.unit ?? null,
      targetPerDay: data.targetPerDay ?? null,
    },
  })
  res.status(201).json(habit)
})

habitsRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = patchHabitSchema.parse(req.body)
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return res.status(404).json({ error: 'Nie znaleziono' })

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      ...(data.name != null ? { name: data.name } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.targetPerDay !== undefined ? { targetPerDay: data.targetPerDay } : {}),
    },
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

  const rawValue = data.value
  if (rawValue === 0) {
    await prisma.habitCheckIn.deleteMany({
      where: {
        habitId: id,
        userId,
        date: new Date(data.date),
      },
    })
    return res.status(204).send()
  }

  const resolved: number | null =
    rawValue != null && rawValue > 0 ? rawValue : defaultCheckInValue(habit)

  const checkIn = await prisma.habitCheckIn.upsert({
    where: {
      habitId_date: { habitId: id, date: new Date(data.date) },
    },
    create: {
      habitId: id,
      userId,
      date: new Date(data.date),
      value: resolved,
    },
    update: { value: resolved },
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
