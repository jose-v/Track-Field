import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Container, Flex, Heading, Text, VStack, Grid, GridItem, Icon, Badge, Card, CardHeader, CardBody, Image, Tag,
  Button, SimpleGrid, Progress, HStack, Stack, Spinner, Divider, Stat, StatLabel, StatNumber, StatHelpText, useToast,
  useColorModeValue, Skeleton, SkeletonText
} from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { dateUtils } from '../utils/date'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useSleepStats, getQualityText } from '../hooks/useSleepRecords'
import { useNutritionStats } from '../hooks/useNutritionRecords'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { MdPerson, MdOutlineWbSunny, MdKeyboardArrowRight } from 'react-icons/md'
import { FaCalendarAlt, FaRunning, FaBolt, FaMedal, FaListAlt, FaUsers, FaMapMarkerAlt, FaChartLine, FaCloudRain, FaSnowflake, FaSun, FaCloudSun, FaCloudMeatball } from 'react-icons/fa'
import { useWorkoutStore } from '../lib/workoutStore'
import { 
  WeatherCard, 
  SleepStatsCard, 
  NutritionStatsCard, 
  WorkoutCard, 
  TeamCard,
  ProgressBar,
  StatsCard,
  TrackMeetsCard
} from '../components'
import { supabase } from '../lib/supabase'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'

// Function to format date in "Month Day, Year" format
function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
  } catch (e) {
    console.error('Error formatting date:', e)
    return dateStr
  }
}

// Helper to format date string to YYYY-MM-DD for comparison
function formatDateForComparison(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    return dateUtils.localDateString(dateUtils.parseLocalDate(dateStr));
  } catch (e) {
    console.error('Error formatting date for comparison:', e);
    return '';
  }
}

// Function to get meal type text for nutrition records
function getMealTypeText(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return 'Breakfast';
    case 'lunch': return 'Lunch';
    case 'dinner': return 'Dinner';
    case 'snack': return 'Snack';
    default: return 'Meal';
  }
}

// Create a skeleton card component for loading states
const SkeletonCard = ({ height = "330px" }: { height?: string }) => (
  <Card borderRadius="lg" overflow="hidden" boxShadow="md" h={height}>
    <Skeleton height="80px" />
    <CardBody pt={6}>
      <SkeletonText mt="2" noOfLines={1} spacing="2" skeletonHeight="3" width="40%" mx="auto" />
      <VStack spacing={4} mt={4}>
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="40px" width="120px" mx="auto" />
      </VStack>
    </CardBody>
  </Card>
);

