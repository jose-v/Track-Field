import { BrowserRouter as Router } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useEffect } from 'react'
import AuthErrorHandler from './auth/AuthErrorHandler'
import { supabase } from './lib/supabase'
import { initDebugUtils } from './utils/debugUtils'
import AppRoutes from './routes/AppRoutes'
import { Box, Flex } from '@chakra-ui/react'
import { ChatbotProvider } from './components/ChatBot/ChatbotProvider'

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

  useEffect(() => {
    // Force button text color fix on app mount
    const forceButtonColors = () => {
      // Use timeout to ensure UI has rendered
      setTimeout(() => {
        const buttons = document.querySelectorAll('.chakra-button[data-variant="primary"]');
        buttons.forEach(button => {
          (button as HTMLElement).style.color = 'white';
        });
      }, 100);
    };
    
    forceButtonColors();
    
    // Also listen for route changes which might load new buttons
    window.addEventListener('popstate', forceButtonColors);
    
    return () => {
      window.removeEventListener('popstate', forceButtonColors);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ChatbotProvider>
        <Router>
          <Flex direction="column" minHeight="100vh">
            <AuthErrorHandler />
            <Box flex="1">
              <AppRoutes />
            </Box>
          </Flex>
        </Router>
      </ChatbotProvider>
    </ErrorBoundary>
  )
}

export default App
