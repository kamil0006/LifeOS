import type { ReactNode } from 'react'
import { safeHref } from '../lib/safeUrl'

type SafeExternalLinkProps = {
  href: string | null | undefined
  className?: string
  title?: string
  children: ReactNode
}

export function SafeExternalLink({ href, className, title, children }: SafeExternalLinkProps) {
  const safe = safeHref(href)
  if (!safe) {
    return <span className={className}>{children}</span>
  }
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer" className={className} title={title ?? safe}>
      {children}
    </a>
  )
}
