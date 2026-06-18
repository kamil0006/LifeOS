import { useAuth } from '../context/AuthContext'

export function useFinanceUsesApi() {
  const { isLoggedIn, sessionReady, isDemoMode } = useAuth()
  return sessionReady && isLoggedIn && !isDemoMode
}
