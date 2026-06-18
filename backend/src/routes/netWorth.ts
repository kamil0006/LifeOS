import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import {
  decryptNetWorthAccountRow,
  decryptNetWorthAccountRows,
  decryptNetWorthAdjustmentWithAccount,
  decryptNetWorthAdjustmentsWithAccount,
  encryptNetWorthAccountWrite,
  encryptNetWorthAdjustmentWrite,
} from '../lib/financeFields.js'

const nwAccountAccentKeySchema = z.enum(['cyan', 'green', 'magenta', 'amber', 'rose', 'violet'])

const accountCreateSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(['asset', 'liability']),
  balance: z.number().default(0),
  iconKey: z.string().max(48).optional().nullable(),
  accentKey: nwAccountAccentKeySchema.optional().nullable(),
})

const accountUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  kind: z.enum(['asset', 'liability']).optional(),
  balance: z.number().optional(),
  iconKey: z.string().max(48).optional().nullable(),
  accentKey: nwAccountAccentKeySchema.optional().nullable(),
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
  res.json(decryptNetWorthAccountRows(accounts))
})

netWorthRouter.post('/accounts', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = accountCreateSchema.parse(req.body)
  const enc = encryptNetWorthAccountWrite({ name: data.name })
  const account = await prisma.netWorthAccount.create({
    data: {
      userId,
      name: enc.name!,
      kind: data.kind,
      balance: data.balance,
      iconKey: data.iconKey?.trim() || null,
      accentKey: data.kind === 'asset' && data.accentKey ? data.accentKey : null,
    },
  })
  res.status(201).json(decryptNetWorthAccountRow(account))
})

netWorthRouter.patch('/accounts/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = accountUpdateSchema.parse(req.body)
  const existing = await prisma.netWorthAccount.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const enc = encryptNetWorthAccountWrite(data.name !== undefined ? { name: data.name } : {})
  const patch: {
    name?: string
    kind?: string
    balance?: number
    iconKey?: string | null
    accentKey?: string | null
  } = {}
  if (enc.name !== undefined) patch.name = enc.name
  if (data.kind !== undefined) patch.kind = data.kind
  if (data.balance !== undefined) patch.balance = data.balance
  if (data.iconKey !== undefined) patch.iconKey = data.iconKey?.trim() || null
  const nextKind = (patch.kind ?? existing.kind) as string
  if (nextKind === 'liability') {
    patch.accentKey = null
  } else if (data.accentKey !== undefined) {
    patch.accentKey = data.accentKey
  }
  const account = await prisma.netWorthAccount.update({
    where: { id },
    data: patch,
  })
  res.json(decryptNetWorthAccountRow(account))
})

netWorthRouter.delete('/accounts/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const existing = await prisma.netWorthAccount.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  await prisma.netWorthAccount.delete({ where: { id } })
  res.status(204).end()
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
  res.json(decryptNetWorthAdjustmentsWithAccount(rows))
})

netWorthRouter.post('/adjustments', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = adjustmentCreateSchema.parse(req.body)
  const account = await prisma.netWorthAccount.findFirst({
    where: { id: data.accountId, userId },
  })
  if (!account) return res.status(404).json({ error: 'Konto nie istnieje' })

  const enc = encryptNetWorthAdjustmentWrite({
    description: data.description?.trim() || null,
  })

  const result = await prisma.$transaction(async (tx) => {
    const adjustment = await tx.netWorthAdjustment.create({
      data: {
        userId,
        accountId: data.accountId,
        amount: data.amount,
        description: enc.description ?? null,
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

  res.status(201).json({
    adjustment: decryptNetWorthAdjustmentWithAccount(result.adjustment),
    account: decryptNetWorthAccountRow(result.account),
  })
})

const adjustmentPatchSchema = z
  .object({
    description: z.string().max(200).optional(),
    amount: z.number().optional(),
  })
  .refine((d) => d.description !== undefined || d.amount !== undefined, {
    message: 'Podaj opis i/lub kwotę',
  })

netWorthRouter.patch('/adjustments/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = adjustmentPatchSchema.parse(req.body)
  const existing = await prisma.netWorthAdjustment.findFirst({
    where: { id, userId },
    include: { account: true },
  })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })

  const enc = encryptNetWorthAdjustmentWrite(
    data.description !== undefined ? { description: data.description.trim() || null } : {}
  )

  const row = await prisma.$transaction(async (tx) => {
    if (data.amount !== undefined) {
      const delta = data.amount - existing.amount
      await tx.netWorthAccount.update({
        where: { id: existing.accountId },
        data: { balance: existing.account.balance + delta },
      })
    }
    const patch: { amount?: number; description?: string | null } = {}
    if (data.amount !== undefined) patch.amount = data.amount
    if (enc.description !== undefined) patch.description = enc.description
    return tx.netWorthAdjustment.update({
      where: { id },
      data: patch,
      include: {
        account: { select: { id: true, name: true, kind: true } },
      },
    })
  })

  res.json(decryptNetWorthAdjustmentWithAccount(row))
})

netWorthRouter.delete('/adjustments/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const existing = await prisma.netWorthAdjustment.findFirst({
    where: { id, userId },
    include: { account: true },
  })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })

  await prisma.$transaction(async (tx) => {
    await tx.netWorthAccount.update({
      where: { id: existing.accountId },
      data: { balance: existing.account.balance - existing.amount },
    })
    await tx.netWorthAdjustment.delete({ where: { id } })
  })

  res.status(204).end()
})
