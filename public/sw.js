// Track & Field PWA Service Worker
const CACHE_NAME = 'track-field-v8';
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/icon-180.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('[SW] Cache addAll failed:', error);
      })
  );
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

// Fetch event - Handle SPA routing with better PWA support
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle navigation requests for SPA
  if (event.request.mode === 'navigate') {
    console.log('[SW] Navigation request:', url.pathname, url.search);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('[SW] Navigation successful:', url.pathname);
          return response;
        })
        .catch(() => {
          console.log('[SW] Navigation failed, returning index for SPA:', url.pathname);
          // If network fails, return the main index.html for SPA routing
          return caches.match('/');
        })
    );
    return;
  }

  // Handle other requests (assets, API calls, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.log('[SW] Fetch failed:', error);
        // For failed requests, try to return a fallback if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        throw error;
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Handle PWA-specific events
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 