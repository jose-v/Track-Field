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
import { FaRunning, FaStopwatch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { formatEventTime } from '../../utils/meets';
import type { MeetEvent } from '../../types/meetTypes';

interface EventsListProps {
  events: MeetEvent[];
  title?: string;
  maxDisplayed?: number;
  showRunTime?: boolean;
  onEventClick?: (event: MeetEvent) => void;
  onEditEvent?: (event: MeetEvent) => void;
  onDeleteEvent?: (event: MeetEvent) => void;
  showEditDelete?: boolean;
}

export const EventsList: React.FC<EventsListProps> = ({
  events,
  title = "Events",
  maxDisplayed = 3,
  showRunTime = false,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  showEditDelete = false
}) => {


  // Color mode values - extracted outside the map loop to fix hooks rule
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const eventCardBg = useColorModeValue('white', 'gray.700');
  const eventCardBorder = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

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
        {displayedEvents.map((event, index) => {
          // Extract event properties for consistent naming and cleaner JSX
          const { id, event_name, event_day, start_time, heat, event_type, run_time } = event;
          
          const isClickable = onEventClick && (!showRunTime || !run_time);
            
            return (
              <Box 
                key={id} 
                p={3}
                borderWidth="1px" 
                borderRadius="md" 
                borderColor={eventCardBorder} 
                bg={eventCardBg}
                width="100%"
                cursor={isClickable ? "pointer" : "default"}
                _hover={isClickable ? { bg: hoverBg } : {}}
                _focus={isClickable ? { 
                  bg: hoverBg, 
                  outline: "2px solid", 
                  outlineColor: "blue.500",
                  outlineOffset: "2px"
                } : {}}
                tabIndex={isClickable ? 0 : undefined}
                role={isClickable ? "button" : undefined}
                aria-label={isClickable ? `View details for ${event_name}` : undefined}
                onClick={isClickable ? () => onEventClick(event) : undefined}
                onKeyDown={isClickable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEventClick(event);
                  }
                } : undefined}
              >
                {/* Full width layout */}
                <VStack align="stretch" spacing={2}>
                  {/* Event name and icon row */}
                  <HStack justify="space-between" align="center">
                    <HStack flex="1">
                      <FaRunning color="blue" />
                      <Text fontWeight="medium" fontSize="sm" color={textColor}>
                        {event_name}
                      </Text>
                    </HStack>
                    
                    {/* Action buttons section */}
                    <HStack spacing={1}>
                      {/* Edit/Delete icons */}
                      {showEditDelete && (
                        <>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEvent?.(event);
                            }}
                            aria-label={`Edit ${event_name}`}
                          >
                            <FaEdit size={12} />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent?.(event);
                            }}
                            aria-label={`Delete ${event_name}`}
                          >
                            <FaTrash size={12} />
                          </Button>
                        </>
                      )}
                      
                      {/* Run time section */}
                      {showRunTime && (
                        <Box>
                          {run_time ? (
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
                                {run_time}
                              </Text>
                            </Box>
                          ) : (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              leftIcon={<FaPlus size={10} />}
                              onClick={onEventClick ? () => onEventClick(event) : undefined}
                              aria-label={`Add run time for ${event_name}`}
                            >
                              Add Time
                            </Button>
                          )}
                        </Box>
                      )}
                    </HStack>
                  </HStack>
                  
                  {/* Event details row */}
                  <HStack spacing={4} fontSize="xs" color={mutedTextColor} justify="space-between">
                    <HStack spacing={3}>
                      {event_day && (
                        <HStack>
                          <Text fontWeight="medium">Day {event_day}</Text>
                        </HStack>
                      )}
                      
                      {start_time && (
                        <HStack>
                          <FaStopwatch />
                          <Text>{formatEventTime(start_time)}</Text>
                        </HStack>
                      )}
                    </HStack>
                    
                    {/* Additional event info - Fixed: check for heat !== undefined to handle heat 0 */}
                    {(heat !== undefined || event_type) && (
                      <HStack spacing={2}>
                        {heat !== undefined && (
                          <Text fontSize="xs" color={mutedTextColor}>
                            Heat {heat}
                          </Text>
                        )}
                        {event_type && (
                          <Text fontSize="xs" color={mutedTextColor} fontWeight="medium">
                            {event_type}
                          </Text>
                        )}
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        
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