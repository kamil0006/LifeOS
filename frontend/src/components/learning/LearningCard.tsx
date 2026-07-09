import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('learning')
  return (
    <div className="space-y-2 rounded-lg border border-(--border) bg-(--bg-dark)/50 px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base text-(--text-primary)">{title}</p>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-(--text-muted)">{subtitle}</p>}
          {meta && meta.length > 0 && (
            <p className="mt-0.5 text-sm text-(--text-muted)">{meta.filter(Boolean).join(' • ')}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden items-center gap-1 sm:flex">{quickActions}</div>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--accent)/10 hover:text-(--accent)"
              aria-label={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-[#e74c3c]/10 hover:text-[#e74c3c]"
              aria-label={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {quickActions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-(--border)/40 pt-2 sm:hidden">
          {quickActions}
        </div>
      )}
      {progress !== undefined && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--bg-card)">
            <div
              className="h-full rounded-full bg-(--accent) transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-mono text-(--text-muted)">{progress}%</span>
        </div>
      )}
    </div>
  )
}
