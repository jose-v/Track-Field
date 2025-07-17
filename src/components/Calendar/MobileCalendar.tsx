import React, { useState, useEffect } from 'react';
import { Box, Heading, Flex, Text, Divider, useColorModeValue, Spinner, Grid, GridItem, Button, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, useDisclosure } from '@chakra-ui/react';
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

  const cardBg = useColorModeValue('white', 'gray.800');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');

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
      {months.map((month, idx) => (
        <Box key={month} mb={4}>
          <Heading size="md" mb={4}>{month}</Heading>
          {/* Days in a 7-column grid */}
          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
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
                  <GridItem key={day} p={1} borderRadius="md" border={isTodayCell ? "2px solid orange" : undefined} bg={isTodayCell ? "orange.50" : undefined} minH="48px" cursor="pointer" onClick={() => handleDayClick(idx, day)}>
                    <Text fontWeight="bold" fontSize="sm" textAlign="center">{day}</Text>
                    <Box>
                      {dayWorkouts.map(w => (
                        <Text key={w.id} fontSize="xs" color="blue.500" bg="blue.50" px={1} borderRadius="md" mt={1}>{w.name}</Text>
                      ))}
                      {dayEvents.map(e => (
                        <Text key={e.id} fontSize="xs" color="purple.500" bg="purple.50" px={1} borderRadius="md" mt={1}>{e.meet_name}</Text>
                      ))}
                    </Box>
                  </GridItem>
                );
              });
              return [...pads, ...days];
            })()}
          </Grid>
        </Box>
      ))}
      {/* Bottom drawer for daily view */}
      <Drawer isOpen={isOpen} placement="bottom" onClose={() => { setSelectedDay(null); onClose(); }} size="md">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl" pb={4}>
          <DrawerHeader textAlign="center" fontWeight="bold" fontSize="lg" borderBottomWidth="1px">
            {selectedDay ? `${months[selectedDay.monthIdx]} ${selectedDay.day}, ${currentYear}` : 'Day Details'}
          </DrawerHeader>
          <DrawerBody>
            {selectedDayWorkouts.length === 0 && selectedDayEvents.length === 0 ? (
              <Text textAlign="center" color="gray.400" mt={8}>No activities for this day.</Text>
            ) : (
              <>
                {selectedDayWorkouts.length > 0 && (
                  <Box mb={4}>
                    <Text fontWeight="bold" mb={2} color="blue.500">Workouts</Text>
                    {selectedDayWorkouts.map(w => (
                      <Box key={w.id} mb={2} p={3} borderRadius="md" bg="blue.50">
                        <Text fontWeight="semibold">{w.name}</Text>
                        {/* Add more workout details here if available */}
                      </Box>
                    ))}
                  </Box>
                )}
                {selectedDayEvents.length > 0 && (
                  <Box mb={2}>
                    <Text fontWeight="bold" mb={2} color="purple.500">Events</Text>
                    {selectedDayEvents.map(e => (
                      <Box key={e.id} mb={2} p={3} borderRadius="md" bg="purple.50">
                        <Text fontWeight="semibold">{e.meet_name}</Text>
                        <Text fontSize="sm" color="gray.600">{e.event_name}</Text>
                        <Text fontSize="xs" color="gray.500">{e.location}</Text>
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