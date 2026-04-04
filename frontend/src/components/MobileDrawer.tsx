import { useEffect } from 'react'
import { AppNavPanel } from './Sidebar'

type MobileDrawerProps = {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={`absolute inset-y-0 left-0 z-10 flex w-[min(18rem,100vw-2rem)] max-w-full flex-col border-r border-(--border) bg-(--bg-card)/98 pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu nawigacji"
      >
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-(--accent-cyan)/50 to-transparent" />
        <AppNavPanel onNavigate={onClose} mobileClose={onClose} />
      </aside>
    </div>
  )
}
