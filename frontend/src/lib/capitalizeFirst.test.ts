import { describe, it, expect } from 'vitest'
import { capitalizeFirstPl } from './capitalizeFirst'

describe('capitalizeFirstPl', () => {
  it('capitalizes the first letter, leaving the rest unchanged', () => {
    expect(capitalizeFirstPl('jedzenie')).toBe('Jedzenie')
    expect(capitalizeFirstPl('ąbc')).toBe('Ąbc')
  })

  it('trims surrounding whitespace before capitalizing', () => {
    expect(capitalizeFirstPl('  groceries  ')).toBe('Groceries')
  })

  it('returns an empty string for empty or whitespace-only input', () => {
    expect(capitalizeFirstPl('')).toBe('')
    expect(capitalizeFirstPl('   ')).toBe('')
  })

  it('is a no-op when the first letter is already uppercase', () => {
    expect(capitalizeFirstPl('Rachunki')).toBe('Rachunki')
  })
})
