import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const createSchema = z.object({
  source: z.string().min(1),
  amount: z.number().positive(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  recurring: z.boolean().optional(),
})

const updateSchema = z.object({
  source: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  recurring: z.boolean().optional(),
})

export const incomeRouter = Router()

incomeRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const income = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  res.json(income)
})

incomeRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
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
  res.status(201).json(income)
})

incomeRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.income.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.income.update({
    where: { id },
    data: {
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.recurring !== undefined ? { recurring: data.recurring } : {}),
    },
  })
  res.json(updated)
})

incomeRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.income.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
