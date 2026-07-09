import { Router } from 'express'
import { getExchangeRates } from '../lib/exchangeRates.js'

/** Public endpoint (no auth) — exchange rates are not sensitive data; also needed in demo mode. */
export const exchangeRatesRouter = Router()

exchangeRatesRouter.get('/', async (_req, res) => {
  const rates = await getExchangeRates()
  res.json({ base: 'PLN', rates, updatedAt: new Date().toISOString() })
})
