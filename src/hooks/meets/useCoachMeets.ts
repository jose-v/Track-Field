/**
 * Custom hook for managing coach meets functionality
 */

import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatAthleteName } from '../../utils/meets';
import type { CoachMeetWithData, DebugInfo, MeetEvent } from '../../types/meetTypes';

interface UseCoachMeetsReturn {
  coachMeets: CoachMeetWithData[];
  loading: boolean;
  refreshing: boolean;
  debugInfo: DebugInfo;
  fetchCoachMeets: () => Promise<void>;
}

export const useCoachMeets = (): UseCoachMeetsReturn => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Main state
  const [coachMeets, setCoachMeets] = useState<CoachMeetWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    coachCount: 0,
    meetCount: 0,
    eventCount: 0,
    lastError: null
  });

  // Function to fetch coach meets
  const fetchCoachMeets = async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      console.log('Fetching coach meets for athlete:', user?.id);
      
      // First get the athlete's coaches
      const { data: coachData, error: coachError } = await supabase
        .from('coach_athletes')
        .select('coach_id')
        .eq('athlete_id', user?.id);
      
      console.log('Coach data:', coachData, 'Error:', coachError);
      
      if (coachError) throw coachError;
      
      if (!coachData || coachData.length === 0) {
        console.log('No coaches found for this athlete');
        setCoachMeets([]);
        setDebugInfo({ coachCount: 0, meetCount: 0, eventCount: 0, lastError: null });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Then get meets created by those coaches
      const coachIds = coachData.map((c: any) => c.coach_id);
      console.log('Coach IDs:', coachIds);
      
      const { data: meets, error: meetsError } = await supabase
        .from('track_meets')
        .select('*')
        .in('coach_id', coachIds)
        .order('meet_date', { ascending: true });
      
      console.log('Meets data:', meets, 'Error:', meetsError);
      
      if (meetsError) throw meetsError;
      
      if (!meets || meets.length === 0) {
        console.log('No meets found for these coaches');
        setCoachMeets([]);
        setDebugInfo({ 
          coachCount: coachData.length, 
          meetCount: 0, 
          eventCount: 0, 
          lastError: null 
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Get events for each meet
      const meetIds = meets.map(meet => meet.id);
      
      const { data: meetEvents, error: eventsError } = await supabase
        .from('meet_events')
        .select('id, meet_id, event_name, event_day, start_time')
        .in('meet_id', meetIds);
      
      if (eventsError) throw eventsError;
      
      // Get athletes attending each meet
      const eventIds = meetEvents?.map(e => e.id) || [];
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .select('meet_event_id, athlete_id')
        .in('meet_event_id', eventIds);
      
      if (assignmentsError) throw assignmentsError;
      
      // Get unique athlete IDs
      const athleteIds = [...new Set(assignments?.map(a => a.athlete_id) || [])];
      
      // Get athlete profiles separately
      const { data: athleteProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', athleteIds);
      
      if (profilesError) throw profilesError;
      
      // Group data by meet
      const groupedData = meets.map(meet => {
        const events = meetEvents?.filter(e => e.meet_id === meet.id) || [];
        const meetEventIds = events.map(e => e.id);
        
        const athleteIdsForMeet = assignments
          ?.filter(a => meetEventIds.includes(a.meet_event_id))
          .map(a => a.athlete_id)
          .filter((athleteId, index, self) => 
            // Remove duplicates based on athlete ID
            index === self.findIndex(id => id === athleteId)
          ) || [];
        
        // Map athlete IDs to their profiles
        const athletes = athleteIdsForMeet.map(athleteId => 
          athleteProfiles?.find(profile => profile.id === athleteId)
        ).filter(Boolean) as any[];
        
        return {
          meet,
          events,
          athletes
        };
      });
      
      // Sort by date (most recent/upcoming first)
      groupedData.sort((a, b) => {
        const dateA = new Date(a.meet.meet_date).getTime();
        const dateB = new Date(b.meet.meet_date).getTime();
        return dateA - dateB; // Ascending order (upcoming events first)
      });
      
      setCoachMeets(groupedData);
      
      setDebugInfo({
        coachCount: coachData.length,
        meetCount: meets.length,
        eventCount: meetEvents?.length || 0,
        lastError: null
      });
      
    } catch (error) {
      console.error('Error fetching coach meets:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastError: (error as Error).message
      }));
      
      toast({
        title: 'Error loading coach meets',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch coach meets on component mount
  useEffect(() => {
    if (user?.id) {
      fetchCoachMeets();
    }
  }, [user?.id]);

  return {
    coachMeets,
    loading,
    refreshing,
    debugInfo,
    fetchCoachMeets
  };
}; 