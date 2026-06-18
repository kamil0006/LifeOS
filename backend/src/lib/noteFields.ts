import type { Note } from '@prisma/client'
import { decryptField, decryptFieldNullable, encryptField, encryptFieldNullable } from './encryption.js'

export function encryptNoteWrite(data: {
  content?: string
  title?: string | null
  referenceSource?: string | null
}) {
  return {
    ...(data.content !== undefined && { content: encryptField(data.content) }),
    ...(data.title !== undefined && { title: encryptFieldNullable(data.title?.trim() ? data.title.trim() : null) }),
    ...(data.referenceSource !== undefined && {
      referenceSource: encryptFieldNullable(
        data.referenceSource?.trim() ? data.referenceSource.trim() : null
      ),
    }),
  }
}

export function decryptNoteRow<T extends Pick<Note, 'content' | 'title' | 'referenceSource'>>(note: T): T {
  return {
    ...note,
    content: decryptField(note.content),
    title: decryptFieldNullable(note.title),
    referenceSource: decryptFieldNullable(note.referenceSource),
  }
}
