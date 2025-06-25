/**
 * EventsListSection component for displaying meet events grouped by day
 * Shows events with athlete counts, tooltips, and action buttons
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Tooltip,
  Badge,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { FaCog, FaUsers, FaTrash } from 'react-icons/fa';
import { formatMeetDate } from '../../utils/meets/meetFormatters';

interface EventWithAthletes {
  id: string;
  event_name: string;
  event_date?: string;
  event_day?: number;
  start_time?: string;
  heat?: number;
  event_type?: string;
  run_time?: string;
  athleteCount?: number;
  athleteNames?: string[];
}

interface EventsListSectionProps {
  events: EventWithAthletes[];
  onEditEvent?: (event: EventWithAthletes) => void;
  onAssignAthletes?: (event: EventWithAthletes) => void;
  onDeleteEvent?: (event: EventWithAthletes) => void;
  showActions?: boolean;
}

interface GroupedEvents {
  [key: string]: EventWithAthletes[];
}

export const EventsListSection: React.FC<EventsListSectionProps> = ({
  events,
  onEditEvent,
  onAssignAthletes,
  onDeleteEvent,
  showActions = true
}) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const subtextColor = useColorModeValue('gray.600', 'gray.400');
  const dayHeaderColor = useColorModeValue('gray.800', 'gray.100');
  const eventBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Group events by day
  const groupEventsByDay = (events: EventWithAthletes[]): GroupedEvents => {
    return events.reduce((acc, event) => {
      const dayKey = event.event_day 
        ? `Day ${event.event_day}` 
        : event.event_date 
          ? formatMeetDate(event.event_date)
          : 'Unscheduled';
      
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(event);
      return acc;
    }, {} as GroupedEvents);
  };

  const groupedEvents = groupEventsByDay(events);

  if (events.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color={subtextColor} fontSize="sm">
          No events scheduled for this meet
        </Text>
      </Box>
    );
  }

  // Sort days in ascending order (Day 1, Day 2, Day 3, etc.)
  const sortedDays = Object.entries(groupedEvents).sort(([dayA], [dayB]) => {
    // Extract day numbers for sorting
    const getDayNumber = (dayLabel: string) => {
      const match = dayLabel.match(/Day (\d+)/);
      return match ? parseInt(match[1]) : 999; // Put non-day entries at the end
    };
    
    const dayNumA = getDayNumber(dayA);
    const dayNumB = getDayNumber(dayB);
    
    return dayNumA - dayNumB;
  });

  return (
    <VStack align="stretch" spacing={3}>
      {sortedDays.map(([dayLabel, dayEvents]) => (
        <Box key={dayLabel}>
          {/* Day Header */}
          <Text 
            fontSize="sm" 
            fontWeight="bold" 
            color={dayHeaderColor}
            mb={2}
          >
            {dayLabel}
            {dayEvents[0]?.event_date && dayEvents[0]?.event_day && (
              <Text as="span" fontSize="xs" color={subtextColor} ml={2}>
                ({formatMeetDate(dayEvents[0].event_date)})
              </Text>
            )}
          </Text>

          {/* Events for this day */}
          <VStack align="stretch" spacing={1} ml={2}>
            {dayEvents.map((event) => (
              <HStack 
                key={event.id}
                justify="space-between"
                align="center"
                p={2}
                bg={eventBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                {/* Event info */}
                <HStack spacing={2} flex={1}>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    • {event.event_name}
                  </Text>
                  
                  {/* Athlete count with tooltip - always show */}
                  <Tooltip
                    label={
                      event.athleteNames && event.athleteNames.length > 0
                        ? event.athleteNames.join(', ')
                        : `${event.athleteCount || 0} athletes assigned`
                    }
                    hasArrow
                    placement="top"
                  >
                    <Badge 
                      colorScheme={(event.athleteCount || 0) > 0 ? 'blue' : 'gray'}
                      fontSize="xs"
                      cursor="help"
                    >
                      {event.athleteCount || 0} athlete{(event.athleteCount || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </Tooltip>

                  {/* Event details */}
                  <HStack spacing={1} fontSize="xs" color={subtextColor}>
                    {event.start_time && (
                      <Text>{event.start_time}</Text>
                    )}
                    {event.heat && (
                      <Text>Heat {event.heat}</Text>
                    )}
                    {event.event_type && (
                      <Badge size="sm" colorScheme="purple">
                        {event.event_type}
                      </Badge>
                    )}
                  </HStack>
                </HStack>

                {/* Action buttons */}
                {showActions && (
                  <HStack spacing={1}>
                    {onEditEvent && (
                      <Tooltip label="Edit event" hasArrow>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={<FaCog />}
                          color="white"
                          _hover={{ color: "blue.300", bg: "blue.900" }}
                          onClick={() => onEditEvent(event)}
                          aria-label="Edit event"
                        />
                      </Tooltip>
                    )}
                    
                    {onAssignAthletes && (
                      <Tooltip label="Assign athletes" hasArrow>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={<FaUsers />}
                          color="white"
                          _hover={{ color: "green.300", bg: "green.900" }}
                          onClick={() => onAssignAthletes(event)}
                          aria-label="Assign athletes"
                        />
                      </Tooltip>
                    )}
                    
                    {onDeleteEvent && (
                      <Tooltip label="Delete event" hasArrow>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={<FaTrash />}
                          color="white"
                          _hover={{ color: "red.300", bg: "red.900" }}
                          onClick={() => onDeleteEvent(event)}
                          aria-label="Delete event"
                        />
                      </Tooltip>
                    )}
                  </HStack>
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}; 