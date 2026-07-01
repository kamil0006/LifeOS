/** Polskie święta państwowe – zwraca mapę data (YYYY-MM-DD) -> nazwa święta (tłumaczona przez `t`). */

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export type HolidayNameKey =
  | 'newYear'
  | 'epiphany'
  | 'laborDay'
  | 'constitutionDay'
  | 'assumptionOfMary'
  | 'allSaintsDay'
  | 'independenceDay'
  | 'christmasDay1'
  | 'christmasDay2'
  | 'easter'
  | 'easterMonday'
  | 'pentecost'
  | 'corpusChristi'

/** Oblicza datę Wielkanocy – algorytm Oudina (1940) */
function getEasterDate(year: number): { month: number; day: number } {
  const f = Math.floor
  const G = year % 19
  const C = f(year / 100)
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  const L = I - J
  const month = 3 + f((L + 40) / 44)
  const day = L + 28 - 31 * f(month / 4)
  return { month, day }
}

/** Zwraca święta polskie dla danego roku jako Record<YYYY-MM-DD, nazwa>; `t` tłumaczy nazwy wg `calendar.holidays.*`. */
export function getPolishHolidays(year: number, t: (key: string) => string): Record<string, string> {
  const result: Record<string, string> = {}
  const name = (key: HolidayNameKey) => t(`holidays.${key}`)

  // Stałe święta
  const fixed: [number, number, HolidayNameKey][] = [
    [1, 1, 'newYear'],
    [1, 6, 'epiphany'],
    [5, 1, 'laborDay'],
    [5, 3, 'constitutionDay'],
    [8, 15, 'assumptionOfMary'],
    [11, 1, 'allSaintsDay'],
    [11, 11, 'independenceDay'],
    [12, 25, 'christmasDay1'],
    [12, 26, 'christmasDay2'],
  ]

  for (const [m, d, key] of fixed) {
    result[`${year}-${pad(m)}-${pad(d)}`] = name(key)
  }

  // Święta ruchome (od Wielkanocy)
  const easter = getEasterDate(year)
  const easterDate = new Date(year, easter.month - 1, easter.day)

  const addDays = (days: number, key: HolidayNameKey) => {
    const d = new Date(easterDate)
    d.setDate(d.getDate() + days)
    const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    result[dateKey] = name(key)
  }

  addDays(0, 'easter')
  addDays(1, 'easterMonday')
  addDays(49, 'pentecost')
  addDays(60, 'corpusChristi')

  return result
}
