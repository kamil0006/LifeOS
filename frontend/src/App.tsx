import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DemoDataProvider } from './context/DemoDataContext'
import { MonthProvider } from './context/MonthContext'
import { ChartPeriodProvider } from './context/ChartPeriodContext'
import { LearningProvider } from './context/LearningContext'
import { NotesProvider } from './context/NotesContext'
import { GlobalSearchProvider } from './context/GlobalSearchContext'
import { QuickAddProvider } from './context/QuickAddContext'
import { OnboardingProvider } from './context/OnboardingContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { FinancesLayout } from './pages/Finances/FinancesLayout'
import { Overview } from './pages/Finances/Overview'
import { Transactions } from './pages/Finances/Transactions'
import { Recurring } from './pages/Finances/Recurring'
import { Analytics } from './pages/Finances/Analytics'
import { Todo } from './pages/Todo'
import { FinancesWishes } from './pages/Finances/Wishes'
import { FinancesNetWorth } from './pages/Finances/FinancesNetWorth'
import { Calendar } from './pages/Calendar'
import { Habits } from './pages/Habits'
import { LearningLayout } from './pages/Learning/LearningLayout'
import { LearningOverview } from './pages/Learning/LearningOverview'
import { LearningHours } from './pages/Learning/LearningHours'
import { LearningCourses } from './pages/Learning/LearningCourses'
import { LearningProjects } from './pages/Learning/LearningProjects'
import { LearningBooks } from './pages/Learning/LearningBooks'
import { LearningCertificates } from './pages/Learning/LearningCertificates'
import { NotesLayout } from './pages/Notes/NotesLayout'
import { NotesOverview } from './pages/Notes/NotesOverview'
import { NotesPage } from './pages/Notes/NotesPage'
import { useAuth } from './context/AuthContext'

function App() {
  const { token, isDemoMode } = useAuth()

  const isAuthenticated = isDemoMode || !!token

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <DemoDataProvider>
      <MonthProvider>
        <ChartPeriodProvider>
        <LearningProvider>
        <NotesProvider>
        <GlobalSearchProvider>
        <QuickAddProvider>
        <OnboardingProvider>
        <Layout>
        <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/finances" element={<FinancesLayout />}>
          <Route index element={<Overview />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="wishes" element={<FinancesWishes />} />
          <Route path="net-worth" element={<FinancesNetWorth />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="/expenses" element={<Navigate to="/finances/transactions" replace />} />
        <Route path="/income" element={<Navigate to="/finances/transactions" replace />} />
        <Route path="/wishes" element={<Navigate to="/finances/wishes" replace />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/notes" element={<NotesLayout />}>
          <Route index element={<NotesOverview />} />
          <Route path="quick" element={<NotesPage type="quick" />} />
          <Route path="ideas" element={<NotesPage type="idea" />} />
          <Route path="references" element={<NotesPage type="reference" />} />
        </Route>
        <Route path="/learning" element={<LearningLayout />}>
          <Route index element={<LearningOverview />} />
          <Route path="hours" element={<LearningHours />} />
          <Route path="courses" element={<LearningCourses />} />
          <Route path="projects" element={<LearningProjects />} />
          <Route path="books" element={<LearningBooks />} />
          <Route path="certificates" element={<LearningCertificates />} />
        </Route>
        <Route path="/nauka" element={<Navigate to="/learning" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
        </OnboardingProvider>
        </QuickAddProvider>
        </GlobalSearchProvider>
        </NotesProvider>
        </LearningProvider>
        </ChartPeriodProvider>
      </MonthProvider>
    </DemoDataProvider>
  )
}

export default App
