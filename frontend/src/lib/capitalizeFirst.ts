/** Pierwsza litera wielka (locale pl), reszta napisu bez zmian. */
export function capitalizeFirstPl(value: string): string {
  const s = value.trim()
  if (!s) return ''
  return s.charAt(0).toLocaleUpperCase('pl-PL') + s.slice(1)
}
