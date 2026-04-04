import { useState, type ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
  side?: 'top' | 'bottom'
}

export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        className="inline-flex cursor-help"
      >
        {children}
      </span>
      {visible && (
        <span
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg bg-(--bg-card) border border-(--border) text-sm text-(--text-primary) shadow-lg whitespace-nowrap ${
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
