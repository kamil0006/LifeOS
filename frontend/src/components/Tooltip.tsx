import { useState, useRef, useLayoutEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: ReactNode
  content: string
  side?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  wrapperClassName?: string
}

function getTooltipStyle(
  rect: DOMRect,
  side: 'top' | 'bottom',
  align: 'start' | 'center' | 'end',
): CSSProperties {
  const gap = 8
  const transform: string[] = []

  const top = side === 'top' ? rect.top - gap : rect.bottom + gap
  if (side === 'top') transform.push('translateY(-100%)')

  let left = rect.left
  if (align === 'center') {
    left = rect.left + rect.width / 2
    transform.push('translateX(-50%)')
  } else if (align === 'end') {
    left = rect.right
    transform.push('translateX(-100%)')
  }

  return {
    position: 'fixed',
    top,
    left,
    transform: transform.join(' '),
    zIndex: 9999,
  }
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  wrapperClassName = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current) return

    const update = () => {
      if (!triggerRef.current) return
      setStyle(getTooltipStyle(triggerRef.current.getBoundingClientRect(), side, align))
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [visible, side, align])

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        className={`inline-flex cursor-help items-center justify-center ${wrapperClassName}`}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <span
            role="tooltip"
            style={style}
            className="pointer-events-none max-w-[min(16rem,calc(100vw-1.5rem))] rounded-lg border border-(--border) bg-(--bg-card) px-3 py-2 text-sm leading-snug text-(--text-primary) shadow-lg"
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  )
}
