import { useAuth } from '../context/AuthContext'

/** Zapytania do API tylko poza demo i przy aktywnej sesji cookie. */
export function useAuthenticatedQueryEnabled(): boolean {
  const { isDemoMode, isLoggedIn, sessionReady } = useAuth()
  return sessionReady && !isDemoMode && isLoggedIn
}
