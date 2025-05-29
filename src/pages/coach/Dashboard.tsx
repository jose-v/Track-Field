import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    Card,
    CardBody,
    Stack,
    HStack,
    VStack,
    Button,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Icon,
    Flex,
    useColorModeValue,
    useToast,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Select,
    useDisclosure
  } from '@chakra-ui/react';
  import { useAuth } from '../../contexts/AuthContext';
import { FaUserFriends, FaRunning, FaClipboardCheck, FaCalendarAlt, FaChartLine, FaClipboardList, FaFlagCheckered, FaCloudSun, FaMapMarkerAlt } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { YourTeamCard, WeatherCard, TrackMeetsCard, AlertsNotificationsCard, AthleteRosterCard, TodaysFocusCard } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';

  
// Mock data that's still needed for the exercises dropdown
const mockExercises = [
  'Sprint Drills',
  'Long Jump Practice',
  'Interval Training',
  'Strength Circuit',
  'Relay Baton Pass',
  'Plyometrics',
  'Endurance Run',
  'Shot Put Technique',
];
  
// Types for meet events
interface MeetEvent {
  id: string;
  meet_id: string;
  event_name: string;
  event_day?: number;
  start_time?: string;
}

// Types for track meets
interface TrackMeet {
  id: string;
  name: string;
  meet_date: string;
  city?: string;
  state?: string;
  status?: string;
}

// Types for athlete meet event assignments
interface AthleteEventAssignment {
  id: string;
  athlete_id: string;
  meet_event_id: string;
  assigned_by?: string;
}
  
