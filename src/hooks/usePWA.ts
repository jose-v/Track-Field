import { useEffect, useState } from 'react';

interface PWAState {
  isInstallable: boolean;
  isFullscreen: boolean;
  canGoFullscreen: boolean;
  isHTTPS: boolean;
  hasServiceWorker: boolean;
  userAgent: string;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isFullscreen: false,
    canGoFullscreen: false,
    isHTTPS: false,
    hasServiceWorker: false,
    userAgent: '',
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check environment
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    const hasServiceWorker = 'serviceWorker' in navigator;
    const userAgent = navigator.userAgent;
    
    console.log('[PWA] Environment check:', {
      isHTTPS,
      hasServiceWorker,
      userAgent,
      hostname: location.hostname,
      protocol: location.protocol
    });

    setPwaState(prev => ({ 
      ...prev, 
      isHTTPS,
      hasServiceWorker,
      userAgent
    }));

    // Register service worker
    if (hasServiceWorker && false) { // Temporarily disabled
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] SW registered successfully:', registration);
        })
        .catch((registrationError) => {
          console.error('[PWA] SW registration failed:', registrationError);
        });
    } else {
      console.warn('[PWA] Service Worker disabled for development');
    }

    // Check if fullscreen API is available
    const canGoFullscreen = !!(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen
    );

    console.log('[PWA] Fullscreen API available:', canGoFullscreen);
    setPwaState(prev => ({ ...prev, canGoFullscreen }));

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      console.log('[PWA] Fullscreen state changed:', isFullscreen);
      setPwaState(prev => ({ ...prev, isFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed successfully!');
      setDeferredPrompt(null);
      setPwaState(prev => ({ ...prev, isInstallable: false }));
    });

    // Auto-hide address bar on mobile
    const hideAddressBar = () => {
      if (window.innerHeight < window.outerHeight) {
        console.log('[PWA] Attempting to hide address bar');
        window.scrollTo(0, 1);
      }
    };

    // Trigger on page load and orientation change
    setTimeout(hideAddressBar, 0);
    window.addEventListener('orientationchange', () => {
      setTimeout(hideAddressBar, 100);
    });

    // Debug: Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    console.log('[PWA] Running as standalone app:', isStandalone);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    console.log('[PWA] Install PWA triggered, deferredPrompt:', deferredPrompt);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setPwaState(prev => ({ ...prev, isInstallable: false }));
    } else {
      console.warn('[PWA] No deferred prompt available');
    }
  };

  const enterFullscreen = () => {
    console.log('[PWA] Entering fullscreen mode');
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    console.log('[PWA] Exiting fullscreen mode');
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  };

  const toggleFullscreen = () => {
    if (pwaState.isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  return {
    ...pwaState,
    installPWA,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}; 