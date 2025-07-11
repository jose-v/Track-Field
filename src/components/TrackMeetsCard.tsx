import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  useColorModeValue,
  Tag,
  Flex,
  useToast,
  Link as ChakraLink,
  Skeleton,
  Heading,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCalendarAlt, FaCalendarPlus, FaEye, FaDollarSign, FaClock, FaRunning, FaHotel } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import type { CardProps } from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTimeFormat } from '../contexts/TimeFormatContext';

// Helper function to format date
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateStr;
  }
}

// Format fees to show proper currency format
function formatFee(fee: string | number | undefined): string {
  if (!fee) return '';
  const numericFee = typeof fee === 'string' ? parseFloat(fee) : fee;
  return `$${numericFee.toFixed(2)}`;
}

// Meet event interface
interface MeetEvent {
  id: string;
  event_name: string;
  meet_id: string;
}

// Track meet interface
interface TrackMeet {
  id: string;
  name: string;
  meet_date?: string;
  start_date?: string;
  city?: string;
  state?: string;
  status?: string;
  lodging_type?: string;
  lodging_address?: string;
  meet_events?: MeetEvent[];
  assigned_events?: MeetEvent[];
  total_events?: number;
  assigned_events_count?: number;
  assigned_athletes?: { id: string; name: string }[];
  assigned_athletes_count?: number;
  multi_events_start_date?: string;
  multi_events_end_date?: string;
  track_field_start_date?: string;
  track_field_end_date?: string;
  registration_fee?: number;
  processing_fee?: number;
  entry_deadline_date?: string;
  entry_deadline_time?: string;
}

interface TrackMeetsCardProps extends CardProps {
  viewAllLink?: string;
  userRole?: 'athlete' | 'coach';
}

