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
    useDisclosure
  } from '@chakra-ui/react';
  import { useAuth } from '../../contexts/AuthContext';
import { FaUserFriends, FaRunning, FaClipboardCheck, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useProfileDisplay } from '../../hooks/useProfileDisplay';
import { useQueryClient } from '@tanstack/react-query';
import { WeatherCard, TrackMeetsCard, AlertsNotificationsCard, TodaysFocusCard } from '../../components';
import { MobileWelcomeMessage } from '../../components/MobileWelcomeMessage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import AthleteRosterCard from '../../components/coach/AthleteRosterCard';
import { MeetFormDrawer, type TrackMeetFormData, type TrackMeetData } from '../../components/meets/MeetFormDrawer';
import { useWorkouts } from '../../hooks/useWorkouts';
import { CoachTeamsCard } from '../../components/CoachTeamsCard';
import { CreateTeamModal } from '../../components/CreateTeamModal';
import { UpcomingEventsCard } from '../../components/UpcomingEventsCard';

  
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
            id: `${meet.id}-${meetEvent.id}`,
            name: meet.name,
            date: meet.meet_date,
            location: `${meet.city || ''}, ${meet.state || ''}`.trim(),
            eventName: meetEvent.event_name,
            meetName: meet.name
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
  
export function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile();
  const { workouts, isLoading: workoutsLoading } = useWorkouts();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showMonthlyPlanModal, setShowMonthlyPlanModal] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const { data: realAthletesData, isLoading: athletesLoading } = useCoachAthletes();
  const realAthletes = realAthletesData || []; // Ensure realAthletes is always an array

  const { data: athleteEvents, isLoading: eventsLoading } = useCoachAthleteEvents();

  // Log the user object to see its structure
  console.log('Coach dashboard user object:', user);

  // Color mode styles
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('none', 'base');
  const cardShadowMd = useColorModeValue('none', 'md');
  const athleteItemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const subtitleColor = useColorModeValue('gray.600', 'gray.200');

  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statHelpTextColor = useColorModeValue('gray.500', 'gray.400');

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

  // Get the disclosure hooks for the schedule meet drawer
  const { isOpen: isScheduleMeetOpen, onOpen: onScheduleMeetOpen, onClose: onScheduleMeetClose } = useDisclosure();

  // Create meet submission handler
  const handleCreateMeet = async (data: TrackMeetFormData) => {
    try {
      // Create new track meet
      const { error } = await supabase
        .from('track_meets')
        .insert([{
          ...data,
          coach_id: user?.id
        }]);
      
      if (error) throw error;
      
      toast({
        title: 'Meet scheduled',
        description: 'The track meet has been scheduled successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      onScheduleMeetClose();
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['coach-athlete-events'] });
    } catch (error) {
      console.error('Error scheduling meet:', error);
      toast({
        title: 'Error scheduling meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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

  // Extract last name from display name for welcome message
  const getLastNameFromDisplayName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };

  const welcomeName = profile?.displayName ? getLastNameFromDisplayName(profile.displayName) : (profile?.last_name || '');

  // Helper function to determine if it's a first-time user
  const isFirstTimeUser = (): boolean => {
    if (!user?.created_at) return false;
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Consider it first-time if account was created within the last day
    return daysDiff <= 1;
  };

  // Helper function to get the appropriate welcome message
  const getWelcomeMessage = (): string => {
    return isFirstTimeUser() 
      ? `Welcome, Coach ${welcomeName}!`
      : `Welcome back, Coach ${welcomeName}!`;
  };

  // Check for email verification success toast
  useEffect(() => {
    const shouldShowToast = localStorage.getItem('show-email-verified-toast')
    if (shouldShowToast === 'true' && user?.email_confirmed_at) {
      // Show success toast
      toast({
        title: '🎉 Email Verified Successfully!',
        description: `Welcome to Track & Field, ${profile?.first_name || user?.email?.split('@')[0] || 'Coach'}! Your account is now fully activated.`,
        status: 'success',
        duration: 8000,
        isClosable: true,
        position: 'top'
      })
      
      // Clear the flag so it doesn't show again
      localStorage.removeItem('show-email-verified-toast')
    }
  }, [user, profile, toast])

  return (
    <Box py={0}>
      {/* Mobile Layout */}
      <Box display={{ base: "block", md: "none" }} position="relative">
        {/* Mobile Welcome Message - positioned on same line as hamburger */}
        <MobileWelcomeMessage message={getWelcomeMessage()} />
        
        {/* Weather Card - Full width with 10px padding */}
        <Box px="10px" mb={4}>
          <WeatherCard 
            city={profile?.city || "Greensboro"}
            state={profile?.state || "NC"}
            weather={{
              temp: "71", 
              condition: "Clouds",
              description: "scattered clouds"
            }}
            isLoading={profileLoading}
          />
        </Box>

        {/* Quick Actions - 3 buttons in one line */}
        <Box px="10px" mb={8}>
          <HStack spacing={3} justify="space-between">
            <Button 
              as={RouterLink} 
              to="/coach/workout-creator" 
              variant="solid" 
              colorScheme="blue"
              size="sm"
              flex="1"
            >
              Create Workout
            </Button>
            <Button 
              as={RouterLink} 
              to="/coach/athletes" 
              variant="solid" 
              colorScheme="blue"
              size="sm"
              flex="1"
            >
              Manage Athletes
            </Button>
            <Button 
              variant="solid" 
              colorScheme="blue"
              size="sm"
              onClick={onScheduleMeetOpen}
              flex="1"
            >
              Schedule Meet
            </Button>
          </HStack>
        </Box>
      </Box>

      {/* Desktop Layout */}
      <Box display={{ base: "none", md: "block" }}>
        {/* Header Section */}
        <Flex justify="space-between" align="start" mb={8}>
          <Box flex={1}>
            <Heading mb={2}>Coach Dashboard</Heading>
            <Text color={subtitleColor} mb={4}>
              {getWelcomeMessage()}
            </Text>
            
            {/* Quick Actions integrated into header */}
            <HStack spacing={3} flexWrap="wrap">
              <Button 
                as={RouterLink} 
                to="/coach/workout-creator" 
                variant="solid" 
                colorScheme="blue"
                size="sm"
              >
                Create Workout
              </Button>
              <Button 
                as={RouterLink} 
                to="/coach/athletes" 
                variant="solid" 
                colorScheme="blue"
                size="sm"
              >
                Manage Athletes
              </Button>
              <Button 
                variant="solid" 
                colorScheme="blue"
                size="sm"
                onClick={onScheduleMeetOpen}
              >
                Schedule Meet
              </Button>
              <Button 
                as={RouterLink} 
                to="/coach/stats" 
                variant="solid" 
                colorScheme="teal"
                size="sm"
              >
                View Analytics
              </Button>
            </HStack>
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
            />
          </Box>
        </Flex>
      </Box>

      {/* Priority Section 1: Alerts & Notifications (High Priority) */}
      <Box mb={8}>
        <AlertsNotificationsCard onAlertClick={handleAlertClick} />
      </Box>

      {/* Priority Section 2: Today's Focus & Upcoming Events */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        <TodaysFocusCard onTaskClick={handleTaskClick} />
        
        {/* Enhanced Upcoming Events with athlete dropdowns and meet grouping */}
        <UpcomingEventsCard 
          athleteEvents={athleteEvents || []}
          isLoading={eventsLoading}
        />
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
      
      {/* Coach Teams Section - Now includes all athletes and teams */}
      <Box mb={8}>
        <CoachTeamsCard />
      </Box>
      
      {/* Track Meets Calendar View */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Track Meets Calendar</Heading>
        <TrackMeetsCard 
          viewAllLink="/coach/meets" 
          userRole="coach"
        />
      </Box>
      
      {/* Schedule Meet Drawer */}
      <MeetFormDrawer
        isOpen={isScheduleMeetOpen}
        onClose={onScheduleMeetClose}
        onSubmit={handleCreateMeet}
        currentMeet={null}
        isEditing={false}
        title="Schedule New Meet"
      />
    </Box>
  );
}