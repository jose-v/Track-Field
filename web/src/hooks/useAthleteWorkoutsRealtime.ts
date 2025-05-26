import { useEffect } from 'react';
import { supabase } from '../lib/supabase'; // corrected path

export function useAthleteWorkoutsRealtime(refetch: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('athlete_workouts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athlete_workouts' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);
} 