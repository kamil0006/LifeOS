import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useModalMotion } from '../lib/modalMotion'

export type ConfirmDialogZLayer = 'default' | 'stacked'

export interface ConfirmDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  /** Opcjonalna wyróżniona nazwa (np. w cudzysłowie), jak w Nawykach */
  emphasis?: string
  confirmLabel: string
  cancelLabel?: string
  /** `stacked` — nad innym modalem (np. edycja notatki) */
  zLayer?: ConfirmDialogZLayer
}

/**
 * Ten sam wzorzec co potwierdzenia archiwizacji/usuwania w Nawykach (portal + motion + blur).
 */
export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  emphasis,
  confirmLabel,
  cancelLabel = 'Anuluj',
  zLayer = 'default',
}: ConfirmDialogProps) {
  const { backdrop, panel } = useModalMotion()

  const zBackdrop = zLayer === 'stacked' ? 'z-[10008]' : 'z-9998'
  const zWrap = zLayer === 'stacked' ? 'z-[10009]' : 'z-9999'

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="confirm-backdrop"
            {...backdrop}
            className={`fixed inset-0 ${zBackdrop} bg-black/60 backdrop-blur-sm`}
            onClick={onCancel}
          />
          <div
            className={`fixed inset-0 ${zWrap} flex items-start justify-center overflow-y-auto p-4 pt-24 pointer-events-none`}
          >
            <motion.div
              key="confirm-panel"
              {...panel}
              className="pointer-events-auto relative z-10 w-full max-w-md rounded-lg border border-(--border) bg-(--bg-card) p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-lg font-bold text-(--text-primary) font-gaming">{title}</h3>
              <div className="mb-1 text-base text-(--text-muted)">{description}</div>
              {emphasis != null && emphasis !== '' && (
                <p className="mb-6 text-base font-medium text-(--text-primary)">„{emphasis}”</p>
              )}
              <div className={`flex flex-wrap gap-2 justify-end ${emphasis ? '' : 'mt-6'}`}>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-(--border) px-4 py-2 text-base text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text-primary)"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-2 text-base text-red-400 hover:bg-red-500/25"
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
