import { Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGlobalSearch } from '../context/GlobalSearchContext'

type MobileHeaderProps = {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { open: openSearch } = useGlobalSearch()

  return (
    <header
      className="lg:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-(--border) bg-(--bg-card)/95 backdrop-blur-md px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
      role="banner"
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-(--border) bg-(--bg-dark) text-(--text-primary) hover:border-(--accent-cyan)/50 hover:text-(--accent-cyan) transition-colors"
        aria-label="Otwórz menu nawigacji"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <Link
        to="/dashboard"
        className="min-w-0 font-gaming text-lg font-bold tracking-widest outline-none focus:outline-none"
      >
        <span className="text-(--accent-cyan) drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">Life</span>
        <span className="text-(--text-primary)">OS</span>
      </Link>
      <button
        type="button"
        onClick={openSearch}
        className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-(--border) bg-(--bg-dark) text-(--text-muted) hover:border-(--accent-cyan)/50 hover:text-(--accent-cyan) transition-colors"
        aria-label="Wyszukaj (Ctrl+K)"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
    </header>
  )
}
