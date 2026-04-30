import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Calendar as CalendarIcon,
  Target,
  GraduationCap,
  StickyNote,
  LogOut,
  HelpCircle,
  Search,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import { useOnboarding } from '../context/OnboardingContext'
import { Tooltip } from './Tooltip'

const navSections = [
  {
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Organizacja',
    items: [
      { to: '/calendar', icon: CalendarIcon, label: 'Kalendarz' },
      { to: '/todo', icon: CheckSquare, label: 'To-do' },
      { to: '/notes', icon: StickyNote, label: 'Notatki' },
    ],
  },
  {
    label: 'Finanse',
    items: [{ to: '/finances', icon: Wallet, label: 'Finanse' }],
  },
  {
    label: 'Rozwój',
    items: [
      { to: '/habits', icon: Target, label: 'Nawyki' },
      { to: '/learning', icon: GraduationCap, label: 'Nauka' },
    ],
  },
]

export type AppNavPanelProps = {
  /** Wywoływane po przejściu w nawigacji (np. zamknięcie menu mobilnego). */
  onNavigate?: () => void
  /** Gdy ustawione, pokazuje przycisk X (tylko w drawerze mobilnym). */
  mobileClose?: () => void
}

export function AppNavPanel({ onNavigate, mobileClose }: AppNavPanelProps) {
  const { user, logout, isDemoMode } = useAuth()
  const { open: openSearch } = useGlobalSearch()
  const { open: openOnboarding } = useOnboarding()
  const navigate = useNavigate()

  const handleLogout = () => {
    onNavigate?.()
    logout()
    navigate('/login')
  }

  return (
    <>
      <div className="p-6 border-b border-(--border)">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to="/dashboard"
              onClick={() => onNavigate?.()}
              className="block text-xl font-bold tracking-widest font-gaming hover:opacity-90 transition-opacity outline-none focus:outline-none"
              title="Przejdź do Dashboard"
            >
              <span className="text-(--accent-cyan) drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">Life</span>
              <span className="text-(--text-primary)">OS</span>
            </Link>
            <p className="text-sm text-(--text-muted) mt-1 font-mono tracking-wider">v0.1.0</p>
            <div className="mt-2 flex gap-2">
              <Tooltip content="Szybkie wyszukiwanie (Ctrl+K)">
                <button
                  type="button"
                  onClick={() => {
                    openSearch()
                    onNavigate?.()
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-(--border) bg-(--bg-dark) px-3 py-2.5 text-xs font-gaming text-(--text-muted) transition-colors hover:border-(--accent-cyan)/50 hover:text-(--accent-cyan) min-h-[44px]"
                >
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span>Wyszukaj</span>
                  <kbd className="ml-1 hidden rounded border border-(--border) bg-(--bg-card) px-1.5 py-0.5 font-mono text-[10px] sm:inline">Ctrl+K</kbd>
                </button>
              </Tooltip>
              <Tooltip content="Samouczek – co jest w aplikacji">
                <button
                  type="button"
                  onClick={() => {
                    openOnboarding()
                    onNavigate?.()
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-lg border border-(--border) bg-(--bg-dark) p-0 text-(--text-muted) transition-colors hover:border-(--accent-cyan)/50 hover:text-(--accent-cyan)"
                  aria-label="Otwórz samouczek"
                >
                  <HelpCircle
                    className="size-[18px] shrink-0 text-current [stroke-linecap:round] [stroke-linejoin:round]"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              </Tooltip>
            </div>
          </div>
          {mobileClose && (
            <button
              type="button"
              onClick={mobileClose}
              className="lg:hidden shrink-0 flex h-11 w-11 items-center justify-center rounded-lg border border-(--border) bg-(--bg-dark) text-(--text-muted) transition-colors hover:border-(--accent-cyan)/50 hover:text-(--accent-cyan)"
              aria-label="Zamknij menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <nav className="scrollbar-theme min-h-0 flex-1 space-y-7 overflow-y-auto p-5">
        {navSections.map((section) => (
          <div key={section.label ?? 'dashboard'}>
            {section.label && (
              <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-(--text-muted)">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    `flex min-h-[44px] items-center gap-3 rounded-lg border px-4 py-3 outline-none transition-[background-color,color,border-color,box-shadow] duration-200 ease-out focus:outline-none ${
                      isActive
                        ? 'border border-(--accent-cyan)/40 bg-(--glow-cyan) text-(--accent-cyan) shadow-[0_0_15px_rgba(0,229,255,0.15),0_0_30px_rgba(0,229,255,0.06)]'
                        : 'border-transparent text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary)'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`h-5 w-5 shrink-0 transition-[filter] duration-200 ${isActive ? 'drop-shadow-[0_0_4px_rgba(0,229,255,0.6)]' : ''}`}
                      />
                      <span className="font-medium tracking-wide">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-(--border) p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {isDemoMode ? (
          <>
            <p className="text-sm text-(--text-muted) font-mono">Demo (dane przykładowe)</p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[44px] items-center gap-2 text-sm text-(--text-muted) transition-colors hover:text-(--accent-cyan)"
            >
              <LogOut className="h-3 w-3" />
              Wyjdź z demo
            </button>
          </>
        ) : (
          <>
            <p className="truncate text-sm text-(--text-muted)" title={user?.email}>
              {user?.email}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[44px] items-center gap-2 text-sm text-(--text-muted) transition-colors hover:text-(--accent-cyan)"
            >
              <LogOut className="h-3 w-3" />
              Wyloguj
            </button>
          </>
        )}
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <aside className="relative hidden h-full min-h-0 w-64 shrink-0 overflow-y-auto border-r border-(--border) bg-(--bg-card)/95 scrollbar-theme lg:flex lg:flex-col">
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-(--accent-cyan)/50 to-transparent" />
      <AppNavPanel />
    </aside>
  )
}
