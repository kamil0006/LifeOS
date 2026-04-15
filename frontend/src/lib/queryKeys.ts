/** Klucze z segmentem userId — brak mieszania cache między kontami. */
export const queryKeys = {
  root: ['lifeos'] as const,
  expenses: (userId: string) => [...queryKeys.root, 'expenses', userId] as const,
  income: (userId: string) => [...queryKeys.root, 'income', userId] as const,
  scheduledExpenses: (userId: string) => [...queryKeys.root, 'scheduledExpenses', userId] as const,
  expenseCategories: (userId: string) => [...queryKeys.root, 'expenseCategories', userId] as const,
  todos: (userId: string) => [...queryKeys.root, 'todos', userId] as const,
  events: (userId: string) => [...queryKeys.root, 'events', userId] as const,
  wishes: (userId: string) => [...queryKeys.root, 'wishes', userId] as const,
  habits: (userId: string) => [...queryKeys.root, 'habits', userId] as const,
  goals: (userId: string) => [...queryKeys.root, 'goals', userId] as const,
}
