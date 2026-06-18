import type { Expense, Income, NetWorthAccount, NetWorthAdjustment, ScheduledExpense } from '@prisma/client'
import { decryptField, decryptFieldNullable, encryptField, encryptFieldNullable } from './encryption.js'

export function encryptExpenseWrite(data: { name?: string }) {
  return {
    ...(data.name !== undefined && { name: encryptField(data.name.trim()) }),
  }
}

export function decryptExpenseRow<T extends Pick<Expense, 'name'>>(row: T): T {
  return { ...row, name: decryptField(row.name) }
}

export function decryptExpenseRows<T extends Pick<Expense, 'name'>>(rows: T[]): T[] {
  return rows.map(decryptExpenseRow)
}

export function encryptIncomeWrite(data: { source?: string }) {
  return {
    ...(data.source !== undefined && { source: encryptField(data.source.trim()) }),
  }
}

export function decryptIncomeRow<T extends Pick<Income, 'source'>>(row: T): T {
  return { ...row, source: decryptField(row.source) }
}

export function decryptIncomeRows<T extends Pick<Income, 'source'>>(rows: T[]): T[] {
  return rows.map(decryptIncomeRow)
}

export function encryptScheduledExpenseWrite(data: { name?: string }) {
  return {
    ...(data.name !== undefined && { name: encryptField(data.name.trim()) }),
  }
}

export function decryptScheduledExpenseRow<T extends Pick<ScheduledExpense, 'name'>>(row: T): T {
  return { ...row, name: decryptField(row.name) }
}

export function decryptScheduledExpenseRows<T extends Pick<ScheduledExpense, 'name'>>(rows: T[]): T[] {
  return rows.map(decryptScheduledExpenseRow)
}

export function encryptNetWorthAccountWrite(data: { name?: string }) {
  return {
    ...(data.name !== undefined && { name: encryptField(data.name.trim()) }),
  }
}

export function decryptNetWorthAccountRow<T extends Pick<NetWorthAccount, 'name'>>(row: T): T {
  return { ...row, name: decryptField(row.name) }
}

export function decryptNetWorthAccountRows<T extends Pick<NetWorthAccount, 'name'>>(rows: T[]): T[] {
  return rows.map(decryptNetWorthAccountRow)
}

export function encryptNetWorthAdjustmentWrite(data: { description?: string | null }) {
  return {
    ...(data.description !== undefined && {
      description: encryptFieldNullable(data.description?.trim() ? data.description.trim() : null),
    }),
  }
}

export function decryptNetWorthAdjustmentRow<T extends Pick<NetWorthAdjustment, 'description'>>(row: T): T {
  return { ...row, description: decryptFieldNullable(row.description) }
}

type AdjustmentWithAccount = NetWorthAdjustment & {
  account?: Pick<NetWorthAccount, 'id' | 'name' | 'kind'>
}

export function decryptNetWorthAdjustmentWithAccount<T extends AdjustmentWithAccount>(row: T): T {
  return {
    ...decryptNetWorthAdjustmentRow(row),
    ...(row.account && {
      account: { ...row.account, name: decryptField(row.account.name) },
    }),
  }
}

export function decryptNetWorthAdjustmentsWithAccount<T extends AdjustmentWithAccount>(rows: T[]): T[] {
  return rows.map(decryptNetWorthAdjustmentWithAccount)
}
