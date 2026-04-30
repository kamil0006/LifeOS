import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const createHabitSchema = z.object({
  name: z.string().min(1),
  category: z.union([z.string().max(48), z.null()]).optional(),
  color: z.union([z.string().max(16), z.null()]).optional(),
  scheduleType: z.enum(['daily', 'weekdays', 'weekly', 'monthly']).optional(),
  scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  weeklyTarget: z.union([z.number().int().positive(), z.null()]).optional(),
  monthlyTarget: z.union([z.number().int().positive(), z.null()]).optional(),
  unit: z.union([z.string().max(32), z.null()]).optional(),
  targetPerDay: z.union([z.number().nonnegative(), z.null()]).optional(),
  archivedAt: z.union([z.string(), z.null()]).optional(),
})

const patchHabitSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.union([z.string().max(48), z.null()]).optional(),
  color: z.union([z.string().max(16), z.null()]).optional(),
  scheduleType: z.enum(['daily', 'weekdays', 'weekly', 'monthly']).optional(),
  scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  weeklyTarget: z.union([z.number().int().positive(), z.null()]).optional(),
  monthlyTarget: z.union([z.number().int().positive(), z.null()]).optional(),
  unit: z.union([z.string().max(32), z.null()]).optional(),
  targetPerDay: z.union([z.number().nonnegative(), z.null()]).optional(),
  archivedAt: z.union([z.string(), z.null()]).optional(),
})

const checkInSchema = z.object({
  date: z.string(),
  value: z.union([z.number().nonnegative(), z.null()]).optional(),
  status: z.enum(['done', 'missed', 'skipped']).optional(),
  note: z.union([z.string().max(500), z.null()]).optional(),
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
  const includeArchived = req.query.includeArchived === 'true'
  const habits = await prisma.habit.findMany({
    where: { userId, ...(includeArchived ? {} : { archivedAt: null }) },
    include: { checkIns: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(habits)
})

habitsRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createHabitSchema.parse(req.body)
  const habitData = {
    userId,
    name: data.name,
    category: data.category ?? null,
    color: data.color ?? null,
    scheduleType: data.scheduleType ?? 'daily',
    scheduleDays: data.scheduleDays ?? [],
    weeklyTarget: data.weeklyTarget ?? null,
    monthlyTarget: data.monthlyTarget ?? null,
    unit: data.unit ?? null,
    targetPerDay: data.targetPerDay ?? null,
  }
  const habit = await prisma.habit.create({
    data: habitData,
  })
  res.status(201).json(habit)
})

habitsRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = patchHabitSchema.parse(req.body)
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return res.status(404).json({ error: 'Nie znaleziono' })

  const habitData = {
    ...(data.name != null ? { name: data.name } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.color !== undefined ? { color: data.color } : {}),
    ...(data.scheduleType !== undefined ? { scheduleType: data.scheduleType } : {}),
    ...(data.scheduleDays !== undefined ? { scheduleDays: data.scheduleDays } : {}),
    ...(data.weeklyTarget !== undefined ? { weeklyTarget: data.weeklyTarget } : {}),
    ...(data.monthlyTarget !== undefined ? { monthlyTarget: data.monthlyTarget } : {}),
    ...(data.unit !== undefined ? { unit: data.unit } : {}),
    ...(data.targetPerDay !== undefined ? { targetPerDay: data.targetPerDay } : {}),
    ...(data.archivedAt !== undefined
      ? { archivedAt: data.archivedAt === null ? null : new Date(data.archivedAt) }
      : {}),
  }
  const updated = await prisma.habit.update({
    where: { id },
    data: habitData,
  })
  res.json(updated)
})

habitsRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  if (req.query.permanent === 'true') {
    await prisma.habit.deleteMany({ where: { id, userId, archivedAt: { not: null } } })
    return res.status(204).send()
  }
  const habitData = { archivedAt: new Date() }
  await prisma.habit.updateMany({
    where: { id, userId },
    data: habitData,
  })
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

  const status = data.status ?? 'done'
  const resolved: number | null =
    status === 'done'
      ? rawValue != null && rawValue > 0
        ? rawValue
        : defaultCheckInValue(habit)
      : null

  const checkInCreateData = {
    habitId: id,
    userId,
    date: new Date(data.date),
    status,
    value: resolved,
    note: data.note ?? null,
  }
  const checkInUpdateData = {
    status,
    value: resolved,
    ...(data.note !== undefined ? { note: data.note } : {}),
  }
  const checkIn = await prisma.habitCheckIn.upsert({
    where: {
      habitId_date: { habitId: id, date: new Date(data.date) },
    },
    create: checkInCreateData,
    update: checkInUpdateData,
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
