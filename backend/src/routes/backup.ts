import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { decryptField, decryptFieldNullable, encryptField, encryptFieldNullable } from '../lib/encryption.js'
import { backupFileSchema } from '../lib/backupSchemas.js'

export const backupRouter = Router()

const BACKUP_VERSION = 1 as const

backupRouter.get('/status', async (req, res) => {
  const userId = getAuthUser(req).userId
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lastBackupAt: true } })
  if (!user) return res.status(401).json({ error: 'NO_USER' })
  res.json({ lastBackupAt: user.lastBackupAt })
})

backupRouter.get('/export', async (req, res) => {
  const userId = getAuthUser(req).userId

  const [
    expenseCategories,
    expenses,
    scheduledExpenses,
    income,
    netWorthAccounts,
    netWorthAdjustments,
    todos,
    events,
    habits,
    habitCheckIns,
    goals,
    notes,
    learningSessions,
    courses,
    projects,
    books,
    certifications,
    learningSettings,
  ] = await Promise.all([
    prisma.expenseCategory.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.scheduledExpense.findMany({ where: { userId } }),
    prisma.income.findMany({ where: { userId } }),
    prisma.netWorthAccount.findMany({ where: { userId } }),
    prisma.netWorthAdjustment.findMany({ where: { userId } }),
    prisma.todo.findMany({ where: { userId } }),
    prisma.event.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.habitCheckIn.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId } }),
    prisma.learningSession.findMany({ where: { userId } }),
    prisma.course.findMany({ where: { userId } }),
    prisma.project.findMany({ where: { userId } }),
    prisma.book.findMany({ where: { userId } }),
    prisma.certification.findMany({ where: { userId } }),
    prisma.learningSettings.findUnique({ where: { userId } }),
  ])

  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      expenseCategories,
      expenses: expenses.map((e) => ({ ...e, name: decryptField(e.name) })),
      scheduledExpenses: scheduledExpenses.map((e) => ({ ...e, name: decryptField(e.name) })),
      income: income.map((i) => ({ ...i, source: decryptField(i.source) })),
      netWorthAccounts: netWorthAccounts.map((a) => ({ ...a, name: decryptField(a.name) })),
      netWorthAdjustments: netWorthAdjustments.map((a) => ({
        ...a,
        description: decryptFieldNullable(a.description),
      })),
      todos,
      events,
      habits,
      habitCheckIns,
      goals,
      notes: notes.map((n) => ({
        ...n,
        content: decryptField(n.content),
        title: decryptFieldNullable(n.title),
        referenceSource: decryptFieldNullable(n.referenceSource),
      })),
      learningSessions,
      courses,
      projects,
      books,
      certifications,
      learningSettings: learningSettings
        ? {
            weeklyGoalMinutes: learningSettings.weeklyGoalMinutes,
            sessionCategories: learningSettings.sessionCategories,
            bookCategories: learningSettings.bookCategories,
          }
        : null,
    },
  }

  await prisma.user.update({ where: { id: userId }, data: { lastBackupAt: new Date() } })

  res.json(payload)
})

