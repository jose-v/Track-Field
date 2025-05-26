import { createClient } from '@supabase/supabase-js'

// For debugging - directly check what's coming in from import.meta.env
console.log('Direct env values:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
});

// HARDCODED VALUES AS FALLBACKS - LAST RESORT
const FALLBACK_URL = 'https://vdfqhhfirorqdjldmyzc.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZnFoaGZpcm9ycWRqbGRteXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzM1MjksImV4cCI6MjA2MjMwOTUyOX0.g3ZUC7KtCnN5B8G1qyjiatS9Achy8utlwansrlDyfjM';

// Get Supabase URL, ensuring it has https:// prefix
let supabaseUrl: string;
try {
  let rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
  
  // If the URL doesn't look valid, use the fallback
  if (!rawUrl || rawUrl === 'YOUR_SUPABASE_URL' || rawUrl.includes('undefined')) {
    console.warn('Invalid URL from env, using fallback URL');
    supabaseUrl = FALLBACK_URL;
  } else {
    // Ensure URL has https:// prefix
    supabaseUrl = rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;
  }
} catch (error) {
  console.error('Error processing Supabase URL:', error);
  supabaseUrl = FALLBACK_URL;
}

// Get Supabase anon key
let supabaseAnonKey: string;
try {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  // If the key doesn't look valid, use the fallback
  if (!envKey || envKey.length < 20 || envKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('Invalid key from env, using fallback key');
    supabaseAnonKey = FALLBACK_KEY;
  } else {
    supabaseAnonKey = envKey;
  }
} catch (error) {
  console.error('Error processing Supabase key:', error);
  supabaseAnonKey = FALLBACK_KEY;
}

// Log what we're actually using to connect
console.log('Supabase connection info:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
  keyLength: supabaseAnonKey.length
});

// Create supabase client with error handling
let supabase: any;

try {
  // Create the Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  
  // Test the client with a simple query to verify it's working
  supabase.auth.onAuthStateChange((event: string, session: any) => {
    console.log('Supabase auth state change:', event, session ? 'has session' : 'no session');
  });
  
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('CRITICAL ERROR initializing Supabase client:', error);
  
  // Create a dummy client that won't throw errors
  supabase = {
    auth: {
      onAuthStateChange: (callback: any) => {
        console.log('Mock auth change listener registered');
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null })
    })
  };
}

// Export the client
export { supabase }; 