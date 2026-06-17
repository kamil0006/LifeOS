import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Target,
  Menu,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finances',  icon: Wallet,          label: 'Finanse'   },
  { to: '/todo',      icon: CheckSquare,     label: 'To-do'     },
  { to: '/habits',    icon: Target,          label: 'Nawyki'    },
] as const

type Props = {
  onMoreClick: () => void
}

export function MobileBottomNav({ onMoreClick }: Props) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-(--border) bg-(--bg-card)/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Główna nawigacja"
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-xs font-medium transition-colors duration-150 outline-none ${
              isActive
                ? 'text-(--accent-cyan) drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]'
                : 'text-(--text-muted) hover:text-(--text-primary)'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-150 ${
                  isActive ? 'scale-110' : ''
                }`}
                aria-hidden
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Przycisk "Więcej" otwiera MobileDrawer */}
      <button
        type="button"
        onClick={onMoreClick}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-xs font-medium text-(--text-muted) hover:text-(--text-primary) transition-colors duration-150 outline-none"
        aria-label="Więcej opcji nawigacji"
      >
        <Menu className="h-5 w-5 shrink-0" aria-hidden />
        <span>Więcej</span>
      </button>
    </nav>
  )
}
