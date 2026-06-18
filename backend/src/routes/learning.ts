import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { assertLearningSessionLinksOwned } from '../lib/ownership.js'
import { sanitizeHttpUrl } from '../lib/safeUrl.js'

export const learningRouter = Router()

const cuidLike = z.string().min(1).max(64)

/* ---------------- Sessions ---------------- */
const sessionCreate = z.object({
  date: z.string().max(32),
  minutes: z.number().int().min(0).max(24 * 60),
  topic: z.string().min(1).max(300),
  type: z.enum(['kurs', 'ksiazka', 'projekt', 'praktyka', 'powtorka', 'inne']),
  category: z.string().max(100).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  courseId: cuidLike.nullable().optional(),
  projectId: cuidLike.nullable().optional(),
  bookId: cuidLike.nullable().optional(),
})
const sessionUpdate = sessionCreate.partial()

learningRouter.get('/sessions', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.learningSession.findMany({ where: { userId }, orderBy: { date: 'desc' } }))
})
learningRouter.post('/sessions', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = sessionCreate.parse(req.body)
  await assertLearningSessionLinksOwned(userId, d)
  res.status(201).json(
    await prisma.learningSession.create({
      data: {
        userId,
        date: d.date,
        minutes: d.minutes,
        topic: d.topic.trim(),
        type: d.type,
        category: d.category?.trim() || null,
        note: d.note?.trim() || null,
        courseId: d.courseId?.trim() || null,
        projectId: d.projectId?.trim() || null,
        bookId: d.bookId?.trim() || null,
      },
    })
  )
})
learningRouter.patch('/sessions/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = sessionUpdate.parse(req.body)
  const existing = await prisma.learningSession.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  await assertLearningSessionLinksOwned(userId, d)
  res.json(
    await prisma.learningSession.update({
      where: { id: req.params.id },
      data: {
        ...(d.date !== undefined && { date: d.date }),
        ...(d.minutes !== undefined && { minutes: d.minutes }),
        ...(d.topic !== undefined && { topic: d.topic.trim() }),
        ...(d.type !== undefined && { type: d.type }),
        ...(d.category !== undefined && { category: d.category?.trim() || null }),
        ...(d.note !== undefined && { note: d.note?.trim() || null }),
        ...(d.courseId !== undefined && { courseId: d.courseId?.trim() || null }),
        ...(d.projectId !== undefined && { projectId: d.projectId?.trim() || null }),
        ...(d.bookId !== undefined && { bookId: d.bookId?.trim() || null }),
      },
    })
  )
})
learningRouter.delete('/sessions/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.learningSession.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Courses ---------------- */
const courseCreate = z.object({
  name: z.string().min(1).max(300),
  platform: z.string().max(200).nullable().optional(),
  platformUrl: z.string().max(2000).nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(['w_trakcie', 'ukonczony', 'zaplanowany']).optional(),
  startedAt: z.string().max(32).nullable().optional(),
  completedAt: z.string().max(32).nullable().optional(),
  nextLesson: z.string().max(500).nullable().optional(),
})
const courseUpdate = courseCreate.partial()

learningRouter.get('/courses', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.course.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/courses', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = courseCreate.parse(req.body)
  res.status(201).json(
    await prisma.course.create({
      data: {
        userId,
        name: d.name.trim(),
        platform: d.platform?.trim() || null,
        platformUrl: sanitizeHttpUrl(d.platformUrl),
        progress: d.progress ?? 0,
        status: d.status ?? 'w_trakcie',
        startedAt: d.startedAt || null,
        completedAt: d.completedAt || null,
        nextLesson: d.nextLesson?.trim() || null,
      },
    })
  )
})
learningRouter.patch('/courses/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = courseUpdate.parse(req.body)
  const existing = await prisma.course.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(
    await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...(d.name !== undefined && { name: d.name.trim() }),
        ...(d.platform !== undefined && { platform: d.platform?.trim() || null }),
        ...(d.platformUrl !== undefined && { platformUrl: sanitizeHttpUrl(d.platformUrl) }),
        ...(d.progress !== undefined && { progress: d.progress }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.startedAt !== undefined && { startedAt: d.startedAt }),
        ...(d.completedAt !== undefined && { completedAt: d.completedAt }),
        ...(d.nextLesson !== undefined && { nextLesson: d.nextLesson?.trim() || null }),
      },
    })
  )
})
learningRouter.delete('/courses/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.course.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Projects ---------------- */
const projectCreate = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(5000).nullable().optional(),
  tech: z.string().max(500).nullable().optional(),
  status: z.enum(['pomysl', 'w_trakcie', 'mvp', 'ukonczony', 'porzucony']).optional(),
  url: z.string().max(2000).nullable().optional(),
  githubUrl: z.string().max(2000).nullable().optional(),
  nextStep: z.string().max(500).nullable().optional(),
  priority: z.enum(['niski', 'sredni', 'wysoki']).nullable().optional(),
})
const projectUpdate = projectCreate.partial()

