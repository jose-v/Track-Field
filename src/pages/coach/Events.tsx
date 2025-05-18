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
  Checkbox
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMapMarkerAlt, FaEllipsisV, FaUserPlus, FaRunning } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import type { TrackMeet, TrackMeetFormData, MeetEvent, MeetEventFormData, AthleteWithName } from '../../types/trackMeets';

export function CoachEvents() {
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEventDrawerOpen, onOpen: onEventDrawerOpen, onClose: onEventDrawerClose } = useDisclosure();
  const { isOpen: isAssignDrawerOpen, onOpen: onAssignDrawerOpen, onClose: onAssignDrawerClose } = useDisclosure();
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Add the submit handler to be used by the form modal when it's completed
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
    }
  };
  
  // Handler for event form submission
  const onSubmitEvent = async (data: MeetEventFormData) => {
    try {
      if (!currentMeet) return;
      
      if (isEditingEvent && currentMeetEvent) {
        // Update existing event
        const { error } = await supabase
          .from('meet_events')
          .update(data)
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
          .insert([{
            ...data,
            meet_id: currentMeet.id
          }]);
        
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
      // Form will be reset after successful submission
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
  
  // Form handling setup for meet creation/editing
  // These will be used when we implement the form modals
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrackMeetFormData>({
    defaultValues: currentMeet || undefined
  });

  // Form handling setup for meet event creation/editing
  // These will be used when we implement the event form modals
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
  
  // Fetch list of athletes coached by the current coach
  const fetchAthletes = async () => {
    try {
      // First get the list of athlete IDs this coach coaches
      const { data: coachAthleteData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user?.id);
      
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
                  <Tooltip label="Manage Events">
                    <IconButton
                      aria-label="Manage events"
                      icon={<FaRunning />}
                      onClick={() => {
                        setCurrentMeet(meet);
                        fetchMeetEvents(meet.id);
                        onEventDrawerOpen();
                      }}
                      colorScheme="teal"
                      variant="outline"
                    />
                  </Tooltip>
                  <Tooltip label="Assign Athletes to Events">
                    <IconButton
                      aria-label="Assign athletes to events"
                      icon={<FaUserPlus />}
                      onClick={() => {
                        setCurrentMeet(meet);
                        fetchMeetEvents(meet.id);
                        onAssignDrawerOpen();
                      }}
                      colorScheme="green"
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
                          // Handle delete
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
      
      {/* Create/Edit Track Meet Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Track Meet' : 'Create New Track Meet'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel>Meet Name</FormLabel>
                  <Input {...register('name', { required: 'Name is required' })} />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.meet_date} isRequired>
                  <FormLabel>Meet Date</FormLabel>
                  <Input type="date" {...register('meet_date', { required: 'Date is required' })} />
                  <FormErrorMessage>{errors.meet_date?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.city}>
                  <FormLabel>City</FormLabel>
                  <Input {...register('city')} />
                  <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.state}>
                  <FormLabel>State</FormLabel>
                  <Input {...register('state')} />
                  <FormErrorMessage>{errors.state?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.status}>
                  <FormLabel>Status</FormLabel>
                  <Select {...register('status')} defaultValue="Planned">
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </Select>
                  <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFormClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Event Drawer */}
      <Drawer
        isOpen={isEventDrawerOpen}
        placement="right"
        onClose={onEventDrawerClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            {isEditingEvent ? 'Edit Event' : 'Add Event'}
            {currentMeet && ` - ${currentMeet.name}`}
          </DrawerHeader>
          <DrawerCloseButton />
          
          <DrawerBody>
            <form onSubmit={handleSubmitEvent(onSubmitEvent)}>
              <VStack spacing={4} pt={4}>
                <FormControl isInvalid={!!eventErrors.event_name} isRequired>
                  <FormLabel>Event Name</FormLabel>
                  <Input 
                    {...registerEvent('event_name', { required: 'Event name is required' })} 
                    placeholder="e.g. 100m Dash"
                  />
                  <FormErrorMessage>{eventErrors.event_name?.message}</FormErrorMessage>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Day Number (optional)</FormLabel>
                  <Input 
                    type="number" 
                    {...registerEvent('event_day')} 
                    placeholder="For multi-day meets"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Start Time (optional)</FormLabel>
                  <Input 
                    type="time" 
                    {...registerEvent('start_time')} 
                  />
                </FormControl>
              </VStack>
            </form>
          </DrawerBody>
          
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onEventDrawerClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              isLoading={isEventSubmitting}
              onClick={handleSubmitEvent(onSubmitEvent)}
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
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            Assign Athletes to Events
            {currentMeet && ` - ${currentMeet.name}`}
          </DrawerHeader>
          <DrawerCloseButton />
          
          <DrawerBody>
            {assignmentLoading ? (
              <Flex justify="center" my={8}>
                <Spinner size="xl" />
              </Flex>
            ) : meetEvents.length === 0 ? (
              <Text>No events have been added to this meet yet.</Text>
            ) : (
              <VStack spacing={6} align="stretch">
                {meetEvents.map((event) => (
                  <Box 
                    key={event.id} 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md"
                    shadow="sm"
                  >
                    <Heading size="sm" mb={3}>
                      {event.event_name || (event.event && event.event.name) || 'Event'}
                    </Heading>
                    <FormControl>
                      <FormLabel>Assign Athletes</FormLabel>
                      <CheckboxGroup 
                        value={athleteAssignments[event.id] || []}
                        onChange={(values) => {
                          // Implement assignment logic
                          setAthleteAssignments(prev => ({
                            ...prev,
                            [event.id]: values as string[]
                          }));
                        }}
                      >
                        <VStack align="start">
                          {athletes.map((athlete) => (
                            <Checkbox 
                              key={athlete.id} 
                              value={athlete.id}
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
          
          <DrawerFooter borderTopWidth="1px">
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
      
    </Box>
  );
} 