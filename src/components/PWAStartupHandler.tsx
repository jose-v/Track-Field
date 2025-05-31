import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      return;
    }

    // Check if we have the PWA parameter
    const searchParams = new URLSearchParams(location.search);
    const hasPWAParam = searchParams.has('pwa');
    
    // Handle PWA startup navigation
    if (hasPWAParam && location.pathname === '/dashboard') {
      if (loading) {
        return; // Wait for auth to complete
      }

      if (!user) {
        // Store the intended destination and redirect to login
        sessionStorage.setItem('pwa-return-url', '/dashboard');
        navigate('/login');
        return;
      }

      // User is authenticated, let the normal routing handle it
    }

    // Handle the case where PWA opens on home page instead of dashboard
    if (location.pathname === '/' && !hasPWAParam) {
      if (loading) {
        return;
      }

      if (user) {
        // User is logged in, redirect to dashboard
        navigate('/dashboard');
        return;
      }
    }

  }, [location, user, loading, navigate]);

  // Handle return from login
  useEffect(() => {
    if (user && location.pathname === '/login') {
      const returnUrl = sessionStorage.getItem('pwa-return-url');
      if (returnUrl) {
        sessionStorage.removeItem('pwa-return-url');
        navigate(returnUrl);
      }
    }
  }, [user, location, navigate]);

  return null; // This component doesn't render anything
}; 