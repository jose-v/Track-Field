import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Box,
  Icon,
  Badge,
  Collapse,
  IconButton,
  Flex,
  Spinner,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { 
  FaChevronDown, 
  FaChevronRight, 
  FaFlagCheckered, 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaRunning,
  FaUser
} from 'react-icons/fa';

interface EventData {
  id: string;
  name: string;
  date: string;
  eventName: string;
  meetName?: string;
  location?: string;
  time?: string;
}

interface AthleteWithEvents {
  id: string;
  name: string;
  avatar_url?: string;
  events: EventData[];
}

interface GroupedMeet {
  meetName: string;
  date: string;
  location?: string;
  events: EventData[];
}

interface UpcomingEventsCardProps {
  athleteEvents: AthleteWithEvents[];
  isLoading?: boolean;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  athleteEvents = [],
  isLoading = false
}) => {
  const [expandedAthletes, setExpandedAthletes] = useState<Set<string>>(new Set());
  const [expandedMeets, setExpandedMeets] = useState<Set<string>>(new Set());

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardShadow = useColorModeValue('sm', 'md');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const meetBg = useColorModeValue('gray.50', 'gray.700');
  const eventBg = useColorModeValue('white', 'gray.600');

  const toggleAthleteExpansion = (athleteId: string) => {
    const newExpanded = new Set(expandedAthletes);
    if (newExpanded.has(athleteId)) {
      newExpanded.delete(athleteId);
    } else {
      newExpanded.add(athleteId);
    }
    setExpandedAthletes(newExpanded);
  };

  const toggleMeetExpansion = (athleteId: string, meetName: string) => {
    const meetKey = `${athleteId}-${meetName}`;
    const newExpanded = new Set(expandedMeets);
    if (newExpanded.has(meetKey)) {
      newExpanded.delete(meetKey);
    } else {
      newExpanded.add(meetKey);
    }
    setExpandedMeets(newExpanded);
  };

  // Group events by meet for each athlete
  const groupEventsByMeet = (events: EventData[]): GroupedMeet[] => {
    const meetGroups: { [key: string]: GroupedMeet } = {};
    
    events.forEach(event => {
      const meetName = event.meetName || event.name;
      if (!meetGroups[meetName]) {
        meetGroups[meetName] = {
          meetName,
          date: event.date,
          location: event.location,
          events: []
        };
      }
      meetGroups[meetName].events.push(event);
    });

    return Object.values(meetGroups).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  return (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      borderWidth="1px" 
      shadow={cardShadow} 
      borderRadius="xl"
      data-testid="upcoming-events-card"
    >
      <CardBody>
        <Heading size="md" mb={4}>Upcoming Events</Heading>
        
        {isLoading ? (
          <Flex justify="center" py={4}>
            <Spinner color="blue.500" />
          </Flex>
        ) : !athleteEvents || athleteEvents.length === 0 ? (
          <VStack spacing={3} py={6}>
            <Icon as={FaCalendarAlt} boxSize={8} color="gray.400" />
            <Text color={subtitleColor} textAlign="center">
              No upcoming events assigned to your athletes.
            </Text>
          </VStack>
        ) : (
          <VStack spacing={3} align="stretch">
            {athleteEvents.map((athlete) => {
              const isAthleteExpanded = expandedAthletes.has(athlete.id);
              const groupedMeets = groupEventsByMeet(athlete.events);
              const totalEvents = athlete.events.length;

              return (
                <Box key={athlete.id}>
                  {/* Athlete Header */}
                  <Flex
                    align="center"
                    justify="space-between"
                    p={3}
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => toggleAthleteExpansion(athlete.id)}
                  >
                    <HStack spacing={3}>
                      <IconButton
                        aria-label={isAthleteExpanded ? "Collapse" : "Expand"}
                        icon={isAthleteExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAthleteExpansion(athlete.id);
                        }}
                      />
                      <Icon as={FaUser} color="blue.500" boxSize={4} />
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" color={textColor}>
                          {athlete.name}
                        </Text>
                        <Text fontSize="xs" color={subtitleColor}>
                          {totalEvents} event{totalEvents !== 1 ? 's' : ''}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme="blue" variant="subtle">
                      {totalEvents}
                    </Badge>
                  </Flex>

                  {/* Athlete Events - Collapsible */}
                  <Collapse in={isAthleteExpanded}>
                    <Box pl={6} pr={3} pb={3}>
                      {groupedMeets.length === 0 ? (
                        <Text fontSize="sm" color={subtitleColor} py={2}>
                          No upcoming events
                        </Text>
                      ) : (
                        <VStack spacing={2} align="stretch">
                          {groupedMeets.map((meet) => {
                            const meetKey = `${athlete.id}-${meet.meetName}`;
                            const isMeetExpanded = expandedMeets.has(meetKey);
                            const hasMultipleEvents = meet.events.length > 1;

                            return (
                              <Box key={meetKey}>
                                {/* Meet Header */}
                                <Box
                                  bg={meetBg}
                                  borderRadius="md"
                                  p={3}
                                  cursor={hasMultipleEvents ? "pointer" : "default"}
                                  onClick={hasMultipleEvents ? () => toggleMeetExpansion(athlete.id, meet.meetName) : undefined}
                                  _hover={hasMultipleEvents ? { opacity: 0.8 } : {}}
                                >
                                  <Flex justify="space-between" align="center">
                                    <HStack spacing={2}>
                                      {hasMultipleEvents && (
                                        <IconButton
                                          aria-label={isMeetExpanded ? "Collapse meet" : "Expand meet"}
                                          icon={isMeetExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMeetExpansion(athlete.id, meet.meetName);
                                          }}
                                        />
                                      )}
                                      <Icon as={FaFlagCheckered} color="teal.500" boxSize={3} />
                                      <VStack spacing={0} align="start">
                                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                          {meet.meetName}
                                        </Text>
                                        <HStack spacing={3} fontSize="xs" color={subtitleColor}>
                                          <HStack spacing={1}>
                                            <Icon as={FaCalendarAlt} boxSize={3} />
                                            <Text>{formatDate(meet.date)}</Text>
                                          </HStack>
                                          {meet.location && (
                                            <HStack spacing={1}>
                                              <Icon as={FaMapMarkerAlt} boxSize={3} />
                                              <Text>{meet.location}</Text>
                                            </HStack>
                                          )}
                                        </HStack>
                                      </VStack>
                                    </HStack>
                                    <Badge colorScheme="teal" size="sm">
                                      {meet.events.length} event{meet.events.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </Flex>
                                </Box>

                                {/* Events under this meet */}
                                {hasMultipleEvents ? (
                                  <Collapse in={isMeetExpanded}>
                                    <VStack spacing={1} align="stretch" pl={4} pt={2}>
                                      {meet.events.map((event) => (
                                        <Box
                                          key={event.id}
                                          bg={eventBg}
                                          borderRadius="md"
                                          p={2}
                                          borderLeft="3px solid"
                                          borderLeftColor="teal.400"
                                        >
                                          <HStack justify="space-between">
                                            <HStack spacing={2}>
                                              <Icon as={FaRunning} color="teal.400" boxSize={3} />
                                              <Text fontSize="sm" fontWeight="medium">
                                                {event.eventName}
                                              </Text>
                                            </HStack>
                                            {event.time && (
                                              <Text fontSize="xs" color={subtitleColor}>
                                                {formatTime(event.time)}
                                              </Text>
                                            )}
                                          </HStack>
                                        </Box>
                                      ))}
                                    </VStack>
                                  </Collapse>
                                ) : (
                                  // Single event - show directly
                                  <Box pl={4} pt={1}>
                                    <Box
                                      bg={eventBg}
                                      borderRadius="md"
                                      p={2}
                                      borderLeft="3px solid"
                                      borderLeftColor="teal.400"
                                    >
                                      <HStack justify="space-between">
                                        <HStack spacing={2}>
                                          <Icon as={FaRunning} color="teal.400" boxSize={3} />
                                          <Text fontSize="sm" fontWeight="medium">
                                            {meet.events[0].eventName}
                                          </Text>
                                        </HStack>
                                        {meet.events[0].time && (
                                          <Text fontSize="xs" color={subtitleColor}>
                                            {formatTime(meet.events[0].time)}
                                          </Text>
                                        )}
                                      </HStack>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  </Collapse>

                  {/* Divider between athletes */}
                  {athlete !== athleteEvents[athleteEvents.length - 1] && (
                    <Divider my={2} />
                  )}
                </Box>
              );
            })}
          </VStack>
        )}
      </CardBody>
    </Card>
  );
}; 