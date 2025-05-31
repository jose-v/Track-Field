// PWA Debug Utility
export const PWADebugger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[PWA Debug ${timestamp}] ${message}`, data || '');
    
    // Store debug info in localStorage for inspection
    const debugLog = JSON.parse(localStorage.getItem('pwa-debug-log') || '[]');
    debugLog.push({
      timestamp,
      message,
      data,
      url: window.location.href,
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    });
    
    // Keep only last 50 entries
    if (debugLog.length > 50) {
      debugLog.splice(0, debugLog.length - 50);
    }
    
    localStorage.setItem('pwa-debug-log', JSON.stringify(debugLog));
  },
  
  getDebugLog: () => {
    return JSON.parse(localStorage.getItem('pwa-debug-log') || '[]');
  },
  
  clearDebugLog: () => {
    localStorage.removeItem('pwa-debug-log');
  },
  
  analyzeStartup: () => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const currentUrl = window.location.href;
    const searchParams = new URLSearchParams(window.location.search);
    const hasPWAParam = searchParams.has('pwa');
    
    PWADebugger.log('PWA Startup Analysis', {
      isPWA,
      currentUrl,
      hasPWAParam,
      pathname: window.location.pathname,
      search: window.location.search,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
    
    return {
      isPWA,
      currentUrl,
      hasPWAParam,
      shouldBeOnDashboard: isPWA && window.location.pathname === '/'
    };
  }
};

// Auto-analyze on import
if (typeof window !== 'undefined') {
  PWADebugger.analyzeStartup();
} 