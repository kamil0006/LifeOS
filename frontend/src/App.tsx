import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DemoDataProvider } from './context/DemoDataContext'
import { FinanceCategoriesProvider } from './context/FinanceCategoriesContext'
import { MonthProvider } from './context/MonthContext'
import { ChartPeriodProvider } from './context/ChartPeriodContext'
import { EventsProvider } from './context/EventsContext'
import { TodosProvider } from './context/TodosContext'
import { WishesProvider } from './context/WishesContext'
import { HabitsProvider } from './context/HabitsContext'
import { NaukaProvider } from './context/NaukaContext'
import { NotesProvider } from './context/NotesContext'
import { GlobalSearchProvider } from './context/GlobalSearchContext'
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
import { Achievements } from './pages/Achievements'
import { Calendar } from './pages/Calendar'
import { Habits } from './pages/Habits'
import { NaukaLayout } from './pages/Nauka/NaukaLayout'
import { NaukaOverview } from './pages/Nauka/NaukaOverview'
import { NaukaGodziny } from './pages/Nauka/NaukaGodziny'
import { NaukaKursy } from './pages/Nauka/NaukaKursy'
import { NaukaProjekty } from './pages/Nauka/NaukaProjekty'
import { NaukaKsiazki } from './pages/Nauka/NaukaKsiazki'
import { NaukaCertyfikaty } from './pages/Nauka/NaukaCertyfikaty'
import { NotesLayout } from './pages/Notes/NotesLayout'
import { NotesOverview } from './pages/Notes/NotesOverview'
import { NotesPage } from './pages/Notes/NotesPage'
import { useAuth } from './context/AuthContext'

function App() {
  const { token, isDemoMode } = useAuth()

  // Demo: zawsze pokazuj app z mock danymi
  // Własne dane: wymagaj logowania
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
      <FinanceCategoriesProvider>
      <MonthProvider>
        <ChartPeriodProvider>
        <EventsProvider>
        <TodosProvider>
        <WishesProvider>
        <HabitsProvider>
        <NaukaProvider>
        <NotesProvider>
        <GlobalSearchProvider>
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
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/notes" element={<NotesLayout />}>
          <Route index element={<NotesOverview />} />
          <Route path="quick" element={<NotesPage type="quick" />} />
          <Route path="ideas" element={<NotesPage type="idea" />} />
          <Route path="references" element={<NotesPage type="reference" />} />
        </Route>
        <Route path="/nauka" element={<NaukaLayout />}>
          <Route index element={<NaukaOverview />} />
          <Route path="godziny" element={<NaukaGodziny />} />
          <Route path="kursy" element={<NaukaKursy />} />
          <Route path="projekty" element={<NaukaProjekty />} />
          <Route path="ksiazki" element={<NaukaKsiazki />} />
          <Route path="certyfikaty" element={<NaukaCertyfikaty />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
        </OnboardingProvider>
        </GlobalSearchProvider>
        </NotesProvider>
        </NaukaProvider>
        </HabitsProvider>
        </WishesProvider>
        </TodosProvider>
        </EventsProvider>
        </ChartPeriodProvider>
      </MonthProvider>
      </FinanceCategoriesProvider>
    </DemoDataProvider>
  )
}

export default App
