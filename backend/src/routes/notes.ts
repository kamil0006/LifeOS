import { Router } from 'express'
import { z } from 'zod'
import { getAuthUser } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { decryptNoteRow, encryptNoteWrite } from '../lib/noteFields.js'
import { sanitizeHttpUrl } from '../lib/safeUrl.js'

const noteTypes = ['inbox', 'idea', 'reference'] as const
const ideaStatuses = ['nowy', 'do_sprawdzenia', 'w_realizacji', 'zrobiony', 'odrzucony'] as const
const referenceKinds = ['link', 'ksiazka', 'artykul', 'wideo', 'cytat', 'inne'] as const

const NOTE_CONTENT_MAX = 50_000
const NOTE_TITLE_MAX = 500

const createSchema = z.object({
  type: z.enum(noteTypes).default('inbox'),
  content: z.string().max(NOTE_CONTENT_MAX).default(''),
  tags: z.array(z.string().max(64)).max(32).default([]),
  title: z.string().max(NOTE_TITLE_MAX).nullable().optional(),
  pinned: z.boolean().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
  ideaStatus: z.enum(ideaStatuses).optional(),
  referenceKind: z.enum(referenceKinds).optional(),
  referenceUrl: z.string().max(2048).nullable().optional(),
  referenceSource: z.string().max(NOTE_TITLE_MAX).nullable().optional(),
})

const updateSchema = createSchema.partial()

export const notesRouter = Router()

notesRouter.get('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(notes.map(decryptNoteRow))
})

notesRouter.post('/', async (req, res) => {
  const userId = getAuthUser(req).userId
  const data = createSchema.parse(req.body)
  const enc = encryptNoteWrite({
    content: data.content,
    title: data.title?.trim() ? data.title.trim() : null,
    referenceSource:
      data.type === 'reference' && data.referenceSource?.trim() ? data.referenceSource.trim() : null,
  })
  const note = await prisma.note.create({
    data: {
      userId,
      type: data.type,
      content: enc.content ?? data.content,
      tags: data.tags,
      title: enc.title !== undefined ? enc.title : data.title?.trim() ? data.title.trim() : null,
      pinned: data.pinned ?? false,
      archivedAt: data.archivedAt ? new Date(data.archivedAt) : null,
      ideaStatus: data.type === 'idea' ? (data.ideaStatus ?? 'nowy') : 'nowy',
      referenceKind: data.type === 'reference' ? (data.referenceKind ?? 'link') : 'link',
      referenceUrl:
        data.type === 'reference' ? sanitizeHttpUrl(data.referenceUrl?.trim() ?? null) : null,
      referenceSource: enc.referenceSource !== undefined ? enc.referenceSource : null,
    },
  })
  res.status(201).json(decryptNoteRow(note))
})

notesRouter.patch('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  const data = updateSchema.parse(req.body)
  const existing = await prisma.note.findFirst({ where: { id, userId } })
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono' })
  const enc = encryptNoteWrite({
    ...(data.content != null && { content: data.content }),
    ...(data.title !== undefined && { title: data.title?.trim() ? data.title.trim() : null }),
    ...(data.referenceSource !== undefined && {
      referenceSource: data.referenceSource?.trim() ? data.referenceSource.trim() : null,
    }),
  })
  const updated = await prisma.note.update({
    where: { id },
    data: {
      ...(data.type != null && { type: data.type }),
      ...(enc.content !== undefined && { content: enc.content }),
      ...(data.tags != null && { tags: data.tags }),
      ...(enc.title !== undefined && { title: enc.title }),
      ...(data.pinned !== undefined && { pinned: data.pinned }),
      ...(data.archivedAt !== undefined && {
        archivedAt: data.archivedAt ? new Date(data.archivedAt) : null,
      }),
      ...(data.ideaStatus !== undefined && { ideaStatus: data.ideaStatus }),
      ...(data.referenceKind !== undefined && { referenceKind: data.referenceKind }),
      ...(data.referenceUrl !== undefined && {
        referenceUrl: sanitizeHttpUrl(data.referenceUrl?.trim() ?? null),
      }),
      ...(enc.referenceSource !== undefined && { referenceSource: enc.referenceSource }),
    },
  })
  res.json(decryptNoteRow(updated))
})

notesRouter.delete('/:id', async (req, res) => {
  const userId = getAuthUser(req).userId
  const { id } = req.params
  await prisma.note.deleteMany({ where: { id, userId } })
  res.status(204).send()
})
