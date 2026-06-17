import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const learningRouter = Router()

/* ---------------- Sessions ---------------- */
const sessionCreate = z.object({
  date: z.string(),
  minutes: z.number().int().nonnegative(),
  topic: z.string(),
  type: z.enum(['kurs', 'ksiazka', 'projekt', 'praktyka', 'powtorka', 'inne']),
  category: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  bookId: z.string().nullable().optional(),
})
const sessionUpdate = sessionCreate.partial()

learningRouter.get('/sessions', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.learningSession.findMany({ where: { userId }, orderBy: { date: 'desc' } }))
})
learningRouter.post('/sessions', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = sessionCreate.parse(req.body)
  res.status(201).json(await prisma.learningSession.create({ data: { userId, ...d } }))
})
learningRouter.patch('/sessions/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = sessionUpdate.parse(req.body)
  const existing = await prisma.learningSession.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(await prisma.learningSession.update({ where: { id: req.params.id }, data: d }))
})
learningRouter.delete('/sessions/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.learningSession.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Courses ---------------- */
const courseCreate = z.object({
  name: z.string(),
  platform: z.string().nullable().optional(),
  platformUrl: z.string().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(['w_trakcie', 'ukonczony', 'zaplanowany']).optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  nextLesson: z.string().nullable().optional(),
})
const courseUpdate = courseCreate.partial()

learningRouter.get('/courses', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.course.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/courses', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = courseCreate.parse(req.body)
  res.status(201).json(await prisma.course.create({ data: { userId, ...d } }))
})
learningRouter.patch('/courses/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = courseUpdate.parse(req.body)
  const existing = await prisma.course.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(await prisma.course.update({ where: { id: req.params.id }, data: d }))
})
learningRouter.delete('/courses/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.course.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Projects ---------------- */
const projectCreate = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  tech: z.string().nullable().optional(),
  status: z.enum(['pomysl', 'w_trakcie', 'mvp', 'ukonczony', 'porzucony']).optional(),
  url: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
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
  res.status(201).json(await prisma.project.create({ data: { userId, ...d } }))
})
learningRouter.patch('/projects/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = projectUpdate.parse(req.body)
  const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(await prisma.project.update({ where: { id: req.params.id }, data: d }))
})
learningRouter.delete('/projects/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.project.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Books ---------------- */
const bookCreate = z.object({
  title: z.string(),
  author: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(['chce_przeczytac', 'czytam', 'przeczytane']).optional(),
  finishedAt: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  rating: z.number().int().min(0).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  keyTakeaway: z.string().nullable().optional(),
})
const bookUpdate = bookCreate.partial()

learningRouter.get('/books', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.book.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/books', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = bookCreate.parse(req.body)
  res.status(201).json(await prisma.book.create({ data: { userId, ...d } }))
})
learningRouter.patch('/books/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = bookUpdate.parse(req.body)
  const existing = await prisma.book.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(await prisma.book.update({ where: { id: req.params.id }, data: d }))
})
learningRouter.delete('/books/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.book.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Certifications ---------------- */
const certCreate = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  verificationUrl: z.string().nullable().optional(),
  renewalReminderDays: z.number().int().nonnegative().nullable().optional(),
})
const certUpdate = certCreate.partial()

learningRouter.get('/certifications', async (req, res) => {
  const userId = getAuthUser(req).userId
  res.json(await prisma.certification.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }))
})
learningRouter.post('/certifications', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = certCreate.parse(req.body)
  res.status(201).json(await prisma.certification.create({ data: { userId, ...d } }))
})
learningRouter.patch('/certifications/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const d = certUpdate.parse(req.body)
  const existing = await prisma.certification.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  res.json(await prisma.certification.update({ where: { id: req.params.id }, data: d }))
})
learningRouter.delete('/certifications/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.certification.deleteMany({ where: { id: req.params.id, userId } })
  res.status(204).send()
})

/* ---------------- Settings ---------------- */
const settingsUpdate = z.object({
  weeklyGoalMinutes: z.number().int().min(30).optional(),
  sessionCategories: z.array(z.string()).optional(),
  bookCategories: z.array(z.string()).optional(),
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