backupRouter.post('/import', async (req, res) => {
  const userId = getAuthUser(req).userId

  const parsed = backupFileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'INVALID_BACKUP_FILE', details: parsed.error.issues.slice(0, 20) })
  }
  const { data } = parsed.data

  const accountIds = new Set(data.netWorthAccounts.map((a) => a.id))
  const invalidAdjustment = data.netWorthAdjustments.find((a) => !accountIds.has(a.accountId))
  if (invalidAdjustment) {
    return res.status(400).json({ error: 'INVALID_ACCOUNT_REFERENCE' })
  }
  const habitIds = new Set(data.habits.map((h) => h.id))
  const invalidCheckIn = data.habitCheckIns.find((c) => !habitIds.has(c.habitId))
  if (invalidCheckIn) {
    return res.status(400).json({ error: 'INVALID_HABIT_REFERENCE' })
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.netWorthAdjustment.deleteMany({ where: { userId } })
        await tx.netWorthAccount.deleteMany({ where: { userId } })
        await tx.habitCheckIn.deleteMany({ where: { userId } })
        await tx.habit.deleteMany({ where: { userId } })
        await tx.expense.deleteMany({ where: { userId } })
        await tx.scheduledExpense.deleteMany({ where: { userId } })
        await tx.expenseCategory.deleteMany({ where: { userId } })
        await tx.income.deleteMany({ where: { userId } })
        await tx.todo.deleteMany({ where: { userId } })
        await tx.event.deleteMany({ where: { userId } })
        await tx.goal.deleteMany({ where: { userId } })
        await tx.note.deleteMany({ where: { userId } })
        await tx.learningSession.deleteMany({ where: { userId } })
        await tx.course.deleteMany({ where: { userId } })
        await tx.project.deleteMany({ where: { userId } })
        await tx.book.deleteMany({ where: { userId } })
        await tx.certification.deleteMany({ where: { userId } })
        await tx.learningSettings.deleteMany({ where: { userId } })

        if (data.expenseCategories.length) {
          await tx.expenseCategory.createMany({
            data: data.expenseCategories.map((c) => ({ ...c, userId })) as Prisma.ExpenseCategoryCreateManyInput[],
          })
        }
        if (data.expenses.length) {
          await tx.expense.createMany({
            data: data.expenses.map((e) => ({ ...e, userId, name: encryptField(e.name) })) as Prisma.ExpenseCreateManyInput[],
          })
        }
        if (data.scheduledExpenses.length) {
          await tx.scheduledExpense.createMany({
            data: data.scheduledExpenses.map((e) => ({ ...e, userId, name: encryptField(e.name) })) as Prisma.ScheduledExpenseCreateManyInput[],
          })
        }
        if (data.income.length) {
          await tx.income.createMany({
            data: data.income.map((i) => ({ ...i, userId, source: encryptField(i.source) })) as Prisma.IncomeCreateManyInput[],
          })
        }
        if (data.netWorthAccounts.length) {
          await tx.netWorthAccount.createMany({
            data: data.netWorthAccounts.map((a) => ({ ...a, userId, name: encryptField(a.name) })) as Prisma.NetWorthAccountCreateManyInput[],
          })
        }
        if (data.netWorthAdjustments.length) {
          await tx.netWorthAdjustment.createMany({
            data: data.netWorthAdjustments.map((a) => ({
              ...a,
              userId,
              description: encryptFieldNullable(a.description ?? null),
            })) as Prisma.NetWorthAdjustmentCreateManyInput[],
          })
        }
        if (data.todos.length) {
          await tx.todo.createMany({
            data: data.todos.map((t) => ({ ...t, userId })) as Prisma.TodoCreateManyInput[],
          })
        }
        if (data.events.length) {
          await tx.event.createMany({
            data: data.events.map((e) => ({ ...e, userId })) as Prisma.EventCreateManyInput[],
          })
        }
        if (data.habits.length) {
          await tx.habit.createMany({
            data: data.habits.map((h) => ({ ...h, userId })) as Prisma.HabitCreateManyInput[],
          })
        }
        if (data.habitCheckIns.length) {
          await tx.habitCheckIn.createMany({
            data: data.habitCheckIns.map((c) => ({ ...c, userId })) as Prisma.HabitCheckInCreateManyInput[],
          })
        }
        if (data.goals.length) {
          await tx.goal.createMany({
            data: data.goals.map((g) => ({ ...g, userId })) as Prisma.GoalCreateManyInput[],
          })
        }
        if (data.notes.length) {
          await tx.note.createMany({
            data: data.notes.map((n) => ({
              ...n,
              userId,
              content: encryptField(n.content),
              title: encryptFieldNullable(n.title ?? null),
              referenceSource: encryptFieldNullable(n.referenceSource ?? null),
            })) as Prisma.NoteCreateManyInput[],
          })
        }
        if (data.learningSessions.length) {
          await tx.learningSession.createMany({
            data: data.learningSessions.map((s) => ({ ...s, userId })) as Prisma.LearningSessionCreateManyInput[],
          })
        }
        if (data.courses.length) {
          await tx.course.createMany({
            data: data.courses.map((c) => ({ ...c, userId })) as Prisma.CourseCreateManyInput[],
          })
        }
        if (data.projects.length) {
          await tx.project.createMany({
            data: data.projects.map((p) => ({ ...p, userId })) as Prisma.ProjectCreateManyInput[],
          })
        }
        if (data.books.length) {
          await tx.book.createMany({
            data: data.books.map((b) => ({ ...b, userId })) as Prisma.BookCreateManyInput[],
          })
        }
        if (data.certifications.length) {
          await tx.certification.createMany({
            data: data.certifications.map((c) => ({ ...c, userId })) as Prisma.CertificationCreateManyInput[],
          })
        }
        if (data.learningSettings) {
          await tx.learningSettings.create({ data: { userId, ...data.learningSettings } })
        }
      },
      { timeout: 30_000 }
    )
  } catch (e) {
    console.error('Backup import error:', e)
    return res.status(500).json({ error: 'IMPORT_FAILED' })
  }

  res.json({ ok: true })
})
