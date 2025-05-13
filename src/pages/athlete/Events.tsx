import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Card,
  CardBody,
  CardHeader,
  Divider,
  SimpleGrid,
  Textarea,
  Stack
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMapMarkerAlt, FaEllipsisV, FaRunning, FaStopwatch, FaSync } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
// Use these interfaces instead of the imported ones
// import type { TrackMeet, TrackMeetFormData, MeetEvent } from '../../types/trackMeets';

// Update TrackMeet and TrackMeetFormData interfaces to include description
interface TrackMeet {
  id: string;
  name: string;
  meet_date: string;
  city?: string;
  state?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  athlete_id?: string;
}

interface TrackMeetFormData {
  name: string;
  meet_date: string;
  city?: string;
  state?: string;
  status?: string;
  description?: string;
  coach_id?: string;
}

interface MeetEvent {
  id: string;
  event_name: string;
  event_day?: number;
  start_time?: string;
  meet_id: string;
}

// Event creation form data
interface EventFormData {
  event_name: string;
  event_day: string;
  start_time: string;
}

// Add this AssignedMeets component within the AthleteEvents.tsx file
function AssignedMeets() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myEvents, setMyEvents] = useState<{ meet: TrackMeet, events: MeetEvent[] }[]>([]);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Function to fetch events the athlete is assigned to
  const fetchMyEvents = async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      
      // 1. Get all event assignments for this athlete
      const { data: assignments, error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .select('meet_event_id')
        .eq('athlete_id', user.id);
        
      if (assignmentsError) throw assignmentsError;
      
      if (!assignments || assignments.length === 0) {
        setMyEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // 2. Get the details of these events
      const eventIds = assignments.map(a => a.meet_event_id);
      
      const { data: eventDetails, error: eventsError } = await supabase
        .from('meet_events')
        .select('*, meet_id')
        .in('id', eventIds);
        
      if (eventsError) throw eventsError;
      
      if (!eventDetails || eventDetails.length === 0) {
        setMyEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // 3. Get unique meet IDs
      const meetIds = [...new Set(eventDetails.map(e => e.meet_id))];
      
      // 4. Get meet details
      const { data: meetDetails, error: meetsError } = await supabase
        .from('track_meets')
        .select('*')
        .in('id', meetIds);
        
      if (meetsError) throw meetsError;
      
      // 5. Group events by meet
      const eventsGroupedByMeet = meetDetails?.map(meet => {
        const meetEvents = eventDetails.filter(event => event.meet_id === meet.id);
        return {
          meet,
          events: meetEvents
        };
      }) || [];
      
      // 6. Sort by date (most recent/upcoming first)
      eventsGroupedByMeet.sort((a, b) => {
        const dateA = new Date(a.meet.meet_date).getTime();
        const dateB = new Date(b.meet.meet_date).getTime();
        return dateA - dateB; // Ascending order (upcoming events first)
      });
      
      setMyEvents(eventsGroupedByMeet);
      
    } catch (error) {
      console.error('Error fetching my events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch events on component mount
  useEffect(() => {
    if (user?.id) {
      fetchMyEvents();
    }
  }, [user?.id]);
  
  // Format date for display
  const formatMeetDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  // Format time for display
  const formatEventTime = (timeString?: string) => {
    if (!timeString) return 'TBD';
    
    try {
      // Format time string (assuming it's in HH:MM:SS format)
      return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  };
  
  // Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed': return 'green';
      case 'Cancelled': return 'red';
      case 'Upcoming': return 'blue';
      default: return 'blue';
    }
  };
  
  // Get event status (computed based on meet date and meet status)
  const getEventStatus = (meet: TrackMeet) => {
    if (meet.status === 'Cancelled') return 'Cancelled';
    if (meet.status === 'Completed') return 'Completed';
    
    const meetDate = new Date(meet.meet_date);
    const today = new Date();
    
    // Set times to beginning of day for accurate comparison
    meetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (meetDate < today) {
      return 'Past';
    } else if (meetDate.getTime() === today.getTime()) {
      return 'Today';
    } else {
      return 'Upcoming';
    }
  };
  
  return (
    <Box>
      <Flex justify="space-between" mb={6} align="center">
        <Tooltip label="Refresh assigned events">
          <IconButton
            icon={<FaSync />}
            aria-label="Refresh events"
            isLoading={refreshing}
            onClick={fetchMyEvents}
            colorScheme="blue"
            size="sm"
          />
        </Tooltip>
      </Flex>
      
      {loading ? (
        <Flex justify="center" my={8}>
          <Spinner size="xl" />
        </Flex>
      ) : myEvents.length === 0 ? (
        <Box p={6} bg={cardBg} borderRadius="lg" shadow="md" textAlign="center">
          <Text fontSize="lg">You haven't been assigned to any events yet.</Text>
          <Text mt={2} fontSize="sm" color="gray.500">
            Create a meet or ask your coach to assign you to events.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
          {myEvents.map(({ meet, events }) => (
            <Card key={meet.id} borderRadius="lg" overflow="hidden" boxShadow="md" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader bg="blue.500" py={4} px={5}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md" color="white">{meet.name}</Heading>
                  <Badge 
                    colorScheme={getStatusColor(meet.status)} 
                    variant="solid" 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                  >
                    {meet.status || getEventStatus(meet)}
                  </Badge>
                </Flex>
              </CardHeader>
              
              <CardBody p={5}>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <FaCalendarAlt color="blue" />
                    <Text>{formatMeetDate(meet.meet_date)}</Text>
                  </HStack>
                  
                  {(meet.city || meet.state) && (
                    <HStack>
                      <FaMapMarkerAlt color="blue" />
                      <Text>{[meet.city, meet.state].filter(Boolean).join(', ')}</Text>
                    </HStack>
                  )}
                  
                  <Divider my={2} />
                  
                  <Text fontWeight="bold" fontSize="sm" color="blue.600">
                    Your Events ({events.length}):
                  </Text>
                  
                  <VStack align="stretch" spacing={2}>
                    {events.map((event) => (
                      <Box key={event.id} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                        <Flex justify="space-between" mb={1}>
                          <HStack>
                            <FaRunning color="blue" />
                            <Text fontWeight="medium">{event.event_name}</Text>
                          </HStack>
                        </Flex>
                        
                        <HStack mt={2} spacing={4} fontSize="sm" color="gray.600">
                          {event.event_day && (
                            <Text>Day {event.event_day}</Text>
                          )}
                          
                          {event.start_time && (
                            <HStack>
                              <FaStopwatch />
                              <Text>{formatEventTime(event.start_time)}</Text>
                            </HStack>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export function AthleteEvents() {
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEventsOpen, onOpen: onEventsOpen, onClose: onEventsClose } = useDisclosure();
  const { isOpen: isAddEventOpen, onOpen: onAddEventOpen, onClose: onAddEventClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const [trackMeets, setTrackMeets] = useState<TrackMeet[]>([]);
  const [coachMeets, setCoachMeets] = useState<TrackMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeet, setCurrentMeet] = useState<TrackMeet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [meetEvents, setMeetEvents] = useState<MeetEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [eventFormData, setEventFormData] = useState({
    event_name: '',
    event_day: '1',
    start_time: ''
  });
  const { user } = useAuth();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');

  // Fetch track meets on component mount
  useEffect(() => {
    if (user) {
      fetchTrackMeets();
      fetchCoaches();
      fetchCoachMeets();
    }
  }, [user]);

  // Fetch track meets created by this athlete
  const fetchTrackMeets = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('track_meets')
        .select('*')
        .eq('athlete_id', user?.id)
        .order('meet_date', { ascending: true });
      
      if (error) throw error;
      
      setTrackMeets(data || []);
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
  
  // Fetch meets created by this athlete's coaches
  const fetchCoachMeets = async () => {
    try {
      // First get the athlete's coaches
      const { data: coachData, error: coachError } = await supabase
        .from('coach_athletes')
        .select('coach_id')
        .eq('athlete_id', user?.id);
      
      if (coachError) throw coachError;
      
      if (!coachData || coachData.length === 0) return;
      
      // Then get meets created by those coaches
      const coachIds = coachData.map((c: any) => c.coach_id);
      
      const { data, error } = await supabase
        .from('track_meets')
        .select('*')
        .in('coach_id', coachIds)
        .order('meet_date', { ascending: true });
      
      if (error) throw error;
      
      setCoachMeets(data || []);
    } catch (error) {
      console.error('Error fetching coach meets:', error);
    }
  };
  
  // Fetch coaches for this athlete
  const fetchCoaches = async () => {
    try {
      // First get the coach IDs for this athlete
      const { data: athleteCoachData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('coach_id')
        .eq('athlete_id', user?.id);
      
      if (relationError) throw relationError;
      
      if (!athleteCoachData || athleteCoachData.length === 0) {
        setCoaches([]);
        return;
      }
      
      // Then fetch the profile data for those coaches
      const coachIds = athleteCoachData.map((row: any) => row.coach_id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', coachIds);
      
      if (profileError) throw profileError;
      
      const formattedCoaches = profileData?.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`
      })) || [];
      
      setCoaches(formattedCoaches);
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };
  
  // Fetch events for a specific meet
  const fetchMeetEvents = async (meetId: string) => {
    try {
      const { data, error } = await supabase
        .from('meet_events')
        .select(`
          *,
          event:event_id (
            name,
            category
          ),
          athlete_assignments:athlete_meet_events(
            id,
            athlete_id
          )
        `)
        .eq('meet_id', meetId);
      
      if (error) throw error;
      
      setMeetEvents(data || []);
      
      // Find events the athlete is already assigned to
      const athleteEvents = data
        ?.filter((event: any) => 
          event.athlete_assignments.some((assignment: any) => 
            assignment.athlete_id === user?.id
          )
        )
        .map((event: any) => event.id) || [];
      
      setSelectedEvents(athleteEvents);
      
    } catch (error) {
      console.error('Error fetching meet events:', error);
    }
  };

  // Handle creating a new event
  const handleCreateEvent = async () => {
    if (!currentMeet) return;
    
    try {
      // Validate form
      if (!eventFormData.event_name.trim()) {
        toast({
          title: 'Event name is required',
          status: 'error',
          duration: 2000,
          isClosable: true
        });
        return;
      }

      // Create the event
      const { data: newEvent, error } = await supabase
        .from('meet_events')
        .insert([{
          meet_id: currentMeet.id,
          event_name: eventFormData.event_name,
          event_day: parseInt(eventFormData.event_day),
          start_time: eventFormData.start_time || null
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Also assign this athlete to the event
      if (newEvent) {
        const { error: assignError } = await supabase
          .from('athlete_meet_events')
          .insert([{
            athlete_id: user?.id,
            meet_event_id: newEvent.id
          }]);
          
        if (assignError) throw assignError;
        
        // Add to selected events
        setSelectedEvents(prev => [...prev, newEvent.id]);
      }
      
      // Reset form and close dialog
      setEventFormData({
        event_name: '',
        event_day: '1',
        start_time: ''
      });
      
      // Refresh events list
      fetchMeetEvents(currentMeet.id);
      
      onAddEventClose();
      
      toast({
        title: 'Event created successfully',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error creating event',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
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

  // Handle form submission for creating/updating a track meet
  const onSubmit = async (data: TrackMeetFormData) => {
    try {
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
        const { data: newMeet, error } = await supabase
          .from('track_meets')
          .insert([{
            ...data,
            athlete_id: user?.id
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        // Set the created meet as current to add events
        if (newMeet) {
          setCurrentMeet(newMeet);
        }
        
        toast({
          title: 'Track meet created',
          status: 'success',
          description: 'Now you can add events to this meet',
          duration: 2000,
          isClosable: true,
        });

        // Open the event creation modal
        onFormClose();
        fetchMeetEvents(newMeet.id);
        onEventsOpen();
      }
      
      // Refresh the track meets list
      fetchTrackMeets();
      
    } catch (error) {
      console.error('Error saving track meet:', error);
      toast({
        title: 'Error saving track meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle event selection/deselection
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };
  
  // Save athlete event selections
  const saveEventSelections = async () => {
    try {
      // First get current assignments to know what to add/remove
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('athlete_meet_events')
        .select('id, meet_event_id')
        .eq('athlete_id', user?.id)
        .in('meet_event_id', meetEvents.map(e => e.id));
      
      if (fetchError) throw fetchError;
      
      // Find assignments to remove (those that exist but aren't in selected)
      const assignmentsToRemove = currentAssignments
        ?.filter((a: any) => !selectedEvents.includes(a.meet_event_id))
        .map((a: any) => a.id) || [];
      
      // Find assignments to add (those in selected but don't exist yet)
      const currentEventIds = currentAssignments?.map((a: any) => a.meet_event_id) || [];
      const eventsToAdd = selectedEvents.filter(id => !currentEventIds.includes(id));
      
      // Remove assignments
      if (assignmentsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('athlete_meet_events')
          .delete()
          .in('id', assignmentsToRemove);
        
        if (removeError) throw removeError;
      }
      
      // Add new assignments
      if (eventsToAdd.length > 0) {
        const newAssignments = eventsToAdd.map(eventId => ({
          athlete_id: user?.id,
          meet_event_id: eventId
        }));
        
        const { error: addError } = await supabase
          .from('athlete_meet_events')
          .insert(newAssignments);
        
        if (addError) throw addError;
      }
      
      toast({
        title: 'Event selections saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      onEventsClose();
    } catch (error) {
      console.error('Error saving event selections:', error);
      toast({
        title: 'Error saving event selections',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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
  
  // Render UI
  return (
    <Box py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Track Meets</Heading>
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="blue" 
          onClick={handleCreateMeet}
        >
          Create New Meet
        </Button>
      </Flex>
      
      <Tabs isFitted variant="enclosed" mb={6}>
        <TabList>
          <Tab>My Meets</Tab>
          <Tab>Assigned Meets</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            {loading ? (
              <Flex justify="center" my={8}>
                <Spinner size="xl" />
              </Flex>
            ) : trackMeets.length === 0 ? (
              <Box p={6} bg={bgColor} borderRadius="lg" shadow="md" textAlign="center">
                <Text mb={4}>You haven't created any track meets yet.</Text>
                <Button colorScheme="blue" onClick={handleCreateMeet}>Create Your First Meet</Button>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {trackMeets.map((meet) => (
                  <Box 
                    key={meet.id} 
                    p={5} 
                    borderWidth="1px" 
                    borderRadius="lg" 
                    shadow="md"
                    bg={bgColor}
                  >
                    <Flex justify="space-between" align="flex-start">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">{meet.name}</Heading>
                        <HStack spacing={2}>
                          <FaCalendarAlt />
                          <Text>{format(new Date(meet.meet_date), 'MMMM d, yyyy')}</Text>
                        </HStack>
                        {meet.city && meet.state && (
                          <HStack spacing={2}>
                            <FaMapMarkerAlt />
                            <Text>{`${meet.city}, ${meet.state}`}</Text>
                          </HStack>
                        )}
                        <Badge colorScheme={
                          meet.status === 'Completed' ? 'green' : 
                          meet.status === 'Cancelled' ? 'red' : 'blue'
                        }>
                          {meet.status}
                        </Badge>
                      </VStack>
                      
                      <HStack>
                        <Tooltip label="Select Events">
                          <IconButton
                            aria-label="Select events"
                            icon={<FaRunning />}
                            onClick={() => {
                              setCurrentMeet(meet);
                              fetchMeetEvents(meet.id);
                              onEventsOpen();
                            }}
                            colorScheme="teal"
                            variant="outline"
                          />
                        </Tooltip>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<FaEllipsisV />}
                            variant="outline"
                          />
                          <MenuList>
                            <MenuItem icon={<FaEdit />} onClick={() => handleEditMeet(meet)}>
                              Edit
                            </MenuItem>
                            <MenuItem 
                              icon={<FaTrash />} 
                              onClick={() => {
                                // Set the current meet then show delete confirmation
                                setCurrentMeet(meet);
                                onDeleteConfirmOpen();
                              }}
                              color="red.500"
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
          </TabPanel>
          
          <TabPanel px={0}>
            <AssignedMeets />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Event Selection Modal */}
      <Modal isOpen={isEventsOpen} onClose={onEventsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Events for {currentMeet?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justifyContent="flex-end" mb={4}>
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="green" 
                size="sm" 
                onClick={onAddEventOpen}
              >
                Add New Event
              </Button>
            </Flex>
            
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Event</Th>
                  <Th>Day</Th>
                  <Th>Time</Th>
                  <Th>Participate</Th>
                </Tr>
              </Thead>
              <Tbody>
                {meetEvents.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center">No events available for this meet</Td>
                  </Tr>
                ) : (
                  meetEvents.map((event) => (
                    <Tr key={event.id}>
                      <Td>{event.event_name}</Td>
                      <Td>{event.event_day ? `Day ${event.event_day}` : '-'}</Td>
                      <Td>{event.start_time ? format(new Date(`2000-01-01T${event.start_time}`), 'h:mm a') : '-'}</Td>
                      <Td>
                        <Checkbox 
                          isChecked={selectedEvents.includes(event.id)}
                          onChange={() => toggleEventSelection(event.id)}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEventsClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={saveEventSelections}>
              Save Selections
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Event Creation Modal */}
      <Modal isOpen={isAddEventOpen} onClose={onAddEventClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Event to {currentMeet?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel htmlFor="event_name">Event Name</FormLabel>
                <Input 
                  id="event_name" 
                  value={eventFormData.event_name}
                  onChange={(e) => setEventFormData({...eventFormData, event_name: e.target.value})}
                  placeholder="e.g., 100m Sprint, Long Jump"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="event_day">Day (for multi-day meets)</FormLabel>
                <Select 
                  id="event_day" 
                  value={eventFormData.event_day}
                  onChange={(e) => setEventFormData({...eventFormData, event_day: e.target.value})}
                >
                  {[1, 2, 3, 4, 5].map(day => (
                    <option key={day} value={day}>Day {day}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="start_time">Start Time (optional)</FormLabel>
                <Input 
                  id="start_time" 
                  type="time"
                  value={eventFormData.start_time}
                  onChange={(e) => setEventFormData({...eventFormData, start_time: e.target.value})}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddEventClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleCreateEvent}>
              Create Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Create/Edit Track Meet Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Track Meet' : 'Create New Track Meet'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={(e) => {
              e.preventDefault();
              
              // Get form data
              const formData = new FormData(e.currentTarget);
              const data: TrackMeetFormData = {
                name: formData.get('name') as string,
                meet_date: formData.get('meet_date') as string,
                city: formData.get('city') as string,
                state: formData.get('state') as string,
                status: formData.get('status') as string,
                description: formData.get('description') as string
              };
              
              // Add coach_id if selected
              const coachId = formData.get('coach_id') as string;
              if (coachId) {
                data.coach_id = coachId;
              }
              
              onSubmit(data);
            }}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel htmlFor="name">Meet Name</FormLabel>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g., State Championships" 
                    defaultValue={currentMeet?.name || ''}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel htmlFor="meet_date">Date</FormLabel>
                  <Input 
                    id="meet_date" 
                    name="meet_date" 
                    type="date" 
                    defaultValue={currentMeet?.meet_date || ''}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="city">City</FormLabel>
                  <Input 
                    id="city" 
                    name="city" 
                    placeholder="e.g., Boston" 
                    defaultValue={currentMeet?.city || ''}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="state">State</FormLabel>
                  <Input 
                    id="state" 
                    name="state" 
                    placeholder="e.g., MA" 
                    defaultValue={currentMeet?.state || ''}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="status">Status</FormLabel>
                  <Select 
                    id="status" 
                    name="status" 
                    defaultValue={currentMeet?.status || 'Upcoming'}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Add any details about this meet..." 
                    defaultValue={currentMeet?.description || ''}
                  />
                </FormControl>
                
                {!isEditing && (
                  <FormControl mt={4}>
                    <FormLabel htmlFor="coach_id">Assign Coach (Optional)</FormLabel>
                    <Select id="coach_id" name="coach_id" placeholder="Select a coach">
                      {coaches.map(coach => (
                        <option key={coach.id} value={coach.id}>{coach.name}</option>
                      ))}
                    </Select>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      If you select a coach, they will be able to manage this meet and assign events.
                    </Text>
                  </FormControl>
                )}
              </VStack>
              
              <Flex justify="flex-end" mt={6}>
                <Button variant="ghost" mr={3} onClick={onFormClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" type="submit">
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </Flex>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete "{currentMeet?.name}"? This will also delete all events
              associated with this meet and cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteConfirmClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteMeet}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
    </Box>
  );
} 