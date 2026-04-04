/** Polskie święta państwowe – zwraca mapę data (YYYY-MM-DD) -> nazwa święta */

function pad(n: number) {
  return String(n).padStart(2, '0')
}

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

/** Zwraca święta polskie dla danego roku jako Record<YYYY-MM-DD, nazwa> */
export function getPolishHolidays(year: number): Record<string, string> {
  const result: Record<string, string> = {}

  // Stałe święta
  const fixed: [number, number, string][] = [
    [1, 1, 'Nowy Rok'],
    [1, 6, 'Trzech Króli'],
    [5, 1, 'Święto Pracy'],
    [5, 3, 'Święto Konstytucji 3 Maja'],
    [8, 15, 'Wniebowzięcie NMP'],
    [11, 1, 'Wszystkich Świętych'],
    [11, 11, 'Narodowe Święto Niepodległości'],
    [12, 25, 'Boże Narodzenie (1. dzień)'],
    [12, 26, 'Boże Narodzenie (2. dzień)'],
  ]

  for (const [m, d, name] of fixed) {
    result[`${year}-${pad(m)}-${pad(d)}`] = name
  }

  // Święta ruchome (od Wielkanocy)
  const easter = getEasterDate(year)
  const easterDate = new Date(year, easter.month - 1, easter.day)

  const addDays = (days: number, name: string) => {
    const d = new Date(easterDate)
    d.setDate(d.getDate() + days)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    result[key] = name
  }

  addDays(0, 'Wielkanoc')
  addDays(1, 'Poniedziałek Wielkanocny')
  addDays(49, 'Zielone Świątki')
  addDays(60, 'Boże Ciało')

  return result
}
