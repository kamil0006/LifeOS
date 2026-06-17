import { Router } from 'express'
import { getAuthUser } from '../middleware/auth.js'
import { generateWeeklyReport } from '../lib/aiReport.js'

export const aiRouter = Router()

aiRouter.post('/weekly-report', async (req, res) => {
  const userId = getAuthUser(req).userId
  const result = await generateWeeklyReport(userId)
  res.json(result)
})

aiRouter.get('/status', (_req, res) => {
  res.json({ enabled: Boolean(process.env.OPENAI_API_KEY) })
})
