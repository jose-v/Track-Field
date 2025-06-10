import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { handleOAuthUserProfile } from '../services/authService'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
  showEmailVerifiedToast: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshAttempts, setRefreshAttempts] = useState(0)
  const lastRefreshAttempt = useRef<number>(0)
  const refreshInProgress = useRef<boolean>(false)

  // Add timeout for loading states to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('Auth loading taking too long, forcing loading to false');
        setLoading(false);
      }, 15000); // 15 second timeout for auth
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Initialize auth and set up listeners
  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log('Session found during initialization');
          console.log('🔍 AuthContext: User data during initialization:', {
            userId: data.session.user.id,
            email: data.session.user.email,
            userMetadata: data.session.user.user_metadata,
            appMetadata: data.session.user.app_metadata,
            identities: data.session.user.identities,
            // Full user object structure
            fullUser: data.session.user,
            // Try to access any name fields
            name: (data.session.user as any).name,
            fullName: (data.session.user as any).full_name,
            firstName: (data.session.user as any).first_name,
            lastName: (data.session.user as any).last_name,
            // Keys available on user object
            userKeys: Object.keys(data.session.user),
            // Check raw metadata
            rawMetadata: JSON.stringify(data.session.user.user_metadata),
            rawIdentities: JSON.stringify(data.session.user.identities)
          });
          setUser(data.session.user);
          setSession(data.session);
        } else {
          console.log('No active session found');
          setUser(null);
          setSession(null);
        }
      } catch (e) {
        console.error('Unexpected error during auth initialization:', e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('Auth state changed:', _event);
      
      if (newSession) {
        console.log('New session available');
        console.log('🔍 AuthContext: User data during state change:', {
          event: _event,
          userId: newSession.user.id,
          email: newSession.user.email,
          userMetadata: newSession.user.user_metadata,
          appMetadata: newSession.user.app_metadata,
          identities: newSession.user.identities,
          // Full user object structure
          fullUser: newSession.user,
          // Try to access any name fields
          name: (newSession.user as any).name,
          fullName: (newSession.user as any).full_name,
          firstName: (newSession.user as any).first_name,
          lastName: (newSession.user as any).last_name,
          // Keys available on user object
          userKeys: Object.keys(newSession.user),
          // Check raw metadata
          rawMetadata: JSON.stringify(newSession.user.user_metadata),
          rawIdentities: JSON.stringify(newSession.user.identities)
        });
        
        // Handle OAuth profile creation for new users
        if (_event === 'SIGNED_IN' && newSession.user.identities) {
          const hasOAuthIdentity = newSession.user.identities.some(
            (identity: any) => identity.provider === 'google'
          );
          
          if (hasOAuthIdentity) {
            console.log('OAuth user detected, ensuring profile exists');
            
            // Check if we're in a signup context by looking for role in localStorage
            let selectedRole: any = null;
            try {
              const signupDataStr = localStorage.getItem('signup-data');
              if (signupDataStr) {
                const signupData = JSON.parse(signupDataStr);
                selectedRole = signupData.role;
              }
            } catch (error) {
              console.log('No signup context found');
            }
            
            // Only pass role if we have one from signup context
            // If no role, handleOAuthUserProfile will know we're in signup flow
            const roleToPass = selectedRole || undefined;
            
            // Don't block the auth flow if profile creation fails
            handleOAuthUserProfile(newSession.user, roleToPass).catch(error => {
              console.error('Failed to create OAuth user profile:', error);
            });
          }
        }
        
        setUser(newSession.user);
        setSession(newSession);
      } else {
        console.log('Session ended');
        setUser(null);
        setSession(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Try to recover if we get auth errors
  useEffect(() => {
    // Don't retry too frequently
    if (refreshAttempts > 0 && !refreshInProgress.current) {
      // Only log refresh attempts in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Auth refresh attempt ${refreshAttempts}`);
      }
      
      // Check if we're trying to refresh too frequently
      const now = Date.now();
      if (now - lastRefreshAttempt.current < 5000) {
        // Only log throttling in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Throttling refresh attempts - too many requests');
        }
        return;
      }
      
      lastRefreshAttempt.current = now;
      refreshInProgress.current = true;
      
      const attemptRefresh = async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('Error refreshing session:', error);
            
            // If it's a rate limit error, wait longer
            if (error.message?.includes('rate limit')) {
              console.log('Hit rate limit, will try again later');
              setTimeout(() => {
                refreshInProgress.current = false;
              }, 10000); // Wait 10 seconds
              return;
            }
            
            // If still failing after multiple attempts, trigger sign out
            if (refreshAttempts > 3) {
              console.log('Too many refresh attempts, signing out');
              await supabase.auth.signOut();
              setRefreshAttempts(0);
              // Clear localStorage for Supabase
              Object.keys(localStorage)
                .filter(key => key.startsWith('sb-'))
                .forEach(key => localStorage.removeItem(key));
            }
          } else if (data.session) {
            setUser(data.session.user);
            setSession(data.session);
            setRefreshAttempts(0);
          }
        } catch (e) {
          console.error('Unexpected error during refresh:', e);
        } finally {
          refreshInProgress.current = false;
        }
      };
      
      attemptRefresh();
    }
  }, [refreshAttempts]);

  const signIn = async (email: string, password: string) => {
    try {
      // Clear any existing authentication data first
      await supabase.auth.signOut();
      
      // Clear localStorage for Supabase
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-'))
        .forEach(key => localStorage.removeItem(key));
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      setUser(data.user);
      setSession(data.session);
    } catch (e) {
      console.error('Unexpected error during sign in:', e);
      throw e;
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
    } catch (e) {
      console.error('Unexpected error during sign up:', e);
      throw e;
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      setUser(null);
      setSession(null);
      
      // Clear localStorage for Supabase
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-'))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Unexpected error during sign out:', e);
      throw e;
    }
  }

  const refreshSession = async (): Promise<boolean> => {
    // Prevent concurrent refreshes
    if (refreshInProgress.current) {
      return false;
    }
    
    // Add rate limiting
    const now = Date.now();
    if (now - lastRefreshAttempt.current < 5000) {
      // Only log throttling in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Throttling refresh - too recent attempt');
      }
      return false;
    }
    
    lastRefreshAttempt.current = now;
    refreshInProgress.current = true;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        
        // If it's specifically a missing session error, we should redirect to login
        if (error.message?.includes('Auth session missing')) {
          console.log('Session missing, clearing auth data');
          setUser(null);
          setSession(null);
          
          // Clear localStorage for Supabase
          Object.keys(localStorage)
            .filter(key => key.startsWith('sb-'))
            .forEach(key => localStorage.removeItem(key));
            
          return false;
        }
        
        setRefreshAttempts(prev => prev + 1);
        return false;
      }
      
      if (data?.session) {
        setUser(data.session.user);
        setSession(data.session);
        setRefreshAttempts(0);
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Unexpected error during manual refresh:', e);
      setRefreshAttempts(prev => prev + 1);
      return false;
    } finally {
      // Make sure we release the lock
      refreshInProgress.current = false;
    }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      // Clear any existing authentication data first
      await supabase.auth.signOut();
      
      // Clear localStorage for Supabase
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-'))
        .forEach(key => localStorage.removeItem(key));
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Determine redirect URL based on context
      let finalRedirectTo: string;
      
      if (redirectTo) {
        finalRedirectTo = redirectTo;
      } else {
        // Check if we're in a signup context by looking at the current URL
        const currentPath = window.location.pathname;
        const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://olympr.app';
        if (currentPath === '/signup' || currentPath.includes('signup')) {
          // For signup context, redirect to a special signup completion page
          finalRedirectTo = `${baseUrl}/signup?oauth_return=true`;
        } else {
          // For login context, redirect to dashboard router which will redirect to appropriate role dashboard
          finalRedirectTo = `${baseUrl}/dashboard`;
        }
      }
      
      // Sign in with Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      
      // Note: The actual auth state change will be handled by the onAuthStateChange listener
      // when the user returns from Google's OAuth flow
    } catch (e) {
      console.error('Unexpected error during Google sign in:', e);
      throw e;
    }
  }

  const showEmailVerifiedToast = () => {
    // Set a flag in localStorage to show the toast on next dashboard visit
    localStorage.setItem('show-email-verified-toast', 'true')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut, refreshSession, showEmailVerifiedToast }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 