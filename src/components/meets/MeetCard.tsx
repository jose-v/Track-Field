/**
 * Reusable MeetCard component with enhanced event count display and improved accessibility
 */

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Button,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { FaCalendarAlt, FaMapMarkerAlt, FaRunning } from 'react-icons/fa';
import { TravelTimeDisplay } from '../TravelTimeDisplay';
import { EventsListSection } from './EventsListSection';
import { 
  formatMeetDate, 
  generateMapsLink, 
  getStatusColor,
  formatDateRange,
  isMultiDayEvent 
} from '../../utils/meets';
import type { TrackMeet } from '../../types/meetTypes';

export interface EventWithAthletes {
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

interface MeetCardProps {
  meet: TrackMeet;
  eventCount?: number;
  actionButtons?: React.ReactNode;
  children?: React.ReactNode;
  showTravelTime?: boolean;
  onClick?: () => void;
  // Events section
  allEvents?: EventWithAthletes[];
  onEditEvent?: (event: EventWithAthletes) => void;
  onAssignAthletesToEvent?: (event: EventWithAthletes) => void;
  onDeleteEvent?: (event: EventWithAthletes) => void;
  showEventActions?: boolean;
}

export const MeetCard: React.FC<MeetCardProps> = ({
  meet,
  eventCount,
  actionButtons,
  children,
  showTravelTime = false,
  onClick,
  allEvents,
  onEditEvent,
  onAssignAthletesToEvent,
  onDeleteEvent,
  showEventActions = true
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const descriptionBg = useColorModeValue('gray.50', 'gray.700');

  // Accessibility: Generate descriptive aria-label
  const cardAriaLabel = `Meet: ${meet.name}, Date: ${formatMeetDate(meet.meet_date)}, Status: ${meet.status || 'Upcoming'}${eventCount ? `, Events: ${eventCount}` : ''}`;

  // Handle keyboard interactions for clickable card
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      p="0"
      bg={cardBg}
      borderWidth="1px" 
      borderColor={borderColor}
      _dark={{ bg: 'gray.800' }}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      onKeyDown={handleKeyPress}
      aria-label={cardAriaLabel}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      _hover={onClick ? { boxShadow: 'lg', transform: 'translateY(-1px)' } : undefined}
      _focus={onClick ? { outline: '2px solid', outlineColor: 'blue.500', outlineOffset: '2px' } : undefined}
      transition="all 0.2s ease-in-out"
    >
      {/* Card header with gradient background */}
      <Box 
        bg="linear-gradient(135deg, #2B6CB0 0%, #4299E1 100%)" 
        py={4} 
        px={5}
        margin="0"
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="md" color="white" noOfLines={1}>
            {meet.name}
          </Heading>
          <HStack spacing={2}>
            {/* Enhanced event count badge */}
            {typeof eventCount === 'number' && (
              <Badge 
                colorScheme="purple" 
                variant="solid" 
                px={2} 
                py={1} 
                borderRadius="md"
                aria-label={`${eventCount} events in this meet`}
              >
                <HStack spacing={1}>
                  <FaRunning size={12} />
                  <Text fontSize="xs">{eventCount}</Text>
                </HStack>
              </Badge>
            )}
            <Badge 
              colorScheme={getStatusColor(meet.status)} 
              variant="solid" 
              px={2} 
              py={1} 
              borderRadius="md"
            >
              {meet.status || 'Upcoming'}
            </Badge>
          </HStack>
        </Flex>
      </Box>
      
      {/* Card body */}
      <CardBody px={4} py={4} bg={cardBg} _dark={{ bg: 'gray.800' }}>
        <VStack align="stretch" spacing={3}>
          {/* Date Information */}
          <HStack>
            <FaCalendarAlt color="blue" aria-hidden="true" />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">
                {isMultiDayEvent(meet.meet_date, meet.end_date) 
                  ? formatDateRange(meet.meet_date, meet.end_date)
                  : formatMeetDate(meet.meet_date)
                }
              </Text>
              {isMultiDayEvent(meet.meet_date, meet.end_date) && (
                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                  Multi-day event
                </Text>
              )}
            </VStack>
          </HStack>
          
          {/* Location Information */}
          {(meet.city || meet.state || meet.venue_name) && (
            <HStack spacing={2} align="start">
              <FaMapMarkerAlt color="blue" aria-hidden="true" />
              <VStack align="start" spacing={1} flex="1">
                {meet.venue_name && (
                  <Text fontWeight="medium">
                    {meet.venue_name}
                    {meet.venue_type && (
                      <Badge ml={2} colorScheme="purple" fontSize="xs">
                        {meet.venue_type}
                      </Badge>
                    )}
                  </Text>
                )}
                {(meet.city || meet.state) && (
                  <Text fontSize="sm" color={mutedTextColor}>
                    {[meet.city, meet.state].filter(Boolean).join(', ')}
                  </Text>
                )}
                {/* Maps Link with improved accessibility */}
                {generateMapsLink(meet.venue_name, meet.city, meet.state) && (
                  <Button
                    as="a"
                    href={generateMapsLink(meet.venue_name, meet.city, meet.state)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    variant="outline"
                    colorScheme="green"
                    leftIcon={<FaMapMarkerAlt />}
                    mt={1}
                    aria-label={`Open directions to ${meet.venue_name || 'meet location'} in maps`}
                  >
                    Open in Maps
                  </Button>
                )}
                {/* Travel Time Display */}
                {showTravelTime && (
                  <TravelTimeDisplay
                    city={meet.city}
                    state={meet.state}
                    venueName={meet.venue_name}
                    size="sm"
                  />
                )}
              </VStack>
            </HStack>
          )}
          
          {/* Description */}
          {meet.description && (
            <Box 
              p={3} 
              bg={descriptionBg} 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderLeftColor="blue.400"
            >
              <Text fontSize="sm" color={mutedTextColor} lineHeight="1.5">
                {meet.description}
              </Text>
            </Box>
          )}
          
          {/* Events List Section */}
          {allEvents && allEvents.length > 0 && (
            <>
              <Divider my={2} />
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color={mutedTextColor} mb={3}>
                  Events ({allEvents.length})
                </Text>
                <EventsListSection
                  events={allEvents}
                  onEditEvent={onEditEvent}
                  onAssignAthletes={onAssignAthletesToEvent}
                  onDeleteEvent={onDeleteEvent}
                  showActions={showEventActions}
                />
              </Box>
            </>
          )}
          
          {/* Children content (events, assignments, etc.) */}
          {children && (
            <>
              <Divider my={2} />
              {children}
            </>
          )}
          
          {/* Action buttons */}
          {actionButtons && (
            <Flex justify="flex-end" pt={2}>
              <HStack>
                {actionButtons}
              </HStack>
            </Flex>
          )}
          
          {/* Registration link */}
          {meet.join_link && (
            <Button
              as="a"
              href={meet.join_link}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="outline"
              colorScheme="blue"
              leftIcon={<FaCalendarAlt />}
              aria-label={`Register for ${meet.name}`}
            >
              Registration
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}; 