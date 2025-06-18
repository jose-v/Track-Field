/**
 * Tab component for displaying assigned meets using hooks and shared components
 */

import React from 'react';
import { 
  Box, 
  Flex, 
  Spinner, 
  SimpleGrid, 
  Button, 
  HStack, 
  Heading, 
  useDisclosure, 
  Text,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { useAssignedMeets } from '../../../hooks/meets';
import { useAuth } from '../../../contexts/AuthContext';
import { MeetCard, EventsList, AthleteAssignmentInfo, RunTimeModal, EmptyState } from '../index';
import { EventCreationModal } from '../modals';
import type { TrackMeet } from '../../../types/meetTypes';

export const AssignedMeetsTab: React.FC = () => {
  const { user } = useAuth();
  const {
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
  } = useAssignedMeets();

  // Modal states for event selection and creation
  const { isOpen: isEventCreationOpen, onOpen: onEventCreationOpen, onClose: onEventCreationClose } = useDisclosure();
  const { isOpen: isEditEventOpen, onOpen: onEditEventOpen, onClose: onEditEventClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const [selectedMeet, setSelectedMeet] = React.useState<TrackMeet | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

  // Handle event creation callback
  const handleEventCreated = () => {
    // Add a small delay to ensure database has been updated
    setTimeout(() => {
      fetchMyEvents();
    }, 1000);
    
    onEventCreationClose();
  };

  // Handle edit event
  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    onEditEventOpen();
  };

  // Handle delete event
  const handleDeleteEvent = (event: any) => {
    setSelectedEvent(event);
    onDeleteConfirmOpen();
  };

  // Confirm delete event
  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      // Import supabase dynamically to avoid build issues
      const { supabase } = await import('../../../lib/supabase');
      
      // Delete the event from meet_events table
      const { error } = await supabase
        .from('meet_events')
        .delete()
        .eq('id', selectedEvent.id);
      
      if (error) throw error;
      
      // Refresh the data
      fetchMyEvents();
      onDeleteConfirmClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };





  if (loading) {
    return (
      <Flex justify="center" my={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Header with refresh button */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">
          Your Events & Meets 
          {refreshing && <Text as="span" fontSize="sm" color="blue.500" ml={2}>(Refreshing...)</Text>}
        </Heading>

      </Flex>



      {myEvents.length === 0 ? (
        <EmptyState
          title="You haven't been assigned to any events yet."
          description="Create a meet or ask your coach to assign you to events."
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
          {myEvents.map(({ meet, events, assignedByCoach }) => (
            <MeetCard
              key={meet.id}
              meet={meet}
              showTravelTime={true}
            >
              {/* Coach Assignment Info */}
              <AthleteAssignmentInfo assignedByCoach={assignedByCoach} />
              
              {/* Events List */}
              <EventsList
                events={events}
                title="Your Events"
                maxDisplayed={10}
                showRunTime={true}
                onEventClick={openRunTimeModal}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                showEditDelete={true}
              />

              {/* Action buttons for the meet */}
              <HStack spacing={2} mt={4}>
                <Button
                  leftIcon={<FaPlus />}
                  onClick={() => {
                    setSelectedMeet(meet);
                    onEventCreationOpen();
                  }}
                  variant="outline"
                  size="sm"
                  colorScheme="blue"
                >
                  Add New Event
                </Button>
              </HStack>
            </MeetCard>
          ))}
        </SimpleGrid>
      )}
      
      {/* Event Creation Modal - For creating new events */}
      <EventCreationModal
        isOpen={isEventCreationOpen}
        onClose={onEventCreationClose}
        meet={selectedMeet}
        onEventCreated={handleEventCreated}
      />
      
      {/* Run Time Input Modal */}
      <RunTimeModal
        isOpen={isRunTimeModalOpen}
        onClose={closeRunTimeModal}
        event={currentEventForTime}
        runTime={runTimeInput}
        setRunTime={setRunTimeInput}
        onSubmit={handleRunTimeSubmit}
        isSubmitting={isSubmittingTime}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={React.useRef(null)}
        onClose={onDeleteConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Event
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{selectedEvent?.event_name}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteConfirmClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteEvent} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}; 