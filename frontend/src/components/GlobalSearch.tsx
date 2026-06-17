import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  LayoutDashboard,
  Wallet,
  GraduationCap,
  StickyNote,
  Calendar,
  CheckSquare,
  Target,
  ChevronDown,
  ChevronRight,
  Receipt,
  Repeat,
  BarChart3,
  Inbox,
  Lightbulb,
  BookMarked,
  Archive,
  Clock,
  FolderKanban,
  BookOpen,
  Award,
} from 'lucide-react'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import { ModalShell } from './ModalShell'

interface NavItemChild {
  label: string
  route: string
  icon: typeof Search
}

interface NavItem {
  id: string
  label: string
  route: string
  icon: typeof Search
  keywords: string[]
  children?: NavItemChild[]
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard, keywords: ['strona główna', 'pulpit'] },
  {
    id: 'finances',
    label: 'Finanse',
    route: '/finances',
    icon: Wallet,
    keywords: ['pieniądze', 'transakcje', 'rachunki'],
    children: [
      { label: 'Przegląd', route: '/finances', icon: LayoutDashboard },
      { label: 'Transakcje', route: '/finances/transactions', icon: Receipt },
      { label: 'Stałe koszty', route: '/finances/recurring', icon: Repeat },
      { label: 'Wartość netto', route: '/finances/net-worth', icon: Wallet },
      { label: 'Analityka', route: '/finances/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'notes',
    label: 'Notatki',
    route: '/notes',
    icon: StickyNote,
    keywords: ['notatki', 'pomysły', 'referencje'],
    children: [
      { label: 'Przegląd', route: '/notes', icon: LayoutDashboard },
      { label: 'Inbox', route: '/notes/inbox', icon: Inbox },
      { label: 'Pomysły', route: '/notes/ideas', icon: Lightbulb },
      { label: 'Referencje', route: '/notes/references', icon: BookMarked },
      { label: 'Archiwum', route: '/notes/archive', icon: Archive },
    ],
  },
  { id: 'calendar', label: 'Kalendarz', route: '/calendar', icon: Calendar, keywords: ['wydarzenia', 'terminy'] },
  { id: 'todo', label: 'To-do', route: '/todo', icon: CheckSquare, keywords: ['zadania', 'lista'] },
  { id: 'habits', label: 'Nawyki', route: '/habits', icon: Target, keywords: ['cele', 'nawyki'] },
  {
    id: 'learning',
    label: 'Nauka',
    route: '/learning',
    icon: GraduationCap,
    keywords: ['kursy', 'książki', 'projekty'],
    children: [
      { label: 'Przegląd', route: '/learning', icon: LayoutDashboard },
      { label: 'Czas nauki', route: '/learning/hours', icon: Clock },
      { label: 'Kursy', route: '/learning/courses', icon: GraduationCap },
      { label: 'Projekty', route: '/learning/projects', icon: FolderKanban },
      { label: 'Książki', route: '/learning/books', icon: BookOpen },
      { label: 'Certyfikaty', route: '/learning/certificates', icon: Award },
    ],
  },
]

function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function matchesQuery(item: NavItem, query: string): boolean {
  if (!query.trim()) return true
  const nQuery = normalizeForSearch(query)
  const nLabel = normalizeForSearch(item.label)
  const nKeywords = item.keywords.map((k) => normalizeForSearch(k))
  const matchesParent = nLabel.includes(nQuery) || nKeywords.some((k) => k.includes(nQuery))
  if (matchesParent) return true
  if (item.children) {
    return item.children.some((c) => normalizeForSearch(c.label).includes(nQuery))
  }
  return false
}

function getFilteredChildren(item: NavItem, query: string): NavItemChild[] {
  if (!item.children) return []
  if (!query.trim()) return item.children
  const nQuery = normalizeForSearch(query)
  return item.children.filter((c) => normalizeForSearch(c.label).includes(nQuery))
}

/** Stopka palety: jawne Ctrl / Shift (bez symboli ⌃⌘). */
function ShortcutLegend({
  parts,
  accentClass,
}: {
  parts: string[]
  accentClass?: string
}) {
  return (
    <span className="inline-flex items-center gap-0.5 font-mono">
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && (
            <span className="text-(--text-muted) select-none" aria-hidden="true">
              +
            </span>
          )}
          <kbd
            className={`px-1.5 py-0.5 rounded bg-(--bg-dark) border border-(--border) ${accentClass ?? ''}`}
          >
            {part}
          </kbd>
        </span>
      ))}
    </span>
  )
}

