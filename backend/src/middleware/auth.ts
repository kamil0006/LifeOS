import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export interface AuthPayload {
  userId: string
  email: string
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    ;(req as Request & { user: AuthPayload }).user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Nieprawidłowy token' })
  }
}
