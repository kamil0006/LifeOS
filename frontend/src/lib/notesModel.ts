export type NoteType = 'inbox' | 'idea' | 'reference'

export type IdeaStatus =
  | 'nowy'
  | 'do_sprawdzenia'
  | 'w_realizacji'
  | 'odrzucony'
  | 'zrobiony'

/** Kolejność workflow w UI (filtry, select – „Zrobiony” przed „Odrzucony”). */
export const IDEA_STATUS_WORKFLOW_ORDER: IdeaStatus[] = [
  'nowy',
  'do_sprawdzenia',
  'w_realizacji',
  'zrobiony',
  'odrzucony',
]

export type ReferenceKind = 'link' | 'ksiazka' | 'artykul' | 'wideo' | 'cytat' | 'inne'

export interface Note {
  id: string
  type: NoteType
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  title: string | null
  pinned: boolean
  archivedAt: string | null
  ideaStatus: IdeaStatus
  referenceKind: ReferenceKind
  referenceUrl: string | null
  /** Źródło cytatu / opis linku poza polem URL */
  referenceSource: string | null
}

const IDEA_STATUSES: IdeaStatus[] = [...IDEA_STATUS_WORKFLOW_ORDER]

const REF_KINDS: ReferenceKind[] = ['link', 'ksiazka', 'artykul', 'wideo', 'cytat', 'inne']

/** Jedna linia do wyświetlania tytułu – bez składni Markdown (linki → tekst anchor). */
export function stripMarkdownForDisplayTitle(line: string): string {
  let s = line.replace(/\r\n/g, '\n').trim()
  s = s.replace(/^#{1,6}\s+/, '')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export function notePlainExcerpt(content: string, maxLen = 120): string {
  let s = content.replace(/\r\n/g, '\n').trim()
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/\n+/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

export function getNoteDisplayTitle(note: Note): string {
  const t = note.title?.trim()
  if (t) return stripMarkdownForDisplayTitle(t)
  const first = note.content.replace(/\r\n/g, '\n').split('\n').find((l) => l.trim().length > 0)
  if (!first) return 'Bez tytułu'
  const stripped = stripMarkdownForDisplayTitle(first)
  return stripped || 'Bez tytułu'
}

export function normalizeNoteFromStorage(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : null
  const content = typeof o.content === 'string' ? o.content : ''
  if (!id) return null

  let type: NoteType =
    o.type === 'idea' || o.type === 'reference' || o.type === 'inbox' ? o.type : 'inbox'
  if (o.type === 'quick') type = 'inbox'

  const tags = Array.isArray(o.tags)
    ? (o.tags.filter((t) => typeof t === 'string') as string[])
    : []

  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : createdAt

  const title =
    typeof o.title === 'string' && o.title.trim() ? o.title.trim() : null

  const pinned = Boolean(o.pinned)

  const archivedAt =
    typeof o.archivedAt === 'string' && o.archivedAt.length > 0 ? o.archivedAt : null

  const ideaStatus: IdeaStatus =
    typeof o.ideaStatus === 'string' && (IDEA_STATUSES as string[]).includes(o.ideaStatus)
      ? (o.ideaStatus as IdeaStatus)
      : 'nowy'

  const referenceKind: ReferenceKind =
    typeof o.referenceKind === 'string' && (REF_KINDS as string[]).includes(o.referenceKind)
      ? (o.referenceKind as ReferenceKind)
      : 'link'

  const referenceUrl =
    typeof o.referenceUrl === 'string' && o.referenceUrl.trim()
      ? o.referenceUrl.trim()
      : null

  const referenceSource =
    typeof o.referenceSource === 'string' && o.referenceSource.trim()
      ? o.referenceSource.trim()
      : null

  return {
    id,
    type,
    content,
    tags,
    createdAt,
    updatedAt,
    title,
    pinned,
    archivedAt,
    ideaStatus: type === 'idea' ? ideaStatus : 'nowy',
    referenceKind: type === 'reference' ? referenceKind : 'link',
    referenceUrl: type === 'reference' ? referenceUrl : null,
    referenceSource: type === 'reference' ? referenceSource : null,
  }
}

export function normalizeNotesArray(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeNoteFromStorage).filter((n): n is Note => n !== null)
}

export type NoteCreateInput = Pick<Note, 'type' | 'content' | 'tags'> &
  Partial<
    Pick<
      Note,
      | 'title'
      | 'pinned'
      | 'archivedAt'
      | 'ideaStatus'
      | 'referenceKind'
      | 'referenceUrl'
      | 'referenceSource'
    >
  >

export function createNotePayloadFromInput(input: NoteCreateInput): Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
  const type = input.type
  return {
    type,
    content: input.content,
    tags: input.tags,
    title: input.title?.trim() ? input.title.trim() : null,
    pinned: input.pinned ?? false,
    archivedAt: input.archivedAt ?? null,
    ideaStatus: type === 'idea' ? (input.ideaStatus ?? 'nowy') : 'nowy',
    referenceKind: type === 'reference' ? (input.referenceKind ?? 'link') : 'link',
    referenceUrl: type === 'reference' ? (input.referenceUrl?.trim() ? input.referenceUrl.trim() : null) : null,
    referenceSource:
      type === 'reference'
        ? (input.referenceSource?.trim() ? input.referenceSource.trim() : null)
        : null,
  }
}

/** Pełny rekord (np. demo / migracja) → payload bez id/dat */
export function createNotePayload(partial: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
  return createNotePayloadFromInput({
    type: partial.type,
    content: partial.content,
    tags: partial.tags,
    title: partial.title,
    pinned: partial.pinned,
    archivedAt: partial.archivedAt,
    ideaStatus: partial.ideaStatus,
    referenceKind: partial.referenceKind,
    referenceUrl: partial.referenceUrl,
    referenceSource: partial.referenceSource,
  })
}
