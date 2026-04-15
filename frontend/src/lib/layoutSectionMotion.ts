import type { Variants } from 'framer-motion'
import { TODO_COLUMN_SPRING, TODO_ITEM_SPRING } from './todoMotion'

/**
 * Przejścia między podstronami (Finanse / Nauka / Notatki): jak kolumny Kanban — z boku, czytelny spring.
 * Zastępuje mało widoczny efekt `clipPath` „z dołu”.
 */
export function getSubpageOutletVariants(reduceMotion: boolean | null): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    }
  }
  return {
    hidden: { opacity: 0, x: -32 },
    visible: { opacity: 1, x: 0, transition: { ...TODO_COLUMN_SPRING, delay: 0.04 } },
    exit: {
      opacity: 0,
      x: 24,
      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
    },
  }
}

/** Kontener strony Przegląd (Finanse) — stagger jak na Dashboard. */
export const overviewPageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

/** Pojedyncze kafelki przeglądu (np. Finanse Overview): każdy z innej strony, potem jedna siatka. */
export function getOverviewTileVariants(reduceMotion: boolean | null, index: number): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.2, delay: index * 0.04 } },
    }
  }
  const offsets = [
    { x: -36, y: 0 },
    { x: 36, y: 0 },
    { x: 0, y: -28 },
    { x: -28, y: 28 },
    { x: 28, y: -24 },
  ]
  const o = offsets[index % offsets.length]
  return {
    hidden: { opacity: 0, ...o },
    show: { opacity: 1, x: 0, y: 0, transition: { ...TODO_ITEM_SPRING, delay: index * 0.06 } },
  }
}
