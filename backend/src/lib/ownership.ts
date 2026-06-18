import { prisma } from './prisma.js'
import { HttpError } from './httpError.js'

async function assertOwned(
  userId: string,
  id: string | null | undefined,
  lookup: (entityId: string) => Promise<{ id: string } | null>,
  message: string
): Promise<void> {
  if (id == null || id.trim() === '') return
  const row = await lookup(id.trim())
  if (!row) throw new HttpError(400, message)
}

export async function assertNoteOwned(userId: string, noteId: string | null | undefined): Promise<void> {
  await assertOwned(userId, noteId, (id) => prisma.note.findFirst({ where: { id, userId }, select: { id: true } }), 'Nieprawidłowy link do notatki')
}

export async function assertEventOwned(userId: string, eventId: string | null | undefined): Promise<void> {
  await assertOwned(userId, eventId, (id) => prisma.event.findFirst({ where: { id, userId }, select: { id: true } }), 'Nieprawidłowy link do wydarzenia')
}

export async function assertTodoOwned(userId: string, todoId: string | null | undefined): Promise<void> {
  await assertOwned(userId, todoId, (id) => prisma.todo.findFirst({ where: { id, userId }, select: { id: true } }), 'Nieprawidłowy link do zadania')
}

export async function assertCourseOwned(userId: string, courseId: string | null | undefined): Promise<void> {
  await assertOwned(userId, courseId, (id) => prisma.course.findFirst({ where: { id, userId }, select: { id: true } }), 'Nieprawidłowy kurs')
}

export async function assertProjectOwned(userId: string, projectId: string | null | undefined): Promise<void> {
  await assertOwned(userId, projectId, (id) => prisma.project.findFirst({ where: { id, userId }, select: { id: true } }), 'Nieprawidłowy projekt')
}

export async function assertBookOwned(userId: string, bookId: string | null | undefined): Promise<void> {
  await assertOwned(userId, bookId, (id) => prisma.book.findFirst({ where: { id, userId }, select: { id: true } }), 'Nieprawidłowa książka')
}

/** Walidacja powiązań todo ↔ event ↔ note w jednym wywołaniu. */
export async function assertTodoLinksOwned(
  userId: string,
  links: { noteId?: string | null; linkedEventId?: string | null }
): Promise<void> {
  await assertNoteOwned(userId, links.noteId)
  await assertEventOwned(userId, links.linkedEventId)
}

export async function assertLearningSessionLinksOwned(
  userId: string,
  links: { courseId?: string | null; projectId?: string | null; bookId?: string | null }
): Promise<void> {
  await assertCourseOwned(userId, links.courseId)
  await assertProjectOwned(userId, links.projectId)
  await assertBookOwned(userId, links.bookId)
}
