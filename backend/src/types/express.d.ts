import { AuthPayload } from '../middleware/auth.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}
