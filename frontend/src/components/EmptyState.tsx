import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className = '', compact }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-12 px-6'} ${className}`}
    >
      <div className={`rounded-xl bg-(--bg-dark) border border-(--border) flex items-center justify-center ${compact ? 'w-10 h-10 mb-2' : 'w-14 h-14 mb-4'}`}>
        <Icon className={compact ? 'w-5 h-5 text-(--text-muted)' : 'w-7 h-7 text-(--text-muted)'} />
      </div>
      <h3 className={`font-semibold text-(--text-primary) font-gaming tracking-wide ${compact ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-(--text-muted) mt-1 max-w-sm ${compact ? 'text-sm' : 'text-base'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
