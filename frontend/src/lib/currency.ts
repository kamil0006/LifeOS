import { api } from './api/client'

export type ForeignCurrency = 'USD' | 'EUR'
export type Currency = 'PLN' | ForeignCurrency

export const CURRENCIES: Currency[] = ['PLN', 'USD', 'EUR']

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  PLN: 'zł',
  USD: '$',
  EUR: '€',
}

export interface ExchangeRatesResponse {
  base: 'PLN'
  rates: Record<ForeignCurrency, number>
  updatedAt: string
}

/** Public endpoint (no auth) — also works in demo mode. */
export function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
  return api<ExchangeRatesResponse>('/exchange-rates')
}

export function convertToPln(amount: number, currency: Currency, rates: Record<ForeignCurrency, number> | null): number | null {
  if (currency === 'PLN') return amount
  const rate = rates?.[currency]
  if (!rate) return null
  return Math.round(amount * rate * 100) / 100
}

export function formatCurrencyAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = amount.toLocaleString(currency === 'PLN' ? 'pl-PL' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency === 'USD' || currency === 'EUR' ? `${symbol}${formatted}` : `${formatted} ${symbol}`
}
