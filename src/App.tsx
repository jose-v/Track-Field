import { BrowserRouter as Router } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useEffect } from 'react'
import AuthErrorHandler from './auth/AuthErrorHandler'
import { supabase } from './lib/supabase'
import { initDebugUtils } from './utils/debugUtils'
import AppRoutes from './routes/AppRoutes'

// Global styles for public/private pages
import './styles/public.css'
import './styles/private.css'

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

  // Initialize debug utilities in development mode
  if (process.env.NODE_ENV === 'development') {
    initDebugUtils();
  }

  return (
    <ErrorBoundary>
      <Router>
        <AuthErrorHandler />
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  )
}

export default App
