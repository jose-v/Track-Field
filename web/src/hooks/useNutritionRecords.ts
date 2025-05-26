import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface EatingRecord {
  id: string;
  athlete_id: string;
  record_date: string;
  meal_type: string;
  calories: number;
  notes?: string;
  created_at: string;
}

export function useNutritionRecords(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nutritionRecords', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('eating_records')
        .select('*')
        .eq('athlete_id', user.id)
        .order('record_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching nutrition records:', error);
        throw error;
      }

      return data as EatingRecord[];
    },
    enabled: !!user,
  });
}

// Get nutrition stats
export function useNutritionStats() {
  const { data: records, isLoading, error } = useNutritionRecords(7); // Last 7 records
  
  const stats = {
    totalCalories: 0,
    averageCaloriesPerDay: 0,
    mealTypeDistribution: {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    },
    recentRecord: null as EatingRecord | null
  };

  if (records && records.length > 0) {
    // Calculate total calories
    let totalCalories = 0;
    
    // Group records by date for daily average
    const recordsByDate: Record<string, EatingRecord[]> = {};
    
    records.forEach(record => {
      // Add to total calories
      totalCalories += record.calories || 0;
      
      // Count by meal type
      if (record.meal_type) {
        stats.mealTypeDistribution[record.meal_type as keyof typeof stats.mealTypeDistribution]++;
      }
      
      // Group by date
      if (record.record_date) {
        if (!recordsByDate[record.record_date]) {
          recordsByDate[record.record_date] = [];
        }
        recordsByDate[record.record_date].push(record);
      }
    });
    
    stats.totalCalories = totalCalories;
    stats.averageCaloriesPerDay = Object.keys(recordsByDate).length > 0 
      ? totalCalories / Object.keys(recordsByDate).length 
      : 0;
    
    // Get most recent record
    stats.recentRecord = records[0];
  }

  return { stats, isLoading, error };
} 