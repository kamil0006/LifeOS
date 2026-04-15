import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { unlockAchievement } from '../lib/achievements.js'

const createSchema = z.object({
  text: z.string().min(1),
})

const updateSchema = z.object({
  done: z.boolean(),
})

export const todosRouter = Router()

todosRouter.get('/', async (req, res) => {
  const userId = req.user!.userId
  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(todos)
})

todosRouter.post('/', async (req, res) => {
  const userId = req.user!.userId
  const data = createSchema.parse(req.body)
  const todo = await prisma.todo.create({
    data: { userId, text: data.text },
  })
  const count = await prisma.todo.count({ where: { userId } })
  if (count === 1) await unlockAchievement(userId, 'first_todo')
  res.status(201).json(todo)
})

todosRouter.patch('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.todo.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const updated = await prisma.todo.update({
    where: { id },
    data: { done: data.done },
  })
  res.json(updated)
})

todosRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.userId
  const { id } = req.params
  await prisma.todo.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
