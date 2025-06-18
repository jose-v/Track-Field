import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  calculateSleepDuration, 
  getSleepQualityText, 
  SLEEP_QUALITY_MAPPING,
  analyzeSleepTrends 
} from '../utils/analytics/performance';

export interface SleepRecord {
  id: string;
  athlete_id: string;
  sleep_date: string;
  start_time: string;
  end_time: string;
  quality: number; // Back to number to match database schema
  notes?: string;
  created_at: string;
}

// Re-export quality mapping for backward compatibility
export const qualityMapping = SLEEP_QUALITY_MAPPING;

// Re-export quality text function for backward compatibility  
export const getQualityText = getSleepQualityText;

export function useSleepRecords(limit?: number) {
  const { user } = useAuth();

  return useQuery<SleepRecord[], Error>({
    queryKey: ['sleepRecords', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      let query = supabase
        .from('sleep_records')
        .select('*')
        .eq('athlete_id', user.id)
        .order('sleep_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: records, error } = await query;

      if (error) {
        throw error;
      }

      return records || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // Reduced to 30 seconds for more frequent updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60, // Refetch every minute when component is active
  });
}

// Get sleep stats using centralized analytics
export function useSleepStats() {
  const { data: records, isLoading, error, refetch } = useSleepRecords(7); // Last 7 records
  
  const stats = {
    averageDuration: 0,
    bestQuality: '',
    latestBedtime: '',
    countByQuality: {
      poor: 0,
      fair: 0,
      good: 0,
      excellent: 0
    },
    recentRecord: null as SleepRecord | null,
    trend: 'stable' as 'improving' | 'stable' | 'declining',
    consistencyScore: 0
  };

  if (records && records.length > 0) {
    // Prepare data for analytics
    const sleepData = records.map(record => {
      const duration = calculateSleepDuration(record.start_time, record.end_time);
      return {
        date: record.sleep_date,
        duration: duration.total,
        quality: record.quality
      };
    });

    // Use centralized analytics
    const analysis = analyzeSleepTrends(sleepData);
    stats.averageDuration = analysis.averageDuration;
    stats.trend = analysis.trend;
    stats.consistencyScore = analysis.consistencyScore;

    // Count by quality using centralized function
    records.forEach(record => {
      if (record.quality) {
        const qualityText = getSleepQualityText(record.quality);
        if (qualityText in stats.countByQuality) {
          stats.countByQuality[qualityText as keyof typeof stats.countByQuality]++;
        }
      }
    });
    
    // Get most recent record
    stats.recentRecord = records[0];

    // Find best quality
    const qualityOrder = ['poor', 'fair', 'good', 'excellent'];
    let bestQuality = 'poor';
    for (const quality of qualityOrder) {
      if (stats.countByQuality[quality as keyof typeof stats.countByQuality] > 0) {
        bestQuality = quality;
      }
    }
    stats.bestQuality = bestQuality;

    // Get latest bedtime from most recent record
    if (stats.recentRecord) {
      stats.latestBedtime = stats.recentRecord.start_time;
    }
  }

  return { stats, isLoading, error, refetch };
} 