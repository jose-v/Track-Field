import { Box, Heading, Flex, Text, Grid, GridItem, useColorModeValue, Button, Tooltip, Select, HStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { FaCalendarAlt, FaRunning, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { api } from '../../services/api';
import { MobileHeader } from '../';

interface TrainingCalendarProps {
  isCoach?: boolean;
  athleteId?: string;
}

interface WorkoutData {
  id: string;
  name: string;
  date: string;
  type?: string;
  duration?: string;
}

interface EventData {
  id: string;
  meet_name: string;
  meet_date: string;
  location?: string;
  meet_id: string;
  event_name: string;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  workouts: WorkoutData[];
  events: EventData[];
}

interface CalendarStats {
  hours: number;
  miles: number;
  personalRecords: number;
  activities: number;
}

export const TrainingCalendarInner = ({ isCoach = false, athleteId }: TrainingCalendarProps) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [stats, setStats] = useState<CalendarStats>({
    hours: 0,
    miles: 0,
    personalRecords: 0,
    activities: 0
  });
  const [monthlyWorkouts, setMonthlyWorkouts] = useState<Record<number, WorkoutData[]>>({});
  const [monthlyEvents, setMonthlyEvents] = useState<Record<number, EventData[]>>({});
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Colors (move all useColorModeValue calls here)
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('none', 'md');
  const monthBgColor = useColorModeValue('gray.50', 'gray.700');
  const headerBgColor = useColorModeValue('gray.100', 'gray.600');
  const workoutBgColor = useColorModeValue('blue.100', 'blue.700');
  const eventBgColor = useColorModeValue('purple.100', 'purple.700');
  const barTextColor = useColorModeValue('gray.800', 'gray.100');
  const statLabelColor = useColorModeValue('gray.500', 'gray.400');
  const statValueColor = useColorModeValue('gray.600', 'gray.300');
  const noActivitiesColor = useColorModeValue('gray.700', 'gray.200');
  const activitiesCountColor = useColorModeValue('gray.600', 'gray.300');
  
  // Year view text colors
  const yearViewTextColor = useColorModeValue('white', 'white');
  const yearViewHeadingColor = useColorModeValue('white', 'white');
  const yearViewActivityColor = useColorModeValue('white', 'white');
  
  // Month data
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];
  
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  
  // Get selected month from URL hash
  const getSelectedMonthFromHash = (): number | null => {
    const hash = location.hash.replace('#', '');
    const monthIndex = months.findIndex(month => month.toLowerCase() === hash.toLowerCase());
    return monthIndex !== -1 ? monthIndex : null;
  };
  
  const selectedMonth = getSelectedMonthFromHash();
  
  // Handle month selection for dropdown
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = parseInt(e.target.value, 10);
    if (selectedMonth !== null) {
      // Update the month in the month view
      navigate(`${location.pathname}#${months[monthIndex].toLowerCase()}`);
    } else {
      // Just update the current month in year view
      setCurrentMonth(monthIndex);
    }
  };
  
  // Fetch workouts for the current user/athlete for the entire year
  const fetchWorkoutsForYear = async () => {
    try {
      // Determine whose workouts to fetch
      const targetUserId = athleteId || user?.id;
      if (!targetUserId) return [];
      
      let workouts: WorkoutData[] = [];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching workouts for user:', targetUserId, 'for year:', currentYear);
      }
      
      // Format year for date filtering
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      
      try {
        // Use the same API method as the athlete workouts page
        const assignedWorkouts = await api.workouts.getAssignedToAthlete(targetUserId);
        
        if (assignedWorkouts && assignedWorkouts.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Found assigned and created workouts:', assignedWorkouts.length);
          }
          
          // Transform and filter workouts for the current year
          workouts = assignedWorkouts
            .filter(workout => {
              // Filter workouts for the current year
              if (!workout.date) return false;
              const workoutYear = new Date(workout.date).getFullYear();
              return workoutYear === currentYear;
            })
            .map(workout => ({
              id: workout.id,
              name: workout.name,
              date: workout.date,
              type: workout.type || 'Workout',
              duration: workout.duration || '30'
            }));
            
          if (process.env.NODE_ENV === 'development') {
            console.log(`Filtered ${workouts.length} workouts for year ${currentYear}`);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('No assigned workouts found for user:', targetUserId);
          }
          
          // If no assigned workouts, try fetching workouts created by the user
          if (!isCoach) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Trying to fetch workouts created by user');
            }
            const createdWorkouts = await api.workouts.getByCreator(targetUserId);
            
            if (createdWorkouts && createdWorkouts.length > 0) {
              workouts = createdWorkouts
                .filter(workout => {
                  if (!workout.date) return false;
                  const workoutYear = new Date(workout.date).getFullYear();
                  return workoutYear === currentYear;
                })
                .map(workout => ({
                  id: workout.id,
                  name: workout.name,
                  date: workout.date,
                  type: workout.type || 'Workout',
                  duration: workout.duration || '30'
                }));
                
                              if (process.env.NODE_ENV === 'development') {
                  console.log(`Found ${workouts.length} created workouts for year ${currentYear}`);
                }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching workouts from API:', err);
        // Don't fall back to mock data - just return empty array
        workouts = [];
      }
      
      // Organize workouts by month
      const byMonth: Record<number, WorkoutData[]> = {};
      
      workouts.forEach(workout => {
        if (workout && workout.date) {
          const workoutDate = new Date(workout.date);
          const month = workoutDate.getMonth();
          
          if (!byMonth[month]) {
            byMonth[month] = [];
          }
          
          byMonth[month].push(workout);
        }
      });
      
      setMonthlyWorkouts(byMonth);
      
      // Update stats based on workouts
      updateStats(workouts);
      
      return workouts;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      // Return empty array instead of mock data
      setMonthlyWorkouts({});
      return [];
    }
  };

  // Add updateStats and fetchPersonalRecordsCount
  const updateStats = (workouts: WorkoutData[]) => {
    // Calculate total activities
    const activities = workouts.length;
    // Calculate total hours (assuming duration is stored in minutes)
    let totalMinutes = 0;
    workouts.forEach(workout => {
      if (workout.duration) {
        const durationMatch = workout.duration.match(/(\d+)/);
        if (durationMatch) {
          totalMinutes += parseInt(durationMatch[0], 10);
        }
      }
    });
    const hours = Math.round(totalMinutes / 60);
    // Fetch personal records count
    fetchPersonalRecordsCount().then(recordsCount => {
      // For miles, we'll just use a placeholder calculation for now
      // In a real app, this would come from actual workout distance data
      const miles = Math.round(totalMinutes / 10);
      setStats({
        hours,
        miles,
        personalRecords: recordsCount,
        activities
      });
    });
  };

  const fetchPersonalRecordsCount = async (): Promise<number> => {
    try {
      const targetUserId = athleteId || user?.id;
      if (!targetUserId) return 0;
      try {
        // Get count of personal records for this athlete
        const { count, error } = await supabase
          .from('personal_records')
          .select('id', { count: 'exact', head: true })
          .eq('athlete_id', targetUserId);
        if (error) throw error;
        return count || 0;
      } catch (err) {
        // Return a mock count if database query fails
        return 8;
      }
    } catch (error) {
      return 0;
    }
  };

  // Fetch events for the athlete or coach
  const fetchEventsForYear = async () => {
    try {
      const targetUserId = athleteId || user?.id;
      if (!targetUserId) return [];
      let events: EventData[] = [];
      try {
        // Format year for date filtering
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;
        if (isCoach) {
          // For coaches, fetch events for all of their athletes
          const { data: coachAthletes, error: coachAthletesError } = await supabase
            .from('coach_athletes')
            .select('athlete_id')
            .eq('coach_id', targetUserId);
          if (coachAthletesError) throw coachAthletesError;
          if (coachAthletes && coachAthletes.length > 0) {
            const athleteIds = coachAthletes.map(row => row.athlete_id);
            // Get profile information for each athlete
            const { data: athleteProfiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', athleteIds);
            if (profilesError) throw profilesError;
            const athleteNames = new Map();
            if (athleteProfiles) {
              athleteProfiles.forEach(profile => {
                athleteNames.set(profile.id, `${profile.first_name} ${profile.last_name}`);
              });
            }
            // Get a list of all track meets in the year range
            const { data: yearMeets, error: yearMeetsError } = await supabase
              .from('track_meets')
              .select('id, name, meet_date, city, state')
              .gte('meet_date', yearStart)
              .lte('meet_date', yearEnd);
            if (yearMeetsError) throw yearMeetsError;
            const trackMeetsMap = new Map();
            if (yearMeets) {
              yearMeets.forEach(meet => {
                trackMeetsMap.set(meet.id, meet);
              });
            }
            // Fetch events for all athletes
            const { data: allEventAssignments, error: allEventsError } = await supabase
              .from('athlete_meet_events')
              .select(`
                id,
                athlete_id,
                meet_event_id,
                meet_events(id, meet_id, event_name)
              `)
              .in('athlete_id', athleteIds);
            if (allEventsError) throw allEventsError;
            if (allEventAssignments && allEventAssignments.length > 0) {
              const meetEventIds = allEventAssignments.map(item => item.meet_event_id).filter(Boolean);
              const { data: meetEvents, error: meetEventsError } = await supabase
                .from('meet_events')
                .select('id, meet_id, event_name')
                .in('id', meetEventIds);
              if (meetEventsError) throw meetEventsError;
              const meetEventsMap = new Map();
              if (meetEvents) {
                meetEvents.forEach(event => {
                  meetEventsMap.set(event.id, event);
                });
              }
              events = allEventAssignments
                .map(item => {
                  const meetEvent = meetEventsMap.get(item.meet_event_id);
                  if (!meetEvent) return null;
                  const trackMeet = trackMeetsMap.get(meetEvent.meet_id);
                  if (!trackMeet) return null;
                  const athleteName = athleteNames.get(item.athlete_id) || 'Unknown Athlete';
                  return {
                    id: `${item.id}`,
                    meet_id: trackMeet.id,
                    meet_name: trackMeet.name,
                    meet_date: trackMeet.meet_date,
                    location: `${trackMeet.city || ''}, ${trackMeet.state || ''}`.trim() || 'Unknown Location',
                    event_name: `${meetEvent.event_name || 'Unknown Event'} (${athleteName})`
                  };
                })
                .filter(Boolean)
                .filter(event => {
                  if (!event || !event.meet_date) return false;
                  const eventYear = new Date(event.meet_date).getFullYear();
                  return eventYear === currentYear;
                });
            }
          }
        } else {
          // For individual athletes, fetch only their events
          const { data: eventAssignments, error: eventError } = await supabase
            .from('athlete_meet_events')
            .select(`
              meet_event_id,
              meet_events (
                id,
                meet_id,
                event_name,
                track_meets (
                  id,
                  name,
                  meet_date,
                  city,
                  state
                )
              )
            `)
            .eq('athlete_id', targetUserId);
          if (eventError) throw eventError;
          if (eventAssignments && eventAssignments.length > 0) {
            events = eventAssignments.map(item => {
              const meetEvent = item.meet_events as any;
              const trackMeet = meetEvent?.track_meets as any;
              return {
                id: meetEvent?.id || '',
                meet_id: meetEvent?.meet_id || '',
                meet_name: trackMeet?.name || 'Unknown Meet',
                meet_date: trackMeet?.meet_date || '',
                location: `${trackMeet?.city || ''}, ${trackMeet?.state || ''}`.trim() || 'Unknown Location',
                event_name: meetEvent?.event_name || 'Unknown Event'
              };
            }).filter(event => new Date(event.meet_date).getFullYear() === currentYear);
          }
        }
        // Deduplicate events by meet_name and meet_date
        const uniqueEvents = events.filter((event, index, arr) =>
          arr.findIndex(e =>
            e.meet_date === event.meet_date &&
            e.meet_name === event.meet_name
          ) === index
        );
        // Organize by month
        const byMonth: Record<number, EventData[]> = {};
        uniqueEvents.forEach(e => {
          const m = new Date(e.meet_date).getMonth();
          if (!byMonth[m]) byMonth[m] = [];
          byMonth[m].push(e);
        });
        setMonthlyEvents(byMonth);
        return uniqueEvents;
      } catch (error) {
        setMonthlyEvents({});
        return [];
      }
    } catch (error) {
      setMonthlyEvents({});
      return [];
    }
  };

  // Navigation and refresh functions
  const goToPrevYear = () => {
    setMonthlyWorkouts({});
    setMonthlyEvents({});
    setLoading(true);
    setCurrentYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    setMonthlyWorkouts({});
    setMonthlyEvents({});
    setLoading(true);
    setCurrentYear(prev => prev + 1);
  };

  const goToPrevMonth = () => {
    if (selectedMonth !== null) {
      const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const newYear = selectedMonth === 0 ? currentYear - 1 : currentYear;
      if (newYear !== currentYear) setCurrentYear(newYear);
      navigate(`${location.pathname}#${months[newMonth].toLowerCase()}`);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth !== null) {
      const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const newYear = selectedMonth === 11 ? currentYear + 1 : currentYear;
      if (newYear !== currentYear) setCurrentYear(newYear);
      navigate(`${location.pathname}#${months[newMonth].toLowerCase()}`);
    }
  };

  const handleMonthClick = (monthIndex: number) => {
    navigate(`${location.pathname}#${months[monthIndex].toLowerCase()}`);
  };

  const backToYearlyView = () => {
    navigate(location.pathname);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setMonthlyWorkouts({});
    setMonthlyEvents({});
    try {
      await Promise.all([
        fetchWorkoutsForYear(),
        fetchEventsForYear()
      ]);
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for calendar rendering
  const getDaysInMonth = (year: number, month: number): CalendarDay[] => {
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7 for easier calculation
    // Calculate days from previous month to display
    const prevMonthDaysToShow = firstDayOfWeek - 1;
    // Get days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from({ length: prevMonthDaysToShow }, (_, i) => ({
      day: prevMonthLastDay - (prevMonthDaysToShow - 1) + i,
      isCurrentMonth: false,
      workouts: [],
      events: []
    }));
    // Current month days with workouts and events
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      // Get workouts for this day
      const dayWorkouts = monthlyWorkouts[month]?.filter(workout => {
        return workout.date === dateStr;
      }) || [];
      // Get events for this day
      const dayEvents = monthlyEvents[month]?.filter(event => {
        return event.meet_date === dateStr;
      }) || [];
      return {
        day,
        isCurrentMonth: true,
        workouts: dayWorkouts,
        events: dayEvents
      };
    });
    // Next month days to fill the calendar grid
    const totalDaysShown = Math.ceil((prevMonthDaysToShow + daysInMonth) / 7) * 7;
    const nextMonthDaysToShow = totalDaysShown - (prevMonthDaysToShow + daysInMonth);
    const nextMonthDays = Array.from({ length: nextMonthDaysToShow }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: false,
      workouts: [],
      events: []
    }));
    // Combine all days
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const getMonthActivityCount = (month: number): number => {
    const workouts = monthlyWorkouts[month] || [];
    const events = monthlyEvents[month] || [];
    return workouts.length + events.length;
  };

  const isToday = (year: number, month: number, day: number): boolean => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const isCurrentMonth = (year: number, month: number): boolean => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month;
  };

  // Data loading effect
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setMonthlyWorkouts({});
      setMonthlyEvents({});
      try {
        await Promise.all([
          fetchWorkoutsForYear(),
          fetchEventsForYear()
        ]);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [currentYear, user, athleteId, isCoach]);

  // If month is selected, show month detail view
  if (selectedMonth !== null) {
    return (
      <Box className="page container">
        <Box 
          className="calendar-content" 
          bg={cardBg} 
          borderRadius="md" 
          boxShadow={cardShadow} 
          p={4}
          borderWidth="1px"
          borderColor={borderColor}
          mt={{ base: "20px", lg: 0 }}
        >
          {/* Month Detail Header */}
          <Flex justify="space-between" align="center" mb={4}>
            <Flex align="center" gap={4}>
              <Button colorScheme="blue" variant="ghost" onClick={backToYearlyView} size="sm">
                &lt; Back to Year
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                colorScheme="blue"
                onClick={handleRefresh}
                isLoading={loading}
                loadingText="Refreshing..."
              >
                Refresh
              </Button>
              <Flex align="center">
                <Button size="sm" onClick={goToPrevMonth} mr={1}>
                  &lt;
                </Button>
                <Select 
                  value={selectedMonth} 
                  onChange={handleMonthChange}
                  size="sm"
                  width="auto"
                  mx={2}
                >
                  {months.map((month, idx) => (
                    <option key={month} value={idx}>
                      {month}
                    </option>
                  ))}
                </Select>
                <Button size="sm" onClick={goToNextMonth} ml={1}>
                  &gt;
                </Button>
                <Text fontWeight="bold" ml={2}>
                  {currentYear}
                </Text>
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {new Date(currentYear, selectedMonth + 1, 0).getDate()} DAYS
              </Text>
            </Flex>
            {/* Stats Summary */}
            <Flex className="stats" gap={4} align="center">
              <Box textAlign="center">
                <Text fontWeight="bold" fontSize="xl">{stats.hours}</Text>
                <Text fontSize="sm" color="gray.500">Hours</Text>
              </Box>
              <Box textAlign="center">
                <Text fontWeight="bold" fontSize="xl">{stats.miles}</Text>
                <Text fontSize="sm" color="gray.500">Miles</Text>
              </Box>
              <Box textAlign="center">
                <Text fontWeight="bold" fontSize="xl">{stats.personalRecords}</Text>
                <Text fontSize="sm" color="gray.500">Personal Records</Text>
              </Box>
              <Box textAlign="center">
                <Text fontWeight="bold" fontSize="xl">{stats.activities}</Text>
                <Text fontSize="sm" color="gray.500">Activities</Text>
              </Box>
            </Flex>
          </Flex>
          {/* Monthly Calendar View */}
          <Box>
            {/* Days of Week Header */}
            <Grid templateColumns="repeat(7, 1fr)" gap={0}>
              {daysOfWeek.map(day => (
                <GridItem 
                  key={day} 
                  p={2} 
                  bg={headerBgColor} 
                  textAlign="center"
                  fontWeight="bold"
                  fontSize="sm"
                  color="white"
                >
                  {day}
                </GridItem>
              ))}
            </Grid>
            {/* Calendar Days Grid */}
            <Grid templateColumns="repeat(7, 1fr)" gap={0}>
              {getDaysInMonth(currentYear, selectedMonth).map((dateObj, i) => (
                <GridItem 
                  key={i} 
                  p={2} 
                  height="0"
                  paddingBottom="100%" /* This creates a square aspect ratio */
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg={dateObj.isCurrentMonth ? cardBg : 'gray.50'}
                  opacity={dateObj.isCurrentMonth ? 1 : 0.5}
                  position="relative"
                  overflow="hidden"
                >
                  {/* Create an inner container for content that's positioned absolutely */}
                  <Box position="absolute" top={0} left={0} right={0} bottom={0} p={2}>
                    <Box position="relative">
                      <Text 
                        position="absolute" 
                        top={0} 
                        right={0} 
                        fontSize="sm" 
                        fontWeight={dateObj.isCurrentMonth ? "bold" : "normal"}
                      >
                        {dateObj.day}
                      </Text>
                      {/* Orange dot for current day */}
                      {dateObj.isCurrentMonth && isToday(currentYear, selectedMonth, dateObj.day) && (
                        <Box
                          position="absolute"
                          top="21px"
                          right="-1px"
                          width="6px"
                          height="6px"
                          borderRadius="50%"
                          bg="orange.500"
                          transform="translateX(-50%)"
                        />
                      )}
                    </Box>
                    {/* Workouts for this day */}
                    <Flex 
                      position="absolute" 
                      top={10} 
                      left={2} 
                      right={2} 
                      direction="column" 
                      gap={1}
                      overflow="hidden"
                    >
                      {dateObj.workouts.map((workout, idx) => (
                        <Tooltip key={workout.id} label={workout.name}>
                          <Box 
                            bg={workoutBgColor} 
                            borderRadius="md"
                            p={1}
                            fontSize="xs"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            color={barTextColor}
                          >
                            {workout.name}
                          </Box>
                        </Tooltip>
                      ))}
                      {/* Events for this day */}
                      {dateObj.events.map((event, idx) => (
                        <Tooltip 
                          key={event.id} 
                          label={
                            <Box>
                              <Text fontWeight="bold">{event.meet_name}</Text>
                              <Flex align="center" mt={1}>
                                <FaMapMarkerAlt />
                                <Text ml={1}>{event.location}</Text>
                              </Flex>
                              <Text mt={1}>{event.event_name}</Text>
                            </Box>
                          }
                          hasArrow
                        >
                          <Box 
                            bg={eventBgColor} 
                            borderRadius="md"
                            p={1}
                            fontSize="xs"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            borderLeft="3px solid"
                            borderLeftColor="purple.500"
                            color={barTextColor}
                          >
                            <Flex align="center">
                              <FaCalendarAlt size="10px" />
                              <Text ml={1} fontWeight="bold" color={barTextColor}>{event.meet_name}: {event.event_name}</Text>
                            </Flex>
                          </Box>
                        </Tooltip>
                      ))}
                    </Flex>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }
  // Default: Year view
  return (
    <Box className="page container">
      <Box 
        className="calendar-content" 
        bg={cardBg} 
        borderRadius="md" 
        boxShadow={cardShadow} 
        p={4}
        borderWidth="1px"
        borderColor={borderColor}
        mt={{ base: "20px", lg: 0 }}
      >
        {/* Calendar Header & Navigation */}
        <Flex className="calendar-header" justify="space-between" align="center" mb={4}>
          <Flex className="year-navigation" align="center" gap={4}>
            <Box 
              as="button" 
              onClick={goToPrevYear} 
              mr={2}
              color="blue.500"
              _hover={{ color: 'blue.600' }}
            >
              &lt;
            </Box>
            <Text fontWeight="bold">{currentYear}</Text>
            <Box 
              as="button" 
              onClick={goToNextYear} 
              ml={2}
              color="blue.500"
              _hover={{ color: 'blue.600' }}
            >
              &gt;
            </Box>
            <Button 
              size="sm" 
              variant="outline" 
              colorScheme="blue"
              onClick={handleRefresh}
              isLoading={loading}
              loadingText="Refreshing..."
              ml={4}
            >
              Refresh
            </Button>
            <Text fontSize="sm" color={statLabelColor}>52 WEEKS</Text>
          </Flex>
          {/* Stats Summary */}
          <Flex className="stats" gap={4} align="center">
            <Box textAlign="center">
              <Text fontWeight="bold" fontSize="xl">{stats.hours}</Text>
              <Text fontSize="sm" color={statLabelColor}>Hours</Text>
            </Box>
            <Box textAlign="center">
              <Text fontWeight="bold" fontSize="xl">{stats.miles}</Text>
              <Text fontSize="sm" color={statLabelColor}>Miles</Text>
            </Box>
            <Box textAlign="center">
              <Text fontWeight="bold" fontSize="xl">{stats.personalRecords}</Text>
              <Text fontSize="sm" color={statLabelColor}>Personal Records</Text>
            </Box>
            <Box textAlign="center">
              <Text fontWeight="bold" fontSize="xl">{stats.activities}</Text>
              <Text fontSize="sm" color={statLabelColor}>Activities</Text>
            </Box>
          </Flex>
        </Flex>
        {/* Calendar Grid */}
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          {months.map((month, index) => (
            <GridItem 
              key={month} 
              bg={monthBgColor} 
              p={4} 
              borderRadius="md"
              cursor="pointer"
              onClick={() => handleMonthClick(index)}
              _hover={{ 
                boxShadow: 'md',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              }}
            >
              <Flex justify="space-between" align="center" mb={4}>
                <HStack spacing={2}>
                  <Heading as="h3" size="md" color={yearViewHeadingColor}>{month}</Heading>
                  {/* Orange dot for current month */}
                  {isCurrentMonth(currentYear, index) && (
                    <Box
                      width="6px"
                      height="6px"
                      borderRadius="50%"
                      bg="orange.500"
                      mt={1}
                    />
                  )}
                </HStack>
                {!loading && (
                  <Text fontSize="sm" color={yearViewActivityColor}>
                    {getMonthActivityCount(index) > 0 ? (
                      <>
                        <Text as="span" fontWeight="bold">{getMonthActivityCount(index)}</Text> activities
                      </>
                    ) : (
                      <Text as="span">No activities</Text>
                    )}
                  </Text>
                )}
              </Flex>
              <Box height="150px" position="relative">
                {loading ? (
                  <Text fontSize="sm" color="gray.500" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                    Loading...
                  </Text>
                ) : (
                  <>
                    {/* Show a preview of activities with priority-based display */}
                    {(() => {
                      const workouts = monthlyWorkouts[index] || [];
                      const events = monthlyEvents[index] || [];
                      const workoutCount = workouts.length;
                      return (
                        <>
                          {/* Priority 1: Show all meets/events with full names */}
                          {events.map((event, idx) => (
                            <Box 
                              key={`event-${idx}`} 
                              bg={eventBgColor} 
                              borderRadius="md" 
                              p={1} 
                              mb={1} 
                              fontSize="sm"
                              whiteSpace="nowrap"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              borderLeft="3px solid"
                              borderLeftColor="purple.500"
                              color={yearViewTextColor}
                            >
                              <Text color={yearViewTextColor}>
                                {new Date(event.meet_date).getDate()} - {event.meet_name}
                              </Text>
                            </Box>
                          ))}
                          {/* Priority 2: Show workout count if any workouts exist */}
                          {workoutCount > 0 && (
                            <Box 
                              bg={workoutBgColor} 
                              borderRadius="md" 
                              p={1} 
                              mb={1} 
                              fontSize="sm"
                              color={yearViewTextColor}
                            >
                              <Text color={yearViewTextColor}>
                                {workoutCount} workout{workoutCount === 1 ? '' : 's'}
                              </Text>
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </Box>
            </GridItem>
          ))}
        </Grid>
      </Box>
    </Box>
  );
} 