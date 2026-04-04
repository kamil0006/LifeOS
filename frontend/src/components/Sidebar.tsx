import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Trophy,
  Calendar as CalendarIcon,
  Target,
  GraduationCap,
  StickyNote,
  LogOut,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import { useOnboarding } from '../context/OnboardingContext'
import { Tooltip } from './Tooltip'
import { Search } from 'lucide-react'

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
      { to: '/nauka', icon: GraduationCap, label: 'Nauka' },
      { to: '/achievements', icon: Trophy, label: 'Osiągnięcia' },
    ],
  },
]

export function Sidebar() {
  const { user, logout, isDemoMode } = useAuth()
  const { open: openSearch } = useGlobalSearch()
  const { open: openOnboarding } = useOnboarding()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 border-r border-(--border) bg-(--bg-card)/95 flex flex-col relative">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/50 to-transparent" />
      <div className="p-6 border-b border-(--border)">
        <Link
          to="/dashboard"
          className="block text-xl font-bold tracking-widest font-gaming hover:opacity-90 transition-opacity outline-none focus:outline-none"
          title="Przejdź do Dashboard"
        >
          <span className="text-(--accent-cyan) drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">Life</span>
          <span className="text-(--text-primary)">OS</span>
        </Link>
        <p className="text-sm text-(--text-muted) mt-1 font-mono tracking-wider">
          v0.1.0
        </p>
        <div className="mt-2 flex gap-2">
          <Tooltip content="Szybkie wyszukiwanie (Ctrl+K)">
            <button
              type="button"
              onClick={openSearch}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-(--border) bg-(--bg-dark) text-(--text-muted) hover:text-(--accent-cyan) hover:border-(--accent-cyan)/50 transition-colors text-xs font-gaming"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Wyszukaj</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-(--bg-card) border border-(--border) font-mono text-[10px]">Ctrl+K</kbd>
            </button>
          </Tooltip>
          <Tooltip content="Samouczek – co jest w aplikacji">
            <button
              type="button"
              onClick={openOnboarding}
              className="flex items-center justify-center p-2 rounded-lg border border-(--border) bg-(--bg-dark) text-(--text-muted) hover:text-(--accent-cyan) hover:border-(--accent-cyan)/50 transition-colors"
              aria-label="Otwórz samouczek"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
      <nav className="flex-1 p-5 overflow-y-auto scrollbar-theme space-y-7">
        {navSections.map((section) => (
          <div key={section.label ?? 'dashboard'}>
            {section.label && (
              <p className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-(--text-muted)">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg border outline-none focus:outline-none transition-[background-color,color,border-color,box-shadow] duration-200 ease-out ${
                      isActive
                        ? 'bg-(--glow-cyan) text-(--accent-cyan) border border-(--accent-cyan)/40 shadow-[0_0_15px_rgba(0,229,255,0.15),0_0_30px_rgba(0,229,255,0.06)]'
                        : 'text-(--text-muted) border-transparent hover:bg-(--bg-card-hover) hover:text-(--text-primary)'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-5 h-5 shrink-0 transition-[filter] duration-200 ${isActive ? 'drop-shadow-[0_0_4px_rgba(0,229,255,0.6)]' : ''}`} />
                      <span className="font-medium tracking-wide">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-(--border) space-y-2">
        {isDemoMode ? (
          <>
            <p className="text-sm text-(--text-muted) font-mono">Demo (dane przykładowe)</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Wyjdź z demo
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-(--text-muted) truncate" title={user?.email}>
              {user?.email}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Wyloguj
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
