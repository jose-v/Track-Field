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
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import type { CardProps } from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  meet_events?: MeetEvent[];
  assigned_events?: MeetEvent[];
  total_events?: number;
  assigned_events_count?: number;
}

interface TrackMeetsCardProps extends CardProps {
  viewAllLink?: string;
}

const TrackMeetsCard: React.FC<TrackMeetsCardProps> = ({
  viewAllLink = "/athlete/events",
  ...rest
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [trackMeets, setTrackMeets] = useState<TrackMeet[]>([]);
  const [coachMeets, setCoachMeets] = useState<TrackMeet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Color mode values matching quick-log cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

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

      // Fetch meets where the user is assigned as an athlete
      const { data: athleteMeets, error: athleteError } = await supabase
        .from('track_meets')
        .select(`
          *,
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

      setTrackMeets(processedAthleteMeets);
      setCoachMeets(processedCoachMeets);

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
        boxShadow="lg"
        minH="320px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        {...rest}
      >
        <Text color={statLabelColor}>Loading track meets...</Text>
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
      boxShadow="lg"
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
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Track Meets
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                {getTotalMeets() > 0 
                  ? `${getUpcomingMeets()} upcoming meets`
                  : 'No meets scheduled'
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
              {getTotalMeets()} Total
            </Badge>
            {getUpcomingMeets() > 0 && (
              <Badge 
                colorScheme="green" 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                {getUpcomingMeets()} Upcoming
              </Badge>
            )}
          </VStack>
        </HStack>

        {/* Content */}
        {trackMeets.length === 0 && coachMeets.length === 0 ? (
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            p={6}
            borderRadius="lg"
            textAlign="center"
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack spacing={3}>
              <Icon as={FaCalendarAlt} boxSize={8} color={statLabelColor} />
              <Text fontSize="lg" fontWeight="medium" color={statNumberColor}>
                No track meets found
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Check back later for upcoming meets
              </Text>
            </VStack>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch" flex="1">
            {/* My Track Meets */}
            {trackMeets.length > 0 && (
              <Box>
                <HStack spacing={2} mb={3}>
                  <Icon as={FaMapMarkerAlt} color="blue.500" fontSize="sm" />
                  <Text fontSize="sm" fontWeight="bold" color={statNumberColor}>
                    My Track Meets
                  </Text>
                  <Badge colorScheme="blue" variant="outline" fontSize="xs">
                    {trackMeets.length}
                  </Badge>
                </HStack>
                
                <VStack spacing={2}>
                  {trackMeets.slice(0, 2).map(meet => (
                    <Box 
                      key={meet.id} 
                      p={3} 
                      borderRadius="md" 
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      border="1px solid"
                      borderColor={borderColor}
                      w="100%"
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="bold" color={statNumberColor} noOfLines={1}>
                            {meet.name}
                          </Text>
                          <Text fontSize="xs" color={statLabelColor}>
                            {formatDate(meet.meet_date)}
                          </Text>
                          {meet.city && meet.state && (
                            <Text fontSize="xs" color={statLabelColor}>
                              {meet.city}, {meet.state}
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
                      
                      {/* Assigned Events */}
                      {meet.assigned_events && meet.assigned_events.length > 0 && (
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
              </Box>
            )}
            
            {/* Coach's Meets */}
            {coachMeets.length > 0 && (
              <Box>
                <HStack spacing={2} mb={3}>
                  <Icon as={FaCalendarAlt} color="purple.500" fontSize="sm" />
                  <Text fontSize="sm" fontWeight="bold" color={statNumberColor}>
                    Coach's Meets
                  </Text>
                  <Badge colorScheme="purple" variant="outline" fontSize="xs">
                    {coachMeets.length}
                  </Badge>
                </HStack>
                
                <VStack spacing={2}>
                  {coachMeets.slice(0, 2).map(meet => (
                    <Box 
                      key={meet.id} 
                      p={3} 
                      borderRadius="md" 
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      border="1px solid"
                      borderColor={borderColor}
                      w="100%"
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="bold" color={statNumberColor} noOfLines={1}>
                            {meet.name}
                          </Text>
                          <Text fontSize="xs" color={statLabelColor}>
                            {formatDate(meet.meet_date)}
                          </Text>
                          {meet.city && meet.state && (
                            <Text fontSize="xs" color={statLabelColor}>
                              {meet.city}, {meet.state}
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
              </Box>
            )}
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