export const learningFieldClass =
  'w-full rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-base text-(--text-primary) focus:border-(--accent-cyan)/50 focus:outline-none focus:ring-1 focus:ring-(--accent-cyan)/25'

export const learningLabelClass = 'mb-2 block text-base text-(--text-muted)'

export const learningFormActionsClass =
  'mt-6 space-y-2 border-t border-(--border)/60 pt-4 sm:flex sm:flex-wrap sm:gap-2 sm:space-y-0'

export const learningPrimaryBtnClass =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/15 px-4 py-3 text-base font-medium text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/25 disabled:opacity-50 sm:w-auto sm:py-2'

export const learningSecondaryBtnClass =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-(--border) px-4 py-2.5 text-base text-(--text-muted) transition-colors hover:bg-(--bg-card) sm:w-auto sm:py-2'

export const learningAddBtnClass =
  'flex min-h-11 items-center gap-2 rounded-lg border border-(--accent-cyan)/40 bg-(--accent-cyan)/15 px-4 py-2 text-base font-medium text-(--accent-cyan) transition-colors hover:bg-(--accent-cyan)/25'

export const learningChipClass = (active: boolean) =>
  `rounded-lg border px-3 py-2.5 text-base transition-colors sm:py-2 ${
    active
      ? 'border-(--accent-cyan)/50 bg-(--accent-cyan)/15 text-(--accent-cyan)'
      : 'border-(--border) text-(--text-muted) hover:bg-(--bg-card)'
  }`
