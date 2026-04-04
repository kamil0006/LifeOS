import type { ReactNode } from 'react'

/** Pulse blocks aligned with Card / dashboard layout (gaming UI). */

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-(--border)/40 ${className}`} aria-hidden />
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <SkeletonPulse className={`h-4 ${className}`} />
}

export function SkeletonCardShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg border border-(--border) bg-(--bg-card) p-5 overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--accent-cyan)/20 to-transparent" />
      {children}
    </div>
  )
}

export function SkeletonRow({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-(--border)/50 last:border-0">
      <SkeletonPulse className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <SkeletonPulse className="h-3 w-[60%] max-w-[200px]" />
        <SkeletonPulse className="h-3 w-1/4 max-w-[80px]" />
      </div>
      {wide && <SkeletonPulse className="h-5 w-20 shrink-0" />}
    </div>
  )
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return <SkeletonPulse className={`h-[240px] w-full min-h-[200px] rounded-lg ${className}`} />
}
