import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { prisma } from './lib/prisma.js'
import { authRouter } from './routes/auth.js'
import { expensesRouter } from './routes/expenses.js'
import { incomeRouter } from './routes/income.js'
import { todosRouter } from './routes/todos.js'
import { wishesRouter } from './routes/wishes.js'
import { achievementsRouter } from './routes/achievements.js'
import { eventsRouter } from './routes/events.js'
import { habitsRouter } from './routes/habits.js'
import { goalsRouter } from './routes/goals.js'
import { scheduledExpensesRouter } from './routes/scheduledExpenses.js'
import { expenseCategoriesRouter } from './routes/expenseCategories.js'
import { authMiddleware } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true }))
app.use(express.json())

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', version: '0.1.0' })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/expenses', authMiddleware, expensesRouter)
app.use('/api/income', authMiddleware, incomeRouter)
app.use('/api/todos', authMiddleware, todosRouter)
app.use('/api/wishes', authMiddleware, wishesRouter)
app.use('/api/achievements', authMiddleware, achievementsRouter)
app.use('/api/events', authMiddleware, eventsRouter)
app.use('/api/habits', authMiddleware, habitsRouter)
app.use('/api/goals', authMiddleware, goalsRouter)
app.use('/api/scheduled-expenses', authMiddleware, scheduledExpensesRouter)
app.use('/api/expense-categories', authMiddleware, expenseCategoriesRouter)

const server = app.listen(PORT, async () => {
  console.log(`LifeOS API running on http://localhost:${PORT}`)
  try {
    await prisma.$connect()
    console.log('Połączenie z bazą danych OK')
  } catch (e) {
    console.error('\nBŁĄD: Nie można połączyć z bazą danych!')
    console.error('Sprawdź DATABASE_URL w .env i czy PostgreSQL działa.')
    console.error('Uruchom migracje: npx prisma migrate dev\n')
  }
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nBłąd: Port ${PORT} jest zajęty.`)
    console.error('Zatrzymaj inny proces lub ustaw PORT w .env (np. PORT=3002)\n')
    process.exit(1)
  }
  throw err
})
