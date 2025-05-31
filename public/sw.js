// Track & Field PWA Service Worker
const CACHE_NAME = 'track-field-v9';
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

// Fetch event - Handle SPA routing
self.addEventListener('fetch', (event) => {
  // Handle navigation requests for SPA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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