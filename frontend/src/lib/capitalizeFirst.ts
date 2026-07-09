/** Uppercases the first letter (pl locale), rest of the string unchanged. */
export function capitalizeFirstPl(value: string): string {
  const s = value.trim()
  if (!s) return ''
  return s.charAt(0).toLocaleUpperCase('pl-PL') + s.slice(1)
}
