import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PWADebugger } from '../utils/pwaDebug';

export const PWAStartupHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only handle PWA startup logic
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (navigator as any).standalone ||
                  document.referrer.includes('android-app://');

    if (!isPWA) {
      PWADebugger.log('PWAStartupHandler: Not in PWA mode, skipping');
      return;
    }

    PWADebugger.log('PWAStartupHandler: PWA detected', {
      currentPath: location.pathname,
      currentSearch: location.search,
      userLoading: loading,
      hasUser: !!user
    });

    // Check if we have the PWA parameter
    const searchParams = new URLSearchParams(location.search);
    const hasPWAParam = searchParams.has('pwa');
    
    // Handle PWA startup navigation
    if (hasPWAParam && location.pathname === '/dashboard') {
      PWADebugger.log('PWAStartupHandler: PWA startup detected on dashboard route');
      
      if (loading) {
        PWADebugger.log('PWAStartupHandler: Waiting for auth to complete');
        return; // Wait for auth to complete
      }

      if (!user) {
        PWADebugger.log('PWAStartupHandler: No user, redirecting to login with return URL');
        // Store the intended destination and redirect to login
        sessionStorage.setItem('pwa-return-url', '/dashboard');
        navigate('/login');
        return;
      }

      PWADebugger.log('PWAStartupHandler: User authenticated, maintaining dashboard route');
      // User is authenticated, let the normal routing handle it
    }

    // Handle the case where PWA opens on home page instead of dashboard
    if (location.pathname === '/' && !hasPWAParam) {
      PWADebugger.log('PWAStartupHandler: PWA opened on home page, checking if should redirect');
      
      if (loading) {
        PWADebugger.log('PWAStartupHandler: Waiting for auth to complete before redirect decision');
        return;
      }

      if (user) {
        PWADebugger.log('PWAStartupHandler: User authenticated, redirecting to dashboard');
        // User is logged in, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      PWADebugger.log('PWAStartupHandler: No user, staying on home page');
    }

  }, [location, user, loading, navigate]);

  // Handle return from login
  useEffect(() => {
    if (user && location.pathname === '/login') {
      const returnUrl = sessionStorage.getItem('pwa-return-url');
      if (returnUrl) {
        PWADebugger.log('PWAStartupHandler: User logged in, returning to stored URL', { returnUrl });
        sessionStorage.removeItem('pwa-return-url');
        navigate(returnUrl);
      }
    }
  }, [user, location, navigate]);

  return null; // This component doesn't render anything
}; 