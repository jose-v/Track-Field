import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface Athlete {
  id: string;
  gender?: string;
  events?: string[];
  team_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  weight_kg?: number;
}

export function useCoachAthletes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coach-athletes', user?.id],
    queryFn: async (): Promise<Athlete[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('athletes')
        .select(`
          id,
          gender,
          events,
          team_id,
          first_name,
          last_name,
          date_of_birth,
          created_at,
          created_by,
          updated_at,
          updated_by,
          weight_kg
        `)
        // .eq('coach_id', user.id) // Uncomment if you have coach_id
        .order('first_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
} 