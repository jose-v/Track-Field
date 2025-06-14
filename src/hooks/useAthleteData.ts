import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  events?: string[];
  team_id?: string;
  age?: number;
}

export function useAthleteData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['athlete-data', user?.id],
    queryFn: async (): Promise<AthleteData | null> => {
      if (!user?.id) {
        console.log("[useAthleteData] No user ID, returning null");
        return null;
      }

      console.log(`[useAthleteData] Fetching data for athlete ${user.id}...`);

      try {
        // Get profile data first (most reliable)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url')
          .eq('id', user.id)
          .eq('role', 'athlete')
          .single();

        if (profileError) {
          console.error('[useAthleteData] Error fetching profile:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.warn('[useAthleteData] No profile found for athlete');
          return null;
        }

        // Get athlete-specific data (optional, don't fail if unavailable)
        let athleteData = null;
        try {
          const { data, error: athleteError } = await supabase
            .from('athletes')
            .select('id, date_of_birth, gender, events, team_id')
            .eq('id', user.id)
            .single();

          if (!athleteError && data) {
            athleteData = data;
          } else if (athleteError) {
            console.warn('[useAthleteData] Athlete data not available:', athleteError.message);
          }
        } catch (athleteErr) {
          console.warn('[useAthleteData] Failed to fetch athlete data, continuing with profile only');
        }

        // Calculate age if date_of_birth is available
        let age = undefined;
        if (athleteData?.date_of_birth) {
          const birthDate = new Date(athleteData.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        const result: AthleteData = {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          date_of_birth: athleteData?.date_of_birth,
          gender: athleteData?.gender,
          events: athleteData?.events || [],
          team_id: athleteData?.team_id,
          age
        };

        console.log('[useAthleteData] Successfully fetched athlete data:', result);
        return result;
      } catch (error) {
        console.error('[useAthleteData] Failed to fetch athlete data:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    retry: 2, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
} 