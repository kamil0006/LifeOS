const API_BASE = '/api'

type ApiAuthEvent = 'session-expired'

const authListeners = new Set<(event: ApiAuthEvent) => void>()

export function onApiAuthEvent(listener: (event: ApiAuthEvent) => void): () => void {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

function emitAuthEvent(event: ApiAuthEvent) {
  authListeners.forEach((listener) => listener(event))
}

let refreshInFlight: Promise<boolean> | null = null

function shouldSkipRefresh(path: string): boolean {
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/reset-password')
  )
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new Error(
      'Nie można połączyć z serwerem. Upewnij się, że backend działa (port 3002).'
    )
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isAuthRoute = path.startsWith('/auth/') && path !== '/auth/me'
  let res = await fetchApi(path, options)

  if (res.status === 401 && !shouldSkipRefresh(path)) {
    const refreshed = await refreshSession()
    if (refreshed) {
      res = await fetchApi(path, options)
    }
  }

  if (res.status === 401) {
    if (!isAuthRoute) {
      emitAuthEvent('session-expired')
    }
    const err = await res.json().catch(() => ({ error: 'Nieprawidłowy email lub hasło' }))
    throw new Error(err.error || 'Nieprawidłowy email lub hasło')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg = err?.error || err?.message
    const fallback =
      res.status === 400
        ? 'Nieprawidłowe dane'
        : res.status === 404
          ? 'Nie znaleziono'
          : res.status === 503
            ? 'Serwis tymczasowo niedostępny'
            : 'Wystąpił błąd serwera'
    throw new Error(msg || fallback)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
