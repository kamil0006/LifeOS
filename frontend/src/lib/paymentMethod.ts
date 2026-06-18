export type PaymentMethod = 'card' | 'cash'

export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'cash']

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Karta',
  cash: 'Gotówka',
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'card' || value === 'cash'
}

export function paymentMethodLabel(value: PaymentMethod | null | undefined): string | null {
  if (!value) return null
  return PAYMENT_METHOD_LABELS[value]
}
