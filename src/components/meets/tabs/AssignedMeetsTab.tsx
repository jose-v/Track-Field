/**
 * Tab component for displaying assigned meets using hooks and shared components
 */

import React from 'react';
import { Box, Flex, Spinner, SimpleGrid } from '@chakra-ui/react';
import { useAssignedMeets } from '../../../hooks/meets';
import { MeetCard, EventsList, AthleteAssignmentInfo, RunTimeModal, EmptyState } from '../index';

export const AssignedMeetsTab: React.FC = () => {
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

  if (loading) {
    return (
      <Flex justify="center" my={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (myEvents.length === 0) {
    return (
      <EmptyState
        title="You haven't been assigned to any events yet."
        description="Create a meet or ask your coach to assign you to events."
      />
    );
  }

  return (
    <Box>
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
              maxDisplayed={3}
              showRunTime={true}
              onEventClick={openRunTimeModal}
            />
          </MeetCard>
        ))}
      </SimpleGrid>
      
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
    </Box>
  );
}; 