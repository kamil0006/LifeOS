import { describe, it, expect } from 'vitest'
import { isForeignCurrency } from './exchangeRates.js'

describe('isForeignCurrency', () => {
  it('recognizes USD and EUR as foreign', () => {
    expect(isForeignCurrency('USD')).toBe(true)
    expect(isForeignCurrency('EUR')).toBe(true)
  })

  it('does not treat PLN or unknown codes as foreign', () => {
    expect(isForeignCurrency('PLN')).toBe(false)
    expect(isForeignCurrency('GBP')).toBe(false)
    expect(isForeignCurrency('')).toBe(false)
  })
})

// getExchangeRate / convertToPln hit the NBP API via fetch() and use an in-memory
// cache — deferred to a follow-up that mocks global fetch.
