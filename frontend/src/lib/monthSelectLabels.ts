/** Abbreviated month names — selectors / charts (Sty, Lut, …). */
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
 * Month options: from the current month down to January of the same year
 * (no multi-year list going back — e.g. only Jan–May 2026 instead of back to June 2024).
 */
export function buildCurrentYearMonthOptions(
  recalcToken: number,
  monthNames: readonly string[] = ROLLING_MONTH_NAMES
): {
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
      label: `${monthNames[m]} ${year}`,
    })
  }
  return options
}
