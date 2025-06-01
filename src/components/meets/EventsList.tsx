/**
 * Reusable EventsList component for displaying track meet events
 */

import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Divider,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { FaRunning, FaStopwatch } from 'react-icons/fa';
import { formatEventTime } from '../../utils/meets';
import type { MeetEvent } from '../../types/meetTypes';

interface EventsListProps {
  events: MeetEvent[];
  title?: string;
  maxDisplayed?: number;
  showRunTime?: boolean;
  onEventClick?: (event: MeetEvent) => void;
}

export const EventsList: React.FC<EventsListProps> = ({
  events,
  title = "Events",
  maxDisplayed = 3,
  showRunTime = false,
  onEventClick
}) => {
  // Color mode values
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const eventCardBg = useColorModeValue('white', 'gray.700');
  const eventCardBorder = useColorModeValue('gray.200', 'gray.600');

  const displayedEvents = events.slice(0, maxDisplayed);
  const remainingCount = Math.max(0, events.length - maxDisplayed);

  if (events.length === 0) {
    return (
      <Box>
        <Text fontSize="sm" color={mutedTextColor} textAlign="center">
          No events available
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      {/* Title and count */}
      <Flex justify="space-between" align="center">
        <Text fontWeight="bold" fontSize="sm" color="blue.600">
          {title} ({events.length}):
        </Text>
      </Flex>
      
      <Divider my={2} />
      
      {/* Events list */}
      <VStack align="stretch" spacing={2}>
        {displayedEvents.map((event) => (
          <Box 
            key={event.id} 
            p={2} 
            borderWidth="1px" 
            borderRadius="md" 
            borderColor={eventCardBorder} 
            bg={eventCardBg}
            cursor={onEventClick ? "pointer" : "default"}
            _hover={onEventClick ? { bg: useColorModeValue('gray.50', 'gray.600') } : {}}
            onClick={onEventClick ? () => onEventClick(event) : undefined}
          >
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1} flex="1">
                <HStack>
                  <FaRunning color="blue" />
                  <Text fontWeight="medium" fontSize="sm" color={textColor}>
                    {event.event_name}
                  </Text>
                </HStack>
                
                <HStack spacing={3} fontSize="xs" color={mutedTextColor}>
                  {event.event_day && (
                    <Text>Day {event.event_day}</Text>
                  )}
                  
                  {event.start_time && (
                    <HStack>
                      <FaStopwatch />
                      <Text>{formatEventTime(event.start_time)}</Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>

              {/* Run time display */}
              {showRunTime && event.run_time && (
                <Box
                  px={2}
                  py={1}
                  bg="green.50"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderLeftColor="green.400"
                >
                  <Text fontSize="xs" fontWeight="bold" color="green.700">
                    {event.run_time}
                  </Text>
                </Box>
              )}
            </HStack>
          </Box>
        ))}
        
        {/* Show remaining count */}
        {remainingCount > 0 && (
          <Text fontSize="xs" color={mutedTextColor} textAlign="center">
            +{remainingCount} more event{remainingCount !== 1 ? 's' : ''}
          </Text>
        )}
      </VStack>
    </VStack>
  );
}; 