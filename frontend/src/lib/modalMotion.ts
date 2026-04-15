import { useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { TODO_COLUMN_SPRING, TODO_ITEM_SPRING, modalPanelPresence } from './todoMotion'

export { TODO_ITEM_SPRING, TODO_COLUMN_SPRING } from './todoMotion'

type MotionDivProps = Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>

/**
 * Dialogi: spring jak To-do, wejście panelu z boku (`modalPanelPresence`) — bez kolizji z layoutem (x) + ruchem pionowym karty.
 */
export function useModalMotion(): { backdrop: MotionDivProps; panel: MotionDivProps } {
  const reduceMotion = useReducedMotion()

  const backdrop: MotionDivProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduceMotion ? 0.12 : 0.18 },
  }

  const panel: MotionDivProps = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: modalPanelPresence.initial,
        animate: modalPanelPresence.animate,
        exit: modalPanelPresence.exit,
        transition: TODO_ITEM_SPRING,
      }

  return { backdrop, panel }
}

/** Onboarding: slide jak kolumna Kanban (lewa), zamknięcie jak karta To-do. */
export function useOnboardingMotion(): {
  overlay: MotionDivProps
  stepCard: MotionDivProps
} {
  const reduceMotion = useReducedMotion()

  const overlay: MotionDivProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduceMotion ? 0.12 : 0.18 },
  }

  const stepCard: MotionDivProps = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, x: -24 },
        animate: { opacity: 1, x: 0 },
        exit: modalPanelPresence.exit,
        transition: { ...TODO_COLUMN_SPRING, delay: 0.08 },
      }

  return { overlay, stepCard }
}
