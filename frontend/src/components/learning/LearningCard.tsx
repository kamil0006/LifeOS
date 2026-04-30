import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface LearningCardProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  progress?: number
  meta?: (string | undefined)[]
  quickActions?: ReactNode
  onEdit?: () => void
  onDelete?: () => void
}

export function LearningCard({
  title,
  subtitle,
  badge,
  progress,
  meta,
  quickActions,
  onEdit,
  onDelete,
}: LearningCardProps) {
  return (
    <div className="py-3 px-4 rounded-lg bg-(--bg-dark)/50 border border-(--border) space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-gaming text-(--text-primary)">{title}</p>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-(--text-muted) mt-0.5">{subtitle}</p>}
          {meta && meta.length > 0 && (
            <p className="text-sm text-(--text-muted) mt-0.5">{meta.filter(Boolean).join(' • ')}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {quickActions}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--accent-cyan) hover:bg-(--accent-cyan)/10 transition-colors"
              aria-label="Edytuj"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-(--text-muted) hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors"
              aria-label="Usuń"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {progress !== undefined && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-(--bg-card) overflow-hidden">
            <div
              className="h-full bg-(--accent-cyan) rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-(--text-muted) w-8 text-right">{progress}%</span>
        </div>
      )}
    </div>
  )
}
