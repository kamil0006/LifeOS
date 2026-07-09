import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { learningAddBtnClass } from '../../components/learning/learningFormClasses'
import { useLearning } from '../../context/LearningContext'
import { formatMinutes, SESSION_TYPE_OPTIONS } from './learningUtils'
import { PomodoroCardButton } from '../../components/learning/PomodoroTimer'

export function LearningOverview() {
  const { t } = useTranslation('learning')
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-(--accent)/20 max-md:p-4">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-(--accent)" />
            <p className="text-sm text-(--text-muted)">{t('overview.statTotal')}</p>
          </div>
          <p className="text-xl font-bold text-(--accent) sm:text-2xl">{formatMinutes(totalMinutes)}</p>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            {t('overview.statSessions', { count: sessions.length })}
          </p>
        </Card>

        <Card className="border-(--positive)/20 max-md:p-4">
          <div className="mb-1 flex items-center gap-2">
            <Target className="h-4 w-4 shrink-0 text-(--positive)" />
            <p className="text-sm text-(--text-muted)">{t('overview.statThisWeek')}</p>
          </div>
          <p className="text-xl font-bold text-(--positive) sm:text-2xl">{formatMinutes(weekProgress)}</p>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            {t('overview.statGoalPercent', { percent: goalPercent })}
          </p>
        </Card>

        <Card className="border-(--accent-2)/20 max-md:p-4">
          <div className="mb-1 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-(--accent-2)" />
            <p className="text-sm text-(--text-muted)">{t('overview.statCourses')}</p>
          </div>
          <p className="text-xl font-bold text-(--accent-2) sm:text-2xl">
            {t('overview.statCoursesActive', { count: courses.filter((c) => c.status === 'w_trakcie').length })}
          </p>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            {t('overview.statCoursesCompleted', { count: courses.filter((c) => c.status === 'ukonczony').length })}
          </p>
        </Card>

        <Card className="border-(--warning)/20 max-md:p-4">
          <div className="mb-1 flex items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-(--warning)" />
            <p className="text-sm text-(--text-muted)">{t('overview.statBooks')}</p>
          </div>
          <p className="text-xl font-bold text-(--warning) sm:text-2xl">
            {t('overview.statBooksReading', { count: books.filter((b) => b.status === 'czytam').length })}
          </p>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            {t('overview.statBooksRead', { count: books.filter((b) => b.status === 'przeczytane').length })}
          </p>
        </Card>
      </div>

      {/* Timer — primary CTA, right under stats */}
      <Card>
        <PomodoroCardButton />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currently learning — courses + projects + books */}
        <Card title={t('overview.currentlyLearning')}>
          {!hasAnythingActive ? (
            <div className="space-y-3">
              <p className="text-base text-(--text-muted)">{t('overview.nothingActive')}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate('/learning/courses')}
                  className={learningAddBtnClass}
                >
                  <Plus className="h-4 w-4" />
                  {t('overview.addCourse')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/learning/projects')}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-(--positive)/40 bg-(--positive)/15 px-4 py-2 text-base font-medium text-(--positive) transition-colors hover:bg-(--positive)/25"
                >
                  <Plus className="h-4 w-4" />
                  {t('overview.addProject')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/learning/books')}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-(--warning)/40 bg-(--warning)/15 px-4 py-2 text-base font-medium text-(--warning) transition-colors hover:bg-(--warning)/25"
                >
                  <Plus className="h-4 w-4" />
                  {t('overview.addBook')}
                </button>
              </div>
              {recentTopics.length > 0 && (
                <div className="pt-2 border-t border-(--border)">
                  <p className="text-xs text-(--text-muted) font-display uppercase tracking-widest mb-2">
                    {t('overview.recentTopics')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentTopics.map((topic) => (
                      <span
                        key={topic}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-(--bg-dark) border border-(--border) text-sm font-display text-(--text-muted)"
                      >
                        <Tag className="w-3 h-3" />
                        {topic}
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
                          <GraduationCap className="w-3.5 h-3.5 text-(--accent-2) shrink-0" />
                          <p className="font-display text-(--text-primary) text-sm truncate">{c.name}</p>
                        </div>
                        <span className="text-sm font-mono text-(--accent) shrink-0">{c.progress}%</span>
                      </div>
                      {c.nextLesson && (
                        <p className="text-sm text-(--text-muted) flex items-center gap-1 pl-5">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.nextLesson}</span>
                        </p>
                      )}
                      <div className="h-1.5 rounded-full bg-(--bg-dark) overflow-hidden">
                        <div
                          className="h-full bg-(--accent) rounded-full transition-all"
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
                        <FolderKanban className="w-3.5 h-3.5 text-(--positive) shrink-0" />
                        <p className="font-display text-(--text-primary) text-sm truncate">{p.name}</p>
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
                      <BookOpen className="w-3.5 h-3.5 text-(--warning) shrink-0" />
                      <p className="font-display text-(--text-primary) text-sm truncate">{b.title}</p>
                      {b.author && (
                        <span className="text-sm text-(--text-muted) shrink-0">— {b.author}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/learning/courses')}
                className="text-sm text-(--accent) hover:underline font-display"
              >
                {t('overview.manage')}
              </button>
            </div>
          )}
        </Card>

        {/* Last sessions */}
        <Card title={t('overview.recentSessions')}>
          {recentSessions.length === 0 ? (
            <div className="space-y-3">
              <p className="text-base text-(--text-muted)">{t('overview.noSessions')}</p>
              <button
                type="button"
                onClick={() => navigate('/learning/hours')}
                className={learningAddBtnClass}
              >
                <Plus className="h-4 w-4" />
                {t('overview.addSession')}
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
                        className="text-sm font-display text-(--text-primary) truncate max-w-[180px]"
                        title={s.topic}
                      >
                        {s.topic}
                      </p>
                      <p className="text-xs text-(--text-muted)">
                        {s.date}
                        {typeOpt && ` · ${t(`sessionType.${typeOpt.value}`)}`}
                        {s.category && ` · ${s.category}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-(--accent) shrink-0">
                      {formatMinutes(s.minutes)}
                    </span>
                  </div>
                )
              })}
              <button
                onClick={() => navigate('/learning/hours')}
                className="text-sm text-(--accent) hover:underline font-display pt-1"
              >
                {t('overview.history')}
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Next step */}
      {nextStepItem && (
        <Card>
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-(--accent) mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-(--text-muted) font-display uppercase tracking-widest mb-0.5">
                {t('overview.nextStep')}
              </p>
              <p className="text-base font-display text-(--text-primary)">{nextStepItem.step}</p>
              <p className="text-sm text-(--text-muted) mt-0.5">{nextStepItem.label}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <Card title={t('overview.quickActions')} className="max-md:p-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {[
            {
              labelKey: 'quickSession',
              route: '/learning/hours',
              cls: 'border-(--accent)/30 text-(--accent) hover:bg-(--accent)/10',
            },
            {
              labelKey: 'quickCourse',
              route: '/learning/courses',
              cls: 'border-(--accent-2)/30 text-(--accent-2) hover:bg-(--accent-2)/10',
            },
            {
              labelKey: 'quickBook',
              route: '/learning/books',
              cls: 'border-(--warning)/30 text-(--warning) hover:bg-(--warning)/10',
            },
            {
              labelKey: 'quickProject',
              route: '/learning/projects',
              cls: 'border-(--positive)/30 text-(--positive) hover:bg-(--positive)/10',
            },
          ].map((action) => (
            <button
              key={action.route}
              type="button"
              onClick={() => navigate(action.route)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${action.cls}`}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {t(`overview.${action.labelKey}`)}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
