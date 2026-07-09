import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../lib/config.js'
import { getTokenFromRequest } from '../lib/authCookie.js'

export interface AuthPayload {
  userId: string
  email: string
  /** access — API; refresh — session refresh only */
  typ?: 'access' | 'refresh'
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' })
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthPayload
    if (payload.typ === 'refresh') {
      return res.status(401).json({ error: 'Nieprawidłowy token autoryzacji' })
    }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Nieprawidłowy token' })
  }
}

/** Use in handlers after `authMiddleware` — central invariant instead of `req.user!`. */
export function getAuthUser(req: Request): AuthPayload {
  if (req.user === undefined) {
    throw new Error('getAuthUser: missing req.user (auth middleware not applied?)')
  }
  return req.user
}
