/**
 * Debug utilities for troubleshooting authentication and other issues
 * These functions are meant to be called from the browser console.
 */

import { supabase } from '../lib/supabase';

// Make debug utils available in the global window object
declare global {
  interface Window {
    debugUtils: {
      signIn: (email: string, password: string) => Promise<void>;
      refreshSession: () => Promise<void>;
      clearSession: () => void;
      getSession: () => Promise<void>;
      checkAuth: () => Promise<void>;
    };
  }
}

// Sign in with email/password
async function signIn(email: string, password: string): Promise<void> {
  try {
    console.log(`Attempting to sign in with email: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Sign in failed:', error);
    } else {
      console.log('Sign in successful!', data);
      console.log('User:', data.user);
      console.log('Session:', data.session);
    }
  } catch (e) {
    console.error('Error during sign in:', e);
  }
}

// Try to refresh the current session
async function refreshSession(): Promise<void> {
  try {
    console.log('Attempting to refresh session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh failed:', error);
    } else if (data.session) {
      console.log('Session refreshed successfully!', data);
    } else {
      console.log('No session to refresh');
    }
  } catch (e) {
    console.error('Error during session refresh:', e);
  }
}

// Clear the current session (sign out)
function clearSession(): void {
  try {
    console.log('Clearing session from localStorage...');
    
    // Remove all supabase related items from localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith('sb-'))
      .forEach(key => {
        console.log(`Removing ${key}`);
        localStorage.removeItem(key);
      });
      
    console.log('Session cleared. Refreshing page...');
    
    // Reload the page to apply changes
    window.location.reload();
  } catch (e) {
    console.error('Error clearing session:', e);
  }
}

// Get and display the current session
async function getSession(): Promise<void> {
  try {
    console.log('Getting current session...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
    } else if (data.session) {
      console.log('Current session:', data.session);
      console.log('User:', data.session.user);
      console.log('Access token:', data.session.access_token);
      console.log('Refresh token:', data.session.refresh_token ? 'EXISTS' : 'MISSING');
      
      // Check token expiry
      const jwt = parseJwt(data.session.access_token);
      console.log('Token expiry:', new Date(jwt.exp * 1000).toLocaleString());
      console.log('Current time:', new Date().toLocaleString());
      console.log('Expires in:', Math.floor((jwt.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');
    } else {
      console.log('No active session');
    }
  } catch (e) {
    console.error('Error getting session:', e);
  }
}

// Check auth state and print detailed auth debugging info
async function checkAuth(): Promise<void> {
  try {
    console.log('--- Auth Debug Information ---');
    
    // Get session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session exists:', !!sessionData.session);
    
    // Show localStorage keys related to auth
    console.log('Auth localStorage keys:');
    Object.keys(localStorage)
      .filter(key => key.startsWith('sb-'))
      .forEach(key => {
        const item = localStorage.getItem(key);
        console.log(`- ${key}: ${item ? (item.length > 50 ? item.substring(0, 50) + '...' : item) : 'null'}`);
      });
      
    if (sessionData.session) {
      await getSession();
    }
    
    console.log('--- End Auth Debug Information ---');
  } catch (e) {
    console.error('Error during auth check:', e);
  }
}

// Helper to parse JWT tokens
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return {};
  }
}

// Initialize debug utilities
export function initDebugUtils() {
  if (typeof window !== 'undefined') {
    window.debugUtils = {
      signIn,
      refreshSession,
      clearSession,
      getSession,
      checkAuth
    };
    
    console.log('Debug utilities initialized. Available via window.debugUtils');
  }
}

export default {
  initDebugUtils
}; 