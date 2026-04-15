import {
  SkeletonPulse,
  SkeletonCardShell,
  SkeletonRow,
  SkeletonChart,
} from './SkeletonPrimitives'

/** Dashboard: KPI row + two charts + side content hint */
export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <SkeletonPulse className="h-9 w-48 max-w-full" />
          <SkeletonPulse className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonPulse className="h-10 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <SkeletonCardShell key={i}>
            <SkeletonPulse className="h-3 w-24 mb-3" />
            <SkeletonPulse className="h-8 w-32" />
          </SkeletonCardShell>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonCardShell>
          <SkeletonPulse className="h-5 w-40 mb-4" />
          <SkeletonChart />
        </SkeletonCardShell>
        <SkeletonCardShell>
          <SkeletonPulse className="h-5 w-36 mb-4" />
          <SkeletonChart />
        </SkeletonCardShell>
      </div>
      <SkeletonCardShell>
        <SkeletonPulse className="h-5 w-44 mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} wide />
          ))}
        </div>
      </SkeletonCardShell>
    </div>
  )
}

/** Finances: title + month + list (Expenses, Income, Recurring) */
export function FinanceListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-2">
          <SkeletonPulse className="h-8 w-40" />
          <SkeletonPulse className="h-4 w-56" />
        </div>
        <SkeletonPulse className="h-10 w-44 rounded-lg" />
      </div>
      <SkeletonCardShell>
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} wide />
          ))}
        </div>
      </SkeletonCardShell>
    </div>
  )
}

/** Overview: month selector + trend card + stats */
export function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-end">
        <SkeletonPulse className="h-10 w-44 rounded-lg" />
      </div>
      <SkeletonCardShell>
        <SkeletonPulse className="h-3 w-40 mb-4" />
        <div className="flex flex-wrap gap-8">
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-8 w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-7 w-28" />
          </div>
        </div>
      </SkeletonCardShell>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCardShell>
          <SkeletonPulse className="h-4 w-28 mb-3" />
          <SkeletonPulse className="h-10 w-full" />
        </SkeletonCardShell>
        <SkeletonCardShell>
          <SkeletonPulse className="h-4 w-28 mb-3" />
          <SkeletonPulse className="h-10 w-full" />
        </SkeletonCardShell>
      </div>
    </div>
  )
}

/** Transactions: filters + table rows */
export function TransactionsPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap justify-between gap-4">
        <SkeletonPulse className="h-10 w-44 rounded-lg" />
        <div className="flex gap-2">
          <SkeletonPulse className="h-10 w-28 rounded-lg" />
          <SkeletonPulse className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <SkeletonCardShell>
        <div className="flex gap-2 mb-4">
          <SkeletonPulse className="h-8 w-20 rounded" />
          <SkeletonPulse className="h-8 w-20 rounded" />
          <SkeletonPulse className="h-8 w-16 rounded" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-(--border)/50">
              <SkeletonPulse className="h-4 w-24 shrink-0" />
              <SkeletonPulse className="h-4 flex-1 max-w-[180px]" />
              <SkeletonPulse className="h-4 w-20 shrink-0" />
              <SkeletonPulse className="h-4 w-16 shrink-0 ml-auto" />
            </div>
          ))}
        </div>
      </SkeletonCardShell>
    </div>
  )
}

/** Analytics: period + multiple chart cards */
export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-wrap justify-between gap-4">
        <SkeletonPulse className="h-9 w-48" />
        <SkeletonPulse className="h-10 w-52 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCardShell key={i}>
            <SkeletonPulse className="h-5 w-44 mb-4" />
            <SkeletonChart className="h-52" />
          </SkeletonCardShell>
        ))}
      </div>
    </div>
  )
}

/** Net worth: hero + grid */
export function NetWorthPageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="space-y-2">
        <SkeletonPulse className="h-9 w-56" />
        <SkeletonPulse className="h-4 w-80 max-w-full" />
      </div>
      <SkeletonCardShell className="p-8">
        <SkeletonPulse className="h-4 w-32 mx-auto mb-4" />
        <SkeletonPulse className="h-12 w-48 mx-auto mb-6" />
        <SkeletonPulse className="h-3 w-full max-w-md mx-auto" />
      </SkeletonCardShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <SkeletonCardShell key={i}>
            <SkeletonPulse className="h-3 w-24 mb-2" />
            <SkeletonPulse className="h-7 w-28" />
          </SkeletonCardShell>
        ))}
      </div>
    </div>
  )
}

/** Todo, Habits, Calendar, Wishes: title + card list */
export function SimplePageSkeleton({ titleWidth = 'w-40' }: { titleWidth?: string }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-2">
        <SkeletonPulse className={`h-8 ${titleWidth}`} />
        <SkeletonPulse className="h-4 w-64 max-w-full" />
      </div>
      <SkeletonCardShell>
        <div className="space-y-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </SkeletonCardShell>
    </div>
  )
}
