import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/Card'
import {
  Clock,
  GraduationCap,
  BookOpen,
  Target,
  ArrowRight,
  Plus,
  FolderKanban,
  Tag,
} from 'lucide-react'
import { useLearning } from '../../context/LearningContext'
import { formatMinutes, SESSION_TYPE_OPTIONS } from './learningUtils'
import { PomodoroCardButton } from '../../components/learning/PomodoroTimer'

export function LearningOverview() {
  const learning = useLearning()
  const navigate = useNavigate()

  const sessions = useMemo(() => learning?.sessions ?? [], [learning])
  const courses = useMemo(() => learning?.courses ?? [], [learning])
  const projects = useMemo(() => learning?.projects ?? [], [learning])
  const books = useMemo(() => learning?.books ?? [], [learning])

  const totalMinutes = useMemo(() => sessions.reduce((s, h) => s + h.minutes, 0), [sessions])

  const weekProgress = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    const startStr = startOfWeek.toISOString().split('T')[0]
    const endStr = now.toISOString().split('T')[0]
    return sessions
      .filter((s) => s.date >= startStr && s.date <= endStr)
      .reduce((sum, s) => sum + s.minutes, 0)
  }, [sessions])

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 5),
    [sessions],
  )

  const activeCourses = useMemo(
    () => courses.filter((c) => c.status === 'w_trakcie').slice(0, 3),
    [courses],
  )

  const activeProjects = useMemo(
    () =>
      projects
        .filter((p) => p.status !== 'ukonczony' && p.status !== 'porzucony')
        .sort((a, b) => {
          const pri = { wysoki: 0, sredni: 1, niski: 2 }
          return (pri[a.priority ?? 'niski'] ?? 2) - (pri[b.priority ?? 'niski'] ?? 2)
        })
        .slice(0, 3),
    [projects],
  )

  const readingBooks = useMemo(
    () => books.filter((b) => b.status === 'czytam').slice(0, 3),
    [books],
  )

  // Recent topic chips from last 10 sessions
  const recentTopics = useMemo(() => {
    const seen = new Set<string>()
    return sessions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((s) => {
        const key = s.category || s.topic
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 5)
      .map((s) => s.category || s.topic)
  }, [sessions])

  const nextStepItem = useMemo(() => {
    const highPriProject = projects.find(
      (p) =>
        p.priority === 'wysoki' &&
        p.nextStep &&
        p.status !== 'ukonczony' &&
        p.status !== 'porzucony',
    )
    if (highPriProject) return { label: highPriProject.name, step: highPriProject.nextStep! }
    const activeCourse = courses.find((c) => c.status === 'w_trakcie' && c.nextLesson)
    if (activeCourse) return { label: activeCourse.name, step: activeCourse.nextLesson! }
    return null
  }, [projects, courses])

  if (!learning) return null

  const weeklyGoal = learning.weeklyGoalMinutes
  const goalPercent = Math.min(100, Math.round((weekProgress / weeklyGoal) * 100))

  const hasAnythingActive =
    activeCourses.length > 0 || activeProjects.length > 0 || readingBooks.length > 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-(--accent-cyan)/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-(--accent-cyan)" />
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Łącznie</p>
          </div>
          <p className="text-2xl font-bold font-gaming text-(--accent-cyan)">{formatMinutes(totalMinutes)}</p>
          <p className="text-sm text-(--text-muted) mt-0.5">{sessions.length} sesji</p>
        </Card>

        <Card className="border-(--accent-green)/20">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-(--accent-green)" />
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Ten tydzień</p>
          </div>
          <p className="text-2xl font-bold font-gaming text-(--accent-green)">{formatMinutes(weekProgress)}</p>
          <p className="text-sm text-(--text-muted) mt-0.5">{goalPercent}% celu</p>
        </Card>

        <Card className="border-(--accent-magenta)/20">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-(--accent-magenta)" />
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Kursy</p>
          </div>
          <p className="text-2xl font-bold font-gaming text-(--accent-magenta)">
            {courses.filter((c) => c.status === 'w_trakcie').length} aktywne
          </p>
          <p className="text-sm text-(--text-muted) mt-0.5">
            {courses.filter((c) => c.status === 'ukonczony').length} ukończonych
          </p>
        </Card>

        <Card className="border-(--accent-amber)/20">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-(--accent-amber)" />
            <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">Książki</p>
          </div>
          <p className="text-2xl font-bold font-gaming text-(--accent-amber)">
            {books.filter((b) => b.status === 'czytam').length} czytam
          </p>
          <p className="text-sm text-(--text-muted) mt-0.5">
            {books.filter((b) => b.status === 'przeczytane').length} przeczytanych
          </p>
        </Card>
      </div>

      {/* Timer — primary CTA, right under stats */}
      <Card>
        <PomodoroCardButton />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currently learning — courses + projects + books */}
        <Card title="Aktualnie uczysz się">
          {!hasAnythingActive ? (
            <div className="space-y-3">
              <p className="text-base text-(--text-muted)">Nic aktywnego. Zacznij kurs, projekt lub książkę.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/learning/courses')}
                  className="text-sm text-(--accent-cyan) hover:underline font-gaming"
                >
                  + Dodaj kurs
                </button>
                <button
                  onClick={() => navigate('/learning/projects')}
                  className="text-sm text-(--accent-green) hover:underline font-gaming"
                >
                  + Projekt
                </button>
                <button
                  onClick={() => navigate('/learning/books')}
                  className="text-sm text-(--accent-amber) hover:underline font-gaming"
                >
                  + Książka
                </button>
              </div>
              {recentTopics.length > 0 && (
                <div className="pt-2 border-t border-(--border)">
                  <p className="text-xs text-(--text-muted) font-gaming uppercase tracking-widest mb-2">
                    Ostatnie tematy
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentTopics.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-(--bg-dark) border border-(--border) text-sm font-gaming text-(--text-muted)"
                      >
                        <Tag className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active courses */}
              {activeCourses.length > 0 && (
                <div className="space-y-3">
                  {activeCourses.map((c) => (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GraduationCap className="w-3.5 h-3.5 text-(--accent-magenta) shrink-0" />
                          <p className="font-gaming text-(--text-primary) text-sm truncate">{c.name}</p>
                        </div>
                        <span className="text-sm font-mono text-(--accent-cyan) shrink-0">{c.progress}%</span>
                      </div>
                      {c.nextLesson && (
                        <p className="text-sm text-(--text-muted) flex items-center gap-1 pl-5">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.nextLesson}</span>
                        </p>
                      )}
                      <div className="h-1.5 rounded-full bg-(--bg-dark) overflow-hidden">
                        <div
                          className="h-full bg-(--accent-cyan) rounded-full transition-all"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active projects */}
              {activeProjects.length > 0 && (
                <div className={activeCourses.length > 0 ? 'pt-3 border-t border-(--border)' : ''}>
                  {activeProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 py-1"
                      onClick={() => navigate('/learning/projects')}
                      role="button"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FolderKanban className="w-3.5 h-3.5 text-(--accent-green) shrink-0" />
                        <p className="font-gaming text-(--text-primary) text-sm truncate">{p.name}</p>
                      </div>
                      {p.nextStep && (
                        <p className="text-sm text-(--text-muted) truncate max-w-[120px]">{p.nextStep}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reading books */}
              {readingBooks.length > 0 && (
                <div
                  className={
                    activeCourses.length > 0 || activeProjects.length > 0
                      ? 'pt-3 border-t border-(--border)'
                      : ''
                  }
                >
                  {readingBooks.map((b) => (
                    <div key={b.id} className="flex items-center gap-1.5 py-1 min-w-0">
                      <BookOpen className="w-3.5 h-3.5 text-(--accent-amber) shrink-0" />
                      <p className="font-gaming text-(--text-primary) text-sm truncate">{b.title}</p>
                      {b.author && (
                        <span className="text-sm text-(--text-muted) shrink-0">— {b.author}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/learning/courses')}
                className="text-sm text-(--accent-cyan) hover:underline font-gaming"
              >
                Zarządzaj →
              </button>
            </div>
          )}
        </Card>

        {/* Last sessions */}
        <Card title="Ostatnie sesje">
          {recentSessions.length === 0 ? (
            <div className="space-y-3">
              <p className="text-base text-(--text-muted)">Brak sesji.</p>
              <button
                onClick={() => navigate('/learning/hours')}
                className="text-sm text-(--accent-cyan) hover:underline font-gaming"
              >
                + Dodaj sesję
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => {
                const typeOpt = SESSION_TYPE_OPTIONS.find((o) => o.value === s.type)
                return (
                  <div key={s.id} className="flex items-center justify-between py-1 gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-gaming text-(--text-primary) truncate max-w-[180px]"
                        title={s.topic}
                      >
                        {s.topic}
                      </p>
                      <p className="text-xs text-(--text-muted)">
                        {s.date}
                        {typeOpt && ` · ${typeOpt.label}`}
                        {s.category && ` · ${s.category}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-(--accent-cyan) shrink-0">
                      {formatMinutes(s.minutes)}
                    </span>
                  </div>
                )
              })}
              <button
                onClick={() => navigate('/learning/hours')}
                className="text-sm text-(--accent-cyan) hover:underline font-gaming pt-1"
              >
                Historia →
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Next step */}
      {nextStepItem && (
        <Card>
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-(--accent-cyan) mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-(--text-muted) font-gaming uppercase tracking-widest mb-0.5">
                Następny krok
              </p>
              <p className="text-base font-gaming text-(--text-primary)">{nextStepItem.step}</p>
              <p className="text-sm text-(--text-muted) mt-0.5">{nextStepItem.label}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <Card title="Szybkie akcje">
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: 'Sesja',
              route: '/learning/hours',
              cls: 'text-(--accent-cyan) border-(--accent-cyan)/30 hover:bg-(--accent-cyan)/10',
            },
            {
              label: 'Kurs',
              route: '/learning/courses',
              cls: 'text-(--accent-magenta) border-(--accent-magenta)/30 hover:bg-(--accent-magenta)/10',
            },
            {
              label: 'Książka',
              route: '/learning/books',
              cls: 'text-(--accent-amber) border-(--accent-amber)/30 hover:bg-(--accent-amber)/10',
            },
            {
              label: 'Projekt',
              route: '/learning/projects',
              cls: 'text-(--accent-green) border-(--accent-green)/30 hover:bg-(--accent-green)/10',
            },
          ].map((action) => (
            <button
              key={action.route}
              type="button"
              onClick={() => navigate(action.route)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-gaming text-sm transition-colors ${action.cls}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
