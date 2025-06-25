/**
 * Custom hook for managing meet events functionality
 */

import { useState, useCallback } from 'react';
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
  handleUpdateEvent: (eventId: string) => Promise<void>;
  resetEventForm: () => void;
  loadEventForEdit: (event: any) => void;
  handleCreateEventWithData: (meetId: string, eventData: Partial<EventFormData>) => Promise<any>;
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

  // Handle creating a new event with provided data (for bulk creation)
  const handleCreateEventWithData = async (meetId: string, eventData: Partial<EventFormData>) => {
    try {
      // Validate event name
      if (!eventData.event_name?.trim()) {
        toast({
          title: 'Event name is required',
          status: 'error',
          duration: 2000,
          isClosable: true
        });
        return;
      }

      // Prepare the data with proper type conversion
      const eventDbData = {
        meet_id: meetId,
        event_name: eventData.event_name.trim(),
        event_date: eventData.event_date || null,
        event_day: eventData.event_day ? parseInt(eventData.event_day.toString(), 10) : null,
        start_time: eventData.start_time || null,
        heat: eventData.heat ? parseInt(eventData.heat.toString(), 10) : null,
        event_type: eventData.event_type || null,
        run_time: eventData.run_time || null
      };

      // Create the event
      const { data: newEvent, error } = await supabase
        .from('meet_events')
        .insert([eventDbData])
        .select();
        
      if (error) throw error;
      
      // Don't auto-assign for bulk creation (coach is creating for athletes)
      
      return newEvent?.[0]; // Return the created event
      
    } catch (error) {
      console.error('Error creating event:', error);
      throw error; // Re-throw to be handled by bulk creator
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
      
      // Automatically assign the athlete to the event they created
      if (newEvent && newEvent.length > 0 && user?.id) {
        const { error: assignmentError } = await supabase
          .from('athlete_meet_events')
          .insert([{
            athlete_id: user.id,
            meet_event_id: newEvent[0].id,
            assigned_by: user.id // Self-assigned
          }]);
        
        if (assignmentError) {
          console.error('Error auto-assigning athlete to event:', assignmentError);
          // Don't throw error - event was created successfully, assignment failed
        }
      }
      
      toast({
        title: 'Event created',
        description: 'Event has been added to the meet and you have been assigned to it',
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

  // Handle updating an existing event
  const handleUpdateEvent = async (eventId: string) => {
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
        event_name: eventFormData.event_name.trim(),
        event_date: eventFormData.event_date || null,
        event_day: eventFormData.event_day ? parseInt(eventFormData.event_day, 10) : null,
        start_time: eventFormData.start_time || null,
        heat: eventFormData.heat ? parseInt(eventFormData.heat.toString(), 10) : null,
        event_type: eventFormData.event_type || null,
        run_time: eventFormData.run_time || null
      };

      // Update the event
      const { error } = await supabase
        .from('meet_events')
        .update(eventData)
        .eq('id', eventId);
        
      if (error) throw error;
      
      toast({
        title: 'Event updated',
        description: 'Event has been updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true
      });

      // Clear form
      resetEventForm();
      
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error updating event',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Load event data for editing
  const loadEventForEdit = useCallback((event: any) => {
    console.log('Loading event for edit:', event);
    setEventFormData({
      event_name: event.event_name || '',
      event_date: event.event_date || '',
      event_day: event.event_day?.toString() || '',
      start_time: event.start_time || '',
      heat: event.heat?.toString() || '',
      event_type: event.event_type || '',
      run_time: event.run_time || ''
    });
  }, []);

  // Reset event form
  const resetEventForm = useCallback(() => {
    setEventFormData(defaultEventFormData);
  }, []);

  return {
    meetEvents,
    selectedEvents,
    eventFormData,
    setEventFormData,
    fetchMeetEvents,
    toggleEventSelection,
    saveEventSelections,
    handleCreateEvent,
    handleUpdateEvent,
    resetEventForm,
    loadEventForEdit,
    handleCreateEventWithData
  };
}; 