learningRouter.get('/projects', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/projects', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = projectCreate.parse(req.body)
  res.status(201).json(
    await prisma.project.create({
      data: {
        userId,
        name: d.name.trim(),
        description: d.description?.trim() || null,
        tech: d.tech?.trim() || null,
        status: d.status ?? 'pomysl',
        url: sanitizeHttpUrl(d.url),
        githubUrl: sanitizeHttpUrl(d.githubUrl),
        nextStep: d.nextStep?.trim() || null,
        priority: d.priority ?? null,
      },
    })
  )
})
learningRouter.patch('/projects/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = projectUpdate.parse(req.body)
  const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(
    await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(d.name !== undefined && { name: d.name.trim() }),
        ...(d.description !== undefined && { description: d.description?.trim() || null }),
        ...(d.tech !== undefined && { tech: d.tech?.trim() || null }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.url !== undefined && { url: sanitizeHttpUrl(d.url) }),
        ...(d.githubUrl !== undefined && { githubUrl: sanitizeHttpUrl(d.githubUrl) }),
        ...(d.nextStep !== undefined && { nextStep: d.nextStep?.trim() || null }),
        ...(d.priority !== undefined && { priority: d.priority }),
      },
    })
  )
})
learningRouter.delete('/projects/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.project.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Books ---------------- */
const bookCreate = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(200).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  status: z.enum(['chce_przeczytac', 'czytam', 'przeczytane']).optional(),
  finishedAt: z.string().max(32).nullable().optional(),
  startedAt: z.string().max(32).nullable().optional(),
  rating: z.number().int().min(0).max(5).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  keyTakeaway: z.string().max(2000).nullable().optional(),
})
const bookUpdate = bookCreate.partial()

learningRouter.get('/books', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.book.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/books', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = bookCreate.parse(req.body)
  res.status(201).json(
    await prisma.book.create({
      data: {
        userId,
        title: d.title.trim(),
        author: d.author?.trim() || null,
        category: d.category?.trim() || null,
        status: d.status ?? 'chce_przeczytac',
        finishedAt: d.finishedAt || null,
        startedAt: d.startedAt || null,
        rating: d.rating ?? null,
        notes: d.notes?.trim() || null,
        keyTakeaway: d.keyTakeaway?.trim() || null,
      },
    })
  )
})
learningRouter.patch('/books/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = bookUpdate.parse(req.body)
  const existing = await prisma.book.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(
    await prisma.book.update({
      where: { id: req.params.id },
      data: {
        ...(d.title !== undefined && { title: d.title.trim() }),
        ...(d.author !== undefined && { author: d.author?.trim() || null }),
        ...(d.category !== undefined && { category: d.category?.trim() || null }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.finishedAt !== undefined && { finishedAt: d.finishedAt }),
        ...(d.startedAt !== undefined && { startedAt: d.startedAt }),
        ...(d.rating !== undefined && { rating: d.rating }),
        ...(d.notes !== undefined && { notes: d.notes?.trim() || null }),
        ...(d.keyTakeaway !== undefined && { keyTakeaway: d.keyTakeaway?.trim() || null }),
      },
    })
  )
})
learningRouter.delete('/books/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.book.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Certifications ---------------- */
const certCreate = z.object({
  name: z.string().min(1).max(300),
  issuer: z.string().min(1).max(200),
  date: z.string().max(32),
  url: z.string().max(2000).nullable().optional(),
  expiryDate: z.string().max(32).nullable().optional(),
  verificationUrl: z.string().max(2000).nullable().optional(),
  renewalReminderDays: z.number().int().min(0).max(365).nullable().optional(),
})
const certUpdate = certCreate.partial()

learningRouter.get('/certifications', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.certification.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/certifications', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = certCreate.parse(req.body)
  res.status(201).json(
    await prisma.certification.create({
      data: {
        userId,
        name: d.name.trim(),
        issuer: d.issuer.trim(),
        date: d.date,
        url: sanitizeHttpUrl(d.url),
        expiryDate: d.expiryDate || null,
        verificationUrl: sanitizeHttpUrl(d.verificationUrl),
        renewalReminderDays: d.renewalReminderDays ?? null,
      },
    })
  )
})
learningRouter.patch('/certifications/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = certUpdate.parse(req.body)
  const existing = await prisma.certification.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(
    await prisma.certification.update({
      where: { id: req.params.id },
      data: {
        ...(d.name !== undefined && { name: d.name.trim() }),
        ...(d.issuer !== undefined && { issuer: d.issuer.trim() }),
        ...(d.date !== undefined && { date: d.date }),
        ...(d.url !== undefined && { url: sanitizeHttpUrl(d.url) }),
        ...(d.expiryDate !== undefined && { expiryDate: d.expiryDate }),
        ...(d.verificationUrl !== undefined && { verificationUrl: sanitizeHttpUrl(d.verificationUrl) }),
        ...(d.renewalReminderDays !== undefined && { renewalReminderDays: d.renewalReminderDays }),
      },
    })
  )
})
learningRouter.delete('/certifications/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.certification.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Settings ---------------- */
const settingsUpdate = z.object({
  weeklyGoalMinutes: z.number().int().min(30).max(60 * 24 * 7).optional(),
  sessionCategories: z.array(z.string().max(100)).max(50).optional(),
  bookCategories: z.array(z.string().max(100)).max(50).optional(),
})

learningRouter.get('/settings', async (req, res) => {
  const userId = getAuthUser(req).userId
  const settings = await prisma.learningSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })
  res.json(settings)
})
learningRouter.put('/settings', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = settingsUpdate.parse(req.body)
  const settings = await prisma.learningSettings.upsert({
    where: { userId },
    create: { userId, ...d },
    update: d,
  })
  res.json(settings)
})
