import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import {
  decryptIncomeRow,
  decryptIncomeRows,
  encryptIncomeWrite,
} from '../lib/financeFields.js'

const paymentMethodSchema = z.enum(['card', 'cash'])

const createSchema = z.object({
  source: z.string().min(1).max(500),
  amount: z.number().positive(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  recurring: z.boolean().optional(),
  category: z.string().max(100).optional(),
  paymentMethod: paymentMethodSchema,
})

const updateSchema = z.object({
  source: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  date: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  recurring: z.boolean().optional(),
  category: z.string().max(100).optional(),
  paymentMethod: paymentMethodSchema.optional(),
})

export const incomeRouter = Router()

incomeRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const income = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  res.json(decryptIncomeRows(income))
})

incomeRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const enc = encryptIncomeWrite({ source: data.source })
  const income = await prisma.income.create({
    data: {
      userId,
      source: enc.source!,
      amount: data.amount,
      date: new Date(data.date),
      recurring: data.recurring ?? false,
      ...(data.category !== undefined ? { category: data.category } : {}),
      paymentMethod: data.paymentMethod,
    },
  })
  res.status(201).json(decryptIncomeRow(income))
})

incomeRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.income.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const enc = encryptIncomeWrite(data.source !== undefined ? { source: data.source } : {})
  const updated = await prisma.income.update({
    where: { id },
    data: {
      ...(enc.source !== undefined ? { source: enc.source } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.recurring !== undefined ? { recurring: data.recurring } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
    },
  })
  res.json(decryptIncomeRow(updated))
})

incomeRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.income.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
