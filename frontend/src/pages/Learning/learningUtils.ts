import { Clock, Tag, BookOpen, FolderKanban, GraduationCap, RotateCcw, Zap } from 'lucide-react'
import type { SessionType } from '../../context/LearningContext'

export const SESSION_TYPE_OPTIONS: { value: SessionType; label: string; icon: typeof Clock }[] = [
  { value: 'kurs', label: 'Kurs', icon: GraduationCap },
  { value: 'ksiazka', label: 'Książka', icon: BookOpen },
  { value: 'projekt', label: 'Projekt', icon: FolderKanban },
  { value: 'praktyka', label: 'Praktyka', icon: Zap },
  { value: 'powtorka', label: 'Powtórka', icon: RotateCcw },
  { value: 'inne', label: 'Inne', icon: Tag },
]

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}
