/** Allows only http(s) — protects against javascript: / data: in links. */
export function safeHref(href: string | undefined | null): string | undefined {
  if (!href?.trim()) return undefined
  try {
    const u = new URL(href.trim())
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.href
    }
  } catch {
    /* invalid URL */
  }
  return undefined
}

export function safeExternalHref(href: string | undefined | null): string | undefined {
  const safe = safeHref(href)
  if (!safe) return undefined
  try {
    const u = new URL(safe)
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href
  } catch {
    return undefined
  }
  return undefined
}
