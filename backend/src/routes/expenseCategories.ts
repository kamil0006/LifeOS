import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { DEFAULT_EXPENSE_CATEGORIES_FOR_SEED } from '../lib/defaultExpenseCategories.js'

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

const updateSchema = createSchema.partial()

export const expenseCategoriesRouter = Router()

expenseCategoriesRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { financesCategoriesSeededAt: true },
  })
  if (!user) return res.status(401).json({ error: 'Brak użytkownika' })

  let categories = await prisma.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  if (!user.financesCategoriesSeededAt) {
    if (categories.length === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_EXPENSE_CATEGORIES_FOR_SEED.map((d) => ({
          userId,
          name: d.name,
          color: d.color.toLowerCase(),
        })),
        skipDuplicates: true,
      })
      categories = await prisma.expenseCategory.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      })
    }
    await prisma.user.update({
      where: { id: userId },
      data: { financesCategoriesSeededAt: new Date() },
    })
  }

  if (categories.length === 0) {
    await prisma.expenseCategory.createMany({
      data: DEFAULT_EXPENSE_CATEGORIES_FOR_SEED.map((d) => ({
        userId,
        name: d.name,
        color: d.color.toLowerCase(),
      })),
      skipDuplicates: true,
    })
    categories = await prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
  }

  res.json(categories)
})

expenseCategoriesRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const category = await prisma.expenseCategory.create({
    data: { userId, name: data.name.trim(), color: data.color },
  })
  res.status(201).json(category)
})

expenseCategoriesRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
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
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.expenseCategory.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
