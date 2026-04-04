import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-lg border border-(--border) bg-(--bg-card) p-5 overflow-hidden transition-[border-color,box-shadow] duration-200 ease-out hover:border-(--accent-cyan)/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] ${className}`}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/40 to-transparent" />
      {(title || action) && (
        <div className={`flex items-center gap-4 mb-3 ${action ? 'justify-between' : ''}`}>
          {title && (
            <h3 className="text-base font-semibold text-(--text-primary) font-gaming tracking-wider">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </motion.div>
  )
}
