import { prisma } from './prisma.js'

export async function unlockAchievement(userId: string, achievementId: string) {
  try {
    await prisma.achievement.upsert({
      where: {
        userId_achievementId: { userId, achievementId },
      },
      create: { userId, achievementId },
      update: {},
    })
  } catch {
    // ignore
  }
}

export async function checkSavingsAchievement(userId: string) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [incomeSum, expenseSum] = await Promise.all([
    prisma.income.aggregate({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ])

  const balance = (incomeSum._sum.amount ?? 0) - (expenseSum._sum.amount ?? 0)
  if (balance >= 1000) await unlockAchievement(userId, 'savings_1000')
}
