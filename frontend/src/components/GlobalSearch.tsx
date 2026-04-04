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
  Trophy,
  ChevronDown,
  ChevronRight,
  Receipt,
  Repeat,
  BarChart3,
  Sparkles,
  Zap,
  Lightbulb,
  BookMarked,
  Clock,
  FolderKanban,
  BookOpen,
  Award,
} from 'lucide-react'
import { useGlobalSearch } from '../context/GlobalSearchContext'

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
      { label: 'Zachcianki', route: '/finances/wishes', icon: Sparkles },
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
      { label: 'Szybkie notatki', route: '/notes/quick', icon: Zap },
      { label: 'Pomysły', route: '/notes/ideas', icon: Lightbulb },
      { label: 'Referencje', route: '/notes/references', icon: BookMarked },
    ],
  },
  { id: 'calendar', label: 'Kalendarz', route: '/calendar', icon: Calendar, keywords: ['wydarzenia', 'terminy'] },
  { id: 'todo', label: 'To-do', route: '/todo', icon: CheckSquare, keywords: ['zadania', 'lista'] },
  { id: 'habits', label: 'Nawyki', route: '/habits', icon: Target, keywords: ['cele', 'nawyki'] },
  { id: 'achievements', label: 'Osiągnięcia', route: '/achievements', icon: Trophy, keywords: ['odznaki', 'sukcesy'] },
  {
    id: 'nauka',
    label: 'Nauka',
    route: '/nauka',
    icon: GraduationCap,
    keywords: ['kursy', 'książki', 'projekty'],
    children: [
      { label: 'Przegląd', route: '/nauka', icon: LayoutDashboard },
      { label: 'Godziny kodowania', route: '/nauka/godziny', icon: Clock },
      { label: 'Kursy', route: '/nauka/kursy', icon: GraduationCap },
      { label: 'Projekty', route: '/nauka/projekty', icon: FolderKanban },
      { label: 'Książki', route: '/nauka/ksiazki', icon: BookOpen },
      { label: 'Certyfikaty', route: '/nauka/certyfikaty', icon: Award },
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="global-search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-9997 flex items-start justify-center pt-[15vh] px-4"
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-xl border border-(--border) bg-(--bg-card) shadow-[0_0_30px_rgba(0,229,255,0.08),0_0_60px_rgba(0,229,255,0.04)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Globalne wyszukiwanie"
          >
            <div className="p-4">
              <div className="global-search-field relative">
                <Search className="w-5 h-5 shrink-0 text-(--text-muted)" />
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
                  className="ml-auto p-2 -mr-2 rounded-lg hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--accent-cyan) transition-colors shrink-0"
                  aria-label="Zamknij"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="border-t border-(--border) max-h-[50vh] overflow-y-auto scrollbar-theme">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-base text-(--text-muted)">
                  Brak pasujących sekcji
                </div>
              ) : (
                <div className="py-2">
                  {filtered.map((item) => {
                    const Icon = item.icon
                    const hasChildren = item.children && item.children.length > 0
                    const isExpanded = expanded.has(item.id)

                    return (
                      <div key={item.id} className="mb-1 last:mb-0">
                        <div className="flex items-center group rounded-lg hover:bg-(--bg-card-hover)">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="shrink-0 p-1 rounded hover:bg-(--bg-card-hover) text-(--text-muted) hover:text-(--accent-cyan) transition-colors"
                              aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-6 shrink-0" />
                          )}
                          <div className="flex-1 flex items-center gap-3 px-3 py-2.5 border-l-2 border-l-transparent group-hover:border-l-(--accent-cyan) transition-all duration-200">
                            <Icon className="w-5 h-5 text-(--accent-cyan) shrink-0" />
                            {hasChildren ? (
                              <>
                                <span className="text-base text-(--text-primary) font-gaming flex-1">
                                  {item.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSelect(item.route)}
                                  className="text-sm text-(--text-muted) hover:text-(--accent-cyan) px-2 py-1 rounded hover:bg-(--bg-card-hover) transition-colors"
                                >
                                  Przegląd
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelect(item.route)}
                                className="flex-1 text-left"
                              >
                                <span className="text-base text-(--text-primary) font-gaming">
                                  {item.label}
                                </span>
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
                              <div className="pl-9 pr-2 pb-2 space-y-0.5">
                                {getFilteredChildren(item, query).map((child) => {
                                  const ChildIcon = child.icon
                                  return (
                                    <button
                                      key={child.route}
                                      type="button"
                                      onClick={() => handleSelect(child.route)}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-(--bg-card-hover) transition-colors"
                                    >
                                      <ChildIcon className="w-4 h-4 text-(--accent-cyan)/70 shrink-0" />
                                      <span className="text-sm text-(--text-primary) font-gaming">
                                        {child.label}
                                      </span>
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
            <div className="px-4 py-2 border-t border-(--border) flex items-center justify-center gap-4 text-xs text-(--text-muted)">
              <span><kbd className="px-1.5 py-0.5 rounded bg-(--bg-dark) border border-(--border) font-mono">Esc</kbd> zamknij</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-(--bg-dark) border border-(--border) font-mono text-(--accent-cyan)">Ctrl+K</kbd> otwórz</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
