/**
 * Shopify-style three-panel interface for managing athlete event assignments
 * Left: Athletes roster | Center: Selected athlete's events | Right: Available events
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Badge,
  Button,
  IconButton,
  Flex,
  Divider,
  useToast,
  Tooltip,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  TimeIcon,
  CalendarIcon,
  DragHandleIcon
} from '@chakra-ui/icons';
import { FaRunning, FaUsers, FaFilter, FaClock, FaMapMarkerAlt, FaPlus } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { TrackMeet } from '../../types/meetTypes';
import { CoachEventBulkCreator } from './CoachEventBulkCreator';

interface CoachAthleteEventManagerProps {
  meet: TrackMeet | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  eventCount: number;
}

interface Event {
  id: string;
  event_name: string;
  event_date?: string;
  event_day?: number;
  start_time?: string;
  heat?: number;
  event_type?: string;
  run_time?: string;
}

interface AthleteEvent extends Event {
  assigned_at: string;
  assigned_by: string;
}

export const CoachAthleteEventManager: React.FC<CoachAthleteEventManagerProps> = ({
  meet,
  isOpen,
  onClose,
  onRefresh
}) => {
  // Hooks
  const { user } = useAuth();
  
  // State management
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [athleteEvents, setAthleteEvents] = useState<AthleteEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [assigningEvent, setAssigningEvent] = useState<string | null>(null);
  const [isAddEventsOpen, setIsAddEventsOpen] = useState(false);
  
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('white', 'gray.800');
  const panelBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorderColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.900', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardHoverBorder = useColorModeValue('blue.300', 'blue.500');
  const inputBg = useColorModeValue('white', 'gray.600');
  const overlayBg = useColorModeValue('rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)');
  const iconColor = useColorModeValue("#3182CE", "#63B3ED");
  const emptyStateIconColor = useColorModeValue("#CBD5E0", "#4A5568");

  // Load initial data when component opens
  useEffect(() => {
    if (isOpen && meet) {
      loadAvailableEvents();
      loadAthletes();
    }
  }, [isOpen, meet]);

  // Load athlete events when athlete is selected
  useEffect(() => {
    if (selectedAthlete && meet) {
      loadAthleteEvents(selectedAthlete.id);
    }
  }, [selectedAthlete, meet]);

  const loadAthletes = async () => {
    if (!meet || !user?.id) return;
    
    setLoading(true);
    try {
      // Get teams where the current user is a coach
      const { data: coachTeams, error: teamsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('role', 'coach')
        .eq('status', 'active');
      
      if (teamsError) throw teamsError;
      
      if (!coachTeams || coachTeams.length === 0) {
        // Fallback: Check legacy coach_athletes table for coaches who haven't migrated to teams
        const { data: legacyRelations, error: legacyError } = await supabase
          .from('coach_athletes')
          .select('athlete_id')
          .eq('coach_id', user.id)
          .eq('approval_status', 'approved');
        
        if (legacyError) throw legacyError;
        
        if (!legacyRelations || legacyRelations.length === 0) {
          setAthletes([]);
          setLoading(false);
          return;
        }
        
        // Get athlete profile data for legacy relationships
        const legacyAthleteIds = legacyRelations.map(lr => lr.athlete_id);
        const { data: athletesData, error: athletesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', legacyAthleteIds)
          .eq('role', 'athlete')
          .order('first_name, last_name');
        
        if (athletesError) throw athletesError;
        
        // Get event counts for legacy athletes
        const athletesWithCounts = await Promise.all(
          (athletesData || []).map(async (athlete) => {
            try {
              const { data: meetEvents } = await supabase
                .from('meet_events')
                .select('id')
                .eq('meet_id', meet.id);

              if (!meetEvents || meetEvents.length === 0) {
                return {
                  ...athlete,
                  full_name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown',
                  eventCount: 0
                };
              }

              const { count } = await supabase
                .from('athlete_meet_events')
                .select('id', { count: 'exact', head: true })
                .eq('athlete_id', athlete.id)
                .in('meet_event_id', meetEvents.map(e => e.id));

              return {
                ...athlete,
                full_name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown',
                eventCount: count || 0
              };
            } catch (error) {
              const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown';
              return {
                ...athlete,
                full_name: fullName,
                eventCount: 0
              };
            }
          })
        );

        setAthletes(athletesWithCounts);
        setLoading(false);
        return;
      }
      
      const teamIds = coachTeams.map(ct => ct.team_id);
      
      // Get athlete IDs from these teams
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select('user_id')
        .in('team_id', teamIds)
        .eq('role', 'athlete')
        .eq('status', 'active');
      
      if (teamMembersError) throw teamMembersError;
      
      if (!teamMembers || teamMembers.length === 0) {
        setAthletes([]);
        setLoading(false);
        return;
      }
      
      // Get athlete profile data
      const athleteIds = teamMembers.map(tm => tm.user_id);
      const { data: athletesData, error: athletesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', athleteIds)
        .eq('role', 'athlete')
        .order('first_name, last_name');
      
      if (athletesError) throw athletesError;

      // Get event counts for each athlete for this meet - simplified approach
      const athletesWithCounts = await Promise.all(
        (athletesData || []).map(async (athlete) => {
          try {
            // First get all meet events for this meet
            const { data: meetEvents } = await supabase
              .from('meet_events')
              .select('id')
              .eq('meet_id', meet.id);

                         if (!meetEvents || meetEvents.length === 0) {
               return {
                 ...athlete,
                 full_name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown',
                 eventCount: 0
               };
             }

            // Then count assignments for this athlete
            const { count } = await supabase
              .from('athlete_meet_events')
              .select('id', { count: 'exact', head: true })
              .eq('athlete_id', athlete.id)
              .in('meet_event_id', meetEvents.map(e => e.id));

            return {
              ...athlete,
              full_name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown',
              eventCount: count || 0
            };
                               } catch (error) {
            const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown';
            return {
              ...athlete,
              full_name: fullName,
              eventCount: 0
            };
          }
        })
      );

      setAthletes(athletesWithCounts);
    } catch (error) {
      console.error('Error loading athletes:', error);
      toast({
        title: "Error loading athletes",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableEvents = async () => {
    if (!meet) return;

    try {
      const { data: eventsData, error } = await supabase
        .from('meet_events')
        .select('*')
        .eq('meet_id', meet.id)
        .order('event_day, start_time, event_name');
      if (error) throw error;
      setAvailableEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error loading events",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadAthleteEvents = async (athleteId: string) => {
    if (!meet) return;

    try {
      // Get all assignments for this athlete in this meet
      const { data: assignmentsData, error } = await supabase
        .from('athlete_meet_events')
        .select(`
          *,
          meet_events!inner (*)
        `)
        .eq('athlete_id', athleteId)
        .eq('meet_events.meet_id', meet.id);
      if (error) throw error;

      const events = (assignmentsData || []).map(assignment => ({
        ...assignment.meet_events,
        assigned_at: assignment.created_at,
        assigned_by: assignment.assigned_by
      })).sort((a, b) => {
        // Sort by date, then time
        if (a.event_date && b.event_date) {
          const dateCompare = a.event_date.localeCompare(b.event_date);
          if (dateCompare !== 0) return dateCompare;
        }
        if (a.start_time && b.start_time) {
          return a.start_time.localeCompare(b.start_time);
        }
        return a.event_name.localeCompare(b.event_name);
      });

      setAthleteEvents(events);
    } catch (error) {
      console.error('Error loading athlete events:', error);
      toast({
        title: "Error loading athlete events",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const assignEventToAthlete = async (eventId: string) => {
    if (!selectedAthlete || !meet) return;

    setAssigningEvent(eventId);
    try {
      const { error } = await supabase
        .from('athlete_meet_events')
        .insert({
          athlete_id: selectedAthlete.id,
          meet_event_id: eventId
        });

      if (error) throw error;

      toast({
        title: "Event assigned successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Refresh data
      loadAthleteEvents(selectedAthlete.id);
      loadAthletes(); // Update event counts
      onRefresh?.();
    } catch (error) {
      console.error('Error assigning event:', error);
      toast({
        title: "Error assigning event",
        description: "This athlete may already be assigned to this event",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAssigningEvent(null);
    }
  };

  const removeEventFromAthlete = async (eventId: string) => {
    if (!selectedAthlete) return;

    try {
      const { error } = await supabase
        .from('athlete_meet_events')
        .delete()
        .eq('athlete_id', selectedAthlete.id)
        .eq('meet_event_id', eventId);

      if (error) throw error;

      toast({
        title: "Event removed successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Refresh data
      loadAthleteEvents(selectedAthlete.id);
      loadAthletes(); // Update event counts
      onRefresh?.();
    } catch (error) {
      console.error('Error removing event:', error);
      toast({
        title: "Error removing event",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!meet) return;
    
    try {
      // First, remove all athlete assignments for this event
      const { error: assignmentError } = await supabase
        .from('athlete_meet_events')
        .delete()
        .eq('meet_event_id', eventId);

      if (assignmentError) throw assignmentError;

      // Then delete the event itself
      const { error: eventError } = await supabase
        .from('meet_events')
        .delete()
        .eq('id', eventId)
        .eq('meet_id', meet.id);

      if (eventError) throw eventError;

      toast({
        title: "Event deleted",
        description: "Event and all athlete assignments have been removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh all data
      loadAvailableEvents();
      loadAthletes();
      if (selectedAthlete) {
        loadAthleteEvents(selectedAthlete.id);
      }
      onRefresh?.();

    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error deleting event",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // HH:MM
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'Finals': return 'red';
      case 'Semifinal': return 'orange';
      case 'Qualifier': return 'yellow';
      case 'Preliminary': return 'blue';
      default: return 'gray';
    }
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unassignedEvents = availableEvents.filter(event =>
    !athleteEvents.some(ae => ae.id === event.id)
  );

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={overlayBg}
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg={bgColor}
        borderRadius="xl"
        shadow="2xl"
        w="full"
        maxW="1400px"
        h="90vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Flex
          p={6}
          borderBottom="1px solid"
          borderColor={borderColor}
          align="center"
          justify="space-between"
          bg={headerBg}
        >
          <HStack spacing={3}>
            <FaUsers size={24} color={iconColor} />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Athlete Event Management
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                {meet?.name} • {athletes.length} athletes • {availableEvents.length} events
              </Text>
            </VStack>
          </HStack>
          <Button variant="ghost" onClick={onClose} color={textColor}>
            ✕
          </Button>
        </Flex>

        {/* Three-panel layout */}
        <Flex flex={1} overflow="hidden">
          {/* Left Panel: Athletes Roster */}
          <Box
            w="300px"
            borderRight="1px solid"
            borderColor={borderColor}
            display="flex"
            flexDirection="column"
            bg={panelBg}
          >
            <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color={subtextColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search athletes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: subtextColor }}
                />
              </InputGroup>
            </Box>

            <VStack spacing={0} align="stretch" flex={1} overflowY="auto">
              {loading ? (
                <Flex justify="center" align="center" h="200px">
                  <Spinner />
                </Flex>
              ) : filteredAthletes.length === 0 ? (
                <Flex justify="center" align="center" h="200px">
                  <Text color={subtextColor}>No athletes found</Text>
                </Flex>
              ) : (
                filteredAthletes.map((athlete) => (
                  <Box
                    key={athlete.id}
                    p={3}
                    cursor="pointer"
                    bg={selectedAthlete?.id === athlete.id ? selectedBg : "transparent"}
                    borderLeft={selectedAthlete?.id === athlete.id ? "4px solid" : "4px solid transparent"}
                    borderLeftColor={selectedAthlete?.id === athlete.id ? selectedBorderColor : "transparent"}
                    _hover={{ bg: hoverBg }}
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Avatar size="sm" name={athlete.full_name} src={athlete.avatar_url} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium" color={textColor}>
                            {athlete.full_name}
                          </Text>
                          <Text fontSize="xs" color={subtextColor}>
                            {athlete.email}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge colorScheme={athlete.eventCount > 0 ? "blue" : "gray"} size="sm">
                        {athlete.eventCount}
                      </Badge>
                    </HStack>
                  </Box>
                ))
              )}
            </VStack>
          </Box>

          {/* Center Panel: Selected Athlete's Events */}
          <Box flex={1} display="flex" flexDirection="column" bg={panelBg}>
            {selectedAthlete ? (
              <>
                <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Avatar name={selectedAthlete.full_name} src={selectedAthlete.avatar_url} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                          {selectedAthlete.full_name}
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          {athleteEvents.length} events assigned
                        </Text>
                      </VStack>
                    </HStack>
                  </HStack>
                </Box>

                <VStack spacing={0} align="stretch" flex={1} overflowY="auto" p={4}>
                  {athleteEvents.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      No events assigned. Click events from the right panel to assign them.
                    </Alert>
                  ) : (
                    athleteEvents.map((event) => (
                      <Box 
                        key={event.id} 
                        p={3} 
                        mb={2} 
                        bg={cardBg} 
                        borderWidth="1px" 
                        borderColor={borderColor}
                        borderRadius="md"
                        _hover={{ bg: hoverBg }}
                      >
                        <HStack justify="space-between" align="start" spacing={3}>
                          <VStack align="start" spacing={2} flex={1}>
                            <Text fontWeight="semibold" fontSize="md" color={textColor} lineHeight="short">
                              {event.event_name}
                            </Text>
                            
                            <HStack spacing={4} wrap="wrap">
                              {event.event_date && (
                                <HStack spacing={1}>
                                  <CalendarIcon boxSize={3} color={subtextColor} />
                                  <Text fontSize="xs" color={subtextColor}>
                                    {formatDate(event.event_date)}
                                  </Text>
                                </HStack>
                              )}
                              
                              {event.start_time && (
                                <HStack spacing={1}>
                                  <TimeIcon boxSize={3} color={subtextColor} />
                                  <Text fontSize="xs" color={subtextColor}>
                                    {formatTime(event.start_time)}
                                  </Text>
                                </HStack>
                              )}
                              
                              {event.event_day && (
                                <Text fontSize="xs" color={subtextColor}>
                                  Day {event.event_day}
                                </Text>
                              )}
                              
                              {event.event_type && (
                                <Badge size="sm" colorScheme={getEventTypeColor(event.event_type)}>
                                  {event.event_type}
                                </Badge>
                              )}
                            </HStack>
                          </VStack>
                          
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            onClick={() => removeEventFromAthlete(event.id)}
                            aria-label="Remove event"
                          />
                        </HStack>
                      </Box>
                    ))
                  )}
                </VStack>
              </>
            ) : (
              <Flex justify="center" align="center" h="full">
                <VStack spacing={4}>
                  <FaRunning size={48} color={emptyStateIconColor} />
                  <Text color={subtextColor} textAlign="center">
                    Select an athlete from the left panel<br />
                    to view and manage their events
                  </Text>
                </VStack>
              </Flex>
            )}
          </Box>

          {/* Right Panel: Available Events */}
          <Box
            w="350px"
            borderLeft="1px solid"
            borderColor={borderColor}
            display="flex"
            flexDirection="column"
            bg={panelBg}
          >
            <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
              <HStack justify="space-between" align="start" mb={3}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="md" fontWeight="semibold" color={textColor}>
                    Available Events
                  </Text>
                  <Text fontSize="sm" color={subtextColor}>
                    Click to assign to {selectedAthlete?.full_name || 'selected athlete'}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => setIsAddEventsOpen(true)}
                >
                  Manage Events
                </Button>
              </HStack>
            </Box>

            <VStack spacing={0} align="stretch" flex={1} overflowY="auto" p={4}>
              {!selectedAthlete ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Select an athlete first
                </Alert>
              ) : unassignedEvents.length === 0 ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  All events assigned to this athlete
                </Alert>
              ) : (
                unassignedEvents.map((event) => (
                  <Box
                    key={event.id}
                    p={3}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    _hover={{ bg: hoverBg, borderColor: cardHoverBorder }}
                    mb={1}
                  >
                    <HStack justify="space-between" w="full" spacing={2}>
                      <VStack 
                        align="start" 
                        spacing={1} 
                        flex={1}
                        cursor="pointer"
                        onClick={() => assignEventToAthlete(event.id)}
                        opacity={assigningEvent === event.id ? 0.6 : 1}
                      >
                        <Text fontWeight="medium" fontSize="sm" color={textColor} lineHeight="short">
                          {event.event_name}
                        </Text>
                        
                        <HStack spacing={3} wrap="wrap">
                          {event.event_date && (
                            <Text fontSize="xs" color={subtextColor}>
                              {formatDate(event.event_date)}
                            </Text>
                          )}
                          
                          {event.start_time && (
                            <Text fontSize="xs" color={subtextColor}>
                              {formatTime(event.start_time)}
                            </Text>
                          )}
                          
                          {event.event_type && (
                            <Badge size="sm" colorScheme={getEventTypeColor(event.event_type)}>
                              {event.event_type}
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                      
                      <HStack spacing={1}>
                        {assigningEvent === event.id && (
                          <Spinner size="xs" />
                        )}
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                          aria-label="Delete event"
                        />
                      </HStack>
                    </HStack>
                  </Box>
                ))
              )}
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Add Events Drawer */}
      <CoachEventBulkCreator
        isOpen={isAddEventsOpen}
        onClose={() => setIsAddEventsOpen(false)}
        meet={meet}
        onEventsCreated={() => {
          loadAvailableEvents(); // Refresh available events
          if (selectedAthlete) {
            loadAthleteEvents(selectedAthlete.id); // Refresh athlete events
          }
          onRefresh?.(); // Refresh parent component
        }}
      />
    </Box>
  );
}; 