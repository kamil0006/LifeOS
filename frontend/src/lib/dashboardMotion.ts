import type { Variants } from 'framer-motion'
import { TODO_ITEM_SPRING } from './todoMotion'

/** Dashboard container: sections reveal one after another. */
export const dashboardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}

/** Tile entrance directions (cycled) — each from a different side, ending as one cohesive grid. */
const DIRECTION_OFFSETS = [
  { x: -40, y: 0 },
  { x: 40, y: 0 },
  { x: 0, y: -36 },
  { x: 0, y: 36 },
  { x: -36, y: -28 },
  { x: 36, y: -28 },
  { x: -36, y: 28 },
  { x: 36, y: 28 },
]

export function getDashboardTileVariants(reduceMotion: boolean | null, index: number): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.2 } },
    }
  }
  const o = DIRECTION_OFFSETS[index % DIRECTION_OFFSETS.length]
  return {
    hidden: { opacity: 0, ...o },
    show: { opacity: 1, x: 0, y: 0, transition: TODO_ITEM_SPRING },
  }
}

/** Section with multiple tiles (Quick stats / links) — inner stagger, one by one from different sides. */
export const dashboardSectionStaggerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}
