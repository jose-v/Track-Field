/**
 * API utilities for handling Supabase authentication and requests
 */

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wrapper function for API calls that handles authentication errors
 * and automatically refreshes the session if needed
 */
export async function withAuthHandling<T>(
  apiCall: () => Promise<T>,
  options?: {
    maxRetries?: number;
    refreshOnError?: boolean;
  }
): Promise<T> {
  const { maxRetries = 1, refreshOnError = true } = options || {};
  let attempts = 0;
  
  while (attempts <= maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      attempts++;
      console.error(`API error (attempt ${attempts}/${maxRetries + 1}):`, error);
      
      // Check if it's an authentication error
      if (refreshOnError && 
          (error.message?.includes('Invalid JWT') || 
           error.message?.includes('JWT expired') ||
           error.message?.includes('Invalid refresh token') ||
           error.message?.includes('not authenticated'))) {
        
        console.log('Auth error detected, attempting to refresh session...');
        
        try {
          // If it's specifically a refresh token error, try to get a new session
          if (error.message?.includes('Invalid refresh token') || error.message?.includes('Refresh Token Not Found')) {
            console.log('Refresh token issue detected, redirecting to login...');
            // This requires manual intervention - can't recover
            window.location.href = '/login?error=session_expired';
            break;
          }
          
          // Try to refresh the token
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Error refreshing session:', refreshError);
            if (attempts > maxRetries) throw error; // Re-throw original error if max retries reached
          } else if (data.session) {
            console.log('Session refreshed, retrying request');
            // Continue and retry the request
            continue;
          }
        } catch (refreshException) {
          console.error('Exception during refresh:', refreshException);
        }
      }
      
      // If we've reached max retries or it's not an auth error, throw the original error
      if (attempts > maxRetries) throw error;
    }
  }
  
  // This should never be reached due to the throws above, but TypeScript needs it
  throw new Error('Unexpected end of withAuthHandling');
}

/**
 * React hook for using the withAuthHandling function in components
 */
export function useApiWithAuth() {
  const { refreshSession } = useAuth();
  
  const callApiWithAuth = async <T>(
    apiCall: () => Promise<T>,
    options?: {
      maxRetries?: number;
      refreshOnError?: boolean;
    }
  ): Promise<T> => {
    const { maxRetries = 1, refreshOnError = true } = options || {};
    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        return await apiCall();
      } catch (error: any) {
        attempts++;
        console.error(`API error (attempt ${attempts}/${maxRetries + 1}):`, error);
        
        // Check if it's an authentication error
        if (refreshOnError && 
            (error.message?.includes('Invalid JWT') || 
             error.message?.includes('JWT expired') ||
             error.message?.includes('Invalid refresh token') ||
             error.message?.includes('not authenticated'))) {
          
          console.log('Auth error detected, using AuthContext to refresh session...');
          
          // If it's specifically a refresh token error, we need to redirect to login
          if (error.message?.includes('Invalid refresh token') || error.message?.includes('Refresh Token Not Found')) {
            console.log('Refresh token issue detected, redirecting to login...');
            window.location.href = '/login?error=session_expired';
            break;
          }
          
          // Use the AuthContext's refresh method
          const refreshed = await refreshSession();
          
          if (refreshed) {
            console.log('Session refreshed via AuthContext, retrying request');
            continue; // Retry the request
          }
        }
        
        // If we've reached max retries or it's not an auth error, throw the original error
        if (attempts > maxRetries) throw error;
      }
    }
    
    // This should never be reached
    throw new Error('Unexpected end of callApiWithAuth');
  };
  
  return { callApiWithAuth };
} 