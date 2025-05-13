import { ChakraProvider, useToast } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
import { AthleteEvents } from './pages/athlete/Events'
import { CoachStats } from './pages/coach/Stats'
import { CoachAthletes } from './pages/coach/Athletes'
import { AthleteWorkouts } from './pages/athlete/AthleteWorkouts'
import { CreateWorkout } from './pages/coach/CreateWorkout'
import { ImportWorkout } from './pages/coach/ImportWorkout'
import { EditWorkout } from './pages/coach/EditWorkout'
import { Nutrition } from './pages/athlete/Nutrition'
import { Sleep } from './pages/athlete/Sleep'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { initDebugUtils } from './utils/debugUtils'

// Create a client with reasonable defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000
    },
    mutations: {
      retry: 2
    }
  }
});

// Initialize debug utilities in development mode
if (process.env.NODE_ENV === 'development') {
  initDebugUtils();
}

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

// Global auth error handler that monitors for auth errors
const AuthErrorHandler = () => {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [authErrorCount, setAuthErrorCount] = useState(0);
  
  // Set up global error handler for auth errors
  useEffect(() => {
    const handleAuthError = async (event: ErrorEvent) => {
      // Check if it's an auth error
      if (event.error?.message?.includes('JWT') || 
          event.error?.message?.includes('refresh token') ||
          event.error?.message?.includes('not authenticated')) {
        
        console.log('Global auth error detected', event.error);
        
        // Increment error counter
        setAuthErrorCount(prev => prev + 1);
        
        // Try to refresh the session
        const success = await refreshSession();
        
        if (success) {
          console.log('Session refreshed successfully from global handler');
          setAuthErrorCount(0);
        } else if (authErrorCount >= 3) {
          // After multiple failures, redirect to login
          console.log('Multiple auth errors, redirecting to login');
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please login again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          navigate('/login');
          setAuthErrorCount(0);
        }
      }
    };
    
    // Listen for global errors
    window.addEventListener('error', handleAuthError);
    
    return () => {
      window.removeEventListener('error', handleAuthError);
    };
  }, [refreshSession, navigate, authErrorCount, toast]);
  
  return null; // This component doesn't render anything
};

function App() {
  // Initialize auth detection on app load
  useEffect(() => {
    // Check auth status on app load
    const checkInitialAuth = async () => {
      try {
        console.log('Checking initial auth status...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking initial auth:', error);
        } else if (data.session) {
          console.log('Initial auth check: Session exists');
        } else {
          console.log('Initial auth check: No session');
        }
      } catch (e) {
        console.error('Error during initial auth check:', e);
      }
    };
    
    checkInitialAuth();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <AuthProvider>
            <Router>
              <AuthErrorHandler />
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
                  <Route path="/coach/workouts/new" element={<PrivateRoute><CreateWorkout /></PrivateRoute>} />
                  <Route path="/coach/workouts/import" element={<PrivateRoute><ImportWorkout /></PrivateRoute>} />
                  <Route path="/coach/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
                  <Route path="/coach/events" element={<PrivateRoute><CoachEvents /></PrivateRoute>} />
                  <Route path="/coach/stats" element={<PrivateRoute><CoachStats /></PrivateRoute>} />
                  <Route path="/coach/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                </Route>

                {/* Athlete Routes */}
                <Route element={<AthleteLayout><Outlet /></AthleteLayout>}>
                  <Route path="/athlete/dashboard" element={<PrivateRoute><AthleteDashboard /></PrivateRoute>} />
                  <Route path="/athlete/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/athlete/workouts" element={<PrivateRoute><AthleteWorkouts /></PrivateRoute>} />
                  <Route path="/athlete/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
                  <Route path="/athlete/events" element={<PrivateRoute><AthleteEvents /></PrivateRoute>} />
                  <Route path="/athlete/stats" element={<PrivateRoute><NotFound /></PrivateRoute>} />
                  <Route path="/athlete/nutrition" element={<PrivateRoute><Nutrition /></PrivateRoute>} />
                  <Route path="/athlete/sleep" element={<PrivateRoute><Sleep /></PrivateRoute>} />
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
