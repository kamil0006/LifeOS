import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

const updateSchema = createSchema.partial()

export const expenseCategoriesRouter = Router()

expenseCategoriesRouter.get('/', async (req, res) => {
  const userId = req.user!.userId
  const categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
  res.json(categories)
})

expenseCategoriesRouter.post('/', async (req, res) => {
  const userId = req.user!.userId
  const data = createSchema.parse(req.body)
  const category = await prisma.expenseCategory.create({
    data: { userId, name: data.name.trim(), color: data.color },
  })
  res.status(201).json(category)
})

expenseCategoriesRouter.patch('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const category = await prisma.expenseCategory.updateMany({
    where: { id, userId },
    data: data as { name?: string; color?: string },
  })
  if (category.count === 0) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.expenseCategory.findFirst({ where: { id, userId } })
  res.json(updated)
})

expenseCategoriesRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  await prisma.expenseCategory.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
