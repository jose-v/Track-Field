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
  email?: string;
  phone?: string;
  avatar_url?: string;
  age?: number;
  completion_rate?: number;
}

export function useCoachAthletes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coach-athletes', user?.id],
    queryFn: async (): Promise<Athlete[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get the athletes data
      const { data: athletesData, error: athletesError } = await supabase
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
        .order('first_name');

      if (athletesError) throw athletesError;

      // Now get the profiles data
      const athleteIds = athletesData.map(athlete => athlete.id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, phone, avatar_url')
        .in('id', athleteIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by id for easy lookup
      const profilesMap = new Map();
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine the data and calculate age and completion rate
      const combinedData = athletesData.map(athlete => {
        const profile = profilesMap.get(athlete.id);
        
        // Calculate age from date_of_birth
        let age = undefined;
        if (athlete.date_of_birth) {
          const birthDate = new Date(athlete.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        // Calculate a dummy completion rate for demo purposes
        const completionRate = Math.floor(Math.random() * 100);
        
        return {
          ...athlete,
          email: profile?.email,
          phone: profile?.phone,
          avatar_url: profile?.avatar_url,
          age,
          completion_rate: completionRate
        };
      });
      
      return combinedData;
    },
    enabled: !!user?.id,
  });
} 