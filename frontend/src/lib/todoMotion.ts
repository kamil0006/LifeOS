/**
 * Wspólne parametry ruchu dla sekcji To-do i dialogów (`modalMotion`).
 * Jedna prawda — żeby animacje nie rozjeżdżały się między stroną a modalami.
 */
export const TODO_ITEM_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 }

export const TODO_COLUMN_SPRING = { type: 'spring' as const, stiffness: 320, damping: 34 }

/** Jak wejście wierszy w `itemEnter` (variants) na stronie To-do */
export const todoItemEnterVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: TODO_ITEM_SPRING,
  },
}

/** Jak pojedyncza karta zadania (poza layoutId) */
export const todoCardPresence = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.92, filter: 'blur(4px)' as const, transition: { duration: 0.2 } },
  transition: TODO_ITEM_SPRING,
}

/**
 * Panele dialogów: wejście z boku (x), bez drugiego „unoszenia” po slide podstrony (layout).
 * Karty To-do nadal używają `todoCardPresence` (y).
 */
export const modalPanelPresence = {
  initial: { opacity: 0, x: 22, y: 0, scale: 0.98 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0, x: 10, scale: 0.96, filter: 'blur(4px)' as const, transition: { duration: 0.2 } },
  transition: TODO_ITEM_SPRING,
}
