import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const achievementsRouter = Router()

achievementsRouter.get('/', async (req, res) => {
  const userId = (req as any).user.userId
  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
  })
  res.json(achievements)
})
