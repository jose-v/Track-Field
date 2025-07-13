import { useEffect } from 'react';
import { supabase } from '../lib/supabase'; // corrected path

export function useAthleteWorkoutsRealtime(refetch: () => void) {
  useEffect(() => {
    // Debounce refetch calls to prevent spam
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefetch = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refetch();
      }, 1000); // Wait 1 second before refetching
    };
    
    const channel = supabase
      .channel('athlete_workouts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athlete_workouts' },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, []); // Remove refetch dependency to prevent infinite loops
} 