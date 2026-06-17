/**
 * Generuje unikalny identyfikator działający także w kontekście NIE-secure
 * (np. telefon łączący się z dev serverem przez http://192.168.x.x).
 *
 * `crypto.randomUUID()` istnieje wyłącznie w secure context (HTTPS / localhost).
 * Na zwykłym http na telefonie jest `undefined` i jego wywołanie rzuca wyjątkiem,
 * co bez error boundary wywala całą aplikację (czarny ekran).
 */
export function safeRandomId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined

  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      /* fall through */
    }
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    // RFC 4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