export function GlobalSearch() {
  const { isOpen, close } = useGlobalSearch()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setExpanded(new Set())
      inputRef.current?.focus()
    }
  }, [isOpen])

  const filtered = useMemo(
    () => NAV_ITEMS.filter((item) => matchesQuery(item, query)),
    [query]
  )

  // Auto-rozwiń sekcje, gdy zapytanie pasuje do podstrony
  useEffect(() => {
    if (!query.trim()) return
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const item of filtered) {
        if (item.children?.some((c) => normalizeForSearch(c.label).includes(normalizeForSearch(query)))) {
          next.add(item.id)
        }
      }
      return next
    })
  }, [query, filtered])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelect = (route: string) => {
    navigate(route)
    close()
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={close}
      maxWidth="max-w-md"
      padding="p-0"
      zBackdrop={9996}
      zPanel={9997}
      backdropKey="global-search-backdrop"
      panelKey="global-search-panel"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Globalne wyszukiwanie"
        className="overflow-hidden"
      >
        <div className="p-4">
          <div className="global-search-field relative">
            <Search className="h-5 w-5 shrink-0 text-(--text-muted)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj sekcji..."
              className="font-gaming"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              onClick={close}
              className="-mr-2 ml-auto shrink-0 rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
              aria-label="Zamknij"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="scrollbar-theme max-h-[50vh] overflow-y-auto border-t border-(--border)">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-base text-(--text-muted)">Brak pasujących sekcji</div>
          ) : (
            <div className="py-2">
              {filtered.map((item) => {
                const Icon = item.icon
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expanded.has(item.id)

                return (
                  <div key={item.id} className="mb-1 last:mb-0">
                    <div className="group flex items-center rounded-lg hover:bg-(--bg-card-hover)">
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="shrink-0 rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
                          aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      ) : (
                        <span className="w-6 shrink-0" />
                      )}
                      <div className="flex flex-1 items-center gap-3 border-l-2 border-l-transparent px-3 py-2.5 transition-all duration-200 group-hover:border-l-(--accent-cyan)">
                        <Icon className="h-5 w-5 shrink-0 text-(--accent-cyan)" />
                        {hasChildren ? (
                          <>
                            <span className="flex-1 text-base font-gaming text-(--text-primary)">{item.label}</span>
                            <button
                              type="button"
                              onClick={() => handleSelect(item.route)}
                              className="rounded px-2 py-1 text-sm text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
                            >
                              Przegląd
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => handleSelect(item.route)} className="flex-1 text-left">
                            <span className="text-base font-gaming text-(--text-primary)">{item.label}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {hasChildren && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-0.5 pb-2 pl-9 pr-2">
                            {getFilteredChildren(item, query).map((child) => {
                              const ChildIcon = child.icon
                              return (
                                <button
                                  key={child.route}
                                  type="button"
                                  onClick={() => handleSelect(child.route)}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-(--bg-card-hover)"
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0 text-(--accent-cyan)/70" />
                                  <span className="text-sm font-gaming text-(--text-primary)">{child.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-(--border) px-4 py-2 text-sm text-(--text-muted)">
          <span>
            <kbd className="rounded border border-(--border) bg-(--bg-dark) px-1.5 py-0.5 font-mono">Esc</kbd> zamknij
          </span>
          <span>
            <ShortcutLegend parts={['Ctrl', 'K']} accentClass="text-(--accent-cyan)" /> paleta
          </span>
          <span>
            <ShortcutLegend parts={['Ctrl', 'E']} accentClass="text-(--accent-magenta)" /> wydatek
          </span>
          <span>
            <ShortcutLegend parts={['Ctrl', 'I']} accentClass="text-(--accent-green)" /> przychód
          </span>
          <span>
            <ShortcutLegend parts={['Ctrl', 'Shift', 'Y']} accentClass="text-(--accent-amber)" /> notatka
          </span>
          <span>
            <ShortcutLegend parts={['Ctrl', 'Shift', 'L']} accentClass="text-(--accent-cyan)/90" /> to-do
          </span>
        </div>
      </div>
    </ModalShell>
  )
}
