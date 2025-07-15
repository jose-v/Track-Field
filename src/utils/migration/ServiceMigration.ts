import { dbClient } from '../../lib/dbClient';
import { sleepService } from '../../services/domain/SleepService';
import { getTodayLocalDate } from '../dateUtils';

/**
 * Service Migration Utility
 * Helps transition from direct Supabase calls to service layer
 */
export class ServiceMigration {
  
  /**
   * Migration wrapper that allows gradual transition
   * Uses new service if available, falls back to legacy method
   */
  static async withFallback<T>(
    newServiceCall: () => Promise<T>,
    legacyCall: () => Promise<T>,
    featureFlag: string = 'use_new_services'
  ): Promise<T> {
    const useNewServices = localStorage.getItem(featureFlag) === 'true' || 
                          import.meta.env.VITE_USE_NEW_SERVICES === 'true';
    
    if (useNewServices) {
      try {
        return await newServiceCall();
      } catch (error) {
        console.warn(`New service failed, falling back to legacy:`, error);
        return await legacyCall();
      }
    } else {
      return await legacyCall();
    }
  }

  /**
   * Sleep-specific migration helpers
   */
  static sleep = {
    async getRecords(userId: string, days: number = 7) {
      return ServiceMigration.withFallback(
        () => sleepService.getRecentSleepRecords(userId, days),
        async () => {
          // Legacy implementation using timezone-aware dates
          const endDate = getTodayLocalDate();
          const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
          const startDateLocal = startDate.getFullYear() + '-' + 
            String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(startDate.getDate()).padStart(2, '0');
          
          const { data, error } = await dbClient.supabase
            .from('sleep_records')
            .select('*')
            .eq('athlete_id', userId)
            .gte('sleep_date', startDateLocal)
            .lte('sleep_date', endDate)
            .order('sleep_date', { ascending: false });

          if (error) throw error;
          return data || [];
        }
      );
    },

    async getStats(userId: string, days: number = 7) {
      return ServiceMigration.withFallback(
        () => sleepService.getSleepStats(userId, days),
        async () => {
          // Legacy stats calculation
          const records = await ServiceMigration.sleep.getRecords(userId, days);
          
          if (records.length === 0) {
            return { avgDuration: 0, avgQuality: 0, totalRecords: 0 };
          }

          const totalDuration = records.reduce((sum: number, record: any) => sum + record.duration, 0);
          const totalQuality = records.reduce((sum: number, record: any) => sum + record.quality, 0);

          return {
            avgDuration: Math.round((totalDuration / records.length) * 10) / 10,
            avgQuality: Math.round((totalQuality / records.length) * 10) / 10,
            totalRecords: records.length,
            latestRecord: records[0]
          };
        }
      );
    },

    async createRecord(sleepData: any) {
      return ServiceMigration.withFallback(
        () => sleepService.upsertSleepRecord(sleepData),
        async () => {
          // Legacy upsert implementation
          const { data: existing } = await dbClient.supabase
            .from('sleep_records')
            .select('id')
            .eq('athlete_id', sleepData.athlete_id)
            .eq('sleep_date', sleepData.sleep_date)
            .single();

          if (existing) {
            const { data, error } = await dbClient.supabase
              .from('sleep_records')
              .update(sleepData)
              .eq('id', existing.id)
              .select()
              .single();
            
            if (error) throw error;
            return data;
          } else {
            const { data, error } = await dbClient.supabase
              .from('sleep_records')
              .insert(sleepData)
              .select()
              .single();
            
            if (error) throw error;
            return data;
          }
        }
      );
    }
  };

  /**
   * Enable new services for testing
   */
  static enableNewServices() {
    localStorage.setItem('use_new_services', 'true');
    console.log('✅ New services enabled for this session');
  }

  /**
   * Disable new services (use legacy)
   */
  static disableNewServices() {
    localStorage.setItem('use_new_services', 'false');
    console.log('⚠️ Using legacy services for this session');
  }

  /**
   * Check current service mode
   */
  static getCurrentMode(): 'new' | 'legacy' {
    const useNewServices = localStorage.getItem('use_new_services') === 'true' || 
                          import.meta.env.VITE_USE_NEW_SERVICES === 'true';
    return useNewServices ? 'new' : 'legacy';
  }

  /**
   * Migration status checker
   */
  static async checkMigrationHealth() {
    const results = {
      dbClient: false,
      sleepService: false,
      errors: [] as string[]
    };

    try {
      // Test dbClient
      await dbClient.getCurrentUser();
      results.dbClient = true;
    } catch (error: any) {
      results.errors.push(`DbClient error: ${error.message}`);
    }

    try {
      // Test sleep service (if user is authenticated)
      const user = await dbClient.getCurrentUser();
      if (user) {
        await sleepService.getRecentSleepRecords(user.id, 1);
        results.sleepService = true;
      }
    } catch (error: any) {
      results.errors.push(`SleepService error: ${error.message}`);
    }

    return results;
  }
}

// Add to window for debugging in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).ServiceMigration = ServiceMigration;
  
  // Also expose other services for console testing
  import('../../services/index.js').then(module => {
    (window as any).services = module.services;
    (window as any).sleepService = module.sleepService;
    (window as any).dbClient = module.dbClient;
    console.log('🔧 Debug services loaded:', Object.keys(module.services));
  }).catch(err => {
    console.warn('Could not load services for debugging:', err);
  });
} 