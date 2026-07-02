import { describe, it, expect } from 'vitest'
import {
  expenseBackupSchema,
  scheduledExpenseBackupSchema,
  netWorthAccountBackupSchema,
} from './backupSchemas.js'

describe('expenseBackupSchema', () => {
  const valid = {
    id: 'exp-1',
    name: 'Groceries',
    amount: 123.45,
    category: 'food',
    date: '2026-07-01',
    paymentMethod: 'card',
    createdAt: '2026-07-01',
  }

  it('parses a valid expense', () => {
    expect(expenseBackupSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a non-numeric amount', () => {
    const result = expenseBackupSchema.safeParse({ ...valid, amount: 'not a number' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = expenseBackupSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a name over 500 characters', () => {
    const result = expenseBackupSchema.safeParse({ ...valid, name: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts card, cash, null and undefined paymentMethod', () => {
    expect(expenseBackupSchema.safeParse({ ...valid, paymentMethod: 'card' }).success).toBe(true)
    expect(expenseBackupSchema.safeParse({ ...valid, paymentMethod: 'cash' }).success).toBe(true)
    expect(expenseBackupSchema.safeParse({ ...valid, paymentMethod: null }).success).toBe(true)
    const { paymentMethod: _omit, ...withoutPaymentMethod } = valid
    expect(expenseBackupSchema.safeParse(withoutPaymentMethod).success).toBe(true)
  })

  it('rejects an unsupported paymentMethod', () => {
    const result = expenseBackupSchema.safeParse({ ...valid, paymentMethod: 'blik' })
    expect(result.success).toBe(false)
  })

  it('coerces a date string and rejects garbage dates', () => {
    expect(expenseBackupSchema.safeParse({ ...valid, date: '2026-01-15' }).success).toBe(true)
    expect(expenseBackupSchema.safeParse({ ...valid, date: 'not-a-date' }).success).toBe(false)
  })
})

describe('scheduledExpenseBackupSchema', () => {
  const valid = {
    id: 'sched-1',
    name: 'Rent',
    amount: 2000,
    category: 'housing',
    dayOfMonth: 10,
    active: true,
    createdAt: '2026-07-01',
  }

  it('accepts dayOfMonth within 1-31', () => {
    expect(scheduledExpenseBackupSchema.safeParse({ ...valid, dayOfMonth: 1 }).success).toBe(true)
    expect(scheduledExpenseBackupSchema.safeParse({ ...valid, dayOfMonth: 31 }).success).toBe(true)
  })

  it('rejects dayOfMonth outside 1-31', () => {
    expect(scheduledExpenseBackupSchema.safeParse({ ...valid, dayOfMonth: 0 }).success).toBe(false)
    expect(scheduledExpenseBackupSchema.safeParse({ ...valid, dayOfMonth: 32 }).success).toBe(false)
  })

  it('defaults currency to PLN when omitted', () => {
    const result = scheduledExpenseBackupSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.currency).toBe('PLN')
  })

  it('rejects an unsupported currency code', () => {
    const result = scheduledExpenseBackupSchema.safeParse({ ...valid, currency: 'GBP' })
    expect(result.success).toBe(false)
  })
})

describe('netWorthAccountBackupSchema', () => {
  const valid = {
    id: 'acc-1',
    name: 'Savings',
    kind: 'asset',
    balance: 1000,
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
  }

  it('accepts asset and liability kinds', () => {
    expect(netWorthAccountBackupSchema.safeParse({ ...valid, kind: 'asset' }).success).toBe(true)
    expect(netWorthAccountBackupSchema.safeParse({ ...valid, kind: 'liability' }).success).toBe(true)
  })

  it('rejects an unknown kind', () => {
    const result = netWorthAccountBackupSchema.safeParse({ ...valid, kind: 'other' })
    expect(result.success).toBe(false)
  })

  it('accentKey is nullable/optional but restricted to the known enum', () => {
    expect(netWorthAccountBackupSchema.safeParse({ ...valid, accentKey: 'cyan' }).success).toBe(true)
    expect(netWorthAccountBackupSchema.safeParse({ ...valid, accentKey: null }).success).toBe(true)
    const { accentKey: _omit, ...withoutAccentKey } = valid as typeof valid & { accentKey?: string }
    expect(netWorthAccountBackupSchema.safeParse(withoutAccentKey).success).toBe(true)
    expect(netWorthAccountBackupSchema.safeParse({ ...valid, accentKey: 'purple' }).success).toBe(false)
  })
})
