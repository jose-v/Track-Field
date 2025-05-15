import { Box, Heading, Flex, Text, Grid, GridItem, useColorModeValue, Button, Tooltip, Select } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { FaCalendarAlt, FaRunning, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

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

/**
 * TrainingCalendar component displays a yearly calendar with workout data
 * It will show different information based on whether it's viewed by a coach or athlete
 */
export const TrainingCalendar = ({ isCoach = false, athleteId }: TrainingCalendarProps) => {
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
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const monthBgColor = useColorModeValue('gray.50', 'gray.700');
  const headerBgColor = useColorModeValue('gray.100', 'gray.600');
  const workoutBgColor = useColorModeValue('blue.100', 'blue.700');
  const eventBgColor = useColorModeValue('purple.100', 'purple.700');
  
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
      
      try {
        console.log('Fetching workouts for user:', targetUserId, 'for year:', currentYear);
        
        // Format year for date filtering
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;
        
        // Get all assigned workouts for this athlete
        const { data: assignedWorkoutData, error: assignedError } = await supabase
          .from('athlete_workouts')
          .select(`
            workout_id,
            workouts (
              id,
              name,
              type,
              date,
              duration
            )
          `)
          .eq('athlete_id', targetUserId);
        
        if (assignedError) throw assignedError;
        
        if (assignedWorkoutData && assignedWorkoutData.length > 0) {
          console.log('Found workouts:', assignedWorkoutData);
          
          // Transform the data to match our WorkoutData interface and filter by year
          workouts = assignedWorkoutData
            .map(item => {
              const workout = item.workouts as any;
              
              return {
                id: workout?.id || '',
                name: workout?.name || 'Unnamed Workout',
                date: workout?.date || '',
                type: workout?.type || 'Custom',
                duration: workout?.duration || '30'
              };
            })
            .filter(workout => {
              // Filter workouts for the current year
              if (!workout.date) return false;
              const workoutYear = new Date(workout.date).getFullYear();
              return workoutYear === currentYear;
            });
            
          console.log(`Filtered ${workouts.length} workouts for year ${currentYear}`);
        } else {
          console.log('No assigned workouts found for user:', targetUserId);
          
          // Try fetching directly from workouts table if no assigned workouts
          const { data: directWorkoutData, error: directError } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', targetUserId)
            .gte('date', yearStart)
            .lte('date', yearEnd);
            
          if (directError) throw directError;
          
          if (directWorkoutData && directWorkoutData.length > 0) {
            console.log(`Found ${directWorkoutData.length} direct workouts for year ${currentYear}:`, directWorkoutData);
            
            workouts = directWorkoutData.map(workout => ({
              id: workout.id,
              name: workout.name,
              date: workout.date,
              type: workout.type || 'Custom',
              duration: workout.duration || '30'
            }));
          } else {
            console.log('No workouts found for user:', targetUserId);
          }
        }
      } catch (err) {
        console.error('Error with database query, using mock data instead:', err);
        
        // Fallback to mock data if database query fails
        workouts = [
          {
            id: '1',
            name: 'Morning Run',
            date: `${currentYear}-03-10`,
            type: 'Cardio',
            duration: '45'
          },
          {
            id: '2',
            name: 'Sprint Training',
            date: `${currentYear}-03-12`,
            type: 'Track',
            duration: '60'
          },
          {
            id: '3',
            name: 'Distance Run',
            date: `${currentYear}-03-15`,
            type: 'Endurance',
            duration: '90'
          },
          {
            id: '4',
            name: 'Track Workout',
            date: `${currentYear}-04-05`,
            type: 'Track',
            duration: '75'
          },
          {
            id: '5',
            name: 'Hill Repeats',
            date: `${currentYear}-04-10`,
            type: 'Strength',
            duration: '60'
          },
          {
            id: '6',
            name: 'Long Run',
            date: `${currentYear}-05-02`,
            type: 'Endurance',
            duration: '120'
          }
        ];
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
      return [];
    }
  };
  
  // Fetch events for the athlete
  const fetchEventsForYear = async () => {
    try {
      // Determine whose events to fetch
      const targetUserId = athleteId || user?.id;
      if (!targetUserId) return [];
      
      let events: EventData[] = [];
      
      try {
        console.log('Fetching events for user:', targetUserId, 'for year:', currentYear);
        
        // Format year for date filtering
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;
        
        // First try to get the athlete's meet event assignments
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
          console.log('Found event assignments:', eventAssignments);
          
          // Transform the data to match our EventData interface and filter by year
          events = eventAssignments
            .map(item => {
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
            })
            .filter(event => {
              // Filter events for the current year
              if (!event.meet_date) return false;
              const eventYear = new Date(event.meet_date).getFullYear();
              return eventYear === currentYear;
            });
          
          console.log(`Filtered ${events.length} events for year ${currentYear}`);
        } else {
          console.log('No event assignments found for user:', targetUserId);
          
          // If no events in athlete_meet_events, try track_meets directly
          const { data: trackMeets, error: meetsError } = await supabase
            .from('track_meets')
            .select('*')
            .eq('athlete_id', targetUserId)
            .gte('meet_date', yearStart)
            .lte('meet_date', yearEnd);
            
          if (meetsError) throw meetsError;
          
          if (trackMeets && trackMeets.length > 0) {
            console.log(`Found ${trackMeets.length} track meets for year ${currentYear}:`, trackMeets);
            
            // Convert track meets to events format
            events = trackMeets.map(meet => ({
              id: meet.id,
              meet_id: meet.id,
              meet_name: meet.name,
              meet_date: meet.meet_date,
              location: `${meet.city || ''}, ${meet.state || ''}`.trim(),
              event_name: meet.meet_type || 'Track Meet'
            }));
          }
        }
      } catch (err) {
        console.error('Error with database query, using mock data instead:', err);
        
        // Fallback to mock data if database query fails - using the current year
        events = [
          {
            id: '1',
            meet_id: 'm1',
            meet_name: 'State Championship',
            meet_date: `${currentYear}-03-15`,
            location: 'Central Stadium',
            event_name: '100m Sprint'
          },
          {
            id: '2',
            meet_id: 'm1',
            meet_name: 'State Championship',
            meet_date: `${currentYear}-03-15`,
            location: 'Central Stadium',
            event_name: '4x100m Relay'
          },
          {
            id: '3',
            meet_id: 'm2',
            meet_name: 'Regional Qualifier',
            meet_date: `${currentYear}-04-25`,
            location: 'East Field Track',
            event_name: 'Long Jump'
          },
          {
            id: '4',
            meet_id: 'm3',
            meet_name: 'Carter Invitational',
            meet_date: `${currentYear}-12-11`,
            location: 'Greensboro, NC',
            event_name: '400m Dash'
          }
        ];
      }
      
      // Organize events by month
      const byMonth: Record<number, EventData[]> = {};
      
      events.forEach(event => {
        if (event && event.meet_date) {
          const eventDate = new Date(event.meet_date);
          const month = eventDate.getMonth();
          
          if (!byMonth[month]) {
            byMonth[month] = [];
          }
          
          byMonth[month].push(event);
        }
      });
      
      setMonthlyEvents(byMonth);
      
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  };
  
  // Update statistics based on workout data
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
  
  // Fetch personal records count
  const fetchPersonalRecordsCount = async (): Promise<number> => {
    try {
      const targetUserId = athleteId || user?.id;
      if (!targetUserId) return 0;
      
      try {
        console.log('Fetching personal records count for user:', targetUserId);
        
        // Get count of personal records for this athlete
        const { count, error } = await supabase
          .from('personal_records')
          .select('id', { count: 'exact', head: true })
          .eq('athlete_id', targetUserId);
        
        if (error) throw error;
        
        console.log('Personal records count:', count);
        return count || 0;
      } catch (err) {
        console.error('Error with database query, using mock data instead:', err);
        // Return a mock count if database query fails
        return 8;
      }
    } catch (error) {
      console.error('Error fetching personal records count:', error);
      return 0;
    }
  };
  
  // Navigate between years
  const goToPrevYear = () => {
    // Clear data before changing year
    setMonthlyWorkouts({});
    setMonthlyEvents({});
    setLoading(true);
    setCurrentYear(prev => prev - 1);
  };
  
  const goToNextYear = () => {
    // Clear data before changing year
    setMonthlyWorkouts({});
    setMonthlyEvents({});
    setLoading(true);
    setCurrentYear(prev => prev + 1);
  };
  
  // Navigate between months
  const goToPrevMonth = () => {
    if (selectedMonth !== null) {
      const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const newYear = selectedMonth === 0 ? currentYear - 1 : currentYear;
      
      if (newYear !== currentYear) {
        setCurrentYear(newYear);
      }
      
      navigate(`${location.pathname}#${months[newMonth].toLowerCase()}`);
    }
  };
  
  const goToNextMonth = () => {
    if (selectedMonth !== null) {
      const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const newYear = selectedMonth === 11 ? currentYear + 1 : currentYear;
      
      if (newYear !== currentYear) {
        setCurrentYear(newYear);
      }
      
      navigate(`${location.pathname}#${months[newMonth].toLowerCase()}`);
    }
  };
  
  // Handle month selection from year view
  const handleMonthClick = (monthIndex: number) => {
    navigate(`${location.pathname}#${months[monthIndex].toLowerCase()}`);
  };
  
  // Back to yearly view
  const backToYearlyView = () => {
    navigate(location.pathname);
  };
  
  // Generate days for the selected month with real workout and event data
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
  
  // Get the count of activities for a month
  const getMonthActivityCount = (month: number): number => {
    const workouts = monthlyWorkouts[month] || [];
    const events = monthlyEvents[month] || [];
    return workouts.length + events.length;
  };
  
  // Update the useEffect hook to properly handle async operations and cleanup
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching calendar data for year:', currentYear);
        
        // Clear existing data
        if (isMounted) {
          setMonthlyWorkouts({});
          setMonthlyEvents({});
        }
        
        // Fetch workouts
        await fetchWorkoutsForYear();
        
        // Fetch events
        await fetchEventsForYear();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function to handle component unmount
    return () => {
      isMounted = false;
    };
  }, [currentYear, user, athleteId, isCoach]);
  
  // If month is selected, show month detail view
  if (selectedMonth !== null) {
    return (
      <Box className="page container">
        <Heading as="h1" mb={6}>Training Calendar</Heading>
        
        <Box 
          className="calendar-content" 
          bg={bgColor} 
          borderRadius="md" 
          boxShadow="sm" 
          p={4}
          borderWidth="1px"
          borderColor={borderColor}
        >
          {/* Month Detail Header */}
          <Flex justify="space-between" align="center" mb={4}>
            <Flex align="center" gap={4}>
              <Button colorScheme="blue" variant="ghost" onClick={backToYearlyView} size="sm">
                &lt; Back to Year
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
            </Flex>
            
            <Text fontSize="sm" color="gray.500">
              {new Date(currentYear, selectedMonth + 1, 0).getDate()} DAYS
            </Text>
            
            {/* Stats Summary */}
            <Flex className="stats" gap={4}>
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
                  bg={dateObj.isCurrentMonth ? bgColor : 'gray.50'}
                  opacity={dateObj.isCurrentMonth ? 1 : 0.5}
                  position="relative"
                  overflow="hidden"
                >
                  {/* Create an inner container for content that's positioned absolutely */}
                  <Box position="absolute" top={0} left={0} right={0} bottom={0} p={2}>
                    <Text 
                      position="absolute" 
                      top={2} 
                      right={2} 
                      fontSize="sm" 
                      fontWeight={dateObj.isCurrentMonth ? "bold" : "normal"}
                    >
                      {dateObj.day}
                    </Text>
                    
                    {/* Workouts for this day */}
                    <Flex 
                      position="absolute" 
                      bottom={2} 
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
                          >
                            <Flex align="center">
                              <FaCalendarAlt size="10px" />
                              <Text ml={1} fontWeight="bold">{event.meet_name}: {event.event_name}</Text>
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
      <Heading as="h1" mb={6}>Training Calendar</Heading>
      
      <Box 
        className="calendar-content" 
        bg={bgColor} 
        borderRadius="md" 
        boxShadow="sm" 
        p={4}
        borderWidth="1px"
        borderColor={borderColor}
      >
        {/* Calendar Header & Navigation */}
        <Flex className="calendar-header" justify="space-between" align="center" mb={4}>
          <Flex className="year-navigation" align="center">
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
            
            <Select 
              value={currentMonth}
              onChange={handleMonthChange}
              ml={4}
              size="sm"
              width="auto"
            >
              {months.map((month, idx) => (
                <option key={month} value={idx}>
                  {month}
                </option>
              ))}
            </Select>
          </Flex>
          
          <Text fontSize="sm" color="gray.500">52 WEEKS</Text>
          
          {/* Stats Summary */}
          <Flex className="stats" gap={4}>
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
              <Heading as="h3" size="md" mb={4}>{month}</Heading>
              
              <Box height="150px" position="relative">
                {loading ? (
                  <Text fontSize="sm" color="gray.500" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                    Loading...
                  </Text>
                ) : (
                  <>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      {getMonthActivityCount(index) > 0 ? (
                        <>
                          <Text as="span" fontWeight="bold">{getMonthActivityCount(index)}</Text> activities
                        </>
                      ) : (
                        'No activities scheduled'
                      )}
                    </Text>
                    
                    {/* Show a preview of workouts */}
                    {monthlyWorkouts[index]?.slice(0, 3).map((workout, idx) => (
                      <Box 
                        key={idx} 
                        bg={workoutBgColor} 
                        borderRadius="md" 
                        p={1} 
                        mb={1} 
                        fontSize="xs"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {new Date(workout.date).getDate()} - {workout.name}
                      </Box>
                    ))}
                    
                    {/* Show a preview of events */}
                    {monthlyEvents[index]?.slice(0, 2).map((event, idx) => (
                      <Box 
                        key={idx} 
                        bg={eventBgColor} 
                        borderRadius="md" 
                        p={1} 
                        mb={1} 
                        fontSize="xs"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        borderLeft="3px solid"
                        borderLeftColor="purple.500"
                      >
                        <Flex align="center">
                          <Text>{new Date(event.meet_date).getDate()}</Text>
                          <Text mx={1}>-</Text>
                          <Text fontWeight="bold">{event.meet_name}</Text>
                        </Flex>
                      </Box>
                    ))}
                    
                    {/* If there are more activities than shown in preview */}
                    {getMonthActivityCount(index) > 5 && (
                      <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
                        + {getMonthActivityCount(index) - 5} more
                      </Text>
                    )}
                  </>
                )}
              </Box>
            </GridItem>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default TrainingCalendar; 