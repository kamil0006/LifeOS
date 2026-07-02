import { describe, it, expect } from 'vitest'
import { isPaymentMethod, paymentMethodLabel } from './paymentMethod'

describe('isPaymentMethod', () => {
  it('accepts card and cash', () => {
    expect(isPaymentMethod('card')).toBe(true)
    expect(isPaymentMethod('cash')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isPaymentMethod('blik')).toBe(false)
    expect(isPaymentMethod(null)).toBe(false)
    expect(isPaymentMethod(undefined)).toBe(false)
    expect(isPaymentMethod(123)).toBe(false)
  })
})

describe('paymentMethodLabel', () => {
  it('returns the Polish label for a known method', () => {
    expect(paymentMethodLabel('card')).toBe('Karta')
    expect(paymentMethodLabel('cash')).toBe('Gotówka')
  })

  it('returns null for null/undefined', () => {
    expect(paymentMethodLabel(null)).toBeNull()
    expect(paymentMethodLabel(undefined)).toBeNull()
  })
})
