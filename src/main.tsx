import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RootProviders } from './app/RootProviders'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootProviders>
      <App />
    </RootProviders>
  </React.StrictMode>,
)

// Register service worker for PWA functionality (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js')
    .then(() => {
      // Service worker registered successfully
    })
    .catch((registrationError) => {
      console.error('SW registration failed:', registrationError);
    });
        
  // Check for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // New service worker has taken control
                window.location.reload();
        });
        
  // Listen for service worker updates
  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener('updatefound', () => {
      // New service worker is available
      });
  });
}