// Add a hook to fetch events for coach's athletes
function useCoachAthleteEvents() {
  const { user } = useAuth();
  const { data: athletes, isLoading: athletesLoading } = useCoachAthletes();
  const toast = useToast();

  return useQuery({
    queryKey: ['coach-athlete-events', user?.id, athletes?.length],
    queryFn: async () => {
      try {
        if (!user?.id || !athletes || athletes.length === 0) {
          return [];
        }

        const athleteIds = athletes.map(athlete => athlete.id);
        
        // Get all athlete_meet_events assignments
        const { data: eventAssignments, error: assignmentsError } = await supabase
          .from('athlete_meet_events')
          .select('*')
          .in('athlete_id', athleteIds);

        if (assignmentsError) {
          console.error('[useCoachAthleteEvents] Error fetching athlete event assignments:', assignmentsError);
          throw assignmentsError;
        }
        
        if (!eventAssignments || eventAssignments.length === 0) {
          return [];
        }
        
        // Safely type the data
        const typedAssignments = eventAssignments as AthleteEventAssignment[];
        
        // Get the meet event details
        const meetEventIds = typedAssignments.map(assignment => assignment.meet_event_id);
        const { data: meetEvents, error: meetEventsError } = await supabase
          .from('meet_events')
          .select('*')
          .in('id', meetEventIds);
          
        if (meetEventsError) {
          console.error('[useCoachAthleteEvents] Error fetching meet events:', meetEventsError);
          throw meetEventsError;
        }
        
        if (!meetEvents || meetEvents.length === 0) {
          return [];
        }
        
        // Get the track meets
        const meetIds = [...new Set(meetEvents.map(event => event.meet_id))];
        const { data: trackMeets, error: tracksError } = await supabase
          .from('track_meets')
          .select('*')
          .in('id', meetIds);
          
        if (tracksError) {
          console.error('[useCoachAthleteEvents] Error fetching track meets:', tracksError);
          throw tracksError;
        }
        
        // Build maps for lookups
        const meetEventsMap = new Map<string, MeetEvent>(
          meetEvents.map(event => [event.id as string, event as unknown as MeetEvent])
        );
        
        const trackMeetsMap = new Map<string, TrackMeet>(
          trackMeets.map(meet => [meet.id as string, meet as unknown as TrackMeet])
        );
        
        // Process the data to structure by athlete
        const athleteMap = new Map();
        athletes.forEach(athlete => {
          athleteMap.set(athlete.id, {
            id: athlete.id,
            name: `${athlete.first_name} ${athlete.last_name}`,
            events: []
          });
        });

        // Add events to each athlete
        typedAssignments.forEach(assignment => {
          const meetEvent = meetEventsMap.get(assignment.meet_event_id);
          if (!meetEvent) return;
          
          const meet = trackMeetsMap.get(meetEvent.meet_id);
          if (!meet) return;
          
          const athlete = athleteMap.get(assignment.athlete_id);
          if (!athlete) return;
          
          athlete.events.push({
            id: meet.id,
            name: meet.name,
            date: meet.meet_date,
            location: `${meet.city || ''}, ${meet.state || ''}`.trim(),
            eventName: meetEvent.event_name
          });
        });

        // Convert Map to array and sort events by date
        const result = Array.from(athleteMap.values())
          .map(athlete => {
            // Filter out any test meets
            athlete.events = athlete.events
              .filter(event => !event.name.toLowerCase().includes('test meet'))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return athlete;
          })
          // Filter out athletes with no events after removing test meets
          .filter(athlete => athlete.events.length > 0);
        
        return result;
      } catch (error) {
        console.error('[useCoachAthleteEvents] Error in event fetch:', error);
        
        // Show a toast notification for the error
        toast({
          title: "Error loading events",
          description: error instanceof Error ? error.message : "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        
        // Return an empty result instead of throwing
        return [];
      }
    },
    enabled: !!user?.id && !!athletes && athletes.length > 0,
    staleTime: 60000, // 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false, // Disable automatic retries to prevent flooding with error requests
  });
}
  
// Add TrackMeetFormData interface
interface TrackMeetFormData {
  name: string;
  meet_date: string;
  city?: string;
  state?: string;
  status?: string;
}

// Schedule Event Modal Component
function ScheduleEventModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors }
  } = useForm<TrackMeetFormData>();
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);
  
  const onSubmit = async (data: TrackMeetFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create new track meet
      const { error } = await supabase
        .from('track_meets')
        .insert([{
          ...data,
          coach_id: user?.id
        }]);
      
      if (error) throw error;
      
      toast({
        title: 'Event scheduled',
        description: 'The track meet has been scheduled successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error scheduling event:', error);
      toast({
        title: 'Error scheduling event',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Schedule New Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
                     <form id="schedule-event-form" onSubmit={handleSubmit(onSubmit)}>
             <VStack spacing={4}>
               <FormControl isInvalid={!!errors.name} isRequired>
                 <FormLabel>Meet Name</FormLabel>
                 <Input {...register('name', { required: 'Name is required' })} />
                 <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
               </FormControl>
               
               <FormControl isInvalid={!!errors.meet_date} isRequired>
                 <FormLabel>Date</FormLabel>
                 <Input type="date" {...register('meet_date', { required: 'Date is required' })} />
                 <FormErrorMessage>{errors.meet_date?.message}</FormErrorMessage>
               </FormControl>
               
               <FormControl isInvalid={!!errors.city}>
                 <FormLabel>City</FormLabel>
                 <Input {...register('city')} />
                 <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
               </FormControl>
               
               <FormControl isInvalid={!!errors.state}>
                 <FormLabel>State</FormLabel>
                 <Input {...register('state')} />
                 <FormErrorMessage>{errors.state?.message}</FormErrorMessage>
               </FormControl>
               
               <FormControl isInvalid={!!errors.status}>
                 <FormLabel>Status</FormLabel>
                 <Select {...register('status')} defaultValue="Planned">
                   <option value="Planned">Planned</option>
                   <option value="Completed">Completed</option>
                   <option value="Cancelled">Cancelled</option>
                 </Select>
                 <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
               </FormControl>
             </VStack>
           </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            isLoading={isSubmitting}
            type="submit"
            form="schedule-event-form"
          >
            Schedule Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile(); // Get the profile
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('none', 'base');
  const cardShadowMd = useColorModeValue('none', 'md');
  const athleteItemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const subtitleColor = useColorModeValue('gray.600', 'gray.200');
  const eventDateColor = useColorModeValue('gray.500', 'gray.200');
  const noEventsColor = useColorModeValue('gray.400', 'gray.200');
  const statHelpTextColor = useColorModeValue('gray.500', 'gray.200');
  const statLabelColor = useColorModeValue('gray.600', 'gray.200');
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const { data: realAthletesData, isLoading: athletesLoading } = useCoachAthletes();
  const realAthletes = realAthletesData || []; // Ensure realAthletes is always an array

  const { data: athleteEvents, isLoading: eventsLoading } = useCoachAthleteEvents();

  // Log the user object to see its structure
  console.log('Coach dashboard user object:', user);

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'yellow';
    return 'red';
  };

  const averageCompletionRate = realAthletes.length > 0
    ? Math.round(realAthletes.reduce((acc, athlete) => acc + (athlete.completion_rate || 0), 0) / realAthletes.length)
    : 0;

  // Effect for debugging user and athletes state
  useEffect(() => {
    console.log('[CoachDashboard] User:', user);
    console.log('[CoachDashboard] Fetched Athletes:', realAthletesData);
    console.log('[CoachDashboard] Processed realAthletes (array):', realAthletes);
  }, [user, realAthletesData, realAthletes]);

  // Add a refresh mechanism to ensure stats stay current
  useEffect(() => {
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      // Refresh athlete data which will update completion stats
      queryClient.invalidateQueries({ queryKey: ['coachAthletes'] });
    }, 30000); // Every 30 seconds
    
    // Clean up on unmount
    return () => clearInterval(refreshInterval);
  }, [queryClient]);

  // Force refresh when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['coachAthletes'] });
        queryClient.invalidateQueries({ queryKey: ['coach-athlete-events'] });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);

  // Get the disclosure hooks for the schedule event modal
  const { isOpen: isScheduleModalOpen, onOpen: onScheduleModalOpen, onClose: onScheduleModalClose } = useDisclosure();

  // Handler functions for component interactions
  const handleAlertClick = (alert: any) => {
    if (alert.actionLink) {
      navigate(alert.actionLink);
    }
  };

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/coach/athletes/${athleteId}`);
  };

  const handleTaskClick = (task: any) => {
    if (task.actionLink) {
      navigate(task.actionLink);
    }
  };

  return (
    <Box py={8}>
      {/* Header Section */}
      <Flex justify="space-between" align="start" mb={8}>
        <Box>
          <Heading mb={2}>Coach Dashboard</Heading>
          <Text color={subtitleColor}>
            Welcome back, Coach {profile?.last_name || ''}! Here's your mission control.
          </Text>
        </Box>
        
        {/* Weather Widget */}
        <Box width="390px" minW="390px">
          <WeatherCard 
            city={profile?.city || "Greensboro"}
            state={profile?.state || "NC"}
            weather={{
              temp: "71", 
              condition: "Clouds",
              description: "scattered clouds"
            }}
            isLoading={profileLoading}
            fixedDate="Tuesday, May 20"
          />
        </Box>
      </Flex>

      {/* Priority Section 1: Alerts & Notifications (High Priority) */}
      <Box mb={8}>
        <AlertsNotificationsCard onAlertClick={handleAlertClick} />
      </Box>

      {/* Priority Section 2: Today's Focus & Critical Tasks */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        <TodaysFocusCard onTaskClick={handleTaskClick} />
        <AthleteRosterCard onAthleteClick={handleAthleteClick} />
      </SimpleGrid>

      {/* Dashboard Stats - At-a-Glance Metrics */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Total Athletes</StatLabel>
              <StatNumber fontSize="3xl">{athletesLoading ? '...' : realAthletes.length}</StatNumber>
              <StatHelpText color={statHelpTextColor}>Active team members</StatHelpText>
            </Box>
            <Box my="auto" color="blue.500" alignContent="center"><Icon as={FaUserFriends} w={8} h={8} /></Box>
          </Flex>
        </Stat>
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Team Workouts</StatLabel>
              <StatNumber fontSize="3xl">2</StatNumber> 
              <StatHelpText color={statHelpTextColor}>Active training plans</StatHelpText>
            </Box>
            <Box my="auto" color="purple.500" alignContent="center"><Icon as={FaRunning} w={8} h={8} /></Box>
          </Flex>
        </Stat>
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Completion Rate</StatLabel>
              <StatNumber fontSize="3xl" color={`${getCompletionColor(averageCompletionRate)}.500`}>
                {athletesLoading ? '...' : `${averageCompletionRate}%`}
              </StatNumber>
              <StatHelpText color={statHelpTextColor}>Average across team</StatHelpText>
            </Box>
            <Box my="auto" color="green.500" alignContent="center"><Icon as={FaClipboardCheck} w={8} h={8} /></Box>
          </Flex>
        </Stat>
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Upcoming Events</StatLabel>
              <StatNumber fontSize="3xl">{eventsLoading ? '...' : (athleteEvents?.reduce((count, athlete) => count + athlete.events.length, 0) || 0)}</StatNumber>
              <StatHelpText color={statHelpTextColor}>In the next 30 days</StatHelpText>
            </Box>
            <Box my="auto" color="red.500" alignContent="center"><Icon as={FaCalendarAlt} w={8} h={8} /></Box>
          </Flex>
        </Stat>
      </SimpleGrid>
      
      {/* Quick Actions - Prominent Action Buttons */}
      <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={8} bg={cardBg} p={5} rounded="lg" shadow={cardShadow} borderWidth="1px" borderColor={borderColor}>
        <Heading size="md" mb={{ base: 2, md: 0 }}>Quick Actions:</Heading>
        <Button 
          as={RouterLink} 
          to="/coach/workouts/new" 
          variant="solid" 
          colorScheme="blue"
          leftIcon={<Icon as={FaClipboardList} />}
        >
          Create Workout
        </Button>
        <Button 
          as={RouterLink} 
          to="/coach/athletes" 
          variant="solid" 
          colorScheme="blue"
          leftIcon={<Icon as={FaUserFriends} />}
        >
          Manage Athletes
        </Button>
        <Button 
          variant="solid" 
          colorScheme="blue"
          leftIcon={<Icon as={FaCalendarAlt} />}
          onClick={onScheduleModalOpen}
        >
          Schedule Event
        </Button>
        <Button 
          as={RouterLink} 
          to="/coach/stats" 
          variant="solid" 
          colorScheme="teal"
          leftIcon={<Icon as={FaChartLine} />}
        >
          View Analytics
        </Button>
      </Stack>
      
      {/* Secondary Information - Team Details and Events */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        {/* Your Team Card */}
        <YourTeamCard />

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow} borderRadius="xl" data-testid="upcoming-events-card">
          <CardBody>
            <Heading size="md" mb={4}>Upcoming Events</Heading>
            {eventsLoading ? (
              <Flex justify="center" py={4}>
                <Spinner />
              </Flex>
            ) : !athleteEvents || athleteEvents.length === 0 ? (
              <Text>No upcoming events assigned to your athletes.</Text>
            ) : (
              <Stack spacing={4}>
                {athleteEvents.map((athleteWithEvents) => (
                  <Box key={athleteWithEvents.id}>
                    <Text fontWeight="medium" mb={1}>{athleteWithEvents.name}</Text>
                    {athleteWithEvents.events.length > 0 ? (
                      <Stack pl={4} spacing={1}>
                        {athleteWithEvents.events.map((event, idx) => (
                          <HStack key={idx}>
                            <Icon as={FaFlagCheckered} color="teal.400" boxSize={3} />
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">{event.name}</Text>
                              <Text fontSize="xs" color={eventDateColor}>
                                {new Date(event.date).toLocaleDateString()} • {event.eventName}
                              </Text>
                            </Box>
                          </HStack>
                        ))}
                      </Stack>
                    ) : (
                      <Text fontSize="sm" color={noEventsColor} pl={4}>No upcoming events</Text>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Track Meets Calendar View */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Track Meets Calendar</Heading>
        <TrackMeetsCard viewAllLink="/coach/events" />
      </Box>
      
      {/* Schedule Event Modal */}
      <ScheduleEventModal isOpen={isScheduleModalOpen} onClose={onScheduleModalClose} />
    </Box>
  );
}