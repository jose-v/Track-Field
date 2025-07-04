import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Athlete {
  id: string;
  gender?: string;
  events?: string[];
  team_id?: string;
  first_name: string; // From athletes table
  last_name: string;  // From athletes table
  date_of_birth?: string;
  created_at: string;
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
      if (!user?.id) {
        console.log("[useCoachAthletes] No user ID, returning empty array");
        throw new Error('User not authenticated');
      }

      console.log(`[useCoachAthletes] Fetching APPROVED athletes for coach ${user.id}...`);

      // First, get all APPROVED athlete IDs for this coach from the coach_athletes table
      const { data: coachAthleteData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id, id')
        .eq('coach_id', user.id)
        .eq('approval_status', 'approved'); // Only get approved relationships

      if (relationError) {
        console.error('[useCoachAthletes] Error fetching coach-athlete relationships:', relationError);
        throw relationError;
      }

      console.log('[useCoachAthletes] Approved coach-athlete relationships found:', coachAthleteData);
      
      // If there are no approved athletes assigned to this coach, return empty array
      if (!coachAthleteData || coachAthleteData.length === 0) {
        console.log('[useCoachAthletes] No approved athletes found for this coach');
        return [];
      }

      // Extract athlete IDs
      const athleteIds = coachAthleteData.map(relation => relation.athlete_id);
      console.log('[useCoachAthletes] Approved athlete IDs to fetch:', athleteIds);

      // Get athlete data for these IDs
      const { data: athletesData, error: athletesError } = await supabase
        .from('athletes')
        .select(`
          id, date_of_birth, gender, events, team_id, weight_kg, first_name, last_name, created_at
        `)
        .in('id', athleteIds);

      if (athletesError) {
        console.error('[useCoachAthletes] Error fetching athletes data:', athletesError);
        console.error('[useCoachAthletes] Query params:', { ids: athleteIds });
        throw athletesError;
      }

      console.log('[useCoachAthletes] Athletes data fetched:', athletesData);
      
      if (!athletesData || athletesData.length === 0) {
        console.log('[useCoachAthletes] WARNING: No athlete records found for IDs:', athleteIds);
        console.log('[useCoachAthletes] This might indicate that the athletes exist in coach_athletes but not in the athletes table');
        
        return [];
      }

      // Now get the profiles data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, phone, avatar_url')
        .in('id', athleteIds);

      if (profilesError) {
        console.error('[useCoachAthletes] Error fetching profiles data:', profilesError);
        throw profilesError;
      }

      console.log('[useCoachAthletes] Profiles data fetched:', profilesData);

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
      
      console.log('[useCoachAthletes] Final combined APPROVED athlete data:', combinedData);
      return combinedData;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
} 