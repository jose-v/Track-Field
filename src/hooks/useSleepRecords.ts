import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface SleepRecord {
  id: string;
  athlete_id: string;
  sleep_date: string;
  start_time: string;
  end_time: string;
  quality: number;
  notes?: string;
  created_at: string;
}

// Quality mapping between display values and stored integer values
export const qualityMapping = {
  1: 'poor',
  2: 'fair',
  3: 'good',
  4: 'excellent'
};

// Helper to get quality text from quality number
export function getQualityText(qualityValue: number): string {
  return qualityMapping[qualityValue as keyof typeof qualityMapping] || 'Unknown';
}

export function useSleepRecords(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sleepRecords', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('athlete_id', user.id)
        .order('sleep_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sleep records:', error);
        throw error;
      }

      return data as SleepRecord[];
    },
    enabled: !!user,
  });
}

// Helper to calculate sleep duration in hours and minutes
export function calculateSleepDuration(start: string, end: string): { hours: number; minutes: number; total: number } {
  if (!start || !end) return { hours: 0, minutes: 0, total: 0 };

  try {
    const startTime = new Date(`1970-01-01T${start}`);
    let endTime = new Date(`1970-01-01T${end}`);
    
    // If end time is earlier than start time, assume it's the next day
    if (endTime < startTime) {
      endTime = new Date(`1970-01-02T${end}`);
    }
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalHours = diffMs / (1000 * 60 * 60);
    
    return { hours: diffHrs, minutes: diffMins, total: totalHours };
  } catch (error) {
    return { hours: 0, minutes: 0, total: 0 };
  }
}

// Get sleep stats
export function useSleepStats() {
  const { data: records, isLoading, error } = useSleepRecords(7); // Last 7 records
  
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
    recentRecord: null as SleepRecord | null
  };

  if (records && records.length > 0) {
    // Calculate total duration and average
    let totalDuration = 0;
    let validRecords = 0;

    records.forEach(record => {
      if (record.start_time && record.end_time) {
        const duration = calculateSleepDuration(record.start_time, record.end_time);
        totalDuration += duration.total;
        validRecords++;
      }

      // Count quality - convert numeric quality to string for counting
      if (record.quality) {
        const qualityText = getQualityText(record.quality);
        if (qualityText in stats.countByQuality) {
          stats.countByQuality[qualityText as keyof typeof stats.countByQuality]++;
        }
      }
    });

    stats.averageDuration = validRecords > 0 ? totalDuration / validRecords : 0;
    
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
  }

  return { stats, isLoading, error };
} 