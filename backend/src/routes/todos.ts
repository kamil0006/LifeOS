import type { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const priorityEnum = z.enum(['low', 'medium', 'high'])
const categoryEnum = z.enum(['dom', 'praca', 'finanse', 'nauka', 'zdrowie', 'inne'])

function parseDueDateInput(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00.000Z`) : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

const createSchema = z.object({
  text: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  priority: priorityEnum.optional(),
  category: categoryEnum.optional(),
  noteId: z.string().optional().nullable(),
})

const updateSchema = z
  .object({
    done: z.boolean().optional(),
    text: z.string().min(1).optional(),
    dueDate: z.string().nullable().optional(),
    dueTime: z.string().nullable().optional(),
    priority: priorityEnum.optional(),
    category: categoryEnum.optional(),
    archivedAt: z.string().datetime().nullable().optional(),
    noteId: z.string().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'Brak pól do aktualizacji' })

export const todosRouter = Router()

todosRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })
  res.json(todos)
})

todosRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const dueDate = parseDueDateInput(data.dueDate ?? undefined)
  const todo = await prisma.todo.create({
    data: {
      userId,
      text: data.text.trim(),
      dueDate: dueDate === undefined ? undefined : dueDate,
      dueTime: data.dueTime?.trim() || null,
      priority: data.priority ?? 'medium',
      category: data.category ?? 'inne',
      noteId: data.noteId?.trim() || null,
    },
  })
  res.status(201).json(todo)
})

todosRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.todo.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })

  const patch: Record<string, unknown> = {}
  if (data.done !== undefined) patch.done = data.done
  if (data.text !== undefined) patch.text = data.text.trim()
  if (data.dueDate !== undefined) {
    const parsed = parseDueDateInput(data.dueDate === null ? null : data.dueDate)
    patch.dueDate = parsed === undefined ? undefined : parsed
  }
  if (data.dueTime !== undefined) patch.dueTime = data.dueTime?.trim() || null
  if (data.priority !== undefined) patch.priority = data.priority
  if (data.category !== undefined) patch.category = data.category
  if (data.archivedAt !== undefined)
    patch.archivedAt = data.archivedAt === null ? null : new Date(data.archivedAt)
  if (data.noteId !== undefined) patch.noteId = data.noteId?.trim() || null

  const updated = await prisma.todo.update({
    where: { id },
    data: patch as Prisma.TodoUpdateInput,
  })
  res.json(updated)
})

/** Usuwa wszystkie ukończone zadania użytkownika (nie archiwizuje). */
todosRouter.delete('/bulk/completed', async (req, res) => {
  const userId = getAuthUser(req).userId
  await prisma.todo.deleteMany({ where: { userId, done: true } })
  res.status(204).send()
})

todosRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.todo.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
