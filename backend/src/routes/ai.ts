import { Router } from 'express'
import { getAuthUser } from '../middleware/auth.js'
import { generateWeeklyReport } from '../lib/aiReport.js'
import { isOpenAiReportEnabled } from '../lib/config.js'
import { aiRateLimiter } from '../middleware/rateLimit.js'

export const aiRouter = Router()

aiRouter.post('/weekly-report', aiRateLimiter, async (req, res) => {
  const userId = getAuthUser(req).userId
  const result = await generateWeeklyReport(userId)
  res.json(result)
})

aiRouter.get('/status', (_req, res) => {
  res.json({
    enabled: isOpenAiReportEnabled(),
    /** Raport regułowy zawsze dostępny bez wysyłki danych na zewnątrz */
    fallbackAvailable: true,
  })
})
