/**
 * Shared motion parameters for the To-do section and dialogs (`modalMotion`).
 * Single source of truth — so animations stay consistent between the page and modals.
 */
export const TODO_ITEM_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 }

export const TODO_COLUMN_SPRING = { type: 'spring' as const, stiffness: 320, damping: 34 }

/** Like the row entrance in `itemEnter` (variants) on the To-do page */
export const todoItemEnterVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: TODO_ITEM_SPRING,
  },
}

/** Like a single task card (except layoutId) */
export const todoCardPresence = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.92, filter: 'blur(4px)' as const, transition: { duration: 0.2 } },
  transition: TODO_ITEM_SPRING,
}

/**
 * Dialog panels: enter from the side (x), without a second "lift" after the subpage slide (layout).
 * To-do cards still use `todoCardPresence` (y).
 */
export const modalPanelPresence = {
  initial: { opacity: 0, x: 22, y: 0, scale: 0.98 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0, x: 10, scale: 0.96, filter: 'blur(4px)' as const, transition: { duration: 0.2 } },
  transition: TODO_ITEM_SPRING,
}
