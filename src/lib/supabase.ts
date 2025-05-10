import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add verbose logging to help debug connection issues
console.log('Initializing Supabase client. URL defined:', !!supabaseUrl, 'Key defined:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. This will cause API failures.');
  throw new Error('Missing Supabase environment variables');
}

// Create client with retry options and better timeout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options) => {
      // Add better timeout handling
      const timeout = 30000; // 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      return fetchPromise.finally(() => clearTimeout(timeoutId));
    }
  }
}); 