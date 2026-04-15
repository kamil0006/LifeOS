import { useMemo } from 'react'
import { Card } from '../../components/Card'
import { Clock, GraduationCap, FolderKanban, BookOpen, Award } from 'lucide-react'
import { useLearning } from '../../context/LearningContext'

export function LearningOverview() {
  const learning = useLearning()

  const codingHours = useMemo(() => learning?.codingHours ?? [], [learning])
  const courses = useMemo(() => learning?.courses ?? [], [learning])
  const projects = useMemo(() => learning?.projects ?? [], [learning])
  const books = useMemo(() => learning?.books ?? [], [learning])
  const certifications = useMemo(() => learning?.certifications ?? [], [learning])

  const totalHours = useMemo(
    () => codingHours.reduce((s, h) => s + h.hours, 0),
    [codingHours]
  )
  const hoursThisMonth = useMemo(() => {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return codingHours
      .filter((h) => {
        const [year, month] = h.date.split('-').map(Number)
        return month - 1 === m && year === y
      })
      .reduce((s, h) => s + h.hours, 0)
  }, [codingHours])

  if (!learning) return null

  const coursesInProgress = courses.filter((c) => c.status === 'w_trakcie').length
  const coursesCompleted = courses.filter((c) => c.status === 'ukonczony').length

  const stats = [
    { icon: Clock, label: 'Godziny kodowania', value: `${totalHours.toFixed(1)} h`, sub: `${hoursThisMonth.toFixed(1)} h w tym miesiącu`, color: 'text-(--accent-cyan)' },
    { icon: GraduationCap, label: 'Kursy', value: `${coursesInProgress} w trakcie`, sub: `${coursesCompleted} ukończonych`, color: 'text-(--accent-green)' },
    { icon: FolderKanban, label: 'Projekty', value: projects.length.toString(), sub: `${projects.filter((p) => p.status === 'ukonczony').length} ukończonych`, color: 'text-(--accent-magenta)' },
    { icon: BookOpen, label: 'Książki', value: books.length.toString(), sub: 'przeczytane', color: 'text-(--accent-amber)' },
    { icon: Award, label: 'Certyfikaty', value: certifications.length.toString(), sub: 'zdobyte', color: 'text-(--accent-cyan)' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} className="border-(--accent-cyan)/20">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <p className="text-sm text-(--text-muted) font-gaming tracking-widest uppercase">{label}</p>
            </div>
            <p className={`text-2xl font-bold mt-1 font-gaming ${color}`}>{value}</p>
            <p className="text-sm text-(--text-muted) mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
