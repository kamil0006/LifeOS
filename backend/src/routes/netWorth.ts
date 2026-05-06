import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const accountCreateSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['asset', 'liability']),
  balance: z.number().default(0),
})

const accountUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  kind: z.enum(['asset', 'liability']).optional(),
  balance: z.number().optional(),
})

const adjustmentCreateSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number(),
  description: z.string().max(200).optional(),
})

export const netWorthRouter = Router()

netWorthRouter.get('/accounts', async (req, res) => {
  const userId = getAuthUser(req).userId
  const accounts = await prisma.netWorthAccount.findMany({
    where: { userId },
    orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
  })
  res.json(accounts)
})

netWorthRouter.post('/accounts', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = accountCreateSchema.parse(req.body)
  const account = await prisma.netWorthAccount.create({
    data: {
      userId,
      name: data.name,
      kind: data.kind,
      balance: data.balance,
    },
  })
  res.status(201).json(account)
})

netWorthRouter.patch('/accounts/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = accountUpdateSchema.parse(req.body)
  const existing = await prisma.netWorthAccount.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const account = await prisma.netWorthAccount.update({
    where: { id },
    data,
  })
  res.json(account)
})

netWorthRouter.get('/adjustments', async (req, res) => {
  const userId = getAuthUser(req).userId
  const rows = await prisma.netWorthAdjustment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      account: {
        select: { id: true, name: true, kind: true },
      },
    },
    take: 100,
  })
  res.json(rows)
})

netWorthRouter.post('/adjustments', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = adjustmentCreateSchema.parse(req.body)
  const account = await prisma.netWorthAccount.findFirst({
    where: { id: data.accountId, userId },
  })
  if (!account) return res.status(404).json({ error: 'Konto nie istnieje' })

  const result = await prisma.$transaction(async (tx) => {
    const adjustment = await tx.netWorthAdjustment.create({
      data: {
        userId,
        accountId: data.accountId,
        amount: data.amount,
        description: data.description?.trim() || null,
      },
      include: {
        account: { select: { id: true, name: true, kind: true } },
      },
    })

    const updatedAccount = await tx.netWorthAccount.update({
      where: { id: data.accountId },
      data: { balance: account.balance + data.amount },
    })

    return { adjustment, account: updatedAccount }
  })

  res.status(201).json(result)
})
