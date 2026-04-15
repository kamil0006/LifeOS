const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('lifeos_token') || sessionStorage.getItem('lifeos_token')
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isAuthRoute = path.startsWith('/auth/')
  const token = isAuthRoute ? null : getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      'Nie można połączyć z serwerem. Upewnij się, że backend działa (port 3002).'
    )
  }
  if (res.status === 401) {
    if (!isAuthRoute) {
      localStorage.removeItem('lifeos_token')
      localStorage.removeItem('lifeos_user')
      sessionStorage.removeItem('lifeos_token')
      sessionStorage.removeItem('lifeos_user')
      window.location.href = '/login'
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
