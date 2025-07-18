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
  approval_status?: 'pending' | 'approved' | 'declined'; // From coach_athletes table
}

export function useCoachAthletes(options?: { 
  includeStatuses?: ('pending' | 'approved' | 'declined')[] 
}) {
  const { user } = useAuth();
  const includeStatuses = options?.includeStatuses || ['approved'];

  return useQuery({
    queryKey: ['coach-athletes', user?.id, includeStatuses],
    queryFn: async (): Promise<Athlete[]> => {
      if (!user?.id) {
        console.log("[useCoachAthletes] No user ID, returning empty array");
        throw new Error('User not authenticated');
      }

      console.log(`[useCoachAthletes] Fetching athletes with statuses [${includeStatuses.join(', ')}] for coach ${user.id}...`);

      // Method 1: Get direct coach-athlete relationships
      const { data: coachAthleteData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id, id, approval_status')
        .eq('coach_id', user.id)
        .in('approval_status', includeStatuses);

      if (relationError) {
        console.error('[useCoachAthletes] Error fetching coach-athlete relationships:', relationError);
        throw relationError;
      }

      console.log(`[useCoachAthletes] Direct coach-athlete relationships found:`, coachAthleteData);

      // Method 2: Get athletes from teams where this coach is a member
      // First, get teams where this coach is a member
      const { data: coachTeams, error: coachTeamsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'coach')
        .eq('status', 'active');

      let teamAthletes: any[] = [];
      let teamError = null;

      if (coachTeamsError) {
        console.error('[useCoachAthletes] Error fetching coach teams:', coachTeamsError);
        teamError = coachTeamsError;
      } else if (coachTeams && coachTeams.length > 0) {
        // Get athletes from those teams
        const teamIds = coachTeams.map(ct => ct.team_id);
        const { data: athletesFromTeams, error: athletesError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            team_id,
            teams!inner(id, name)
          `)
          .eq('role', 'athlete')
          .eq('status', 'active')
          .in('team_id', teamIds);

        if (athletesError) {
          console.error('[useCoachAthletes] Error fetching team athletes:', athletesError);
          teamError = athletesError;
        } else {
          teamAthletes = athletesFromTeams || [];
        }
      }

      console.log(`[useCoachAthletes] Team athletes found:`, teamAthletes);

      // Combine both sources of athlete IDs
      const directAthleteIds = coachAthleteData?.map(relation => relation.athlete_id) || [];
      const teamAthleteIds = teamError ? [] : (teamAthletes?.map(ta => ta.user_id) || []);
      
      // Create unique list of athlete IDs
      const allAthleteIds = [...new Set([...directAthleteIds, ...teamAthleteIds])];
      
      console.log(`[useCoachAthletes] Combined athlete IDs:`, allAthleteIds);

      if (allAthleteIds.length === 0) {
        console.log(`[useCoachAthletes] No athletes found for this coach`);
        return [];
      }

      const athleteIds = allAthleteIds;

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

      // Create a map of approval statuses by athlete id
      const approvalStatusMap = new Map();
      coachAthleteData?.forEach(relation => {
        approvalStatusMap.set(relation.athlete_id, relation.approval_status);
      });
      
      // For team-based athletes, consider them as "approved" since they're active team members
      teamAthletes.forEach(teamAthlete => {
        if (!approvalStatusMap.has(teamAthlete.user_id)) {
          approvalStatusMap.set(teamAthlete.user_id, 'approved');
        }
      });

      // Combine the data and calculate age and completion rate
      const combinedData = athletesData.map(athlete => {
        const profile = profilesMap.get(athlete.id);
        const approvalStatus = approvalStatusMap.get(athlete.id);
        
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
          completion_rate: completionRate,
          approval_status: approvalStatus
        };
      });
      
      console.log(`[useCoachAthletes] Final combined athlete data with statuses [${includeStatuses.join(', ')}]:`, combinedData);
      return combinedData;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
} 