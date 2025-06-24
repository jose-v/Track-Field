import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.olympr.app';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZnFoaGZpcm9ycWRqbGRteXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzM1MjksImV4cCI6MjA2MjMwOTUyOX0.g3ZUC7KtCnN5B8G1qyjiatS9Achy8utlwansrlDyfjM';

/**
 * Abstract Database Client
 * Provides centralized database operations with retry logic, error handling, and auth management
 */
export class DbClient {
  private client: SupabaseClient;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 'x-application-name': 'track-and-field' }
      }
    });
  }

  /**
   * Get the raw Supabase client (for complex operations)
   */
  get supabase(): SupabaseClient {
    return this.client;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) throw new Error(`Authentication error: ${error.message}`);
    return user;
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw new Error(`Google sign-in error: ${error.message}`);
    return data;
  }

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(`Sign out error: ${error.message}`);
  }

  /**
   * Execute database operation with retry logic
   */
  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication or permission errors
        if (error.code === 'PGRST301' || error.code === 'PGRST116' || 
            error.message?.includes('JWT') || error.message?.includes('permission')) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === this.retryAttempts) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Database operation failed, retrying (${attempt}/${this.retryAttempts}):`, error.message);
      }
    }

    throw lastError!;
  }

  /**
   * Select data from a table with retry logic
   */
  async select<T = any>(
    table: string, 
    columns: string = '*', 
    filters?: Record<string, any>
  ): Promise<T[]> {
    return this.withRetry(async () => {
      let query = this.client.from(table).select(columns);
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      if (error) throw new Error(`Select error on ${table}: ${error.message}`);
      return (data || []) as T[];
    });
  }

  /**
   * Insert data into a table with retry logic
   */
  async insert<T = any>(table: string, data: any | any[]): Promise<T[]> {
    return this.withRetry(async () => {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw new Error(`Insert error on ${table}: ${error.message}`);
      return (result || []) as T[];
    });
  }

  /**
   * Update data in a table with retry logic
   */
  async update<T = any>(
    table: string, 
    data: any, 
    filters: Record<string, any>
  ): Promise<T[]> {
    return this.withRetry(async () => {
      let query = this.client.from(table).update(data);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select();
      if (error) throw new Error(`Update error on ${table}: ${error.message}`);
      return (result || []) as T[];
    });
  }

  /**
   * Upsert data in a table with retry logic
   */
  async upsert<T = any>(
    table: string, 
    data: any | any[], 
    options?: { onConflict?: string }
  ): Promise<T[]> {
    return this.withRetry(async () => {
      const { data: result, error } = await this.client
        .from(table)
        .upsert(data, options)
        .select();
      
      if (error) throw new Error(`Upsert error on ${table}: ${error.message}`);
      return (result || []) as T[];
    });
  }

  /**
   * Delete data from a table with retry logic
   */
  async delete<T = any>(table: string, filters: Record<string, any>): Promise<T[]> {
    return this.withRetry(async () => {
      let query = this.client.from(table).delete();
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select();
      if (error) throw new Error(`Delete error on ${table}: ${error.message}`);
      return (result || []) as T[];
    });
  }

  /**
   * Execute RPC function with retry logic
   */
  async rpc<T = any>(functionName: string, params?: Record<string, any>): Promise<T> {
    return this.withRetry(async () => {
      const { data, error } = await this.client.rpc(functionName, params);
      if (error) throw new Error(`RPC error on ${functionName}: ${error.message}`);
      return data;
    });
  }

  /**
   * Check if user has access to perform operation on resource
   */
  async checkAccess(userId: string, resource: string, resourceId: string): Promise<boolean> {
    try {
      // This would be customized based on your RLS policies
      const { data } = await this.client
        .from(resource)
        .select('id')
        .eq('id', resourceId)
        .limit(1);
      
      return data && data.length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const dbClient = new DbClient(); 