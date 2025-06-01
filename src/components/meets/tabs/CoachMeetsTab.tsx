/**
 * Tab component for displaying coach meets using hooks and shared components
 */

import React from 'react';
import { Box, Flex, Spinner, SimpleGrid, Button, HStack, Text } from '@chakra-ui/react';
import { FaSync } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useCoachMeets } from '../../../hooks/meets';
import { MeetCard, EventsList, AthleteAssignmentInfo, EmptyState } from '../index';

export const CoachMeetsTab: React.FC = () => {
  const { user } = useAuth();
  const {
    coachMeets,
    loading,
    refreshing,
    debugInfo,
    fetchCoachMeets
  } = useCoachMeets();

  if (loading) {
    return (
      <Flex justify="center" my={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (coachMeets.length === 0) {
    const debugInfoDisplay = (
      <>
        <Text>Debug: User ID = {user?.id}</Text>
        <Text>Refreshing: {refreshing ? 'Yes' : 'No'}</Text>
        <Text>Loading: {loading ? 'Yes' : 'No'}</Text>
        <Text>Coaches found: {debugInfo.coachCount}</Text>
        <Text>Meets found: {debugInfo.meetCount}</Text>
        <Text>Events found: {debugInfo.eventCount}</Text>
        {debugInfo.lastError && (
          <Text color="red.500">Error: {debugInfo.lastError}</Text>
        )}
      </>
    );

    return (
      <EmptyState
        title="No coach meets available."
        description=""
        suggestions={[
          "You haven't been assigned to any coaches yet",
          "Your coaches haven't created any meets yet",
          "Check with your coach to get assigned or have meets created"
        ]}
        debugInfo={debugInfoDisplay}
      />
    );
  }

  return (
    <Box>
      {/* Debug refresh button */}
      <Flex justify="flex-end" mb={4}>
        <Button
          size="sm"
          leftIcon={<FaSync />}
          onClick={fetchCoachMeets}
          isLoading={refreshing}
          variant="outline"
          colorScheme="blue"
        >
          Refresh Coach Meets
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
        {coachMeets.map(({ meet, events, athletes }) => (
          <MeetCard
            key={meet.id}
            meet={meet}
            showTravelTime={true}
          >
            {/* Athletes Attending */}
            <AthleteAssignmentInfo athletes={athletes} />
            
            {/* Events List */}
            <EventsList
              events={events}
              title="Available Events"
              maxDisplayed={3}
              showRunTime={false}
            />
          </MeetCard>
        ))}
      </SimpleGrid>
    </Box>
  );
}; 