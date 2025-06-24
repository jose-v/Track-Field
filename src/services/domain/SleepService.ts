import { BaseService } from '../base/BaseService';

export interface SleepRecord {
  id?: string;
  athlete_id: string;
  sleep_date: string;
  start_time: string;
  end_time: string;
  quality: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SleepStats {
  avgDuration: number;
  avgQuality: number;
  totalRecords: number;
  latestRecord?: SleepRecord;
}

/**
 * Sleep Service
 * Handles all sleep-related database operations
 */
export class SleepService extends BaseService {
  
  /**
   * Calculate sleep duration in hours from start and end times
   */
  private calculateDuration(startTime: string, endTime: string): number {
    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      
      let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      // Handle sleep across midnight
      if (duration < 0) {
        duration += 24;
      }
      
      return Math.max(0, Math.min(24, duration)); // Clamp between 0 and 24 hours
    } catch (error) {
      console.error('Error calculating sleep duration:', error);
      return 0;
    }
  }
  
  /**
   * Get sleep records for a user within a date range
   */
  async getSleepRecords(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<SleepRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      // Validate user can access this data
      if (user.id !== userId) {
        const hasAccess = await this.validateUserAccess(user.id, 'sleep_records', userId);
        if (!hasAccess) {
          throw new Error('Access denied to sleep records');
        }
      }

      // Note: For date range queries, we'll need to use the raw Supabase client
      // since our simplified select method doesn't support complex filters yet
      const { data: records, error } = await this.db.supabase
        .from('sleep_records')
        .select('*')
        .eq('athlete_id', userId)
        .gte('sleep_date', startDate)
        .lte('sleep_date', endDate);

      if (error) {
        throw new Error(`Error fetching sleep records: ${error.message}`);
      }

      return records.sort((a, b) => new Date(b.sleep_date).getTime() - new Date(a.sleep_date).getTime());
    } catch (error) {
      this.handleError(error, 'getSleepRecords');
      throw error;
    }
  }

  /**
   * Get sleep records for the last N days
   */
  async getRecentSleepRecords(userId: string, days: number = 7): Promise<SleepRecord[]> {
    const endDate = this.formatDate(new Date());
    const startDate = this.formatDate(new Date(Date.now() - (days * 24 * 60 * 60 * 1000)));
    
    return this.getSleepRecords(userId, startDate, endDate);
  }

  /**
   * Get sleep statistics for a user
   */
  async getSleepStats(userId: string, days: number = 7): Promise<SleepStats> {
    try {
      const records = await this.getRecentSleepRecords(userId, days);
      
      if (records.length === 0) {
        return {
          avgDuration: 0,
          avgQuality: 0,
          totalRecords: 0
        };
      }

      const totalDuration = records.reduce((sum, record) => {
        // Calculate duration from start_time and end_time
        const duration = this.calculateDuration(record.start_time, record.end_time);
        return sum + duration;
      }, 0);
      const totalQuality = records.reduce((sum, record) => sum + record.quality, 0);

      return {
        avgDuration: Math.round((totalDuration / records.length) * 10) / 10,
        avgQuality: Math.round((totalQuality / records.length) * 10) / 10,
        totalRecords: records.length,
        latestRecord: records[0]
      };
    } catch (error) {
      this.handleError(error, 'getSleepStats');
      throw error;
    }
  }

  /**
   * Create a new sleep record
   */
  async createSleepRecord(sleepData: Omit<SleepRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SleepRecord> {
    try {
      const user = await this.getCurrentUser();
      
      // Validate user can create this record
      if (user.id !== sleepData.athlete_id) {
        throw new Error('Cannot create sleep record for another user');
      }

      // Validate required fields
      this.validateRequiredFields(sleepData, ['athlete_id', 'sleep_date', 'start_time', 'end_time', 'quality']);

      // Validate data ranges
      if (sleepData.quality < 1 || sleepData.quality > 4) {
        throw new Error('Quality must be between 1 and 4');
      }

      // Validate sleep duration
      const duration = this.calculateDuration(sleepData.start_time, sleepData.end_time);
      if (duration > 16) {
        throw new Error('Sleep duration cannot exceed 16 hours');
      }
      if (duration < 0.5) {
        throw new Error('Sleep duration must be at least 30 minutes');
      }

      const sanitizedData = this.sanitizeData(sleepData);
      const results = await this.db.insert<SleepRecord>('sleep_records', sanitizedData);
      
      if (results.length === 0) {
        throw new Error('Failed to create sleep record');
      }

      return results[0];
    } catch (error) {
      this.handleError(error, 'createSleepRecord');
      throw error;
    }
  }

  /**
   * Update an existing sleep record
   */
  async updateSleepRecord(
    recordId: string, 
    updates: Partial<Omit<SleepRecord, 'id' | 'athlete_id' | 'created_at' | 'updated_at'>>
  ): Promise<SleepRecord> {
    try {
      const user = await this.getCurrentUser();
      
      // Check if record exists and user owns it
      const existingRecords = await this.db.select<SleepRecord>(
        'sleep_records',
        '*',
        { id: recordId }
      );

      if (existingRecords.length === 0) {
        throw new Error('Sleep record not found');
      }

      const existingRecord = existingRecords[0];
      if (existingRecord.athlete_id !== user.id) {
        throw new Error('Cannot update another user\'s sleep record');
      }

      // Validate data if provided
      if (updates.quality !== undefined && (updates.quality < 1 || updates.quality > 4)) {
        throw new Error('Quality must be between 1 and 4');
      }

      // Validate sleep duration if times are being updated
      if (updates.start_time || updates.end_time) {
        const startTime = updates.start_time || existingRecord.start_time;
        const endTime = updates.end_time || existingRecord.end_time;
        const duration = this.calculateDuration(startTime, endTime);
        
        if (duration > 16) {
          throw new Error('Sleep duration cannot exceed 16 hours');
        }
        if (duration < 0.5) {
          throw new Error('Sleep duration must be at least 30 minutes');
        }
      }

      const sanitizedUpdates = this.sanitizeData(updates);
      const results = await this.db.update<SleepRecord>(
        'sleep_records',
        sanitizedUpdates,
        { id: recordId }
      );

      if (results.length === 0) {
        throw new Error('Failed to update sleep record');
      }

      return results[0];
    } catch (error) {
      this.handleError(error, 'updateSleepRecord');
      throw error;
    }
  }

  /**
   * Upsert sleep record (update if exists for date, create if not)
   */
  async upsertSleepRecord(sleepData: Omit<SleepRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SleepRecord> {
    try {
      const user = await this.getCurrentUser();
      
      if (user.id !== sleepData.athlete_id) {
        throw new Error('Cannot create/update sleep record for another user');
      }

      // Check if record exists for this date
      const existingRecords = await this.db.select<SleepRecord>(
        'sleep_records',
        '*',
        {
          athlete_id: sleepData.athlete_id,
          sleep_date: sleepData.sleep_date
        }
      );

      if (existingRecords.length > 0) {
        // Update existing record
        const { athlete_id, sleep_date, ...updates } = sleepData;
        return this.updateSleepRecord(existingRecords[0].id!, updates);
      } else {
        // Create new record
        return this.createSleepRecord(sleepData);
      }
    } catch (error) {
      this.handleError(error, 'upsertSleepRecord');
      throw error;
    }
  }

  /**
   * Delete a sleep record
   */
  async deleteSleepRecord(recordId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      // Check if record exists and user owns it
      const existingRecords = await this.db.select<SleepRecord>(
        'sleep_records',
        'athlete_id',
        { id: recordId }
      );

      if (existingRecords.length === 0) {
        throw new Error('Sleep record not found');
      }

      if (existingRecords[0].athlete_id !== user.id) {
        throw new Error('Cannot delete another user\'s sleep record');
      }

      await this.db.delete('sleep_records', { id: recordId });
    } catch (error) {
      this.handleError(error, 'deleteSleepRecord');
      throw error;
    }
  }

  /**
   * Get sleep record for a specific date
   */
  async getSleepRecordByDate(userId: string, date: string): Promise<SleepRecord | null> {
    try {
      const user = await this.getCurrentUser();
      
      if (user.id !== userId) {
        const hasAccess = await this.validateUserAccess(user.id, 'sleep_records', userId);
        if (!hasAccess) {
          throw new Error('Access denied to sleep records');
        }
      }

      const records = await this.db.select<SleepRecord>(
        'sleep_records',
        '*',
        {
          athlete_id: userId,
          sleep_date: date
        }
      );

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      this.handleError(error, 'getSleepRecordByDate');
      throw error;
    }
  }
}

// Export singleton instance
export const sleepService = new SleepService(); 