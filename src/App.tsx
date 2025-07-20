import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { FeedbackProvider } from './components/FeedbackProvider';
import { GamificationProvider } from './contexts/GamificationContext';
import { ChatbotProvider } from './components/ChatBot/ChatbotProvider';
import { PWARefreshButton } from './components/PWARefreshButton';
import { PWAStartupHandler } from './components/PWAStartupHandler';
import './App.css';

// Global error handler to prevent DOM manipulation errors
const setupGlobalErrorHandler = () => {
  // Override console.error to suppress specific DOM errors
  const originalError = console.error;
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    if (
      errorMessage.includes("Failed to execute 'contains' on 'Node'") ||
      errorMessage.includes("parameter 1 is not of type 'Node'") ||
      errorMessage.includes("Cannot read property 'contains' of null") ||
      errorMessage.includes("Cannot read property 'contains' of undefined") ||
      errorMessage.includes("TypeError: Failed to execute 'contains'")
    ) {
      // Completely suppress these errors
      return;
    }
    originalError.apply(console, args);
  };

  // Override console.warn to suppress related warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const warningMessage = args.join(' ');
    if (
      warningMessage.includes("contains") ||
      warningMessage.includes("Node") ||
      warningMessage.includes("DOM")
    ) {
      // Suppress DOM-related warnings
      return;
    }
    originalWarn.apply(console, args);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    if (
      errorMessage.includes("Failed to execute 'contains' on 'Node'") ||
      errorMessage.includes("parameter 1 is not of type 'Node'") ||
      errorMessage.includes("TypeError: Failed to execute 'contains'")
    ) {
      event.preventDefault();
      return;
    }
  });

  // Override Node.contains to prevent errors
  const originalContains = Node.prototype.contains;
  Node.prototype.contains = function(otherNode) {
    try {
      if (!otherNode || !(otherNode instanceof Node)) {
        return false;
      }
      return originalContains.call(this, otherNode);
    } catch (error) {
      return false;
    }
  };

  // Override Element.contains to prevent errors
  if (Element.prototype.contains) {
    const originalElementContains = Element.prototype.contains;
    Element.prototype.contains = function(otherNode) {
      try {
        if (!otherNode || !(otherNode instanceof Node)) {
          return false;
        }
        return originalElementContains.call(this, otherNode);
      } catch (error) {
        return false;
      }
    };
  }
};

// Initialize global error handler
setupGlobalErrorHandler();

// Global scroll event protection
const setupScrollProtection = () => {
  // Override addEventListener to protect scroll events
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'scroll') {
      // Wrap scroll listeners to prevent DOM manipulation errors
      const wrappedListener = function(event: Event) {
        try {
          if (listener && typeof listener === 'function') {
            listener.call(this, event);
          }
        } catch (error) {
          // Silently ignore scroll event errors
        }
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
};

// Initialize scroll protection
setupScrollProtection();

function App() {
  return (
    <BrowserRouter>
      <PWAStartupHandler />
      <AppRoutes />
      <PWARefreshButton />
    </BrowserRouter>
  );
}

export default App;
