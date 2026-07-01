import { Clock, Tag, BookOpen, FolderKanban, GraduationCap, RotateCcw, Zap } from 'lucide-react'
import type { SessionType } from '../../context/LearningContext'

export const SESSION_TYPE_OPTIONS: { value: SessionType; icon: typeof Clock }[] = [
  { value: 'kurs', icon: GraduationCap },
  { value: 'ksiazka', icon: BookOpen },
  { value: 'projekt', icon: FolderKanban },
  { value: 'praktyka', icon: Zap },
  { value: 'powtorka', icon: RotateCcw },
  { value: 'inne', icon: Tag },
]

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}
