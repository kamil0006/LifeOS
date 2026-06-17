import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Bitcoin,
  Briefcase,
  Building2,
  Car,
  CircleDollarSign,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  Receipt,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react'

const NW_ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  home: Home,
  car: Car,
  wallet: Wallet,
  piggyBank: PiggyBank,
  briefcase: Briefcase,
  bitcoin: Bitcoin,
  trendingUp: TrendingUp,
  building2: Building2,
  smartphone: Smartphone,
  heartPulse: HeartPulse,
  graduationCap: GraduationCap,
  receipt: Receipt,
  creditCard: CreditCard,
  banknote: Banknote,
  circleDollar: CircleDollarSign,
}

/** Ikony pod wybór przy dodawaniu aktywa (klucze zapisujemy w koncie / demo). */
export const NW_ASSET_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'landmark', label: 'Bank, lokata' },
  { key: 'home', label: 'Dom, mieszkanie' },
  { key: 'car', label: 'Pojazd' },
  { key: 'trendingUp', label: 'Inwestycje' },
  { key: 'bitcoin', label: 'Krypto' },
  { key: 'piggyBank', label: 'Oszczędności' },
  { key: 'briefcase', label: 'Firma' },
  { key: 'wallet', label: 'Portfel' },
  { key: 'building2', label: 'Nieruchomość' },
  { key: 'circleDollar', label: 'Inne' },
]

export const NW_LIABILITY_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'creditCard', label: 'Karta, limit' },
  { key: 'building2', label: 'Hipoteka, kredyt' },
  { key: 'car', label: 'Leasing, auto' },
  { key: 'graduationCap', label: 'Kredyt studencki' },
  { key: 'receipt', label: 'Pożyczka' },
  { key: 'smartphone', label: 'Raty, telefon' },
  { key: 'heartPulse', label: 'Zdrowie' },
  { key: 'landmark', label: 'Kredyt bankowy' },
  { key: 'banknote', label: 'Gotówkowe' },
  { key: 'circleDollar', label: 'Inne' },
]

export function getNetWorthAccountIconKey(kind: 'asset' | 'liability'): string {
  return kind === 'asset' ? 'landmark' : 'creditCard'
}

export function getNetWorthAccountIcon(iconKey: string | null | undefined): LucideIcon {
  if (iconKey && NW_ICON_MAP[iconKey]) return NW_ICON_MAP[iconKey]
  return CircleDollarSign
}
