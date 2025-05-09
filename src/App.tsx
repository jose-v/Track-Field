import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Workouts } from './pages/Workouts'
import { Team } from './pages/Team'
import { Profile } from './pages/Profile'
import Home from './pages/Home'
import { Register } from './pages/Register'
import { NotFound } from './pages/NotFound'
import { Layout } from './components/Layout'
import { PrivateRoute } from './components/PrivateRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pricing } from './pages/Pricing'
import { Features } from './pages/Features'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Events } from './pages/Events'
import { Box } from '@chakra-ui/react'

// Create a client
const queryClient = new QueryClient()

// Public Layout with Navigation
const PublicLayout = () => {
  return (
    <>
      <Navigation />
      <Box px={8} w="100%">
        <Outlet />
      </Box>
      <Footer />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
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
                </Route>
                
                {/* Protected Routes */}
                <Route element={<Layout><Outlet /></Layout>}>
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
                  <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
                  <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
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
