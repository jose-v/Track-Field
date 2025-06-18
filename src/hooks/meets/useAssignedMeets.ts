/**
 * Custom hook for managing assigned meets functionality
 */

import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { sortMeetsByDate, formatAthleteName } from '../../utils/meets';
import type { MeetWithEvents, MeetEvent } from '../../types/meetTypes';

interface UseAssignedMeetsReturn {
  myEvents: MeetWithEvents[];
  loading: boolean;
  refreshing: boolean;
  fetchMyEvents: () => Promise<void>;
  // Run time modal state
  isRunTimeModalOpen: boolean;
  currentEventForTime: MeetEvent | null;
  runTimeInput: string;
  isSubmittingTime: boolean;
  openRunTimeModal: (event: MeetEvent) => void;
  closeRunTimeModal: () => void;
  setRunTimeInput: (value: string) => void;
  handleRunTimeSubmit: () => Promise<void>;
}

export const useAssignedMeets = (): UseAssignedMeetsReturn => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Main state
  const [myEvents, setMyEvents] = useState<MeetWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Run time modal state
  const [isRunTimeModalOpen, setIsRunTimeModalOpen] = useState(false);
  const [currentEventForTime, setCurrentEventForTime] = useState<MeetEvent | null>(null);
  const [runTimeInput, setRunTimeInput] = useState('');
  const [isSubmittingTime, setIsSubmittingTime] = useState(false);

  // Function to fetch events the athlete is assigned to
  const fetchMyEvents = async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      console.log('fetchMyEvents - Starting fetch for user:', user.id);
      
      // NEW APPROACH: Get all meets the athlete can access, not just assigned ones
      // 1. First get meets where athlete has assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .select('meet_event_id, assigned_by')
        .eq('athlete_id', user.id);
        
      console.log('fetchMyEvents - assignments query result:', { assignments, assignmentsError });
        
      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        // Don't throw here, continue to get all accessible meets
      }
      
      // 2. Get all meets that are accessible (not just ones with assignments)
      // For now, we'll get all upcoming meets. In the future, this could be filtered by team/coach relationship
      const { data: allMeets, error: meetsError } = await supabase
        .from('track_meets')
        .select('*')
        .gte('meet_date', new Date().toISOString().split('T')[0]) // Only upcoming meets
        .order('meet_date', { ascending: true });
      
      console.log('fetchMyEvents - all accessible meets:', { allMeets, meetsError });
      
      if (meetsError) {
        console.error('Error fetching meets:', meetsError);
        throw meetsError;
      }
      
      if (!allMeets || allMeets.length === 0) {
        console.log('fetchMyEvents - No accessible meets found');
        setMyEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // 3. For each meet, get events and check which ones the athlete is assigned to
      const meetWithEventsPromises = allMeets.map(async (meet) => {
        // Get all events for this meet
        const { data: meetEvents, error: eventsError } = await supabase
          .from('meet_events')
          .select('*')
          .eq('meet_id', meet.id);
        
        if (eventsError) {
          console.error(`Error fetching events for meet ${meet.id}:`, eventsError);
          return null;
        }
        
        // Filter to only events this athlete is assigned to
        const assignedEvents = meetEvents?.filter(event => 
          assignments?.some(assignment => assignment.meet_event_id === event.id)
        ) || [];
        
        console.log(`Meet "${meet.name}": ${meetEvents?.length || 0} total events, ${assignedEvents.length} assigned to athlete`);
        
        // Only include meets that have assigned events OR are accessible for adding events
        // For now, we'll include all meets so athletes can add events
        return {
          meet,
          events: assignedEvents, // Only show events they're assigned to
          assignedByCoach: assignments?.find(a => 
            assignedEvents.some(e => e.id === a.meet_event_id) && a.assigned_by
          )?.assigned_by ? 'Coach' : undefined // Simplified for now
        };
      });
      
      const meetWithEventsResults = await Promise.all(meetWithEventsPromises);
      const validMeetWithEvents = meetWithEventsResults.filter(result => result !== null);
      
      console.log('fetchMyEvents - Final grouped events:', validMeetWithEvents);
      
      // 4. Sort by date (most recent/upcoming first)
      validMeetWithEvents.sort((a, b) => {
        const dateA = new Date(a.meet.meet_date).getTime();
        const dateB = new Date(b.meet.meet_date).getTime();
        return dateA - dateB; // Ascending order (upcoming events first)
      });
      
      console.log('fetchMyEvents - Setting final events data:', validMeetWithEvents);
      
      // Add detailed logging before setting state
      console.log('=== ABOUT TO SET STATE ===');
      console.log('validMeetWithEvents length:', validMeetWithEvents.length);
      validMeetWithEvents.forEach((meetWithEvents, index) => {
        console.log(`State data ${index + 1}:`, {
          meetName: meetWithEvents.meet.name,
          meetId: meetWithEvents.meet.id,
          eventsCount: meetWithEvents.events.length,
          eventDetails: meetWithEvents.events
        });
      });
      console.log('=== CALLING setMyEvents ===');
      
      setMyEvents(validMeetWithEvents);
      
      console.log('=== setMyEvents CALLED ===');
      
    } catch (error) {
      console.error('Error fetching my events:', error);
      toast({
        title: 'Error loading assigned meets',
        description: 'Please try refreshing the page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch events on component mount
  useEffect(() => {
    if (user?.id) {
      fetchMyEvents();
    }
  }, [user?.id]);

  // Set up real-time subscriptions for data updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Subscribe to athlete_meet_events changes for this athlete
    const athleteEventsSubscription = supabase
      .channel('athlete_meet_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'athlete_meet_events',
          filter: `athlete_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update - athlete_meet_events:', payload);
          // Refetch data when assignments change
          fetchMyEvents();
        }
      )
      .subscribe();

    // Subscribe to meet_events changes (when new events are added to meets)
    const meetEventsSubscription = supabase
      .channel('meet_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meet_events'
        },
        (payload) => {
          console.log('Real-time update - meet_events:', payload);
          // Refetch data when events are added/updated/deleted
          fetchMyEvents();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(athleteEventsSubscription);
      supabase.removeChannel(meetEventsSubscription);
    };
  }, [user?.id]);
  
  // Open run time modal
  const openRunTimeModal = (event: MeetEvent) => {
    setCurrentEventForTime(event);
    setRunTimeInput(event.run_time || '');
    setIsRunTimeModalOpen(true);
  };

  // Close run time modal
  const closeRunTimeModal = () => {
    setIsRunTimeModalOpen(false);
    setCurrentEventForTime(null);
    setRunTimeInput('');
  };
  
  // Handle run time submission
  const handleRunTimeSubmit = async () => {
    if (!currentEventForTime || !runTimeInput.trim()) {
      toast({
        title: 'Please enter a valid run time',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmittingTime(true);
      
      // Update the event with the run time
      const { error } = await supabase
        .from('meet_events')
        .update({ run_time: runTimeInput.trim() })
        .eq('id', currentEventForTime.id);
      
      if (error) throw error;
      
      // Also update the athlete's assignment record if needed
      const { error: assignmentError } = await supabase
        .from('athlete_meet_events')
        .update({ 
          result: runTimeInput.trim(),
          status: 'completed'
        })
        .eq('athlete_id', user?.id)
        .eq('meet_event_id', currentEventForTime.id);
      
      if (assignmentError) {
        console.warn('Could not update athlete assignment:', assignmentError);
      }
      
      toast({
        title: 'Run time saved successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Close modal and reset state
      closeRunTimeModal();
      
      // Refresh the assigned meets to show updated time
      fetchMyEvents();
      
    } catch (error) {
      console.error('Error saving run time:', error);
      toast({
        title: 'Error saving run time',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingTime(false);
    }
  };

  return {
    myEvents,
    loading,
    refreshing,
    fetchMyEvents,
    isRunTimeModalOpen,
    currentEventForTime,
    runTimeInput,
    isSubmittingTime,
    openRunTimeModal,
    closeRunTimeModal,
    setRunTimeInput,
    handleRunTimeSubmit
  };
}; 