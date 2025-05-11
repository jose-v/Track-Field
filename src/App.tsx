import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard as AthleteDashboard } from './pages/Dashboard'
import { Workouts } from './pages/Workouts'
import { Team } from './pages/Team'
import { Profile } from './pages/Profile'
import Home from './pages/Home'
import { Register } from './pages/Register'
import { Signup } from './pages/Signup'
import { NotFound } from './pages/NotFound'
import { Layout as GeneralLayout } from './components/Layout'
import { AthleteLayout } from './components/AthleteLayout'
import { CoachLayout } from './components/CoachLayout'
import { PrivateRoute } from './components/PrivateRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pricing } from './pages/Pricing'
import { Features } from './pages/Features'
import { About } from './pages/About'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Events } from './pages/Events'
import { Contact } from './pages/Contact'
import { PageContainer } from './components/PageContainer'
import RoleDashboardRouter from './pages/RoleDashboardRouter'
import { CoachDashboard } from './pages/coach/Dashboard'
import { CoachWorkouts } from './pages/coach/Workouts'
import { CoachEvents } from './pages/coach/Events'
import { CoachStats } from './pages/coach/Stats'
import { CoachAthletes } from './pages/coach/Athletes'
import { AthleteWorkouts } from './pages/athlete/AthleteWorkouts'

// Create a client
const queryClient = new QueryClient()

// Public Layout with Navigation
const PublicLayout = () => {
  return (
    <>
      <Navigation />
      <PageContainer py={6}>
        <Outlet />
      </PageContainer>
      <Footer />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>
                
                {/* Original Protected Routes (now more for general/unspecified roles or if direct /dashboard is hit) */}
                <Route element={<GeneralLayout><Outlet /></GeneralLayout>}>
                  <Route path="/dashboard" element={<PrivateRoute><RoleDashboardRouter /></PrivateRoute>} />
                  <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
                  <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
                  <Route path="/private-events" element={<PrivateRoute><Events /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                </Route>

                {/* Coach Routes */}
                <Route element={<CoachLayout><Outlet /></CoachLayout>}>
                  <Route path="/coach/dashboard" element={<PrivateRoute><CoachDashboard /></PrivateRoute>} />
                  <Route path="/coach/athletes" element={<PrivateRoute><CoachAthletes /></PrivateRoute>} />
                  <Route path="/coach/workouts" element={<PrivateRoute><CoachWorkouts /></PrivateRoute>} />
                  <Route path="/coach/events" element={<PrivateRoute><CoachEvents /></PrivateRoute>} />
                  <Route path="/coach/stats" element={<PrivateRoute><CoachStats /></PrivateRoute>} />
                  <Route path="/coach/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                </Route>

                {/* Athlete Routes */}
                <Route element={<AthleteLayout><Outlet /></AthleteLayout>}>
                  <Route path="/athlete/dashboard" element={<PrivateRoute><AthleteDashboard /></PrivateRoute>} />
                  <Route path="/athlete/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/athlete/workouts" element={<PrivateRoute><AthleteWorkouts /></PrivateRoute>} />
                  <Route path="/athlete/events" element={<PrivateRoute><NotFound /></PrivateRoute>} />
                  <Route path="/athlete/stats" element={<PrivateRoute><NotFound /></PrivateRoute>} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
