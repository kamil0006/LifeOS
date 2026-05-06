/** Skrócone nazwy miesięcy — selektory / wykresy (Sty, Lut, …). */
export const ROLLING_MONTH_NAMES = [
  'Sty',
  'Lut',
  'Mar',
  'Kwi',
  'Maj',
  'Cze',
  'Lip',
  'Sie',
  'Wrz',
  'Paź',
  'Lis',
  'Gru',
] as const

/**
 * Opcje miesiąca: od bieżącego miesiąca w dół do stycznia tego samego roku
 * (bez wieloletniej listy wstecz — np. tylko Sty–Maj 2026 zamiast do czerwca 2024).
 */
export function buildCurrentYearMonthOptions(recalcToken: number): {
  month: number
  year: number
  label: string
}[] {
  void recalcToken
  const now = new Date()
  const year = now.getFullYear()
  const currentMonth = now.getMonth()
  const options: { month: number; year: number; label: string }[] = []
  for (let m = currentMonth; m >= 0; m--) {
    options.push({
      month: m,
      year,
      label: `${ROLLING_MONTH_NAMES[m]} ${year}`,
    })
  }
  return options
}
