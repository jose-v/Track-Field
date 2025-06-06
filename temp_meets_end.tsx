export const Meets: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEventDrawerOpen, onOpen: onEventDrawerOpen, onClose: onEventDrawerClose } = useDisclosure();
  const { isOpen: isAssignDrawerOpen, onOpen: onAssignDrawerOpen, onClose: onAssignDrawerClose } = useDisclosure();
  const { isOpen: isLocationSetupOpen, onOpen: onLocationSetupOpen, onClose: onLocationSetupClose } = useDisclosure();
  
  // State
  const [meets, setMeets] = useState<TrackMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeet, setCurrentMeet] = useState<TrackMeet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [meetStats, setMeetStats] = useState({ planned: 0, completed: 0, total: 0 });
  const [meetData, setMeetData] = useState<Record<string, { 
    athleteCount: number; 
    eventCount: number; 
    athleteNames: string[]; 
    myAssignedEvents: Array<{ id: string; name: string; time: string | null }>;
    assignedByCoach: string | null;
    coachPhone: string | null;
    coachEmail: string | null;
    // Assistant coaches
    assistantCoach1Name: string | null;
    assistantCoach1Phone: string | null;
    assistantCoach1Email: string | null;
    assistantCoach2Name: string | null;
    assistantCoach2Phone: string | null;
    assistantCoach2Email: string | null;
    assistantCoach3Name: string | null;
    assistantCoach3Phone: string | null;
    assistantCoach3Email: string | null;
    distance?: string;
  }>>({});
  const [userIsCoach, setUserIsCoach] = useState(false);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetEvents, setMeetEvents] = useState<any[]>([]);
  const [athleteAssignments, setAthleteAssignments] = useState<Record<string, string[]>>({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [currentMeetEvent, setCurrentMeetEvent] = useState<any>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  
  // Run time modal state for athletes
  const [isRunTimeModalOpen, setIsRunTimeModalOpen] = useState(false);
  const [currentEventForTime, setCurrentEventForTime] = useState<any>(null);
  const [runTimeInput, setRunTimeInput] = useState('');
  const [isSubmittingTime, setIsSubmittingTime] = useState(false);

  // Form hooks for event management
  const {
    register: registerEvent,
    handleSubmit: handleSubmitEvent,
    reset: resetEvent,
    formState: { errors: eventErrors }
  } = useForm<MeetEventFormData>();

  // Color mode values for event drawer
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');
  const whiteGrayBg = useColorModeValue('white', 'gray.700');
  const hoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const eventDrawerHeaderBg = useColorModeValue('blue.50', 'blue.900');
  const eventDrawerHeaderColor = useColorModeValue('blue.700', 'blue.200');
  const footerBg = useColorModeValue('gray.50', 'gray.700');
  const cancelRef = React.useRef(null);
  
  // Color mode values for assignment drawer
  const assignDrawerHeaderBg = useColorModeValue('green.50', 'green.900');
  const assignDrawerHeaderColor = useColorModeValue('green.700', 'green.200');

  // Fetch meets and related data
  const fetchMeets = useCallback(async () => {
    if (!user) return;
    try {
      // Check if user is coach from multiple sources
      let isCoachUser = user?.user_metadata?.user_type === 'coach' || user?.user_metadata?.role === 'coach';
      
      // Also check the profiles table for role
      if (!isCoachUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        isCoachUser = profileData?.role === 'coach';
      }
      
      // Set the coach state
      setUserIsCoach(isCoachUser);
      
      let meetsData: any[] = [];
      
      if (isCoachUser) {
        console.log('Fetching meets for coach:', user.id);
        const { data, error } = await supabase
          .from('track_meets')
          .select(`
            *, 
            lodging_type, lodging_place_name, lodging_address, lodging_city, lodging_state, lodging_zip, 
            lodging_phone, lodging_website, lodging_checkin_date, lodging_checkout_date, 
            lodging_checkin_time, lodging_checkout_time, lodging_details,
            assistant_coach_1_name, assistant_coach_1_phone, assistant_coach_1_email,
            assistant_coach_2_name, assistant_coach_2_phone, assistant_coach_2_email,
            assistant_coach_3_name, assistant_coach_3_phone, assistant_coach_3_email
          `)
          .eq('coach_id', user.id)
          .order('meet_date', { ascending: true });
        
        if (error) throw error;
        meetsData = data || [];
      } else {
        console.log('Fetching meets for athlete:', user.id);
        // For athletes, get meets they're assigned to through athlete_meet_events
        const { data: athleteEventAssignments } = await supabase
          .from('athlete_meet_events')
          .select('meet_event_id')
          .eq('athlete_id', user.id);
        
        if (athleteEventAssignments && athleteEventAssignments.length > 0) {
          const eventIds = athleteEventAssignments.map(a => a.meet_event_id);
          
          const { data: meetEventData } = await supabase
            .from('meet_events')
            .select('meet_id')
            .in('id', eventIds);
          
          const meetIds = [...new Set(meetEventData?.map(me => me.meet_id) || [])];
          
          if (meetIds.length > 0) {
            const { data, error } = await supabase
              .from('track_meets')
              .select(`
                *, 
                lodging_type, lodging_place_name, lodging_address, lodging_city, lodging_state, lodging_zip, 
                lodging_phone, lodging_website, lodging_checkin_date, lodging_checkout_date, 
                lodging_checkin_time, lodging_checkout_time, lodging_details,
                assistant_coach_1_name, assistant_coach_1_phone, assistant_coach_1_email,
                assistant_coach_2_name, assistant_coach_2_phone, assistant_coach_2_email,
                assistant_coach_3_name, assistant_coach_3_phone, assistant_coach_3_email
              `)
              .in('id', meetIds)
              .order('meet_date', { ascending: true });
            
            if (error) throw error;
            meetsData = data || [];
          }
          // If no meetIds, meetsData remains empty array
        }
        // If no assignments, meetsData remains empty array
      }
      
      console.log('Query result:', { data: meetsData, count: meetsData.length });
        
      setMeets(meetsData);
      
      // Calculate meet stats
      const planned = meetsData.filter(m => m.status === 'Planned').length;
      const completed = meetsData.filter(m => m.status === 'Completed').length;
      const total = meetsData.length;
      setMeetStats({ planned, completed, total });
      
      // Define fetchMeetData function
      const fetchMeetData = async (meetsData: TrackMeet[], isCoachUser: boolean) => {
        const dataMap: Record<string, any> = {};
        
        for (const meet of meetsData) {
          try {
            // Get event count for this meet
            const { count: eventCount } = await supabase
              .from('meet_events')
              .select('*', { count: 'exact', head: true })
              .eq('meet_id', meet.id);
            
            // Get assigned athletes for this meet
            const { data: meetEvents } = await supabase
              .from('meet_events')
              .select('id, event_name')
              .eq('meet_id', meet.id);
            
            const eventIds = meetEvents?.map(event => event.id) || [];
            
            let athleteCount = 0;
            let athleteNames: string[] = [];
            let myAssignedEvents: Array<{ id: string; name: string; time: string | null }> = [];
            let assignedByCoach: string | null = null;
            let coachPhone: string | null = null;
            let coachEmail: string | null = null;
            
            if (eventIds.length > 0) {
              if (isCoachUser) {
                // Coach view: Get all athlete assignments
                const { data: athleteAssignments } = await supabase
                  .from('athlete_meet_events')
                  .select(`
                    athlete_id
                  `)
                  .in('meet_event_id', eventIds);
                
                // Get unique athlete IDs
                const uniqueAthleteIds = [...new Set(athleteAssignments?.map(a => a.athlete_id) || [])];
                
                if (uniqueAthleteIds.length > 0) {
                  // Get athlete profiles separately  
                  const { data: athleteProfiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .in('id', uniqueAthleteIds);
                  
                  athleteCount = uniqueAthleteIds.length;
                  athleteNames = athleteProfiles?.map(profile => 
                    `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  ) || [];
                }
              } else {
                // Athlete view: Get only this athlete's assignments
                try {
                  const { data: myAssignments, error: assignmentError } = await supabase
                    .from('athlete_meet_events')
                    .select(`
                      meet_event_id,
                      assigned_by,
                      result,
                      status
                    `)
                    .in('meet_event_id', eventIds)
                    .eq('athlete_id', user?.id);
                  
                  if (assignmentError) {
                    console.warn('Assignment query failed (likely RLS issue):', assignmentError);
                    // Fallback: no assignments for this athlete
                  } else if (myAssignments && myAssignments.length > 0) {
                    // Get the event names for assigned events
                    const assignedEventIds = myAssignments.map(a => a.meet_event_id);
                    const assignedEvents = meetEvents?.filter(e => assignedEventIds.includes(e.id)) || [];
                    
                    // Build event list with names and times
                    myAssignedEvents = assignedEvents.map(e => {
                      const assignment = myAssignments.find(a => a.meet_event_id === e.id);
                      return {
                        id: e.id,
                        name: e.event_name,
                        time: assignment?.result || null
                      };
                    });
                    
                    // Get coach who assigned (use the first assignment's coach)
                    const coachId = myAssignments[0]?.assigned_by;
                    if (coachId) {
                      try {
                        const { data: coachProfile, error: coachError } = await supabase
                          .from('profiles')
                          .select('first_name, last_name, phone, email')
                          .eq('id', coachId)
                          .single();
                        
                        if (!coachError && coachProfile) {
                          assignedByCoach = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
                          coachPhone = coachProfile.phone || null;
                          coachEmail = coachProfile.email || null;
                        }
                      } catch (coachErr) {
                        console.warn('Coach profile query failed:', coachErr);
                      }
                    }
                    
                    athleteCount = myAssignedEvents.length; // For athlete view, show event count instead
                  }
                  
                  // Also fetch all athletes assigned to this meet for the tooltip
                  // (so athletes can see who else is participating)
                  try {
                    const { data: allAssignments } = await supabase
                      .from('athlete_meet_events')
                      .select('athlete_id')
                      .in('meet_event_id', eventIds);
                    
                    const uniqueAthleteIds = [...new Set(allAssignments?.map(a => a.athlete_id) || [])];
                    
                    if (uniqueAthleteIds.length > 0) {
                      const { data: athleteProfiles } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name')
                        .in('id', uniqueAthleteIds);
                      
                      athleteNames = athleteProfiles?.map(profile => 
                        `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                      ) || [];
                      
                      // Update athlete count to show total athletes, not just events
                      athleteCount = uniqueAthleteIds.length;
                    }
                  } catch (error) {
                    console.warn('Failed to fetch all athlete assignments for tooltip:', error);
                  }
                } catch (error) {
                  console.warn('Failed to fetch athlete assignments:', error);
                  // Continue with empty assignments
                }
              }
            }
            
            // Calculate distance using basic geocoding (placeholder for now)
            let distance = "Distance TBD";
            if (meet.city && meet.state) {
              // This could be enhanced with actual geocoding API
              distance = `${meet.city}, ${meet.state}`;
            }
            
            dataMap[meet.id] = {
              athleteCount,
              eventCount: eventCount || 0,
              athleteNames,
              myAssignedEvents,
              assignedByCoach,
              coachPhone,
              coachEmail,
              // Assistant coaches from meet data
              assistantCoach1Name: meet.assistant_coach_1_name || null,
              assistantCoach1Phone: meet.assistant_coach_1_phone || null,
              assistantCoach1Email: meet.assistant_coach_1_email || null,
              assistantCoach2Name: meet.assistant_coach_2_name || null,
              assistantCoach2Phone: meet.assistant_coach_2_phone || null,
              assistantCoach2Email: meet.assistant_coach_2_email || null,
              assistantCoach3Name: meet.assistant_coach_3_name || null,
              assistantCoach3Phone: meet.assistant_coach_3_phone || null,
              assistantCoach3Email: meet.assistant_coach_3_email || null,
              distance
            };
          } catch (error) {
            console.error(`Error fetching data for meet ${meet.id}:`, error);
            // Set defaults on error
            dataMap[meet.id] = {
              athleteCount: 0,
              eventCount: 0,
              athleteNames: [],
              myAssignedEvents: [],
              assignedByCoach: null,
              coachPhone: null,
              coachEmail: null,
              // Assistant coaches - null on error
              assistantCoach1Name: null,
              assistantCoach1Phone: null,
              assistantCoach1Email: null,
              assistantCoach2Name: null,
              assistantCoach2Phone: null,
              assistantCoach2Email: null,
              assistantCoach3Name: null,
              assistantCoach3Phone: null,
              assistantCoach3Email: null,
              distance: "Distance TBD"
            };
          }
        }
        
        setMeetData(dataMap);
      };
      
      // Fetch additional data for each meet
      await fetchMeetData(meetsData, isCoachUser);
      
    } catch (error) {
      console.error('Error fetching meets:', error);
      toast({
        title: 'Error loading meets',
        description: 'Failed to load track meets',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMeets();
  }, [fetchMeets]);

  // Fetch athletes coached by this user - memoized
  const fetchAthletes = useCallback(async () => {
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
  }, [user?.id]);

  // Fetch meet events for assignment drawer - memoized
  const fetchMeetEventsForAssignment = useCallback(async (meetId: string) => {
    try {
      setAssignmentLoading(true);
      
      const { data, error } = await supabase
        .from('meet_events')
        .select('*')
        .eq('meet_id', meetId)
        .order('event_day, start_time, event_name');
      
      if (error) throw error;
      
      setMeetEvents(data || []);
      
      // Fetch athlete assignments for these events
      if (data && data.length > 0) {
        await fetchAthleteAssignments(data.map((event: any) => event.id));
      } else {
        setAthleteAssignments({});
      }
    } catch (error) {
      console.error('Error fetching meet events:', error);
      setMeetEvents([]);
      setAthleteAssignments({});
    } finally {
      setAssignmentLoading(false);
    }
  }, []);

  // Fetch meet events for management drawer - memoized
  const fetchMeetEventsForManagement = useCallback(async (meetId: string) => {
    try {
      const { data, error } = await supabase
        .from('meet_events')
        .select('*')
        .eq('meet_id', meetId)
        .order('event_day, start_time, event_name');
      
      if (error) throw error;
      
      setMeetEvents(data || []);
    } catch (error) {
      console.error('Error fetching meet events:', error);
      setMeetEvents([]);
    }
  }, []);

  // Fetch athlete assignments for meet events - memoized
  const fetchAthleteAssignments = useCallback(async (eventIds: string[]) => {
    try {
      if (!eventIds.length) return;
      
      const { data, error } = await supabase
        .from('athlete_meet_events')
        .select('*')
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
    }
  }, []);

  // Handlers - memoized to prevent re-creation
  const handleCreateMeet = useCallback(() => {
    setCurrentMeet(null);
    setIsEditing(false);
    onFormOpen();
  }, [onFormOpen]);

  const handleEditMeet = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    setIsEditing(true);
    onFormOpen();
  }, [onFormOpen]);

  const handleDeleteMeet = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const confirmDelete = useCallback(async () => {
    if (!currentMeet) return;

    try {
      const { error } = await supabase
        .from('track_meets')
        .delete()
        .eq('id', currentMeet.id);

      if (error) throw error;

      setMeets(meets.filter(m => m.id !== currentMeet.id));
      toast({
        title: 'Meet deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting meet:', error);
      toast({
        title: 'Error deleting meet',
        description: 'Failed to delete track meet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  }, [currentMeet, meets, toast, onDeleteClose]);

  const handleAssignAthletes = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    // Fetch meet events and athletes for assignment
    fetchMeetEventsForAssignment(meet.id);
    fetchAthletes();
    onAssignDrawerOpen();
  }, [onAssignDrawerOpen]);

  const handleManageEvents = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    // Fetch events for this meet
    fetchMeetEventsForManagement(meet.id);
    onEventDrawerOpen();
  }, [onEventDrawerOpen]);

  // Run time modal handlers for athletes - memoized
  const openRunTimeModal = useCallback((eventData: { eventId: string; eventName: string; currentTime?: string }) => {
    setCurrentEventForTime(eventData);
    setRunTimeInput(eventData.currentTime || '');
    setIsRunTimeModalOpen(true);
  }, []);

  const closeRunTimeModal = useCallback(() => {
    setIsRunTimeModalOpen(false);
    setCurrentEventForTime(null);
    setRunTimeInput('');
  }, []);

  const handleRunTimeSubmit = useCallback(async () => {
    if (!currentEventForTime || !runTimeInput.trim()) {
      toast({
        title: 'Please enter a valid run time',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmittingTime(true);
      
      // Update the athlete's assignment record with the result
      const { error } = await supabase
        .from('athlete_meet_events')
        .update({ 
          result: runTimeInput.trim(),
          status: 'completed'
        })
        .eq('athlete_id', user?.id)
        .eq('meet_event_id', currentEventForTime.eventId);
      
      if (error) throw error;
      
      toast({
        title: 'Run time saved successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Close modal and refresh meet data
      closeRunTimeModal();
      await fetchMeets();
      
    } catch (error) {
      console.error('Error saving run time:', error);
      toast({
        title: 'Error saving run time',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingTime(false);
    }
  }, [currentEventForTime, runTimeInput, toast, user?.id, closeRunTimeModal, fetchMeets]);

  const handleFormSuccess = useCallback(() => {
    fetchMeets();
  }, [fetchMeets]);

  const handleFormSubmit = useCallback(async (data: TrackMeetFormData) => {
    if (!user) return;

    try {
      if (isEditing && currentMeet) {
        const { error } = await supabase
          .from('track_meets')
          .update(data)
          .eq('id', currentMeet.id);
        
        if (error) throw error;
        
        toast({
          title: 'Meet updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        const { error } = await supabase
          .from('track_meets')
          .insert([{
            ...data,
            coach_id: user.id
          }]);
        
        if (error) throw error;
        
        toast({
          title: 'Meet created',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      handleFormSuccess();
      onFormClose();
    } catch (error) {
      console.error('Error saving meet:', error);
      toast({
        title: 'Error saving meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [user, isEditing, currentMeet, toast, handleFormSuccess, onFormClose]);

  // Handler for event form submission - memoized
  const onSubmitEvent = useCallback(async (data: MeetEventFormData) => {
    try {
      if (!currentMeet) return;
      
      setIsEventSubmitting(true);
      
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
      await fetchMeetEventsForManagement(currentMeet.id);
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
    } finally {
      setIsEventSubmitting(false);
    }
  }, [currentMeet, isEditingEvent, currentMeetEvent, toast, onEventDrawerClose, resetEvent]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box py={4}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Button
                leftIcon={<FaArrowLeft size={14} />}
                variant="ghost"
                onClick={() => navigate(-1)}
                size="sm"
                color="gray.300"
                _hover={{ color: "white", bg: "gray.700" }}
              >
                Back
              </Button>
              <Heading size="lg" color="white">Track Meets</Heading>
            </HStack>
            
            <HStack spacing={4}>
              {/* Location Setup */}
              <HStack spacing={2}>
                <Tooltip label="Set your location for travel times" placement="bottom">
                  <IconButton
                    icon={<FaMapMarkerAlt />}
                    aria-label="Set location"
                    onClick={onLocationSetupOpen}
                    variant="ghost"
                    colorScheme="green"
                    size="sm"
                    color="gray.300"
                    _hover={{ color: "white", bg: "gray.700" }}
                  />
                </Tooltip>
                <CurrentLocationDisplay />
              </HStack>
              
              {userIsCoach && (
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleCreateMeet}
                >
                  Create Meet
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Flex 
        direction="column" 
        align="center" 
        p={6}
        color="gray.100"
      >
        {/* Meets List */}
        <Box w="full" maxW="4xl">
          {meets.length === 0 ? (
            <Box
              bg="gray.800"
              borderRadius="2xl"
              p={16}
              textAlign="center"
              border="1px solid"
              borderColor="gray.700"
            >
              <FaCalendarAlt size={48} color="gray.600" style={{ margin: '0 auto 16px' }} />
              <Heading size="md" color="gray.400" mb={2}>No meets found</Heading>
              <Text color="gray.500" mb={6}>
                {userIsCoach ? "Create your first track meet to get started." : "No meets have been assigned to you yet."}
              </Text>
              {userIsCoach && (
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  onClick={handleCreateMeet}
                >
                  Create First Meet
                </Button>
              )}
            </Box>
          ) : (
            meets.map((meet) => (
              <MeetCard
                key={meet.id}
                meet={meet}
                isCoach={userIsCoach}
                onEdit={handleEditMeet}
                onDelete={handleDeleteMeet}
                onAssignAthletes={handleAssignAthletes}
                onManageEvents={handleManageEvents}
                onOpenRunTimeModal={openRunTimeModal}
                athleteCount={meetData[meet.id]?.athleteCount || 0}
                eventCount={meetData[meet.id]?.eventCount || 0}
                athleteNames={meetData[meet.id]?.athleteNames || []}
                myAssignedEvents={meetData[meet.id]?.myAssignedEvents || []}
                assignedByCoach={meetData[meet.id]?.assignedByCoach}
                coachPhone={meetData[meet.id]?.coachPhone}
                coachEmail={meetData[meet.id]?.coachEmail}
                assistantCoach1Name={meetData[meet.id]?.assistantCoach1Name}
                assistantCoach1Phone={meetData[meet.id]?.assistantCoach1Phone}
                assistantCoach1Email={meetData[meet.id]?.assistantCoach1Email}
                assistantCoach2Name={meetData[meet.id]?.assistantCoach2Name}
                assistantCoach2Phone={meetData[meet.id]?.assistantCoach2Phone}
                assistantCoach2Email={meetData[meet.id]?.assistantCoach2Email}
                assistantCoach3Name={meetData[meet.id]?.assistantCoach3Name}
                assistantCoach3Phone={meetData[meet.id]?.assistantCoach3Phone}
                assistantCoach3Email={meetData[meet.id]?.assistantCoach3Email}
                distance={meetData[meet.id]?.distance}
              />
            ))
          )}
        </Box>
      </Flex>

      {/* Form Drawer */}
      <MeetFormDrawer
        isOpen={isFormOpen}
        onClose={onFormClose}
        onSubmit={handleFormSubmit}
        currentMeet={currentMeet}
        isEditing={isEditing}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Meet
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{currentMeet?.name}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Athlete Assignment Drawer */}
      <Drawer
        isOpen={isAssignDrawerOpen}
        placement="right"
        onClose={onAssignDrawerClose}
        size="lg"
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
            Assign Athletes to Events - {currentMeet?.name}
          </DrawerHeader>
          <DrawerCloseButton 
            color={assignDrawerHeaderColor}
            size="lg"
          />

          <DrawerBody py={6}>
            {assignmentLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <VStack spacing={6} align="stretch">
                {meetEvents.map((event) => (
                  <Box 
                    key={event.id}
                    p={6}
                    border="2px solid"
                    borderColor={borderColor}
                    borderRadius="lg"
                    bg={whiteGrayBg}
                  >
                    <Heading 
                      size="lg" 
                      mb={4}
                      color={subtextColor}
                      fontWeight="bold"
                    >
                      {event.event_name}
                    </Heading>
                    
                    <FormControl>
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={subtextColor}
                        mb={4}
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
            <Button 
              variant="outline" 
              colorScheme="gray"
              mr={3} 
              onClick={onAssignDrawerClose}
              size="lg"
              borderWidth="2px"
            >
              Cancel
            </Button>
            <Button 
              variant="solid"
              colorScheme="green" 
              isLoading={assignmentLoading}
              onClick={async () => {
                try {
                  setAssignmentLoading(true);
                  
                  // Get current assignments
                  const { data: currentAssignments } = await supabase
                    .from('athlete_meet_events')
                    .select('*')
                    .in('meet_event_id', meetEvents.map(e => e.id));
                  
                  // Process each event
                  for (const eventId of Object.keys(athleteAssignments)) {
                    const currentAthletes = currentAssignments
                      ?.filter((a: any) => a.meet_event_id === eventId)
                      .map((a: any) => a.athlete_id) || [];
                    
                    const selectedAthletes = athleteAssignments[eventId] || [];
                    
                    // Athletes to remove
                    const athletesToRemove = currentAssignments
                      ?.filter((a: any) => 
                        a.meet_event_id === eventId && 
                        !selectedAthletes.includes(a.athlete_id)
                      )
                      .map((a: any) => a.id) || [];
                    
                    // Athletes to add
                    const athletesToAdd = selectedAthletes
                      .filter((athleteId: string) => 
                        !currentAthletes.includes(athleteId)
                      );
                    
                    // Process removals
                    if (athletesToRemove.length > 0) {
                      const { error: removeError } = await supabase
                        .from('athlete_meet_events')
                        .delete()
                        .in('id', athletesToRemove);
                      
                      if (removeError) throw removeError;
                    }
                    
                    // Process additions
                    if (athletesToAdd.length > 0) {
                      const newAssignments = athletesToAdd.map((athleteId: string) => ({
                        athlete_id: athleteId,
                        meet_event_id: eventId,
                        assigned_by: user?.id
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
                  
                  onAssignDrawerClose();
                  // Refresh the meets data
                  await fetchMeets();
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
              size="lg"
              shadow="md"
            >
              Save Assignments
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Event Management Drawer */}
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
      
      {/* Location Setup Modal */}
      <LocationSetup
        isOpen={isLocationSetupOpen}
        onClose={onLocationSetupClose}
      />
      
      {/* Run Time Modal for Athletes */}
      <RunTimeModal
        isOpen={isRunTimeModalOpen}
        onClose={closeRunTimeModal}
        event={currentEventForTime ? {
          id: currentEventForTime.eventId,
          event_name: currentEventForTime.eventName,
          run_time: currentEventForTime.currentTime,
          meet_id: currentMeet?.id || ''
        } : null}
        runTime={runTimeInput}
        setRunTime={setRunTimeInput}
        onSubmit={handleRunTimeSubmit}
        isSubmitting={isSubmittingTime}
      />
    </Box>
  );
}; 