export function Dashboard() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { workouts, isLoading: workoutsLoading } = useWorkouts()
  const { stats: sleepStats, isLoading: sleepLoading } = useSleepStats()
  const { stats: nutritionStats, isLoading: nutritionLoading } = useNutritionStats()
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [trackMeets, setTrackMeets] = useState<any[]>([])
  const [coachMeets, setCoachMeets] = useState<any[]>([])
  const [isLoadingMeets, setIsLoadingMeets] = useState(false)
  // Default weather data as fallback
  const [weather] = useState({
    temp: '72',
    condition: 'Loading...',
    description: 'Fetching current conditions'
  })
  const navigate = useNavigate()

  // Official USPS state codes mapping
  const STATE_ABBR: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC', 'washington dc': 'DC'
  };

  // Fetch track meets created by this athlete and their coach
  useEffect(() => {
    if (!user) return;
    
    const fetchTrackMeets = async () => {
      try {
        setIsLoadingMeets(true);
        
        // Fetch meets created by this athlete
        const { data: athleteMeets, error: athleteError } = await supabase
          .from('track_meets')
          .select('*')
          .eq('athlete_id', user?.id)
          .order('meet_date', { ascending: true });
        
        if (athleteError) throw athleteError;
        
        // Get all meet events assigned to this athlete
        const { data: assignedMeetEvents, error: assignedEventsError } = await supabase
          .from('athlete_meet_events')
          .select('meet_event_id')
          .eq('athlete_id', user?.id);
          
        if (assignedEventsError) throw assignedEventsError;
        
        // Get the event details for these assignments
        let assignedEventIds: string[] = [];
        let relatedMeetIds: string[] = [];
        
        if (assignedMeetEvents && assignedMeetEvents.length > 0) {
          assignedEventIds = assignedMeetEvents.map(a => a.meet_event_id);
          
          // Get the meet events to find their meet IDs
          const { data: meetEvents, error: meetEventsError } = await supabase
            .from('meet_events')
            .select('id, meet_id, event_name')
            .in('id', assignedEventIds);
            
          if (meetEventsError) throw meetEventsError;
          
          if (meetEvents && meetEvents.length > 0) {
            // Get the unique meet IDs from assigned events
            relatedMeetIds = [...new Set(meetEvents.map(e => e.meet_id))] as string[];
            
            // Create map of events by meet ID for later use
            const meetEventMap: Record<string, any[]> = {};
            meetEvents.forEach(event => {
              if (!meetEventMap[event.meet_id]) {
                meetEventMap[event.meet_id] = [];
              }
              meetEventMap[event.meet_id].push(event);
            });
            
            // Fetch all assigned meets
            const { data: assignedMeets, error: meetsError } = await supabase
              .from('track_meets')
              .select('*')
              .in('id', relatedMeetIds)
              .order('meet_date', { ascending: true });
              
            if (meetsError) throw meetsError;
            
            if (assignedMeets && assignedMeets.length > 0) {
              // Process meets to include assigned events
              const processedAssignedMeets = assignedMeets.map(meet => {
                const meetEvents = meetEventMap[meet.id] || [];
                const assignedEvents = meetEvents.filter(event => 
                  assignedEventIds.includes(event.id)
                );
                
                return {
                  ...meet,
                  assigned_events: assignedEvents,
                  total_events: meetEvents.length,
                  assigned_events_count: assignedEvents.length
                };
              });
              
              // Sort meets by date
              processedAssignedMeets.sort((a, b) => {
                if (!a.meet_date) return 1;
                if (!b.meet_date) return -1;
                return new Date(a.meet_date).getTime() - new Date(b.meet_date).getTime();
              });
              
              // Separate athlete-created meets and coach meets
              const coachMeets = processedAssignedMeets.filter(meet => 
                meet.coach_id && !meet.athlete_id
              );
              
              // For athlete meets, merge any assigned meets that were created by the athlete
              const athleteMeetsWithAssignments = (athleteMeets || []).map(meet => {
                const assignedMeet = processedAssignedMeets.find(m => m.id === meet.id);
                if (assignedMeet) {
                  return assignedMeet; // Use the version with assignment data
                }
                return {
                  ...meet,
                  assigned_events: [],
                  total_events: 0,
                  assigned_events_count: 0
                };
              });
              
              setTrackMeets(athleteMeetsWithAssignments);
              setCoachMeets(coachMeets);
            } else {
              // No assigned meets found, just show athlete's own meets
              setTrackMeets(athleteMeets || []);
              setCoachMeets([]);
            }
          } else {
            // No meet events found for assignments
            setTrackMeets(athleteMeets || []);
            setCoachMeets([]);
          }
        } else {
          // No assignments found, just show athlete's own meets
          setTrackMeets(athleteMeets || []);
          setCoachMeets([]);
        }
      } catch (error) {
        console.error('Error fetching track meets:', error);
        setTrackMeets([]);
        setCoachMeets([]);
      } finally {
        setIsLoadingMeets(false);
      }
    };
    
    fetchTrackMeets();
  }, [user]);

  // Get all events as a formatted string
  const getFormattedEvents = () => {
    if (!profile?.roleData?.events || !Array.isArray(profile.roleData.events)) {
      return 'Not set';
    }
    
    return profile.roleData.events.join(', ') || 'None';
  };

  // Fetch team info if we have a team
  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!profile || !profile.team) return;
      
      setIsLoadingTeam(true);
      try {
        // This is a placeholder - implement actual team data fetching
        // For example: const teamData = await api.teams.getByName(profile.team);
        
        // For now, simulate some team data
        const teamData = {
          name: profile.team,
          accomplishments: [
            `${profile.team} placed 2nd in regional championship`,
            `3 ${profile.team} athletes qualified for state finals`,
            `New team record in 4x100m relay`
          ]
        };
        
        setTeamInfo(teamData);
      } catch (error) {
        console.error('Error fetching team info:', error);
      } finally {
        setIsLoadingTeam(false);
      }
    };
    
    fetchTeamInfo();
  }, [profile]);

  // Find ONLY today's workout - no next workout
  const todayStr = dateUtils.localDateString(new Date());
  
  // Get all workouts for today and future dates
  const currentAndFutureWorkouts = workouts?.filter(workout => {
    if (!workout.date) return false;
    
    const workoutDate = dateUtils.parseLocalDate(workout.date);
    const today = dateUtils.parseLocalDate(todayStr);
    
    // Return workouts for today and future dates
    return workoutDate >= today;
  }) || [];
  
  // Sort workouts by date (earliest first)
  currentAndFutureWorkouts.sort((a, b) => {
    const dateA = a.date ? dateUtils.parseLocalDate(a.date).getTime() : 0;
    const dateB = b.date ? dateUtils.parseLocalDate(b.date).getTime() : 0;
    return dateA - dateB;
  });
  
  // Separate today's workouts specifically
  const todayWorkouts = currentAndFutureWorkouts.filter(workout => {
    return formatDateForComparison(workout.date) === todayStr;
  });
  
  // Get the upcoming workouts (not today, but future)
  const upcomingWorkouts = currentAndFutureWorkouts.filter(workout => {
    return formatDateForComparison(workout.date) !== todayStr;
  }).slice(0, 3); // Limit to 3 upcoming workouts
  
  // Use our centralized workout store for progress tracking
  const workoutStore = useWorkoutStore();
  
  // Function to get completion count for a workout
  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress?.completedExercises?.length || 0;
  };
  
  // Function to get completion percentage for a workout
  const getCompletionPercentage = (workout: any): number => {
    if (!workout || !workout.id) return 0;
    
    const progress = workoutStore.getProgress(workout.id);
    if (!progress) return 0;
    
    // Calculate based on number of exercises
    const totalExercises = progress.totalExercises || 
      (workout.exercises && Array.isArray(workout.exercises) ? workout.exercises.length : 0);
    
    if (totalExercises === 0) return 0;
    
    return (progress.completedExercises.length / totalExercises) * 100;
  };

  // Mock stats for graph
  const statsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Workouts',
        data: [1, 2, 1, 0, 2, 1, 0],
        backgroundColor: 'rgba(66, 153, 225, 0.6)',
      },
    ],
  }

  // Function to handle starting a workout
  const handleStartWorkout = (workout: any) => {
    if (profile?.role === 'coach') {
      // For coaches, navigate to workout details
      navigate(`/coach/workouts/${workout.id}`);
    } else {
      // For athletes, navigate to workout execution page
      navigate(`/athlete/workouts/${workout.id}`);
    }
  };

  // Function to get workout progress data formatted for WorkoutCard
  const getWorkoutProgressData = (workout: any) => {
    if (!workout || !workout.id) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = getCompletionCount(workout.id);
    const total = workout.exercises?.length || 0;
    
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  };

  // Helper to get state abbreviation
  function getStateAbbr(state?: string) {
    if (!state) return '';
    const key = state.trim().toLowerCase();
    return STATE_ABBR[key] || state.slice(0,2).toUpperCase();
  }

  return (
    <Box pt={5} pb={10} bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="container.xl">
        {/* Header with personal greeting */}
        <Box mb={8} display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              <Heading as="h1" size="xl" mb={1}>
                Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Athlete'}
              </Heading>
            </Skeleton>
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              <Text color="gray.600">
                {profile?.role === 'athlete' ? 'Athlete Dashboard' : 'Dashboard'}
              </Text>
            </Skeleton>
          </Box>
          {/* Weather Info Inline */}
          <Box minW="300px" maxW="340px" ml={6}>
            <Skeleton isLoaded={!profileLoading} fadeDuration={1}>
              {(() => {
                // Inline weather state and icon logic
                const [weather, setWeather] = React.useState({
                  temp: '72',
                  condition: 'Loading...',
                  description: 'Fetching current conditions'
                });
                const [isLoading, setIsLoading] = React.useState(profileLoading);
                const [hasError, setHasError] = React.useState(false);
                // Helper function for icon
                function getWeatherIcon(condition: string) {
                  const c = (condition || '').toLowerCase();
                  if (c.includes('rain') || c.includes('drizzle')) return FaCloudRain;
                  if (c.includes('snow')) return FaSnowflake;
                  if (c.includes('clear')) return FaSun;
                  if (c.includes('cloud')) return FaCloudSun;
                  if (c.includes('thunder') || c.includes('storm')) return FaBolt;
                  return FaCloudMeatball;
                }
                React.useEffect(() => {
                  if (!profile?.city) return;
                  const fetchWeather = async () => {
                    setIsLoading(true);
                    setHasError(false);
                    try {
                      // Geocode
                      let lat = 36.0726, lon = -79.7920;
                      if (profile.city.toLowerCase() !== 'greensboro' || (profile.state && profile.state.toLowerCase() !== 'north carolina')) {
                        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(profile.city)}${profile.state ? `,${profile.state}` : ''},us&limit=1&appid=d52188171339c7c268d503e4e1122c12`;
                        const geoRes = await fetch(geoUrl);
                        const geoData = await geoRes.json();
                        if (geoData && geoData.length > 0) {
                          lat = geoData[0].lat;
                          lon = geoData[0].lon;
                        }
                      }
                      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=d52188171339c7c268d503e4e1122c12&units=imperial`;
                      const res = await fetch(url);
                      const data = await res.json();
                      setWeather({
                        temp: Math.round(data.current.temp).toString(),
                        condition: data.current.weather[0].main,
                        description: data.current.weather[0].description
                      });
                    } catch (e) {
                      setHasError(true);
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  fetchWeather();
                }, [profile?.city, profile?.state]);
                const WeatherIcon = React.useMemo(() => getWeatherIcon(weather.condition), [weather.condition]);
                // Date formatting
                const today = new Date();
                const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                  <Box
                    borderRadius="2xl"
                    boxShadow="lg"
                    px={6}
                    py={4}
                    bgGradient="linear(to-r, orange.300, yellow.200)"
                    display="flex"
                    alignItems="center"
                    minH="110px"
                  >
                    <Icon as={WeatherIcon} w={14} h={14} color="white" mr={6} />
                    <Box flex="1">
                      <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={-1}>{weather.condition}</Text>
                      <Text fontSize="3xl" fontWeight="extrabold" color="gray.900" lineHeight="1">{weather.temp}°</Text>
                      <Flex align="center" mt={1} color="gray.600" fontSize="md">
                        <FaMapMarkerAlt style={{ marginRight: 4 }} />
                        <span>{profile?.city}{profile?.state ? `, ${getStateAbbr(profile.state)}` : ''}</span>
                      </Flex>
                      <Text fontSize="sm" color="gray.700" mt={1}>{dateStr}</Text>
                      {hasError && <Text fontSize="xs" color="red.400">Weather unavailable</Text>}
                    </Box>
                  </Box>
                );
              })()}
            </Skeleton>
          </Box>
        </Box>

        {/* Today's Workouts Card */}
        {(profileLoading || workoutsLoading) ? (
          <Skeleton height="200px" mb={10} borderRadius="lg" />
        ) : (
          <Card 
            borderRadius="lg" 
            overflow="hidden" 
            boxShadow="md"
            mb={10}
          >
            <Box 
              h="80px" 
              bg="linear-gradient(135deg, #4FD1C5 0%, #68D391 100%)" 
              position="relative"
              display="flex"
              alignItems="center"
              px={6}
            >
              <Flex 
                bg="white" 
                borderRadius="full" 
                w="50px" 
                h="50px" 
                justifyContent="center" 
                alignItems="center"
                boxShadow="none"
                mr={4}
              >
                <Icon as={FaRunning} w={6} h={6} color="green.400" />
              </Flex>
              <Tag
                size="lg"
                variant="subtle"
                bg="whiteAlpha.300"
                color="white"
                fontWeight="bold"
                px={4}
                py={2}
                borderRadius="md"
              >
                TODAY'S WORKOUTS
              </Tag>
            </Box>
            
            <CardBody>
              {todayWorkouts.length > 0 ? (
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={6}>
                    {todayWorkouts.map((workout, idx) => (
                      <WorkoutCard
                        key={workout.id || idx}
                        workout={workout}
                        isCoach={profile?.role === 'coach'}
                        progress={getWorkoutProgressData(workout)}
                        onStart={() => handleStartWorkout(workout)}
                      />
                    ))}
                  </SimpleGrid>
                  
                  {upcomingWorkouts.length > 0 && (
                    <>
                      <Heading size="md" mb={4}>Upcoming Workouts</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {upcomingWorkouts.map((workout, idx) => (
                          <WorkoutCard
                            key={workout.id || idx}
                            workout={workout}
                            isCoach={profile?.role === 'coach'}
                            progress={getWorkoutProgressData(workout)}
                            onStart={() => handleStartWorkout(workout)}
                          />
                        ))}
                      </SimpleGrid>
                    </>
                  )}
                </Box>
              ) : (
                <VStack spacing={4} py={6} align="center">
                  <Text>No workouts scheduled for today.</Text>
                  {upcomingWorkouts.length > 0 ? (
                    <>
                      <Heading size="md" mt={2} mb={4}>Upcoming Workouts</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} width="100%">
                        {upcomingWorkouts.map((workout, idx) => (
                          <WorkoutCard
                            key={workout.id || idx}
                            workout={workout}
                            isCoach={profile?.role === 'coach'}
                            progress={getWorkoutProgressData(workout)}
                            onStart={() => handleStartWorkout(workout)}
                          />
                        ))}
                      </SimpleGrid>
                    </>
                  ) : (
                    <Button 
                      as={RouterLink}
                      to={profile?.role === 'coach' ? "/coach/workouts" : "/athlete/workouts"}
                      colorScheme="blue"
                    >
                      {profile?.role === 'coach' ? "Create Workouts" : "View Available Workouts"}
                    </Button>
                  )}
                </VStack>
              )}
            </CardBody>
          </Card>
        )}

        {/* Stats & Info Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} my={10}>
          {/* Track Meets Card */}
          {profileLoading || isLoadingMeets ? (
            <SkeletonCard height="320px" />
          ) : (
            <TrackMeetsCard
              trackMeets={trackMeets}
              coachMeets={coachMeets}
              isLoading={isLoadingMeets}
              viewAllLink="/athlete/events"
            />
          )}

          {/* Sleep Card */}
          {(profileLoading || sleepLoading) ? (
            <SkeletonCard />
          ) : (
            <SleepStatsCard
              sleepStats={sleepStats}
              isLoading={sleepLoading}
            />
          )}

          {/* Nutrition Card */}
          {(profileLoading || nutritionLoading) ? (
            <SkeletonCard />
          ) : (
            <NutritionStatsCard
              nutritionStats={nutritionStats}
              isLoading={nutritionLoading}
            />
          )}
        </SimpleGrid>

        {/* Weekly Stats Chart */}
        <Box my={10}>
          <StatsCard 
            title="WEEKLY STATS"
            chartData={statsData}
          />
        </Box>

        {/* Gamification Test Page Link - Development Only */}
        {process.env.NODE_ENV !== 'production' && (
          <Card 
            mb={8} 
            borderRadius="lg" 
            overflow="hidden" 
            boxShadow="md"
            borderWidth="1px"
            borderColor="blue.100"
            bgGradient="linear(to-r, blue.50, purple.50)"
          >
            <CardHeader bg="blue.500" py={3}>
              <Heading size="md" color="white">Gamification Preview</Heading>
            </CardHeader>
            <CardBody>
              <HStack spacing={4} align="center" justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" fontSize="lg">Track your progress and achievements</Text>
                  <Text color="gray.600">View your points, badges, streaks, and leaderboard position</Text>
                </VStack>
                <Button 
                  as={RouterLink} 
                  to="/gamification" 
                  colorScheme="blue" 
                  rightIcon={<Icon as={MdKeyboardArrowRight} />}
                >
                  View Gamification
                </Button>
              </HStack>
            </CardBody>
          </Card>
        )}

      </Container>
    </Box>
  )
} 