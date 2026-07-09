import { useAuth } from '../context/AuthContext'

/** API queries only outside demo mode and with an active cookie session. */
export function useAuthenticatedQueryEnabled(): boolean {
  const { isDemoMode, isLoggedIn, sessionReady } = useAuth()
  return sessionReady && !isDemoMode && isLoggedIn
}
