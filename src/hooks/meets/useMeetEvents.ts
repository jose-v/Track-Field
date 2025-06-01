/**
 * Custom hook for managing meet events functionality
 */

import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { MeetEvent, EventFormData } from '../../types/meetTypes';

interface UseMeetEventsReturn {
  meetEvents: MeetEvent[];
  selectedEvents: string[];
  eventFormData: EventFormData;
  setEventFormData: (data: EventFormData) => void;
  fetchMeetEvents: (meetId: string) => Promise<void>;
  toggleEventSelection: (eventId: string) => void;
  saveEventSelections: () => Promise<void>;
  handleCreateEvent: (meetId: string) => Promise<void>;
  resetEventForm: () => void;
}

const defaultEventFormData: EventFormData = {
  event_name: '',
  event_date: '',
  event_day: '1',
  start_time: '',
  heat: '',
  event_type: '',
  run_time: ''
};

export const useMeetEvents = (): UseMeetEventsReturn => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Main state
  const [meetEvents, setMeetEvents] = useState<MeetEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [eventFormData, setEventFormData] = useState<EventFormData>(defaultEventFormData);

  // Fetch events for a specific meet
  const fetchMeetEvents = async (meetId: string) => {
    try {
      const { data, error } = await supabase
        .from('meet_events')
        .select(`
          *,
          event:event_id (
            name,
            category
          ),
          athlete_assignments:athlete_meet_events(
            id,
            athlete_id
          )
        `)
        .eq('meet_id', meetId);
      
      if (error) throw error;
      
      setMeetEvents(data || []);
      
      // Find events the athlete is already assigned to
      const athleteEvents = data
        ?.filter((event: any) => 
          event.athlete_assignments.some((assignment: any) => 
            assignment.athlete_id === user?.id
          )
        )
        .map((event: any) => event.id) || [];
      
      setSelectedEvents(athleteEvents);
      
    } catch (error) {
      console.error('Error fetching meet events:', error);
      toast({
        title: 'Error fetching meet events',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle event selection/deselection
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };
  
  // Save athlete event selections
  const saveEventSelections = async () => {
    try {
      // First get current assignments to know what to add/remove
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('athlete_meet_events')
        .select('id, meet_event_id')
        .eq('athlete_id', user?.id)
        .in('meet_event_id', meetEvents.map(e => e.id));
      
      if (fetchError) throw fetchError;
      
      // Find assignments to remove (those that exist but aren't in selected)
      const assignmentsToRemove = currentAssignments
        ?.filter((a: any) => !selectedEvents.includes(a.meet_event_id))
        .map((a: any) => a.id) || [];
      
      // Find assignments to add (those in selected but don't exist yet)
      const currentEventIds = currentAssignments?.map((a: any) => a.meet_event_id) || [];
      const eventsToAdd = selectedEvents.filter(id => !currentEventIds.includes(id));
      
      // Remove assignments
      if (assignmentsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('athlete_meet_events')
          .delete()
          .in('id', assignmentsToRemove);
        
        if (removeError) throw removeError;
      }
      
      // Add new assignments
      if (eventsToAdd.length > 0) {
        const newAssignments = eventsToAdd.map(eventId => ({
          athlete_id: user?.id,
          meet_event_id: eventId
        }));
        
        const { error: addError } = await supabase
          .from('athlete_meet_events')
          .insert(newAssignments);
        
        if (addError) throw addError;
      }
      
      toast({
        title: 'Event selections saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error saving event selections:', error);
      toast({
        title: 'Error saving event selections',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle creating a new event
  const handleCreateEvent = async (meetId: string) => {
    try {
      // Validate form
      if (!eventFormData.event_name.trim()) {
        toast({
          title: 'Event name is required',
          status: 'error',
          duration: 2000,
          isClosable: true
        });
        return;
      }

      // Prepare the data with proper type conversion
      const eventData = {
        meet_id: meetId,
        event_name: eventFormData.event_name.trim(),
        event_date: eventFormData.event_date || null,
        event_day: eventFormData.event_day ? parseInt(eventFormData.event_day, 10) : null,
        start_time: eventFormData.start_time || null,
        heat: eventFormData.heat ? parseInt(eventFormData.heat.toString(), 10) : null,
        event_type: eventFormData.event_type || null,
        run_time: eventFormData.run_time || null
      };

      // Create the event
      const { data: newEvent, error } = await supabase
        .from('meet_events')
        .insert([eventData])
        .select();
        
      if (error) throw error;
      
      toast({
        title: 'Event created',
        description: 'Event has been added to the meet',
        status: 'success',
        duration: 2000,
        isClosable: true
      });

      // Clear form
      resetEventForm();
      
      // Refresh events
      await fetchMeetEvents(meetId);
      
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error creating event',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Reset event form
  const resetEventForm = () => {
    setEventFormData(defaultEventFormData);
  };

  return {
    meetEvents,
    selectedEvents,
    eventFormData,
    setEventFormData,
    fetchMeetEvents,
    toggleEventSelection,
    saveEventSelections,
    handleCreateEvent,
    resetEventForm
  };
}; 