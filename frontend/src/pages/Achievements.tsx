import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../components/Card'
import { motion } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { achievementsApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import { useAuthenticatedQueryEnabled } from '../hooks/useAuthenticatedQueryEnabled'

type Rarity = 'common' | 'rare' | 'epic' | 'legend'

interface AchievementDef {
  id: string
  title: string
  description: string
  rarity: Rarity
}

const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  { id: 'first_expense', title: 'Pierwszy krok', description: 'Dodaj pierwszy wydatek', rarity: 'common' },
  { id: 'first_income', title: 'Źródło dochodu', description: 'Dodaj pierwszy przychód', rarity: 'common' },
  { id: 'first_todo', title: 'Lista zadań', description: 'Dodaj pierwsze zadanie', rarity: 'common' },
  { id: 'first_wish', title: 'Marzenie', description: 'Dodaj pierwszą zachciankę', rarity: 'common' },
  { id: 'wishes_5', title: 'Lista marzeń', description: 'Dodaj 5 zachcianek', rarity: 'common' },
  { id: 'savings_1000', title: 'Oszczędny', description: 'Zaoszczędź 1000 zł w miesiącu', rarity: 'rare' },
  { id: 'streak_7', title: 'Streak tygodnia', description: 'Uzupełniaj dane przez 7 dni z rzędu', rarity: 'epic' },
  { id: 'budget_master', title: 'Mistrz budżetu', description: 'Nie przekrocz budżetu przez 3 miesiące', rarity: 'legend' },
]

const rarityStyles: Record<Rarity, string> = {
  common: 'border-(--text-muted) text-(--text-muted)',
  rare: 'border-(--accent-cyan)/50 text-(--accent-cyan) shadow-[0_0_12px_rgba(0,229,255,0.15)]',
  epic: 'border-(--accent-magenta)/50 text-(--accent-magenta) shadow-[0_0_12px_rgba(255,0,212,0.15)]',
  legend: 'border-(--accent-amber) text-(--accent-amber) shadow-[0_0_12px_rgba(255,184,0,0.2)]',
}

const DEMO_UNLOCKED = ['first_expense', 'first_income', 'wishes_5']

export function Achievements() {
  const { isDemoMode, user } = useAuth()
  const userId = user?.id ?? ''
  const queryEnabled = useAuthenticatedQueryEnabled() && !!userId

  const { data: apiAchievements = [], isPending } = useQuery({
    queryKey: queryKeys.achievements(userId),
    queryFn: () => achievementsApi.getAll(),
    enabled: queryEnabled,
  })

  const unlockedMap = useMemo(() => {
    if (isDemoMode) {
      return new Map(DEMO_UNLOCKED.map((id) => [id, '2025-03-01']))
    }
    return new Map(apiAchievements.map((a) => [a.achievementId, a.unlockedAt.split('T')[0]]))
  }, [isDemoMode, apiAchievements])

  const loading = !isDemoMode && isPending

  const achievements = ACHIEVEMENTS_CATALOG.map((def) => ({
    ...def,
    unlocked: unlockedMap.has(def.id),
    unlockedAt: unlockedMap.get(def.id),
  }))

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-base text-(--text-muted)">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-primary) font-gaming tracking-wider">
          OSIĄGNIĘCIA
        </h1>
        <p className="text-base text-(--text-muted) mt-1 font-gaming tracking-wide">
          {unlockedCount} / {ACHIEVEMENTS_CATALOG.length} odblokowanych
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((a) => (
          <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card
              className={`h-full border-2 ${rarityStyles[a.rarity]} ${
                a.unlocked ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${a.unlocked ? 'bg-(--accent-cyan)/10' : 'bg-(--bg-dark)'}`}
                >
                  {a.unlocked ? (
                    <Trophy className="w-6 h-6 text-(--accent-amber)" />
                  ) : (
                    <Lock className="w-6 h-6 text-(--text-muted)" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-gaming font-bold text-(--text-primary)">{a.title}</p>
                  <p className="text-base text-(--text-muted) mt-1">{a.description}</p>
                  {a.unlocked && a.unlockedAt && (
                    <p className="text-sm text-(--accent-cyan) mt-2 font-mono">{a.unlockedAt}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
