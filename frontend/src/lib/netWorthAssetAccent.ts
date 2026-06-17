/** Kolory listy aktywów — spójne z neonową paletą LifeOS */

export const NW_ASSET_ACCENT_OPTIONS: { key: string; label: string }[] = [
  { key: 'cyan', label: 'Cyjan' },
  { key: 'green', label: 'Zieleń' },
  { key: 'magenta', label: 'Magenta' },
  { key: 'amber', label: 'Bursztyn' },
  { key: 'rose', label: 'Róż' },
  { key: 'violet', label: 'Fiolet' },
]

const ACCENT: Record<
  string,
  { icon: string; amount: string; swatch: string; editHover: string; rowAccent: string }
> = {
  cyan: {
    icon: 'text-(--accent-cyan)',
    amount: 'text-(--accent-cyan)',
    swatch: 'bg-(--accent-cyan)',
    editHover: 'hover:border-(--accent-cyan)/40 hover:text-(--accent-cyan)',
    rowAccent: 'border-l-[3px] border-l-(--accent-cyan)/60 bg-(--accent-cyan)/5',
  },
  green: {
    icon: 'text-(--accent-green)',
    amount: 'text-(--accent-green)',
    swatch: 'bg-(--accent-green)',
    editHover: 'hover:border-(--accent-green)/40 hover:text-(--accent-green)',
    rowAccent: 'border-l-[3px] border-l-(--accent-green)/60 bg-(--accent-green)/5',
  },
  magenta: {
    icon: 'text-(--accent-magenta)',
    amount: 'text-(--accent-magenta)',
    swatch: 'bg-(--accent-magenta)',
    editHover: 'hover:border-(--accent-magenta)/40 hover:text-(--accent-magenta)',
    rowAccent: 'border-l-[3px] border-l-(--accent-magenta)/55 bg-(--accent-magenta)/5',
  },
  amber: {
    icon: 'text-(--accent-amber)',
    amount: 'text-(--accent-amber)',
    swatch: 'bg-(--accent-amber)',
    editHover: 'hover:border-(--accent-amber)/45 hover:text-(--accent-amber)',
    rowAccent: 'border-l-[3px] border-l-(--accent-amber)/60 bg-(--accent-amber)/5',
  },
  rose: {
    icon: 'text-[#ff6b9d]',
    amount: 'text-[#ff6b9d]',
    swatch: 'bg-[#ff6b9d]',
    editHover: 'hover:border-[#ff6b9d]/45 hover:text-[#ff6b9d]',
    rowAccent: 'border-l-[3px] border-l-[#ff6b9d]/55 bg-[#ff6b9d]/5',
  },
  violet: {
    icon: 'text-violet-400',
    amount: 'text-violet-400',
    swatch: 'bg-violet-500',
    editHover: 'hover:border-violet-400/45 hover:text-violet-400',
    rowAccent: 'border-l-[3px] border-l-violet-400/55 bg-violet-400/5',
  },
}

export const DEFAULT_NW_ASSET_ACCENT_KEY = 'cyan'

export function normalizeNwAssetAccentKey(key: string | null | undefined): string {
  return key && ACCENT[key] ? key : DEFAULT_NW_ASSET_ACCENT_KEY
}

export function getNwAssetAccentClasses(accentKey: string | null | undefined): {
  icon: string
  amount: string
  swatch: string
  editHover: string
  rowAccent: string
} {
  const k = normalizeNwAssetAccentKey(accentKey)
  return ACCENT[k]!
}
