import { Router } from 'express'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const achievementsRouter = Router()

achievementsRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
  })
  res.json(achievements)
})
