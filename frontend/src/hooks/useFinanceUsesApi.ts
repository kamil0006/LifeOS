import { useAuth } from '../context/AuthContext'

/** Dane finansowe z backendu (nie z DemoDataContext). Przy VITE_DEMO_MODE bez logowania zostaje demo. */
export function useFinanceUsesApi(): boolean {
  const { token } = useAuth()
  return Boolean(token)
}
