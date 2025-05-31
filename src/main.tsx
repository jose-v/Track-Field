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

// Register service worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates immediately
        registration.update();
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, force reload for PWA
                console.log('New PWA version available, updating...');
                window.location.reload();
              }
            });
          }
        });
        
        // Check for updates every 2 minutes (more frequent than before)
        setInterval(() => {
          console.log('Checking for PWA updates...');
          registration.update();
        }, 2 * 60 * 1000);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
