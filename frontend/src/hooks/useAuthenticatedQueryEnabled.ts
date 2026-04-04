import { useAuth } from '../context/AuthContext'

/** Zapytania do API tylko poza demo i przy aktywnym tokenie. */
export function useAuthenticatedQueryEnabled(): boolean {
  const { isDemoMode, token } = useAuth()
  return !isDemoMode && !!token
}
