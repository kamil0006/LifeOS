import type { ReactNode } from 'react'

import { useEffect, useRef } from 'react'

import { createPortal } from 'react-dom'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { TODO_ITEM_SPRING } from '../lib/modalMotion'

import { modalPanelPresence } from '../lib/todoMotion'

import { useIsMobile } from '../hooks/useIsMobile'



type ModalShellProps = {

  isOpen: boolean

  /** Called when user taps backdrop or presses Escape. If undefined, backdrop tap is ignored. */

  onClose: (() => void) | undefined

  children: ReactNode

  /** Tailwind max-width class for desktop panel */

  maxWidth?: string

  /** Padding class(es) applied to panel content area */

  padding?: string

  zBackdrop?: number

  zPanel?: number

  /** Pass unique keys to avoid AnimatePresence conflicts when multiple modals layer */

  backdropKey?: string

  panelKey?: string

}



function blurActiveElement() {

  if (document.activeElement instanceof HTMLElement) {

    document.activeElement.blur()

  }

}



/**

 * Responsive modal shell:

 * - Mobile: bottom sheet sliding up from below with drag handle

 * - Desktop: centered floating card

 *

 * Handles portal, backdrop, AnimatePresence, and animation.

 * Children = the inner modal content (header, form, etc.).

 */

export function ModalShell({

  isOpen,

  onClose,

  children,

  maxWidth = 'max-w-md',

  padding = 'p-5 sm:p-6',

  zBackdrop = 10000,

  zPanel = 10001,

  backdropKey = 'modal-backdrop',

  panelKey = 'modal-panel',

}: ModalShellProps) {

  const isMobile = useIsMobile()

  const reduceMotion = useReducedMotion()

  const wasOpenRef = useRef(false)



  useEffect(() => {

    if (!isOpen) return

    blurActiveElement()

    const prev = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {

      document.body.style.overflow = prev

    }

  }, [isOpen])



  /** Safari / mobile: make sure body doesn't stay locked after the animation. */

  useEffect(() => {

    if (wasOpenRef.current && !isOpen) {

      blurActiveElement()

      const t = window.setTimeout(() => {

        if (document.body.style.overflow === 'hidden') {

          document.body.style.overflow = ''

        }

      }, 400)

      wasOpenRef.current = isOpen

      return () => clearTimeout(t)

    }

    wasOpenRef.current = isOpen

  }, [isOpen])



  const backdropTransition = { duration: reduceMotion ? 0.08 : isMobile ? 0.14 : 0.18 }



  const desktopPanelMotion = reduceMotion

    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }

    : {

        initial: modalPanelPresence.initial,

        animate: modalPanelPresence.animate,

        exit: modalPanelPresence.exit,

        transition: TODO_ITEM_SPRING,

      }



  /** On mobile exit without spring — spring + keyboard can leave the backdrop behind. */

  const mobilePanelMotion = reduceMotion

    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.1 } }

    : {

        initial: { y: '100%' },

        animate: { y: 0, transition: { type: 'spring' as const, damping: 32, stiffness: 320 } },

        exit: { y: '100%', transition: { duration: 0.24, ease: [0.32, 0, 0.67, 0] as const } },

      }



  const backdropClass = isMobile

    ? 'fixed inset-0 bg-black/70 touch-none'

    : 'fixed inset-0 bg-black/60 backdrop-blur-sm'



  const content = (

    <AnimatePresence initial={false} mode="sync">

      {isOpen ? (

        <motion.div

          key={backdropKey}

          role="presentation"

          aria-hidden

          className={backdropClass}

          style={{ zIndex: zBackdrop }}

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}

          transition={backdropTransition}

          onClick={onClose ?? undefined}

        />

      ) : null}



      {isOpen && isMobile ? (

        <motion.div

          key={panelKey}

          role="dialog"

          aria-modal="true"

          {...mobilePanelMotion}

          className="fixed bottom-0 left-0 right-0 overflow-hidden rounded-t-2xl border-x border-t border-(--border) bg-(--bg-card) shadow-2xl"

          style={{ zIndex: zPanel, maxHeight: '92dvh' }}

        >

          <div className="flex shrink-0 justify-center pb-1 pt-3">

            <div className="h-1 w-10 rounded-full bg-(--border)" />

          </div>

          <div

            className={`overflow-y-auto overscroll-contain ${padding} pb-[max(1.5rem,env(safe-area-inset-bottom))]`}

            style={{ maxHeight: 'calc(92dvh - 1.5rem)' }}

          >

            {children}

          </div>

        </motion.div>

      ) : null}



      {isOpen && !isMobile ? (

        <motion.div

          key={panelKey}

          role="dialog"

          aria-modal="true"

          className="pointer-events-none fixed inset-0 flex items-start justify-center overflow-y-auto p-4 pt-12"

          style={{ zIndex: zPanel }}

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}

          transition={{ duration: 0.12 }}

        >

          <motion.div

            {...desktopPanelMotion}

            className={`pointer-events-auto relative z-10 w-full ${maxWidth} rounded-xl border border-(--border) bg-(--bg-card) ${padding} shadow-xl`}

            onClick={(e) => e.stopPropagation()}

          >

            {children}

          </motion.div>

        </motion.div>

      ) : null}

    </AnimatePresence>

  )



  return createPortal(content, document.body)

}


