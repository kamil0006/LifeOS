/** Dozwolone protokoły dla linków zapisywanych w bazie. */
export function sanitizeHttpUrl(raw: string | null | undefined): string | null {
  if (raw == null || raw.trim() === '') return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.href
    }
  } catch {
    /* invalid */
  }
  return null
}
