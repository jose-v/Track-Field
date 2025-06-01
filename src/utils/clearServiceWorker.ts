// Utility to clear service workers during development
export const clearServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log('Unregistered service worker:', registration.scope, result);
      }
      
      // Also clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('Cleared cache:', cacheName);
        }
      }
      
      console.log('All service workers and caches cleared. Please refresh the page.');
      return true;
    } catch (error) {
      console.error('Error clearing service workers:', error);
      return false;
    }
  }
  return false;
};

// Call this function in the console to clear service workers:
// import { clearServiceWorkers } from './utils/clearServiceWorker'; clearServiceWorkers(); 