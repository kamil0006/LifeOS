/** Bieżące kursy walut obcych względem PLN (Tabela A NBP) z cache w pamięci. */

export type ForeignCurrency = 'USD' | 'EUR'
export type Currency = 'PLN' | ForeignCurrency

interface RateCache {
  rate: number
  fetchedAt: number
}

const TTL_MS = 6 * 60 * 60 * 1000 // kursy NBP publikowane raz dziennie w dni robocze — 6h wystarcza
const FALLBACK_RATES: Record<ForeignCurrency, number> = { USD: 4.0, EUR: 4.3 }

const cache: Partial<Record<ForeignCurrency, RateCache>> = {}

async function fetchRateFromNbp(code: ForeignCurrency): Promise<number> {
  const res = await fetch(`https://api.nbp.pl/api/exchangerates/rates/a/${code}/?format=json`)
  if (!res.ok) throw new Error(`NBP zwrócił status ${res.status}`)
  const json = (await res.json()) as { rates?: { mid?: number }[] }
  const rate = json.rates?.[0]?.mid
  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    throw new Error('Brak poprawnego kursu w odpowiedzi NBP')
  }
  return rate
}

export async function getExchangeRate(code: ForeignCurrency): Promise<number> {
  const cached = cache[code]
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.rate
  try {
    const rate = await fetchRateFromNbp(code)
    cache[code] = { rate, fetchedAt: Date.now() }
    return rate
  } catch (e) {
    console.error(`Nie udało się pobrać kursu ${code} z NBP, używam wartości zapasowej:`, e)
    return cached?.rate ?? FALLBACK_RATES[code]
  }
}

export async function getExchangeRates(): Promise<Record<ForeignCurrency, number>> {
  const [USD, EUR] = await Promise.all([getExchangeRate('USD'), getExchangeRate('EUR')])
  return { USD, EUR }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Przelicza kwotę w walucie obcej na PLN wg bieżącego kursu; PLN zwraca bez zmian. */
export async function convertToPln(amount: number, currency: Currency): Promise<number> {
  if (currency === 'PLN') return amount
  const rate = await getExchangeRate(currency)
  return round2(amount * rate)
}

export function isForeignCurrency(currency: string): currency is ForeignCurrency {
  return currency === 'USD' || currency === 'EUR'
}
