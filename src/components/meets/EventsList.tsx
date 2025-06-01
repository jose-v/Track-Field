/**
 * Reusable EventsList component for displaying track meet events with full-width layout
 */

import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Divider,
  Flex,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { FaRunning, FaStopwatch, FaPlus } from 'react-icons/fa';
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
      
      {/* Events list - now full width */}
      <VStack align="stretch" spacing={2}>
        {displayedEvents.map((event) => (
          <Box 
            key={event.id} 
            p={3}
            borderWidth="1px" 
            borderRadius="md" 
            borderColor={eventCardBorder} 
            bg={eventCardBg}
            width="100%"
            cursor={onEventClick ? "pointer" : "default"}
            _hover={onEventClick ? { bg: useColorModeValue('gray.50', 'gray.600') } : {}}
            onClick={onEventClick && !showRunTime ? () => onEventClick(event) : undefined}
          >
            {/* Full width layout */}
            <VStack align="stretch" spacing={2}>
              {/* Event name and icon row */}
              <HStack justify="space-between" align="center">
                <HStack flex="1">
                  <FaRunning color="blue" />
                  <Text fontWeight="medium" fontSize="sm" color={textColor}>
                    {event.event_name}
                  </Text>
                </HStack>
                
                {/* Run time section */}
                {showRunTime && (
                  <Box>
                    {event.run_time ? (
                      <Box
                        px={3}
                        py={1}
                        bg="green.50"
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="green.400"
                        _dark={{ bg: 'green.900', borderLeftColor: 'green.400' }}
                      >
                        <Text fontSize="sm" fontWeight="bold" color="green.700" _dark={{ color: 'green.200' }}>
                          {event.run_time}
                        </Text>
                      </Box>
                    ) : (
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={<FaPlus size={10} />}
                        onClick={onEventClick ? () => onEventClick(event) : undefined}
                        aria-label={`Add run time for ${event.event_name}`}
                      >
                        Add Time
                      </Button>
                    )}
                  </Box>
                )}
              </HStack>
              
              {/* Event details row */}
              <HStack spacing={4} fontSize="xs" color={mutedTextColor} justify="space-between">
                <HStack spacing={3}>
                  {event.event_day && (
                    <HStack>
                      <Text fontWeight="medium">Day {event.event_day}</Text>
                    </HStack>
                  )}
                  
                  {event.start_time && (
                    <HStack>
                      <FaStopwatch />
                      <Text>{formatEventTime(event.start_time)}</Text>
                    </HStack>
                  )}
                </HStack>
                
                {/* Additional event info */}
                {(event.heat || event.event_type) && (
                  <HStack spacing={2}>
                    {event.heat && (
                      <Text fontSize="xs" color={mutedTextColor}>
                        Heat {event.heat}
                      </Text>
                    )}
                    {event.event_type && (
                      <Text fontSize="xs" color={mutedTextColor} fontWeight="medium">
                        {event.event_type}
                      </Text>
                    )}
                  </HStack>
                )}
              </HStack>
            </VStack>
          </Box>
        ))}
        
        {/* Show remaining count */}
        {remainingCount > 0 && (
          <Text fontSize="xs" color={mutedTextColor} textAlign="center" py={2}>
            +{remainingCount} more event{remainingCount !== 1 ? 's' : ''}
          </Text>
        )}
      </VStack>
    </VStack>
  );
}; 