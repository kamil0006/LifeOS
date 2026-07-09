import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  /** false = brak wbudowanego wejścia (animuje rodzic, np. Dashboard z kierunkami) */
  animateEntrance?: boolean
}

export function Card({ children, className = '', title, action, animateEntrance = true }: CardProps) {
  const inner = (
    <>
      {(title || action) && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {title && (
            <h2
              className={`text-base font-semibold text-(--text-primary) font-display tracking-wider ${action ? 'min-w-0 sm:pr-2' : ''}`}
            >
              {title}
            </h2>
          )}
          {action && (
            <div className="min-w-0 w-full shrink-0 sm:w-auto sm:max-w-full">{action}</div>
          )}
        </div>
      )}
      {children}
    </>
  )

  const shell = `relative rounded-lg border border-(--border) bg-(--bg-card) p-5 overflow-hidden transition-[border-color] duration-200 ease-out hover:border-(--accent)/30 ${className}`

  if (!animateEntrance) {
    return <div className={shell}>{inner}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={shell}
    >
      {inner}
    </motion.div>
  )
}
