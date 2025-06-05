import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  FormErrorMessage,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  GridItem,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useColorModeValue,
  Flex,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
  CheckboxGroup,
  Checkbox,
  Icon
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMapMarkerAlt, FaEllipsisV, FaUserPlus, FaRunning } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { MeetFormDrawer, type TrackMeetFormData, type TrackMeetData } from '../../components/meets/MeetFormDrawer';
import { TravelTimeDisplay } from '../../components/TravelTimeDisplay';
import { LocationSetup } from '../../components/LocationSetup';
import { CurrentLocationDisplay } from '../../components/CurrentLocationDisplay';
import type { TrackMeet, MeetEvent, MeetEventFormData, AthleteWithName } from '../../types/trackMeets';

export function CoachMeets() {
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEventDrawerOpen, onOpen: onEventDrawerOpen, onClose: onEventDrawerClose } = useDisclosure();
  const { isOpen: isAssignDrawerOpen, onOpen: onAssignDrawerOpen, onClose: onAssignDrawerClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const { isOpen: isLocationSetupOpen, onOpen: onLocationSetupOpen, onClose: onLocationSetupClose } = useDisclosure();
  const [trackMeets, setTrackMeets] = useState<TrackMeet[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentMeet, setCurrentMeet] = useState<TrackMeet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [athletes, setAthletes] = useState<AthleteWithName[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetEvents, setMeetEvents] = useState<MeetEvent[]>([]);
  const [currentMeetEvent, setCurrentMeetEvent] = useState<MeetEvent | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [athleteAssignments, setAthleteAssignments] = useState<Record<string, string[]>>({});
  const toast = useToast();
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State to track event counts for each meet
  const [meetEventCounts, setMeetEventCounts] = useState<Record<string, number>>({});
  
  // State to track athletes assigned to each meet
  const [meetAthletes, setMeetAthletes] = useState<Record<string, any[]>>({});
  
  // Move all useColorModeValue calls to the top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.700', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const pageBackgroundColor = useColorModeValue('gray.50', 'gray.900');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.500');
  const modalHeaderBg = useColorModeValue('blue.50', 'blue.900');
  const modalHeaderColor = useColorModeValue('blue.800', 'blue.100');
  const footerBg = useColorModeValue('gray.50', 'gray.800');
  const eventDrawerHeaderBg = useColorModeValue('blue.50', 'blue.900');
  const eventDrawerHeaderColor = useColorModeValue('blue.800', 'blue.100');
  const assignDrawerHeaderBg = useColorModeValue('green.50', 'green.900');
  const assignDrawerHeaderColor = useColorModeValue('green.800', 'green.100');
  const deleteModalHeaderBg = useColorModeValue('red.50', 'red.900');
  const deleteModalHeaderColor = useColorModeValue('red.800', 'red.100');
  const yellowBoxBg = useColorModeValue('yellow.50', 'yellow.900');
  const yellowBoxBorder = useColorModeValue('yellow.200', 'yellow.600');
  const yellowBoxText = useColorModeValue('yellow.800', 'yellow.200');
  const whiteGrayBg = useColorModeValue('white', 'gray.700');
  const hoverBoxBorderColor = useColorModeValue('green.300', 'green.500');
  const menuHoverBg = useColorModeValue('blue.50', 'blue.900');
  const menuDeleteHoverBg = useColorModeValue('red.50', 'red.900');
  const grayHoverBg = useColorModeValue('gray.100', 'gray.700');
  const grayHoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const descriptionBoxBg = useColorModeValue('gray.50', 'gray.700');
  
  // Form handling setup for meet creation/editing
  // These will be used when we implement the form modals
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<TrackMeetFormData>({
    defaultValues: currentMeet || undefined
  });
  
  // Submit handler for meet creation/editing
  const onSubmit = async (data: TrackMeetFormData) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && currentMeet) {
        // Update existing track meet
        const { error } = await supabase
          .from('track_meets')
          .update(data)
          .eq('id', currentMeet.id);
        
        if (error) throw error;
        
        toast({
          title: 'Track meet updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        // Create new track meet
        const { error } = await supabase
          .from('track_meets')
          .insert([{
            ...data,
            coach_id: user?.id
          }]);
        
        if (error) throw error;
        
        toast({
          title: 'Track meet created',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      // Refresh the track meets list
      fetchTrackMeets();
      onFormClose();
    } catch (error) {
      console.error('Error saving track meet:', error);
      toast({
        title: 'Error saving track meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Form handling setup for meet event creation/editing
  const {
    handleSubmit: handleSubmitEvent,
    register: registerEvent,
    reset: resetEvent,
    formState: { errors: eventErrors, isSubmitting: isEventSubmitting },
  } = useForm<MeetEventFormData>();

  // Fetch track meets on component mount
  useEffect(() => {
    if (user) {
      fetchTrackMeets();
      fetchAthletes();
      fetchEvents();
    }
  }, [user]);

  // Fetch track meets from the database
  const fetchTrackMeets = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('track_meets')
        .select('*')
        .eq('coach_id', user?.id)
        .order('meet_date', { ascending: true });
      
      if (error) throw error;
      
      setTrackMeets(data || []);
      
      // Fetch event counts for all meets
      if (data && data.length > 0) {
        await fetchEventCounts(data.map(meet => meet.id));
        await fetchMeetAthletes(data.map(meet => meet.id));
      }
    } catch (error) {
      console.error('Error fetching track meets:', error);
      toast({
        title: 'Error fetching track meets',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch event counts for meets
  const fetchEventCounts = async (meetIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('meet_events')
        .select('meet_id')
        .in('meet_id', meetIds);
      
      if (error) throw error;
      
      // Count events by meet_id
      const counts: Record<string, number> = {};
      meetIds.forEach(id => counts[id] = 0);
      
      data?.forEach(event => {
        counts[event.meet_id] = (counts[event.meet_id] || 0) + 1;
      });
      
      setMeetEventCounts(counts);
    } catch (error) {
      console.error('Error fetching event counts:', error);
    }
  };
  
  // Fetch athletes assigned to meets
  const fetchMeetAthletes = async (meetIds: string[]) => {
    try {
      const { data: meetEvents, error: eventsError } = await supabase
        .from('meet_events')
        .select('id, meet_id')
        .in('meet_id', meetIds);
      
      if (eventsError) throw eventsError;
      
      if (!meetEvents || meetEvents.length === 0) return;
      
      const eventIds = meetEvents.map(e => e.id);
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .select(`
          meet_event_id,
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
        .in('meet_event_id', eventIds);
      
      if (assignmentsError) throw assignmentsError;
      
      // Group athletes by meet
      const athletesByMeet: Record<string, any[]> = {};
      
      meetIds.forEach(meetId => {
        const meetEventIds = meetEvents
          .filter(e => e.meet_id === meetId)
          .map(e => e.id);
        
        const meetAthletes = assignments
          ?.filter(a => meetEventIds.includes(a.meet_event_id))
          .map(a => {
            // Properly type the athlete data
            const athleteData = a.athletes as any;
            return {
              id: athleteData?.id,
              profiles: athleteData?.profiles
            };
          })
          .filter((athlete, index, self) => 
            // Remove duplicates based on athlete ID
            athlete?.id && index === self.findIndex(a => a?.id === athlete?.id)
          ) || [];
        
        athletesByMeet[meetId] = meetAthletes;
      });
      
      setMeetAthletes(athletesByMeet);
    } catch (error) {
      console.error('Error fetching meet athletes:', error);
    }
  };
  
  // Fetch list of athletes coached by the current coach
  const fetchAthletes = async () => {
    try {
      // First get the list of athlete IDs this coach coaches (only approved relationships)
      const { data: coachAthleteData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user?.id)
        .eq('approval_status', 'approved'); // Only get approved relationships
      
      if (relationError) throw relationError;
      
      if (!coachAthleteData || coachAthleteData.length === 0) {
        setAthletes([]);
        return;
      }
      
      // Then fetch the profiles for these athletes
      const athleteIds = coachAthleteData.map((row: any) => row.athlete_id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', athleteIds);
      
      if (profileError) throw profileError;
      
      const formattedAthletes = profileData?.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`
      })) || [];
      
      setAthletes(formattedAthletes);
    } catch (error) {
      console.error('Error fetching athletes:', error);
    }
  };
  
  // Fetch standard events
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
  
  // Fetch events for a specific meet
  const fetchMeetEvents = async (meetId: string) => {
    try {
      setAssignmentLoading(true);
      
      const { data, error } = await supabase
        .from('meet_events')
        .select(`
          id,
          meet_id,
          event_id,
          event_name,
          event_day,
          start_time,
          created_at,
          updated_at,
          event:event_id (
            id,
            name,
            category
          )
        `)
        .eq('meet_id', meetId)
        .order('event_day, start_time, event_name');
      
      if (error) throw error;
      
      console.log('Fetched meet events:', data);
      // Cast the data to MeetEvent[] to satisfy TypeScript
      setMeetEvents(data as unknown as MeetEvent[]);
      
      // Fetch athlete assignments for these events
      if (data && data.length > 0) {
        await fetchAthleteAssignments(data.map((event: any) => event.id));
      } else {
        // If no events, set empty assignments
        setAthleteAssignments({});
      }
    } catch (error) {
      console.error('Error fetching meet events:', error);
      toast({
        title: 'Error loading events',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setMeetEvents([]);
      setAthleteAssignments({});
    } finally {
      setAssignmentLoading(false);
    }
  };
  
  // Fetch athlete assignments for meet events
  const fetchAthleteAssignments = async (eventIds: string[]) => {
    try {
      if (!eventIds.length) return;
      
      setAssignmentLoading(true);
      
      const { data, error } = await supabase
        .from('athlete_meet_events')
        .select(`
          id,
          athlete_id,
          meet_event_id
        `)
        .in('meet_event_id', eventIds);
      
      if (error) throw error;
      
      // Organize assignments by event
      const assignments: Record<string, string[]> = {};
      
      // Initialize empty arrays for all event IDs
      eventIds.forEach(eventId => {
        assignments[eventId] = [];
      });
      
      // Then populate with actual assignments
      data?.forEach((assignment: any) => {
        if (assignments[assignment.meet_event_id]) {
          assignments[assignment.meet_event_id].push(assignment.athlete_id);
        } else {
          assignments[assignment.meet_event_id] = [assignment.athlete_id];
        }
      });
      
      setAthleteAssignments(assignments);
    } catch (error) {
      console.error('Error fetching athlete assignments:', error);
      toast({
        title: 'Error loading assignments',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Open the form modal for creating a new track meet
  const handleCreateMeet = () => {
    setIsEditing(false);
    setCurrentMeet(null);
    onFormOpen();
  };

  // Open the form modal for editing an existing track meet
  const handleEditMeet = (meet: TrackMeet) => {
    setIsEditing(true);
    setCurrentMeet(meet);
    onFormOpen();
  };

  // Handle track meet deletion
  const handleDeleteMeet = async () => {
    if (!currentMeet) return;
    
    try {
      // First, delete all events associated with this meet
      const { error: eventsError } = await supabase
        .from('meet_events')
        .delete()
        .eq('meet_id', currentMeet.id);
        
      if (eventsError) throw eventsError;
      
      // Also delete any athlete assignments for this meet's events
      const { error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .delete()
        .eq('meet_id', currentMeet.id);
        
      if (assignmentsError) {
        console.error('Error deleting athlete assignments:', assignmentsError);
        // Continue with meet deletion even if assignments deletion fails
      }
      
      // Then delete the meet itself
      const { error } = await supabase
        .from('track_meets')
        .delete()
        .eq('id', currentMeet.id);
        
      if (error) throw error;
      
      toast({
        title: 'Track meet deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Remove the meet from the local state
      setTrackMeets(prev => prev.filter(meet => meet.id !== currentMeet.id));
      
      onDeleteConfirmClose();
    } catch (error) {
      console.error('Error deleting track meet:', error);
      toast({
        title: 'Error deleting track meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handler for event form submission
  const onSubmitEvent = async (data: MeetEventFormData) => {
    try {
      if (!currentMeet) return;
      
      // Prepare the data with proper type conversion
      const eventData = {
        meet_id: currentMeet.id,
        event_name: data.event_name.trim(),
        event_date: data.event_date || null,
        event_day: data.event_day ? parseInt(data.event_day.toString(), 10) : null,
        start_time: data.start_time || null,
        heat: data.heat ? parseInt(data.heat.toString(), 10) : null,
        event_type: data.event_type || null,
        run_time: data.run_time || null
      };
      
      if (isEditingEvent && currentMeetEvent) {
        // Update existing event
        const { error } = await supabase
          .from('meet_events')
          .update(eventData)
          .eq('id', currentMeetEvent.id);
        
        if (error) throw error;
        
        toast({
          title: 'Event updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('meet_events')
          .insert([eventData]);
        
        if (error) throw error;
        
        toast({
          title: 'Event added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      // Refresh events for this meet
      await fetchMeetEvents(currentMeet.id);
      onEventDrawerClose();
      // Reset the form after successful submission
      resetEvent();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error saving event',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Function to generate maps link
  const generateMapsLink = (venueName?: string, city?: string, state?: string) => {
    if (!venueName && !city && !state) return null;
    
    const query = [venueName, city, state].filter(Boolean).join(', ');
    const encodedQuery = encodeURIComponent(query);
    
    // Detect if user is on iOS/macOS for Apple Maps, otherwise use Google Maps
    const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
    
    if (isAppleDevice) {
      return `maps://maps.apple.com/?q=${encodedQuery}`;
    } else {
      return `https://maps.google.com/?q=${encodedQuery}`;
    }
  };

  // Render UI
  return (
    <Box py={8} bg={pageBackgroundColor} minH="100vh">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color={textColor}>Track Meets</Heading>
        <HStack spacing={2}>
          <HStack spacing={2}>
            <Tooltip label="Set your location for travel times">
              <IconButton
                icon={<FaMapMarkerAlt />}
                aria-label="Set location"
                onClick={onLocationSetupOpen}
                variant="ghost"
                colorScheme="green"
                size="lg" 
              />
            </Tooltip>
            <CurrentLocationDisplay />
          </HStack>
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            onClick={handleCreateMeet}
            size="lg"
            shadow="md"
          >
            Create New Meet
          </Button>
        </HStack>
      </Flex>
      
      {loading ? (
        <Flex justify="center" my={8}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
        </Flex>
      ) : trackMeets.length === 0 ? (
        <Box 
          p={8} 
          bg={bgColor} 
          borderRadius="xl" 
          shadow="lg" 
          textAlign="center"
          borderWidth="2px"
          borderColor={borderColor}
        >
          <Text mb={4} fontSize="lg" color={mutedTextColor}>
            You haven't created any track meets yet.
          </Text>
          <Button colorScheme="blue" onClick={handleCreateMeet} size="lg">
            Create Your First Meet
          </Button>
        </Box>
      ) : (
        <VStack spacing={6} align="stretch">
          {trackMeets.map((meet) => (
            <Box 
              key={meet.id} 
              p={6} 
              borderWidth="2px" 
              borderRadius="xl" 
              shadow="lg"
              bg={bgColor}
              borderColor={borderColor}
              _hover={{ 
                shadow: "xl", 
                borderColor: hoverBorderColor,
                transform: 'translateY(-2px)'
              }}
              transition="all 0.2s ease"
            >
              <Flex justify="space-between" align="flex-start">
                <VStack align="start" spacing={4} flex="1">
                  <Flex justify="space-between" align="flex-start" w="full">
                    <VStack align="start" spacing={2}>
                      <Heading size="lg" color={textColor}>
                        {meet.name}
                      </Heading>
                      <Badge 
                        colorScheme={
                          meet.status === 'Completed' ? 'green' : 
                          meet.status === 'Cancelled' ? 'red' : 'blue'
                        }
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="sm"
                        fontWeight="bold"
                      >
                        {meet.status}
                      </Badge>
                    </VStack>
                  </Flex>
                  
                  {/* Date Information */}
                  <VStack align="start" spacing={2} w="full">
                    <HStack spacing={3}>
                      <Icon as={FaCalendarAlt} color="blue.500" boxSize={5} />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="md" color={subtextColor} fontWeight="medium">
                          {format(new Date(meet.meet_date), 'MMMM d, yyyy')}
                          {meet.end_date && meet.end_date !== meet.meet_date && (
                            <Text as="span" color="blue.500" fontWeight="semibold">
                              {' → ' + format(new Date(meet.end_date), 'MMMM d, yyyy')}
                            </Text>
                          )}
                        </Text>
                        {meet.end_date && meet.end_date !== meet.meet_date && (
                          <Text fontSize="sm" color="blue.600" fontWeight="medium">
                            Multi-day event
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    
                    {/* Location Information */}
                    {(meet.city || meet.state || meet.venue_name) && (
                      <HStack spacing={3} align="start">
                        <Icon as={FaMapMarkerAlt} color="red.500" boxSize={5} />
                        <VStack align="start" spacing={1} flex="1">
                          {meet.venue_name && (
                            <Text fontSize="md" color={subtextColor} fontWeight="medium">
                              {meet.venue_name}
                              {meet.venue_type && (
                                <Badge ml={2} colorScheme="purple" fontSize="xs">
                                  {meet.venue_type}
                                </Badge>
                              )}
                            </Text>
                          )}
                          {(meet.city || meet.state) && (
                            <Text fontSize="sm" color={mutedTextColor}>
                              {[meet.city, meet.state].filter(Boolean).join(', ')}
                            </Text>
                          )}
                          {/* Maps Link */}
                          {generateMapsLink(meet.venue_name, meet.city, meet.state) && (
                            <Button
                              as="a"
                              href={generateMapsLink(meet.venue_name, meet.city, meet.state)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="xs"
                              variant="outline"
                              colorScheme="green"
                              leftIcon={<Icon as={FaMapMarkerAlt} />}
                              mt={1}
                            >
                              Open in Maps
                            </Button>
                          )}
                          {/* Travel Time Display */}
                          <TravelTimeDisplay
                            city={meet.city}
                            state={meet.state}
                            venueName={meet.venue_name}
                            size="sm"
                          />
                        </VStack>
                      </HStack>
                    )}
                    
                    {/* Athletes Attending */}
                    {meetAthletes[meet.id] && meetAthletes[meet.id].length > 0 && (
                      <HStack spacing={3} align="start">
                        <Icon as={FaRunning} color="orange.500" boxSize={5} />
                        <VStack align="start" spacing={1} flex="1">
                          <Text fontSize="md" color="orange.600" fontWeight="medium">
                            Athletes Attending ({meetAthletes[meet.id].length})
                          </Text>
                          <Box>
                            {meetAthletes[meet.id].slice(0, 3).map((athlete: any, index: number) => (
                              <Badge 
                                key={athlete?.id} 
                                colorScheme="orange" 
                                variant="outline" 
                                mr={2} 
                                mb={1}
                                size="sm"
                              >
                                {athlete?.profiles?.first_name} {athlete?.profiles?.last_name}
                              </Badge>
                            ))}
                            {meetAthletes[meet.id].length > 3 && (
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                +{meetAthletes[meet.id].length - 3} more athletes
                              </Text>
                            )}
                          </Box>
                        </VStack>
                      </HStack>
                    )}
                    
                    {/* Event Count and Join Link */}
                    <HStack spacing={6}>
                      <HStack spacing={2}>
                        <Icon as={FaRunning} color="green.500" boxSize={4} />
                        <Text fontSize="sm" color={subtextColor} fontWeight="medium">
                          Events: <Text as="span" color={textColor} fontWeight="bold">
                            {meetEventCounts[meet.id] || 0}
                          </Text>
                        </Text>
                      </HStack>
                      
                      {meet.join_link && (
                        <Button
                          as="a"
                          href={meet.join_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          leftIcon={<Icon as={FaCalendarAlt} />}
                        >
                          Registration
                        </Button>
                      )}
                    </HStack>
                    
                    {/* Description */}
                    {meet.description && (
                      <Box 
                        p={3} 
                        bg={descriptionBoxBg} 
                        borderRadius="md" 
                        borderLeft="4px solid" 
                        borderLeftColor="blue.400"
                        w="full"
                      >
                        <Text fontSize="sm" color={mutedTextColor} lineHeight="1.5">
                          {meet.description}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </VStack>
                
                <HStack spacing={3}>
                  <Tooltip label="Manage Events" hasArrow>
                    <IconButton
                      aria-label="Manage events"
                      icon={<FaRunning />}
                      onClick={() => {
                        setCurrentMeet(meet);
                        fetchMeetEvents(meet.id);
                        onEventDrawerOpen();
                      }}
                      variant="solid"
                      colorScheme="teal"
                      size="lg"
                      shadow="md"
                      _hover={{ transform: 'scale(1.05)' }}
                    />
                  </Tooltip>
                  <Tooltip label="Assign Athletes to Events" hasArrow>
                    <IconButton
                      aria-label="Assign athletes to events"
                      icon={<FaUserPlus />}
                      onClick={() => {
                        setCurrentMeet(meet);
                        fetchMeetEvents(meet.id);
                        onAssignDrawerOpen();
                      }}
                      variant="solid"
                      colorScheme="green"
                      size="lg"
                      shadow="md"
                      _hover={{ transform: 'scale(1.05)' }}
                    />
                  </Tooltip>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<FaEllipsisV />}
                      variant="outline"
                      size="lg"
                      borderWidth="2px"
                      _hover={{ 
                        bg: grayHoverBg,
                        borderColor: grayHoverBorderColor
                      }}
                    />
                    <MenuList 
                      bg={bgColor} 
                      borderColor={borderColor} 
                      borderWidth="2px"
                      shadow="xl"
                    >
                      <MenuItem 
                        icon={<FaEdit />} 
                        onClick={() => handleEditMeet(meet)}
                        color={subtextColor}
                        _hover={{ bg: menuHoverBg }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem 
                        icon={<FaTrash />} 
                        onClick={() => {
                          setCurrentMeet(meet);
                          onDeleteConfirmOpen();
                        }}
                        color="red.500"
                        _hover={{ bg: menuDeleteHoverBg }}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
      
      {/* Create/Edit Track Meet Modal */}
      <MeetFormDrawer
        isOpen={isFormOpen}
        onClose={onFormClose}
        isEditing={isEditing}
        currentMeet={currentMeet as TrackMeetData}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        showCoachSelection={false}
      />
      
      {/* Event Drawer */}
      <Drawer
        isOpen={isEventDrawerOpen}
        placement="right"
        onClose={onEventDrawerClose}
        size="lg"
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg={bgColor} borderLeft="3px solid" borderColor="blue.500">
          <DrawerHeader 
            borderBottomWidth="2px" 
            borderColor={borderColor}
            bg={eventDrawerHeaderBg}
            color={eventDrawerHeaderColor}
            fontSize="lg"
            fontWeight="bold"
          >
            {isEditingEvent ? 'Edit Event' : 'Add Event'}
            {currentMeet && ` - ${currentMeet.name}`}
          </DrawerHeader>
          <DrawerCloseButton 
            color={eventDrawerHeaderColor}
            size="lg"
          />
          
          <DrawerBody py={6}>
            <form onSubmit={handleSubmitEvent(onSubmitEvent)}>
              <VStack spacing={6} pt={4}>
                <FormControl isInvalid={!!eventErrors.event_name} isRequired>
                  <FormLabel 
                    fontSize="md" 
                    fontWeight="semibold"
                    color={subtextColor}
                  >
                    Event Name
                  </FormLabel>
                  <Input 
                    {...registerEvent('event_name', { required: 'Event name is required' })} 
                    placeholder="e.g. 100m Dash"
                    size="lg"
                    borderWidth="2px"
                    borderColor={borderColor}
                    _hover={{ borderColor: hoverBorderColor }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    bg={whiteGrayBg}
                  />
                  <FormErrorMessage color="red.500" fontWeight="medium">
                    {eventErrors.event_name?.message}
                  </FormErrorMessage>
                </FormControl>
                
                <HStack spacing={4} w="full">
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Event Date
                    </FormLabel>
                    <Input 
                      type="date" 
                      {...registerEvent('event_date')} 
                      placeholder="Specific date for this event"
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Day Number
                    </FormLabel>
                    <Input 
                      type="number" 
                      {...registerEvent('event_day')} 
                      placeholder="1, 2, 3..."
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Start Time
                    </FormLabel>
                    <Input 
                      type="time" 
                      {...registerEvent('start_time')} 
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Heat Number
                    </FormLabel>
                    <Input 
                      type="number" 
                      {...registerEvent('heat')} 
                      placeholder="1, 2, 3..."
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Event Type
                    </FormLabel>
                    <Select 
                      {...registerEvent('event_type')} 
                      placeholder="Select event type"
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    >
                      <option value="Preliminary">Preliminary</option>
                      <option value="Qualifier">Qualifier</option>
                      <option value="Semifinal">Semifinal</option>
                      <option value="Finals">Finals</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Run Time (Post-Event)
                    </FormLabel>
                    <Input 
                      {...registerEvent('run_time')} 
                      placeholder="e.g. 10.85, 2:05.43"
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </form>
          </DrawerBody>
          
          <DrawerFooter 
            borderTopWidth="2px" 
            borderColor={borderColor}
            bg={footerBg}
          >
            <Button 
              variant="outline" 
              colorScheme="gray"
              mr={3} 
              onClick={onEventDrawerClose}
              size="lg"
              borderWidth="2px"
            >
              Cancel
            </Button>
            <Button 
              variant="solid"
              colorScheme="blue" 
              isLoading={isEventSubmitting}
              onClick={handleSubmitEvent(onSubmitEvent)}
              size="lg"
              shadow="md"
            >
              {isEditingEvent ? 'Update' : 'Add Event'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* Assign Athletes Drawer */}
      <Drawer
        isOpen={isAssignDrawerOpen}
        placement="right"
        onClose={onAssignDrawerClose}
        size="xl"
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg={bgColor} borderLeft="3px solid" borderColor="green.500">
          <DrawerHeader 
            borderBottomWidth="2px" 
            borderColor={borderColor}
            bg={assignDrawerHeaderBg}
            color={assignDrawerHeaderColor}
            fontSize="lg"
            fontWeight="bold"
          >
            Assign Athletes to Events
            {currentMeet && ` - ${currentMeet.name}`}
          </DrawerHeader>
          <DrawerCloseButton 
            color={assignDrawerHeaderColor}
            size="lg"
          />
          
          <DrawerBody py={6}>
            {assignmentLoading ? (
              <Flex justify="center" my={8}>
                <Spinner size="xl" color="green.500" thickness="4px" />
              </Flex>
            ) : meetEvents.length === 0 ? (
              <Box 
                p={8} 
                textAlign="center" 
                bg={yellowBoxBg}
                borderRadius="xl"
                borderWidth="2px"
                borderColor={yellowBoxBorder}
              >
                <Text fontSize="lg" color={yellowBoxText}>
                  No events have been added to this meet yet.
                </Text>
              </Box>
            ) : (
              <VStack spacing={6} align="stretch">
                {meetEvents.map((event) => (
                  <Box 
                    key={event.id} 
                    p={6} 
                    borderWidth="2px" 
                    borderRadius="xl"
                    shadow="md"
                    bg={whiteGrayBg}
                    borderColor={borderColor}
                    _hover={{ shadow: "lg", borderColor: hoverBoxBorderColor }}
                  >
                    <Heading 
                      size="md" 
                      mb={4}
                      color={textColor}
                    >
                      {event.event_name || (event.event && event.event.name) || 'Event'}
                    </Heading>
                    <FormControl>
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={subtextColor}
                        mb={3}
                      >
                        Assign Athletes
                      </FormLabel>
                      <CheckboxGroup 
                        value={athleteAssignments[event.id] || []}
                        onChange={(values) => {
                          setAthleteAssignments(prev => ({
                            ...prev,
                            [event.id]: values as string[]
                          }));
                        }}
                      >
                        <VStack align="start" spacing={3}>
                          {athletes.map((athlete) => (
                            <Checkbox 
                              key={athlete.id} 
                              value={athlete.id}
                              size="lg"
                              colorScheme="green"
                              borderWidth="2px"
                              color={subtextColor}
                              fontSize="md"
                              fontWeight="medium"
                            >
                              {athlete.name}
                            </Checkbox>
                          ))}
                        </VStack>
                      </CheckboxGroup>
                    </FormControl>
                  </Box>
                ))}
              </VStack>
            )}
          </DrawerBody>
          
          <DrawerFooter 
            borderTopWidth="2px" 
            borderColor={borderColor}
            bg={footerBg}
          >
            <Button variant="outline" mr={3} onClick={onAssignDrawerClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              isDisabled={assignmentLoading}
              onClick={async () => {
                try {
                  setAssignmentLoading(true);
                  
                  // Get current assignments for comparison
                  const { data: currentAssignments, error: fetchError } = await supabase
                    .from('athlete_meet_events')
                    .select('id, athlete_id, meet_event_id')
                    .in('meet_event_id', Object.keys(athleteAssignments));
                  
                  if (fetchError) throw fetchError;
                  
                  // Process each event
                  for (const eventId of Object.keys(athleteAssignments)) {
                    const currentAthletes = currentAssignments
                      ?.filter((a: any) => a.meet_event_id === eventId)
                      .map((a: any) => a.athlete_id) || [];
                    
                    const selectedAthletes = athleteAssignments[eventId] || [];
                    
                    // Athletes to remove (in current but not in selected)
                    const athletesToRemove = currentAssignments
                      ?.filter((a: any) => 
                        a.meet_event_id === eventId && 
                        !selectedAthletes.includes(a.athlete_id)
                      )
                      .map((a: any) => a.id) || [];
                    
                    // Athletes to add (in selected but not in current)
                    const athletesToAdd = selectedAthletes
                      .filter((athleteId: string) => 
                        !currentAthletes.includes(athleteId)
                      );
                    
                    // Process removals if needed
                    if (athletesToRemove.length > 0) {
                      const { error: removeError } = await supabase
                        .from('athlete_meet_events')
                        .delete()
                        .in('id', athletesToRemove);
                      
                      if (removeError) throw removeError;
                    }
                    
                    // Process additions if needed
                    if (athletesToAdd.length > 0) {
                      const newAssignments = athletesToAdd.map((athleteId: string) => ({
                        athlete_id: athleteId,
                        meet_event_id: eventId,
                        assigned_by: user?.id // Track which coach made the assignment
                      }));
                      
                      const { error: addError } = await supabase
                        .from('athlete_meet_events')
                        .insert(newAssignments);
                      
                      if (addError) throw addError;
                    }
                  }
                  
                  toast({
                    title: 'Assignments saved',
                    description: 'Athletes have been assigned to events',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                  
                  // Refresh assignments data
                  if (currentMeet) {
                    await fetchMeetEvents(currentMeet.id);
                  }
                  
                  onAssignDrawerClose();
                } catch (error) {
                  console.error('Error saving assignments:', error);
                  toast({
                    title: 'Error saving assignments',
                    description: (error as Error).message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                } finally {
                  setAssignmentLoading(false);
                }
              }}
            >
              Save Assignments
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent 
          bg={bgColor} 
          borderWidth="2px" 
          borderColor="red.500"
          shadow="2xl"
        >
          <ModalHeader 
            bg={deleteModalHeaderBg}
            color={deleteModalHeaderColor}
            borderBottomWidth="2px"
            borderColor="red.500"
            fontSize="xl"
            fontWeight="bold"
          >
            Confirm Deletion
          </ModalHeader>
          <ModalCloseButton 
            color={deleteModalHeaderColor}
            size="lg"
          />
          <ModalBody py={6}>
            <Text 
              fontSize="md" 
              color={subtextColor}
              lineHeight="1.6"
            >
              Are you sure you want to delete "{currentMeet?.name}"? This will also delete all events
              associated with this meet and cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter 
            borderTopWidth="2px" 
            borderColor={borderColor}
            bg={footerBg}
          >
            <Button 
              variant="outline" 
              mr={3} 
              onClick={onDeleteConfirmClose}
              size="lg"
              borderWidth="2px"
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleDeleteMeet}
              size="lg"
              shadow="md"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Location Setup Modal */}
      <LocationSetup
        isOpen={isLocationSetupOpen}
        onClose={onLocationSetupClose}
      />
    </Box>
  );
} 