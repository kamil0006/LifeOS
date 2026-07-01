import { Router } from 'express'
import { getExchangeRates } from '../lib/exchangeRates.js'

/** Publiczny endpoint (bez auth) — kursy walut nie są danymi wrażliwymi, potrzebny też w trybie demo. */
export const exchangeRatesRouter = Router()

exchangeRatesRouter.get('/', async (_req, res) => {
  const rates = await getExchangeRates()
  res.json({ base: 'PLN', rates, updatedAt: new Date().toISOString() })
})
