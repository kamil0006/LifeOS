import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface UndoToastProps {
  message: string
  duration?: number
  onUndo: () => void
  onExpire: () => void
}

export function UndoToast({ message, duration = 5000, onUndo, onExpire }: UndoToastProps) {
  const [progress, setProgress] = useState(100)
  const expireFnRef = useRef(onExpire)

  useEffect(() => {
    expireFnRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        expireFnRef.current()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [duration])

  return createPortal(
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-99999 w-max max-w-sm"
    >
      <div className="rounded-lg border border-(--border) bg-(--bg-card) shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm font-gaming text-(--text-primary)">{message}</span>
          <button
            type="button"
            onClick={onUndo}
            className="text-sm font-gaming text-(--accent-cyan) hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            Cofnij
          </button>
          <button
            type="button"
            onClick={onExpire}
            className="p-1 rounded text-(--text-muted) hover:text-(--text-primary) transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="h-0.5 bg-(--border)">
          <div
            className="h-full bg-(--accent-cyan) transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}

/**
 * Self-contained hook for managing a single pending undo-delete.
 * Usage:
 *   const { pendingId, toast, scheduleDelete, undo } = useUndoDelete(actualDeleteFn)
 *   // in list: filter out item with pendingId
 *   // render: <AnimatePresence>{toast}</AnimatePresence>
 */
export function useUndoDelete<T extends { id: string }>(onDelete: (id: string) => void) {
  const [pending, setPending] = useState<{ item: T; label: string } | null>(null)
  const timerRef = useRef<number | null>(null)

  const commit = (id: string) => {
    onDelete(id)
    setPending(null)
    timerRef.current = null
  }

  const scheduleDelete = (item: T, label: string) => {
    // Flush any previous pending
    if (pending && timerRef.current) {
      clearTimeout(timerRef.current)
      onDelete(pending.item.id)
    }
    const tid = window.setTimeout(() => commit(item.id), 5000)
    timerRef.current = tid
    setPending({ item, label })
  }

  const undo = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPending(null)
    timerRef.current = null
  }

  const expire = () => {
    if (pending) commit(pending.item.id)
  }

  const toast =
    pending ? (
      <UndoToast
        key={pending.item.id}
        message={`Usunięto: ${pending.label}`}
        onUndo={undo}
        onExpire={expire}
      />
    ) : null

  return { pendingId: pending?.item.id ?? null, toast, scheduleDelete, undo }
}
