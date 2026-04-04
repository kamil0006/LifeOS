import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { AuthPayload } from '../middleware/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  try {
    const raw = registerSchema.parse(req.body)
    const email = raw.email.trim().toLowerCase()
    const password = raw.password
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email już zajęty' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed },
    })
    const token = jwt.sign(
      { userId: user.id, email: user.email } as AuthPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, email: user.email } })
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.errors[0]
      const msg = first?.path[0] === 'email'
        ? 'Nieprawidłowy format adresu email'
        : first?.path[0] === 'password' && first?.code === 'too_small'
          ? 'Hasło musi mieć minimum 6 znaków'
          : 'Nieprawidłowe dane'
      return res.status(400).json({ error: msg })
    }
    if (e && typeof e === 'object' && 'code' in e) {
      const prismaError = e as { code?: string; message?: string }
      if (prismaError.code === 'P2002') {
        return res.status(400).json({ error: 'Email już zajęty' })
      }
      if (prismaError.code === 'P1001' || prismaError.code === 'P1017') {
        return res.status(503).json({
          error: 'Brak połączenia z bazą danych. Sprawdź DATABASE_URL i czy PostgreSQL działa.',
        })
      }
    }
    console.error('Register error:', e)
    const msg = e instanceof Error ? e.message : String(e)
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Błąd serwera. Sprawdź czy PostgreSQL działa i czy wykonano migracje.'
        : msg,
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
    const token = jwt.sign(
      { userId: user.id, email: user.email } as AuthPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, email: user.email } })
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.errors[0]
      const msg = first?.path[0] === 'email'
        ? 'Nieprawidłowy format adresu email'
        : first?.path[0] === 'password' && first?.code === 'too_small'
          ? 'Hasło musi mieć minimum 6 znaków'
          : 'Nieprawidłowe dane'
      return res.status(400).json({ error: msg })
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

// Reset hasła (tylko w trybie deweloperskim – gdy NODE_ENV !== 'production')
authRouter.post('/reset-password', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Nie dostępne' })
  }
  try {
    const raw = z.object({ email: z.string().email(), newPassword: z.string().min(6) }).parse(req.body)
    const email = raw.email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono użytkownika' })
    }
    const hashed = await bcrypt.hash(raw.newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    res.json({ ok: true, message: 'Hasło zaktualizowane. Możesz się zalogować.' })
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.errors[0]
      const path = first?.path[0]
      const msg = path === 'email'
        ? 'Nieprawidłowy format adresu email'
        : (path === 'password' || path === 'newPassword') && first?.code === 'too_small'
          ? 'Hasło musi mieć minimum 6 znaków'
          : 'Nieprawidłowe dane'
      return res.status(400).json({ error: msg })
    }
    throw e
  }
})
