/**
 * Custom hook for managing personal meets functionality
 */

import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { countEventsByMeetId } from '../../utils/meets';
import type { TrackMeet, Coach } from '../../types/meetTypes';

interface UseMyMeetsReturn {
  trackMeets: TrackMeet[];
  coaches: Coach[];
  loading: boolean;
  meetEventCounts: Record<string, number>;
  fetchTrackMeets: () => Promise<void>;
  fetchCoaches: () => Promise<void>;
  handleDeleteMeet: (meetId: string) => Promise<void>;
}

export const useMyMeets = (): UseMyMeetsReturn => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Main state
  const [trackMeets, setTrackMeets] = useState<TrackMeet[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetEventCounts, setMeetEventCounts] = useState<Record<string, number>>({});

  // Fetch track meets created by this athlete
  const fetchTrackMeets = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('track_meets')
        .select('*')
        .eq('athlete_id', user?.id)
        .order('meet_date', { ascending: true });
      
      if (error) throw error;
      
      setTrackMeets(data || []);
      
      // Fetch event counts for all meets
      if (data && data.length > 0) {
        await fetchEventCounts(data.map(meet => meet.id));
      }
    } catch (error) {
      console.error('Error fetching track meets:', error);
      toast({
        title: 'Error fetching track meets',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch event counts for meets
  const fetchEventCounts = async (meetIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('meet_events')
        .select('meet_id')
        .in('meet_id', meetIds);
      
      if (error) throw error;
      
      // Count events by meet_id using utility function
      const counts = countEventsByMeetId(data || []);
      
      // Initialize counts for all meets (including those with 0 events)
      const fullCounts: Record<string, number> = {};
      meetIds.forEach(id => fullCounts[id] = counts[id] || 0);
      
      setMeetEventCounts(fullCounts);
    } catch (error) {
      console.error('Error fetching event counts:', error);
    }
  };
  
  // Fetch coaches for this athlete
  const fetchCoaches = async () => {
    try {
      // First get the coach IDs for this athlete (only approved relationships)
      const { data: athleteCoachData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('coach_id')
        .eq('athlete_id', user?.id)
        .eq('approval_status', 'approved'); // Only get approved relationships
      
      if (relationError) throw relationError;
      
      if (!athleteCoachData || athleteCoachData.length === 0) {
        setCoaches([]);
        return;
      }
      
      // Then fetch the profile data for those coaches
      const coachIds = athleteCoachData.map((row: any) => row.coach_id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', coachIds);
      
      if (profileError) throw profileError;
      
      const formattedCoaches = profileData?.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`
      })) || [];
      
      setCoaches(formattedCoaches);
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };

  // Handle track meet deletion
  const handleDeleteMeet = async (meetId: string) => {
    try {
      // First, delete all events associated with this meet
      const { error: eventsError } = await supabase
        .from('meet_events')
        .delete()
        .eq('meet_id', meetId);
        
      if (eventsError) throw eventsError;
      
      // Then delete the meet itself
      const { error } = await supabase
        .from('track_meets')
        .delete()
        .eq('id', meetId);
        
      if (error) throw error;
      
      toast({
        title: 'Track meet deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Remove the meet from the local state
      setTrackMeets(prev => prev.filter(meet => meet.id !== meetId));
      
    } catch (error) {
      console.error('Error deleting track meet:', error);
      toast({
        title: 'Error deleting track meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error; // Re-throw so the calling component can handle it
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchTrackMeets();
      fetchCoaches();
    }
  }, [user]);

  return {
    trackMeets,
    coaches,
    loading,
    meetEventCounts,
    fetchTrackMeets,
    fetchCoaches,
    handleDeleteMeet
  };
}; 