import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { AuthPayload } from '../middleware/auth.js'
import {
  getJwtSecret,
  isDevResetPasswordAllowed,
  isProduction,
  isRegistrationEnabled,
} from '../lib/config.js'
import { clearAuthCookies, getRefreshTokenFromRequest, setAccessCookie, setRefreshCookie } from '../lib/authCookie.js'
import { authMiddleware } from '../middleware/auth.js'

const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć minimum 8 znaków')
  .max(128)
  .refine((p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p), {
    message: 'Hasło musi zawierać literę i cyfrę',
  })

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
})

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
})

const ACCESS_TOKEN_TTL = '1h'
const REFRESH_TOKEN_TTL_REMEMBER = '7d'
const REFRESH_TOKEN_TTL_SESSION = '24h'

function issueSession(res: Response, user: { id: string; email: string }, rememberMe: boolean) {
  const base = { userId: user.id, email: user.email } as AuthPayload
  const accessToken = jwt.sign({ ...base, typ: 'access' }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: 'HS256',
  })
  const refreshToken = jwt.sign({ ...base, typ: 'refresh' }, getJwtSecret(), {
    expiresIn: rememberMe ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_SESSION,
    algorithm: 'HS256',
  })
  setAccessCookie(res, accessToken)
  setRefreshCookie(res, refreshToken, rememberMe)
  return { user: { id: user.id, email: user.email } }
}

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  if (!isRegistrationEnabled()) {
    return res.status(403).json({ error: 'Rejestracja jest wyłączona' })
  }
  try {
    const raw = registerSchema.parse(req.body)
    const email = raw.email.trim().toLowerCase()
    const password = raw.password
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Nie udało się utworzyć konta. Sprawdź dane lub zaloguj się.' })
    }
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed },
    })
    const rememberMe = raw.rememberMe ?? true
    res.status(201).json(issueSession(res, user, rememberMe))
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.errors[0]
      const msg = first?.path[0] === 'email'
        ? 'Nieprawidłowy format adresu email'
        : first?.message ?? 'Nieprawidłowe dane'
      return res.status(400).json({ error: msg })
    }
    if (e && typeof e === 'object' && 'code' in e) {
      const prismaError = e as { code?: string }
      if (prismaError.code === 'P2002') {
        return res.status(400).json({ error: 'Nie udało się utworzyć konta. Sprawdź dane lub zaloguj się.' })
      }
      if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
        return res.status(503).json({
          error: 'Brak połączenia z bazą danych. Sprawdź DATABASE_URL i czy PostgreSQL działa.',
        })
      }
    }
    console.error('Register error:', e)
    res.status(500).json({
      error: isProduction
        ? 'Błąd serwera. Sprawdź czy PostgreSQL działa i czy wykonano migracje.'
        : e instanceof Error ? e.message : 'Błąd serwera',
    })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const raw = loginSchema.parse(req.body)
    const email = raw.email.trim().toLowerCase()
    const password = raw.password
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' })
    }
    const rememberMe = raw.rememberMe ?? true
    res.json(issueSession(res, user, rememberMe))
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nieprawidłowe dane logowania' })
    }
    if (e && typeof e === 'object' && 'code' in e) {
      const prismaError = e as { code?: string }
      if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
        return res.status(503).json({
          error: 'Brak połączenia z bazą danych. Sprawdź DATABASE_URL i czy PostgreSQL działa.',
        })
      }
    }
    console.error('Login error:', e)
    res.status(500).json({
      error: 'Błąd serwera. Sprawdź czy PostgreSQL działa i czy wykonano migracje.',
    })
  }
})

/** Password reset — local only, with ALLOW_DEV_RESET=true */
authRouter.post('/reset-password', async (req, res) => {
  if (!isDevResetPasswordAllowed()) {
    return res.status(404).json({ error: 'Nie dostępne' })
  }
  const raw = z.object({ email: z.string().email(), newPassword: passwordSchema }).parse(req.body)
  const email = raw.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(400).json({ error: 'Nie udało się zresetować hasła' })
  }
  const hashed = await bcrypt.hash(raw.newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  res.json({ ok: true, message: 'Hasło zaktualizowane. Możesz się zalogować.' })
})

authRouter.get('/me', authMiddleware, (req, res) => {
  const { userId, email } = req.user!
  res.json({ id: userId, email })
})

/** Refresh the short-lived access token based on the refresh cookie. */
authRouter.post('/refresh', async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req)
  if (!refreshToken) {
    return res.status(401).json({ error: 'Brak sesji' })
  }
  try {
    const payload = jwt.verify(refreshToken, getJwtSecret(), { algorithms: ['HS256'] }) as AuthPayload
    if (payload.typ !== 'refresh') {
      return res.status(401).json({ error: 'Nieprawidłowy token odświeżania' })
    }
    const accessToken = jwt.sign(
      { userId: payload.userId, email: payload.email, typ: 'access' } as AuthPayload,
      getJwtSecret(),
      { expiresIn: ACCESS_TOKEN_TTL, algorithm: 'HS256' }
    )
    setAccessCookie(res, accessToken)
    res.json({ ok: true })
  } catch {
    clearAuthCookies(res)
    return res.status(401).json({ error: 'Sesja wygasła. Zaloguj się ponownie.' })
  }
})

authRouter.post('/logout', (_req, res) => {
  clearAuthCookies(res)
  res.status(204).send()
})
