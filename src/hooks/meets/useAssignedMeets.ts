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
      
      // 1. Get all event assignments for this athlete
      const { data: assignments, error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .select('meet_event_id, assigned_by')
        .eq('athlete_id', user.id);
        
      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }
      
      if (!assignments || assignments.length === 0) {
        setMyEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // 2. Get coach profiles for non-null assigned_by values
      const coachIds = [...new Set(assignments
        .map(a => a.assigned_by)
        .filter(Boolean))] as string[];
      
      let coachProfiles: any[] = [];
      if (coachIds.length > 0) {
        const { data: coaches, error: coachError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', coachIds);
        
        if (coachError) {
          console.error('Error fetching coach profiles:', coachError);
          // Don't throw here, continue without coach info
        } else {
          coachProfiles = coaches || [];
        }
      }
      
      // 3. Get the details of these events
      const eventIds = assignments.map(a => a.meet_event_id);
      
      const { data: eventDetails, error: eventsError } = await supabase
        .from('meet_events')
        .select('*, meet_id')
        .in('id', eventIds);
        
      if (eventsError) {
        console.error('Error fetching event details:', eventsError);
        throw eventsError;
      }
      
      if (!eventDetails || eventDetails.length === 0) {
        setMyEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // 4. Get unique meet IDs
      const meetIds = [...new Set(eventDetails.map(e => e.meet_id))];
      
      // 5. Get meet details
      const { data: meetDetails, error: meetsError } = await supabase
        .from('track_meets')
        .select('*')
        .in('id', meetIds);
        
      if (meetsError) {
        console.error('Error fetching meet details:', meetsError);
        throw meetsError;
      }
      
      // 6. Group events by meet and add coach information
      const eventsGroupedByMeet = meetDetails?.map(meet => {
        const meetEvents = eventDetails.filter(event => event.meet_id === meet.id);
        
        // Find the coach who assigned this athlete to events in this meet
        const assignmentWithCoach = assignments.find(assignment => 
          meetEvents.some(event => event.id === assignment.meet_event_id) &&
          assignment.assigned_by
        );
        
        let assignedByCoach: string | undefined;
        if (assignmentWithCoach?.assigned_by) {
          const coachProfile = coachProfiles.find(coach => 
            coach.id === assignmentWithCoach.assigned_by
          );
          if (coachProfile) {
            assignedByCoach = formatAthleteName(coachProfile);
          }
        }
        
        return {
          meet,
          events: meetEvents,
          assignedByCoach
        };
      }) || [];
      
      // 7. Sort by date (most recent/upcoming first)
      eventsGroupedByMeet.sort((a, b) => {
        const dateA = new Date(a.meet.meet_date).getTime();
        const dateB = new Date(b.meet.meet_date).getTime();
        return dateA - dateB; // Ascending order (upcoming events first)
      });
      
      setMyEvents(eventsGroupedByMeet);
      
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