const TrackMeetsCard: React.FC<TrackMeetsCardProps> = ({
  viewAllLink = "/athlete/meets",
  userRole = 'athlete',
  ...rest
}) => {
  const { user } = useAuth();
  const { formatTime } = useTimeFormat();
  const toast = useToast();
  const [trackMeets, setTrackMeets] = useState<TrackMeet[]>([]);
  const [coachMeets, setCoachMeets] = useState<TrackMeet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Color mode values matching quick-log cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch track meets data
  useEffect(() => {
    if (user?.id) {
      fetchTrackMeets();
    }
  }, [user?.id]);

  const fetchTrackMeets = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      if (userRole === 'coach') {
        // For coaches: fetch meets they created
        const { data: coachCreatedMeets, error: coachError } = await supabase
          .from('track_meets')
          .select(`
            *,
            lodging_type,
            lodging_address,
            meet_events (
              id,
              event_name,
              meet_id
            )
          `)
          .eq('coach_id', user.id)
          .order('meet_date', { ascending: true });

        if (coachError) throw coachError;

        // For each meet, get the assigned athletes
        const processedCoachMeets = await Promise.all((coachCreatedMeets || []).map(async (meet) => {
          // Get athletes assigned to this meet through athlete_meet_events
          const meetEventIds = meet.meet_events?.map(e => e.id) || [];
          
          if (meetEventIds.length === 0) {
            return {
              ...meet,
              total_events: meet.meet_events?.length || 0,
              assigned_events: meet.meet_events || [],
              assigned_events_count: meet.meet_events?.length || 0,
              assigned_athletes: [],
              assigned_athletes_count: 0,
            };
          }
          
          const { data: athleteEvents, error: athleteEventsError } = await supabase
            .from('athlete_meet_events')
            .select(`
              athlete_id,
              athletes!athlete_meet_events_athlete_id_fkey (
                id,
                profiles!athletes_id_fkey (
                  id,
                  first_name,
                  last_name
                )
              )
            `)
            .in('meet_event_id', meetEventIds);

          if (athleteEventsError) {
            console.error('Error fetching athletes for meet:', athleteEventsError);
          }

          // Get unique athletes (in case they're in multiple events)
          const uniqueAthletes = new Map();
          (athleteEvents || []).forEach(ae => {
            if (ae.athletes && Array.isArray(ae.athletes) && ae.athletes.length > 0) {
              const athlete = ae.athletes[0]; // Get first athlete
              if (athlete.profiles && Array.isArray(athlete.profiles) && athlete.profiles.length > 0) {
                const profile = athlete.profiles[0]; // Get first profile
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                uniqueAthletes.set(ae.athlete_id, {
                  id: ae.athlete_id,
                  name: name || 'Unknown Athlete'
                });
              }
            }
          });

          const assigned_athletes = Array.from(uniqueAthletes.values());

          return {
            ...meet,
            total_events: meet.meet_events?.length || 0,
            assigned_events: meet.meet_events || [],
            assigned_events_count: meet.meet_events?.length || 0,
            assigned_athletes,
            assigned_athletes_count: assigned_athletes.length,
          };
        }));

        // Filter for current and future meets only and sort by date - latest first (reverse chronological)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
        
        const futureCoachMeets = processedCoachMeets.filter(meet => {
          if (!meet.meet_date) return false;
          const meetDate = new Date(meet.meet_date);
          meetDate.setHours(0, 0, 0, 0); // Normalize meet date to beginning of day
          return meetDate >= today;
        });

        const sortedCoachMeets = futureCoachMeets.sort((a, b) => {
          const dateA = new Date(a.meet_date || '');
          const dateB = new Date(b.meet_date || '');
          return dateB.getTime() - dateA.getTime();
        });

        setTrackMeets(sortedCoachMeets);
        setCoachMeets([]); // Clear coach meets for coach view
      } else {
        // For athletes: fetch meets where they are assigned or from their coaches
        const { data: athleteMeets, error: athleteError } = await supabase
          .from('track_meets')
          .select(`
            *,
            lodging_type,
            lodging_address,
            meet_events (
              id,
              event_name,
              meet_id
            )
          `)
          .eq('athlete_id', user.id)
          .order('meet_date', { ascending: true });

        if (athleteError) throw athleteError;

        // Fetch meets created by coaches of this athlete
        const { data: coachAthleteData, error: coachAthleteError } = await supabase
          .from('coach_athletes')
          .select('coach_id')
          .eq('athlete_id', user.id);

        if (coachAthleteError) throw coachAthleteError;

        let coachMeetsData: TrackMeet[] = [];
        if (coachAthleteData && coachAthleteData.length > 0) {
          const coachIds = coachAthleteData.map(ca => ca.coach_id);
          
          const { data: coachMeetsResult, error: coachMeetsError } = await supabase
            .from('track_meets')
            .select(`
              *,
              lodging_type,
              lodging_address,
              meet_events (
                id,
                event_name,
                meet_id
              )
            `)
            .in('coach_id', coachIds)
            .order('meet_date', { ascending: true });

          if (coachMeetsError) throw coachMeetsError;
          coachMeetsData = coachMeetsResult || [];
        }

        // Process the data to include event counts and assignments
        const processedAthleteMeets = (athleteMeets || []).map(meet => ({
          ...meet,
          total_events: meet.meet_events?.length || 0,
          assigned_events: meet.meet_events || [],
          assigned_events_count: meet.meet_events?.length || 0,
        }));

        const processedCoachMeets = coachMeetsData.map(meet => ({
          ...meet,
          total_events: meet.meet_events?.length || 0,
          assigned_events: [], // Coach meets don't show athlete assignments in this view
          assigned_events_count: 0,
        }));

        // Filter for current and future meets only and sort both arrays by date - latest first (reverse chronological)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
        
        const futureAthleteMeets = processedAthleteMeets.filter(meet => {
          if (!meet.meet_date) return false;
          const meetDate = new Date(meet.meet_date);
          meetDate.setHours(0, 0, 0, 0); // Normalize meet date to beginning of day
          return meetDate >= today;
        });

        const futureCoachMeets = processedCoachMeets.filter(meet => {
          if (!meet.meet_date) return false;
          const meetDate = new Date(meet.meet_date);
          meetDate.setHours(0, 0, 0, 0); // Normalize meet date to beginning of day
          return meetDate >= today;
        });

        const sortedAthleteMeets = futureAthleteMeets.sort((a, b) => {
          const dateA = new Date(a.meet_date || '');
          const dateB = new Date(b.meet_date || '');
          return dateB.getTime() - dateA.getTime();
        });

        const sortedCoachMeets = futureCoachMeets.sort((a, b) => {
          const dateA = new Date(a.meet_date || '');
          const dateB = new Date(b.meet_date || '');
          return dateB.getTime() - dateA.getTime();
        });

        setTrackMeets(sortedAthleteMeets);
        setCoachMeets(sortedCoachMeets);
      }

    } catch (error) {
      console.error('Error fetching track meets:', error);
      toast({
        title: 'Error fetching track meets',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalMeets = () => trackMeets.length + coachMeets.length;
  const getUpcomingMeets = () => {
    const allMeets = [...trackMeets, ...coachMeets];
    return allMeets.filter(meet => {
      const meetDate = meet.meet_date;
      if (!meetDate) return false;
      return new Date(meetDate) >= new Date();
    }).length;
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        minH="320px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        {...rest}
      >
        <Text color={subtitleColor}>Loading track meets...</Text>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
      minH="320px"
      display="flex"
      flexDirection="column"
      {...rest}
    >
      <VStack spacing={5} align="stretch" flex="1">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaMapMarkerAlt} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Track Meets
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {getTotalMeets() > 0 
                  ? `${getTotalMeets()} upcoming meets`
                  : 'No upcoming meets'
                }
              </Text>
            </VStack>
          </HStack>
          <VStack spacing={1} align="end">
            <Badge 
              colorScheme="blue" 
              variant="solid" 
              fontSize="xs"
              px={2}
              py={1}
            >
              {getTotalMeets()} Upcoming
            </Badge>
          </VStack>
        </HStack>

        {/* Content */}
        {trackMeets.length === 0 && coachMeets.length === 0 ? (
          <Box
            bg={sectionBg}
            p={6}
            borderRadius="lg"
            textAlign="center"
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack spacing={3}>
              <Icon as={FaCalendarAlt} boxSize={8} color={subtitleColor} />
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                No upcoming meets
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                Check back later for future meets
              </Text>
            </VStack>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch" flex="1">
            {/* Coach's Meets - Show first */}
            {userRole === 'athlete' && (
              <Box>
                <HStack spacing={2} mb={3}>
                  <Icon as={FaCalendarAlt} color="purple.500" fontSize="sm" />
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>
                    Coach's Meets
                  </Text>
                  <Badge colorScheme="purple" variant="outline" fontSize="xs">
                    {coachMeets.length}
                  </Badge>
                </HStack>
                
                {coachMeets.length > 0 ? (
                  <VStack spacing={2}>
                    {coachMeets.slice(0, 2).map(meet => (
                    <Box 
                      key={meet.id} 
                      p={3} 
                      borderRadius="md" 
                      bg={sectionBg}
                      border="1px solid"
                      borderColor={borderColor}
                      w="100%"
                      cursor="pointer"
                      _hover={{ bg: sectionBg }}
                      transition="background-color 0.2s"
                      onClick={() => window.location.href = viewAllLink}
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                            {meet.name}
                          </Text>
                          
                          {/* Show separate date ranges if available */}
                          {meet.multi_events_start_date && (
                            <Text fontSize="xs" color="blue.500">
                              Multi Events: {formatDate(meet.multi_events_start_date)}
                              {meet.multi_events_end_date && meet.multi_events_start_date !== meet.multi_events_end_date && 
                                ` - ${formatDate(meet.multi_events_end_date)}`}
                            </Text>
                          )}
                          {meet.track_field_start_date && (
                            <Text fontSize="xs" color="blue.500">
                              Track & Field: {formatDate(meet.track_field_start_date)}
                              {meet.track_field_end_date && meet.track_field_start_date !== meet.track_field_end_date && 
                                ` - ${formatDate(meet.track_field_end_date)}`}
                            </Text>
                          )}
                          
                          {/* Fallback to original date if no new dates */}
                          {!meet.multi_events_start_date && !meet.track_field_start_date && (
                            <Text fontSize="xs" color={subtitleColor}>
                              {formatDate(meet.meet_date)}
                            </Text>
                          )}
                          
                          {meet.city && meet.state && (
                            <Text fontSize="xs" color={subtitleColor}>
                              {meet.city}, {meet.state}
                            </Text>
                          )}
                          
                          {/* Show registration fee if available */}
                          {meet.registration_fee && (
                            <VStack align="start" spacing={0} width="full" maxW="120px">
                              <Flex justify="space-between" width="full">
                                <Text fontSize="xs" color="blue.500">Registration:</Text>
                                <Text fontSize="xs" color="blue.500" textAlign="right" ml={3}>{formatFee(meet.registration_fee)}</Text>
                              </Flex>
                              {meet.processing_fee && (
                                <Flex justify="space-between" width="full">
                                  <Text fontSize="xs" color="blue.500">Processing:</Text>
                                  <Text fontSize="xs" color="blue.500" textAlign="right" ml={3}>{formatFee(meet.processing_fee)}</Text>
                                </Flex>
                              )}
                            </VStack>
                          )}
                          
                          {/* Show entry deadline if available */}
                          {meet.entry_deadline_date && (
                            <Text fontSize="xs" color="blue.500">
                              Deadline: {formatDate(meet.entry_deadline_date)}
                              {meet.entry_deadline_time && ` at ${formatTime(meet.entry_deadline_time)}`}
                            </Text>
                          )}
                          
                          {meet.lodging_type && (
                            <Text fontSize="xs" color={subtitleColor}>
                              Lodging: {meet.lodging_type}{meet.lodging_address ? ` - ${meet.lodging_address}` : ''}
                            </Text>
                          )}
                        </VStack>
                        <Tag 
                          size="sm" 
                          colorScheme={
                            meet.status === 'Completed' ? 'green' : 
                            meet.status === 'Cancelled' ? 'red' : 'purple'
                          }
                          variant="solid"
                        >
                          {meet.status || 'Upcoming'}
                        </Tag>
                      </HStack>
                    </Box>
                  ))}
                  </VStack>
                ) : (
                  <Box
                    bg={sectionBg}
                    p={4}
                    borderRadius="lg"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color={subtitleColor}>
                      No upcoming coach meets
                    </Text>
                  </Box>
                )}
              </Box>
            )}
            
            {/* My Track Meets / Coach's Scheduled Meets - Show second */}
            <Box>
              <HStack spacing={2} mb={3}>
                <Icon as={FaMapMarkerAlt} color="blue.500" fontSize="sm" />
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {userRole === 'coach' ? 'My Scheduled Meets' : 'My Track Meets'}
                </Text>
                <Badge colorScheme="blue" variant="outline" fontSize="xs">
                  {trackMeets.length}
                </Badge>
              </HStack>
              
              {trackMeets.length > 0 ? (
                <VStack spacing={2}>
                  {trackMeets.slice(0, 2).map(meet => (
                    <Box 
                      key={meet.id} 
                      p={3} 
                      borderRadius="md" 
                      bg={sectionBg}
                      border="1px solid"
                      borderColor={borderColor}
                      w="100%"
                      cursor="pointer"
                      _hover={{ bg: sectionBg }}
                      transition="background-color 0.2s"
                      onClick={() => window.location.href = viewAllLink}
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                            {meet.name}
                          </Text>
                          
                          {/* Show separate date ranges if available */}
                          {meet.multi_events_start_date && (
                            <Text fontSize="xs" color="blue.500">
                              Multi Events: {formatDate(meet.multi_events_start_date)}
                              {meet.multi_events_end_date && meet.multi_events_start_date !== meet.multi_events_end_date && 
                                ` - ${formatDate(meet.multi_events_end_date)}`}
                            </Text>
                          )}
                          {meet.track_field_start_date && (
                            <Text fontSize="xs" color="blue.500">
                              Track & Field: {formatDate(meet.track_field_start_date)}
                              {meet.track_field_end_date && meet.track_field_start_date !== meet.track_field_end_date && 
                                ` - ${formatDate(meet.track_field_end_date)}`}
                            </Text>
                          )}
                          
                          {/* Fallback to original date if no new dates */}
                          {!meet.multi_events_start_date && !meet.track_field_start_date && (
                            <Text fontSize="xs" color={subtitleColor}>
                              {formatDate(meet.meet_date)}
                            </Text>
                          )}
                          
                          {meet.city && meet.state && (
                            <Text fontSize="xs" color={subtitleColor}>
                              {meet.city}, {meet.state}
                            </Text>
                          )}
                          
                          {/* Show registration fee if available */}
                          {meet.registration_fee && (
                            <VStack align="start" spacing={0} width="full" maxW="120px">
                              <Flex justify="space-between" width="full">
                                <Text fontSize="xs" color="blue.500">Registration:</Text>
                                <Text fontSize="xs" color="blue.500" textAlign="right" ml={3}>{formatFee(meet.registration_fee)}</Text>
                              </Flex>
                              {meet.processing_fee && (
                                <Flex justify="space-between" width="full">
                                  <Text fontSize="xs" color="blue.500">Processing:</Text>
                                  <Text fontSize="xs" color="blue.500" textAlign="right" ml={3}>{formatFee(meet.processing_fee)}</Text>
                                </Flex>
                              )}
                            </VStack>
                          )}
                          
                          {/* Show entry deadline if available */}
                          {meet.entry_deadline_date && (
                            <Text fontSize="xs" color="blue.500">
                              Deadline: {formatDate(meet.entry_deadline_date)}
                              {meet.entry_deadline_time && ` at ${formatTime(meet.entry_deadline_time)}`}
                            </Text>
                          )}
                          
                          {meet.lodging_type && (
                            <Text fontSize="xs" color={subtitleColor}>
                              Lodging: {meet.lodging_type}{meet.lodging_address ? ` - ${meet.lodging_address}` : ''}
                            </Text>
                          )}
                        </VStack>
                        <Tag 
                          size="sm" 
                          colorScheme={
                            meet.status === 'Completed' ? 'green' : 
                            meet.status === 'Cancelled' ? 'red' : 'blue'
                          }
                          variant="solid"
                        >
                          {meet.status || 'Upcoming'}
                        </Tag>
                      </HStack>
                      
                      {/* Assigned Athletes (for coach view) or Events (for athlete view) */}
                      {userRole === 'coach' && meet.assigned_athletes && meet.assigned_athletes.length > 0 && (
                        <Box>
                          <Text fontSize="xs" fontWeight="medium" color="blue.500" mb={1}>
                            Athletes: {meet.assigned_athletes_count}
                          </Text>
                          <Flex flexWrap="wrap" gap={1}>
                            {meet.assigned_athletes.slice(0, 3).map((athlete) => (
                              <Tag key={athlete.id} size="sm" variant="subtle" colorScheme="green" fontSize="xs">
                                {athlete.name}
                              </Tag>
                            ))}
                            {meet.assigned_athletes.length > 3 && (
                              <Tag size="sm" variant="subtle" colorScheme="gray" fontSize="xs">
                                +{meet.assigned_athletes.length - 3}
                              </Tag>
                            )}
                          </Flex>
                        </Box>
                      )}
                      
                      {/* Assigned Events (for athlete view only) */}
                      {userRole === 'athlete' && meet.assigned_events && meet.assigned_events.length > 0 && (
                        <Box>
                          <Text fontSize="xs" fontWeight="medium" color="blue.500" mb={1}>
                            Events: {meet.assigned_events_count} of {meet.total_events}
                          </Text>
                          <Flex flexWrap="wrap" gap={1}>
                            {meet.assigned_events.slice(0, 3).map((event) => (
                              <Tag key={event.id} size="sm" variant="subtle" colorScheme="blue" fontSize="xs">
                                {event.event_name}
                              </Tag>
                            ))}
                            {meet.assigned_events.length > 3 && (
                              <Tag size="sm" variant="subtle" colorScheme="gray" fontSize="xs">
                                +{meet.assigned_events.length - 3}
                              </Tag>
                            )}
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box
                  bg={sectionBg}
                  p={4}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Text fontSize="sm" color={subtitleColor}>
                    No upcoming meets
                  </Text>
                </Box>
              )}
            </Box>
          </VStack>
        )}

        {/* Action Button */}
        <Button
          as={RouterLink}
          to={viewAllLink}
          colorScheme="blue"
          variant="outline"
          size="sm"
          leftIcon={<Icon as={FaCalendarAlt} />}
          mt="auto"
        >
          View All Track Meets
        </Button>
      </VStack>
    </Box>
  );
};

export default TrackMeetsCard; 