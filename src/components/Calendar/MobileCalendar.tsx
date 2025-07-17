import React, { useState, useEffect } from 'react';
import { Box, Heading, Flex, Text, Divider, useColorModeValue, Spinner, Grid, GridItem, Button, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, useDisclosure, Tooltip, Icon } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useRef } from 'react';
import { useNavSentinelRef } from '../../contexts/NavSentinelContext';

interface MobileCalendarProps {
  isCoach?: boolean;
  athleteId?: string;
  currentYear?: number;
  setCurrentYear?: (year: number) => void;
  navbarVisible?: boolean;
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
  description?: string;
  registration_deadline?: string;
  entry_deadline_date?: string;
  venue_name?: string;
  venue_type?: string;
  event_day?: number;
  event_type?: string;
  start_time?: string;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const NAV_BAR_HEIGHT = 56; // Height of SimplifiedNavBar in px (adjust as needed)

export const MobileCalendar: React.FC<MobileCalendarProps> = ({ isCoach = false, athleteId, currentYear: propYear, setCurrentYear: propSetYear }) => {
  const [internalYear, setInternalYear] = useState(new Date().getFullYear());
  const currentYear = propYear !== undefined ? propYear : internalYear;
  const setCurrentYear = propSetYear !== undefined ? propSetYear : setInternalYear;
  const [monthlyWorkouts, setMonthlyWorkouts] = useState<Record<number, WorkoutData[]>>({});
  const [monthlyEvents, setMonthlyEvents] = useState<Record<number, EventData[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  // REMOVE: const [yearNavAtTop, setYearNavAtTop] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ monthIdx: number; day: number } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navSentinelRef = useNavSentinelRef();
  const currentMonthRef = useRef<HTMLDivElement>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const eventBg = useColorModeValue('blue.100', 'blue.800');
  const eventColor = useColorModeValue('blue.600', 'blue.200');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      setLoading(true);
      setMonthlyWorkouts({});
      setMonthlyEvents({});
      // Fetch workouts
      const targetUserId = athleteId || user?.id;
      let workouts: WorkoutData[] = [];
      let events: EventData[] = [];
      try {
        const assignedWorkouts = await api.workouts.getAssignedToAthlete(targetUserId);
        if (assignedWorkouts && assignedWorkouts.length > 0) {
          workouts = assignedWorkouts.filter(w => new Date(w.date).getFullYear() === currentYear);
        }
      } catch {}
      try {
        // Only fetch events for athletes
        if (!isCoach) {
          const { data: eventAssignments } = await supabase
            .from('athlete_meet_events')
            .select(`
              meet_event_id,
              meet_events (
                id,
                meet_id,
                event_name,
                event_day,
                event_type,
                start_time,
                track_meets (
                  id,
                  name,
                  meet_date,
                  city,
                  state,
                  description,
                  registration_deadline,
                  entry_deadline_date,
                  venue_name,
                  venue_type
                )
              )
            `)
            .eq('athlete_id', targetUserId);
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
                event_name: meetEvent?.event_name || 'Unknown Event',
                description: trackMeet?.description || '',
                registration_deadline: trackMeet?.registration_deadline || '',
                entry_deadline_date: trackMeet?.entry_deadline_date || '',
                venue_name: trackMeet?.venue_name || '',
                venue_type: trackMeet?.venue_type || '',
                event_day: meetEvent?.event_day || null,
                event_type: meetEvent?.event_type || '',
                start_time: meetEvent?.start_time || ''
              };
            }).filter(event => new Date(event.meet_date).getFullYear() === currentYear);
          }
        }
      } catch {}
      // Organize by month
      const byMonthWorkouts: Record<number, WorkoutData[]> = {};
      workouts.forEach(w => {
        const m = new Date(w.date).getMonth();
        if (!byMonthWorkouts[m]) byMonthWorkouts[m] = [];
        byMonthWorkouts[m].push(w);
      });
      const byMonthEvents: Record<number, EventData[]> = {};
      events.forEach(e => {
        const m = new Date(e.meet_date).getMonth();
        if (!byMonthEvents[m]) byMonthEvents[m] = [];
        byMonthEvents[m].push(e);
      });
      if (isMounted) {
        setMonthlyWorkouts(byMonthWorkouts);
        setMonthlyEvents(byMonthEvents);
        setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [currentYear, user, athleteId, isCoach]);

  // Scroll to current month on initial load
  useEffect(() => {
    if (!loading && currentMonthRef.current) {
      const timer = setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' // Center the month instead of start to avoid nav overlap
        });
      }, 100); // Small delay to ensure rendering is complete
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Handler for day click
  const handleDayClick = (monthIdx: number, day: number) => {
    setSelectedDay({ monthIdx, day });
    onOpen();
  };

  // Get details for selected day
  const selectedDayWorkouts = selectedDay ? (monthlyWorkouts[selectedDay.monthIdx] || []).filter(w => new Date(w.date).getDate() === selectedDay.day) : [];
  const selectedDayEvents = selectedDay ? (monthlyEvents[selectedDay.monthIdx] || []).filter(e => new Date(e.meet_date).getDate() === selectedDay.day) : [];

  if (loading) return <Flex justify="center" align="center" minH="60vh"><Spinner /></Flex>;

  return (
    <Box borderRadius="md" p={2} pt="42px" mx={2.5} ref={scrollRef}>
      {/* Spacer to prevent content from being hidden under the fixed nav bar */}
      {/* REMOVE: <Box position="fixed" top={yearNavAtTop ? 0 : `${NAV_BAR_HEIGHT}px`} left={0} right={0} zIndex={1000} bg={cardBg} boxShadow="sm" borderBottom="1px solid" borderColor={dividerColor}>
        <Flex align="center" justify="center" gap={4} py={2}>
          <Button size="sm" variant="ghost" onClick={() => setCurrentYear(y => y - 1)}>
            &#x2039;
          </Button>
          <Text fontWeight="bold" fontSize="lg" minW="80px" textAlign="center">{currentYear}</Text>
          <Button size="sm" variant="ghost" onClick={() => setCurrentYear(y => y + 1)}>
            &#x203A;
          </Button>
        </Flex>
      </Box> */}
      {months.map((month, idx) => {
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === idx;
        
        return (
          <Box key={month} mb={4} ref={isCurrentMonth ? currentMonthRef : undefined}>
            <Heading size="md" mb={4}>{month}</Heading>
          {/* Days in a 7-column grid */}
          <Grid templateColumns="repeat(7, 1fr)" gap={1} w="100%">
            {/* Days of week header */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <GridItem key={d} p={1} textAlign="center" fontWeight="bold" color="gray.400" fontSize="sm">{d}</GridItem>
            ))}
            {/* Calculate padding for first day of month */}
            {(() => {
              const firstDay = new Date(currentYear, idx, 1).getDay(); // 0=Sun
              const daysInMonth = new Date(currentYear, idx + 1, 0).getDate();
              const today = new Date();
              const isTodayMonth = today.getFullYear() === currentYear && today.getMonth() === idx;
              // Empty cells before first day
              const pads = Array.from({ length: firstDay }, (_, i) => <GridItem key={"pad-"+i} />);
              // Days of month
              const days = Array.from({ length: daysInMonth }, (_, dayIdx) => {
                const day = dayIdx + 1;
                const dayWorkouts = (monthlyWorkouts[idx] || []).filter(w => new Date(w.date).getDate() === day);
                const dayEvents = (monthlyEvents[idx] || []).filter(e => new Date(e.meet_date).getDate() === day);
                const isTodayCell = isTodayMonth && today.getDate() === day;
                return (
                  <GridItem key={day} p={1} borderRadius="md" h="68px" cursor="pointer" onClick={() => handleDayClick(idx, day)} overflow="hidden" w="100%">
                    <Flex align="center" justify="center" mb={1}>
                      <Text fontWeight="bold" fontSize="sm" textAlign="center">{day}</Text>
                      {isTodayCell && (
                        <Box
                          w="6px"
                          h="6px"
                          bg="orange.500"
                          borderRadius="full"
                          ml={1}
                        />
                      )}
                    </Flex>
                    <Box h="42px" display="flex" flexDirection="column" gap="2px">
                      {(() => {
                        // Combine all events (workouts + meets) with their types
                        const allEvents = [
                          ...dayWorkouts.map(w => ({ ...w, type: 'workout' })),
                          ...dayEvents.map(e => ({ ...e, type: 'event' }))
                        ];
                        
                        if (allEvents.length === 0) return null;
                        
                        const firstEvent = allEvents[0];
                        const remainingCount = allEvents.length - 1;
                        
                        return (
                          <>
                            {/* First event/workout */}
                            <Box
                              fontSize="10px" 
                              color={firstEvent.type === 'workout' ? eventColor : eventColor}
                              bg={firstEvent.type === 'workout' ? eventBg : eventBg}
                              px={1} 
                              py={0.5}
                              borderRadius="full" 
                              lineHeight="1"
                              width="100%"
                              maxW="100%"
                              overflow="hidden"
                              textAlign="center"
                              minH="16px"
                              position="relative"
                            >
                              <Text
                                fontSize="10px"
                                color={firstEvent.type === 'workout' ? eventColor : eventColor}
                                lineHeight="1"
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                                width="100%"
                                maxW="100%"
                              >
                                {firstEvent.type === 'workout' ? (firstEvent as any).name : (firstEvent as any).meet_name}
                              </Text>
                            </Box>
                            
                            {/* Show +X for remaining events */}
                            {remainingCount > 0 && (
                              <Box
                                fontSize="10px" 
                                color="gray.600"
                                bg="gray.100"
                                px={1} 
                                py={0.5}
                                borderRadius="full" 
                                lineHeight="1"
                                width="100%"
                                maxW="100%"
                                overflow="hidden"
                                textAlign="center"
                                minH="16px"
                                position="relative"
                              >
                                <Text
                                  fontSize="10px"
                                  color="gray.600"
                                  lineHeight="1"
                                  fontWeight="semibold"
                                >
                                  +{remainingCount}
                                </Text>
                              </Box>
                            )}
                          </>
                        );
                      })()}
                    </Box>
                  </GridItem>
                );
              });
              return [...pads, ...days];
            })()}
          </Grid>
        </Box>
        );
      })}
      {/* Bottom drawer for daily view */}
      <Drawer isOpen={isOpen} placement="bottom" onClose={() => { setSelectedDay(null); onClose(); }} size="md">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl" pb={4} bg={bgColor}>
          <DrawerHeader 
            textAlign="center" 
            fontWeight="bold" 
            fontSize="lg" 
            borderBottomWidth="1px"
            borderColor={dividerColor}
            color={textColor}
          >
            {selectedDay ? `${months[selectedDay.monthIdx]} ${selectedDay.day}, ${currentYear}` : 'Day Details'}
          </DrawerHeader>
          <DrawerBody>
            {selectedDayWorkouts.length === 0 && selectedDayEvents.length === 0 ? (
              <Text textAlign="center" color={mutedTextColor} mt={8}>No activities for this day.</Text>
            ) : (
              <>
                {selectedDayWorkouts.length > 0 && (
                  <Box mb={4}>
                    <Text fontWeight="bold" mb={2} color={eventColor}>Workouts</Text>
                    {selectedDayWorkouts.map(w => (
                      <Box key={w.id} mb={2} p={3} borderRadius="md" bg={eventBg}>
                        <Text fontWeight="semibold" color={textColor}>{w.name}</Text>
                        {/* Add more workout details here if available */}
                      </Box>
                    ))}
                  </Box>
                )}
                {selectedDayEvents.length > 0 && (
                  <Box mb={2}>
                    <Text fontWeight="bold" mb={2} color={eventColor}>Events</Text>
                    {selectedDayEvents.map(e => (
                      <Box key={e.id} mb={3} p={3} borderRadius="md" bg={eventBg}>
                        {/* Event name and event on same line */}
                        <Flex justify="space-between" align="center" mb={2}>
                          <Flex align="center" gap={2}>
                            <Text fontWeight="semibold" color={textColor}>{e.meet_name}</Text>
                            {e.description && (
                              <Tooltip 
                                label={e.description} 
                                placement="top" 
                                hasArrow 
                                bg="gray.700" 
                                color="white"
                                fontSize="sm"
                                p={2}
                                borderRadius="md"
                                maxW="300px"
                              >
                                <InfoIcon boxSize={3} color={mutedTextColor} cursor="pointer" />
                              </Tooltip>
                            )}
                          </Flex>
                          <Text fontSize="sm" color={subtextColor}>{e.event_name}</Text>
                        </Flex>
                        
                        {/* Two columns layout */}
                        <Grid templateColumns="1fr 1fr" gap={3} fontSize="sm">
                          {/* Left column */}
                          <Box>
                            {(e.entry_deadline_date || e.registration_deadline) && (
                              <Box mb={1}>
                                <Text color={mutedTextColor}>Entry Deadline:</Text>
                                <Text color={textColor}>{e.entry_deadline_date || e.registration_deadline}</Text>
                              </Box>
                            )}
                            {e.location && (
                              <Box mb={1}>
                                <Text color={mutedTextColor}>
                                  <Text as="span" 
                                    textDecoration="underline" 
                                    cursor="pointer"
                                    onClick={() => {
                                      const query = encodeURIComponent(e.location || '');
                                      window.open(`https://maps.google.com?q=${query}`, '_blank');
                                    }}
                                  >
                                    Location
                                  </Text>
                                </Text>
                                <Text color={textColor}>{e.location}</Text>
                              </Box>
                            )}
                            {e.meet_date && (
                              <Box mb={1}>
                                <Text color={mutedTextColor}>Event Date:</Text>
                                <Text color={textColor}>{new Date(e.meet_date).toLocaleDateString()}</Text>
                              </Box>
                            )}
                          </Box>
                          
                          {/* Right column */}
                          <Box>
                            {e.event_day && (
                              <Box mb={1}>
                                <Text color={mutedTextColor}>Day Number:</Text>
                                <Text color={textColor}>Day {e.event_day}</Text>
                              </Box>
                            )}
                            {e.event_type && (
                              <Box mb={1}>
                                <Text color={mutedTextColor}>Type:</Text>
                                <Text color={textColor}>{e.event_type}</Text>
                              </Box>
                            )}
                            {e.start_time && (
                              <Box mb={1}>
                                <Text color={mutedTextColor}>Start Time:</Text>
                                <Text color={textColor}>
                                  {(() => {
                                    try {
                                      const [hours, minutes] = e.start_time.split(':');
                                      const hour24 = parseInt(hours);
                                      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                      const period = hour24 >= 12 ? 'pm' : 'am';
                                      return `${hour12}:${minutes} ${period}`;
                                    } catch {
                                      return e.start_time;
                                    }
                                  })()}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default MobileCalendar; 