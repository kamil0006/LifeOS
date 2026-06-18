import type { PaymentMethod } from '../../lib/paymentMethod'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../lib/paymentMethod'

type PaymentMethodPickerProps = {
  value: PaymentMethod | ''
  onChange: (value: PaymentMethod) => void
  id?: string
}

export function PaymentMethodPicker({ value, onChange, id = 'payment-method' }: PaymentMethodPickerProps) {
  return (
    <div>
      <p id={`${id}-label`} className="mb-2 text-base text-(--text-muted) font-gaming">
        Sposób płatności
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        className="grid grid-cols-2 gap-2"
      >
        {PAYMENT_METHODS.map((method) => {
          const active = value === method
          return (
            <button
              key={method}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(method)}
              className={`min-h-11 rounded-lg border px-3 py-2.5 text-sm font-gaming tracking-wide transition-colors ${
                active
                  ? 'border-(--accent-cyan)/40 bg-(--accent-cyan)/15 text-(--accent-cyan)'
                  : 'border-(--border) bg-(--bg-dark) text-(--text-muted) hover:border-(--accent-cyan)/30 hover:text-(--text-primary)'
              }`}
            >
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod | null | undefined }) {
  if (!method) return null
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-(--border) bg-(--bg-dark)/80 px-2 py-0.5 text-xs font-gaming text-(--text-muted)">
      {PAYMENT_METHOD_LABELS[method]}
    </span>
  )
}
