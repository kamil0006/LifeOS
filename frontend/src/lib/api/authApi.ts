import { api } from './client'

export type AuthUser = { id: string; email: string }

export const authApi = {
  login: (email: string, password: string, rememberMe = true) =>
    api<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    }),
  register: (email: string, password: string, rememberMe = true) =>
    api<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    }),
  me: () => api<AuthUser>('/auth/me'),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
  resetPassword: (email: string, newPassword: string) =>
    api<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),
}
