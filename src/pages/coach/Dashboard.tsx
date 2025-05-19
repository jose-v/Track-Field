import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    Card,
    CardBody,
    Stack,
    HStack,
    Button,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Icon,
    Flex,
    Badge,
    Avatar,
    useColorModeValue,
    useToast,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    FormControl,
    FormLabel,
    Input,
    CheckboxGroup,
    Checkbox // Correctly imported
  } from '@chakra-ui/react';
  import { useAuth } from '../../contexts/AuthContext';
  import { FaUserFriends, FaRunning, FaClipboardCheck, FaCalendarAlt, FaChartLine, FaClipboardList, FaUserPlus, FaUsers, FaDumbbell, FaFlagCheckered } from 'react-icons/fa';
  import { Link as RouterLink } from 'react-router-dom';
  import { useCoachAthletes } from '../../hooks/useCoachAthletes';
  import { useState, useEffect } from 'react';
  import { api } from '../../services/api'; // Correctly imported
  import { useProfile } from '../../hooks/useProfile'; // Import the useProfile hook
  import { useQueryClient } from '@tanstack/react-query';
  
  // Mock data for the dashboard (can be removed if API provides all necessary data)
  const athletesMockForLayout = [
    { id: '1', name: 'John Smith', avatar: '/images/athlete-avatar.jpg', completionRate: 85 },
    { id: '2', name: 'Sarah Williams', avatar: '/images/athlete-avatar3.jpg', completionRate: 92 },
    { id: '3', name: 'Mike Johnson', avatar: '/images/athlete-avatar2.jpg', completionRate: 78 },
  ];
  
  const upcomingEvents = [
    { id: '1', name: 'Team Training Session', date: '2023-12-10', type: 'Training' },
    { id: '2', name: 'Regional Championship', date: '2023-12-18', type: 'Competition' },
  ];
  
  const recentWorkouts = [
    { id: '1', name: 'Sprint Intervals', assignedTo: 3, completionRate: 67 },
    { id: '2', name: 'Endurance Building', assignedTo: 5, completionRate: 80 },
  ];
  
  const mockExercises = [
    'Sprint Drills',
    'Long Jump Practice',
    'Interval Training',
    'Strength Circuit',
    'Relay Baton Pass',
    'Plyometrics',
    'Endurance Run',
    'Shot Put Technique',
  ];
  
  export function CoachDashboard() {
    const { user } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile(); // Get the profile
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const athleteItemHoverBg = useColorModeValue('gray.50', 'gray.700');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
    const [workoutDate, setWorkoutDate] = useState('');
    const [workoutTime, setWorkoutTime] = useState('');
    const [workoutLocation, setWorkoutLocation] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [searchExercise, setSearchExercise] = useState('');
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();
    
    const { athletes: realAthletesData, isLoading: athletesLoading } = useCoachAthletes();
    const realAthletes = realAthletesData || []; // Ensure realAthletes is always an array
  
    // Log the user object to see its structure
    console.log('Coach dashboard user object:', user);
  
    const getCompletionColor = (rate: number) => {
      if (rate >= 80) return 'green';
      if (rate >= 60) return 'yellow';
      return 'red';
    };
  
    const athleteMeets = [
      { athlete: 'John Smith', meets: ['Nike Invitational', 'Hayward Classic'] },
      { athlete: 'Sarah Williams', meets: ['Nike Invitational'] },
      { athlete: realAthletes[2]?.name || athletesMockForLayout[2]?.name || 'Mike J.', meets: [] }, // Example using real/mock athlete name
    ];
  
    const filteredExercises = mockExercises.filter(ex => ex.toLowerCase().includes(searchExercise.toLowerCase()));
  
    async function handleSaveAndAssign() {
      if (!user?.id) {
        toast({ title: 'Error', description: 'User not authenticated.', status: 'error' });
        return;
      }
      if (selectedAthletes.length === 0) {
          toast({ title: 'Error', description: 'Please assign to at least one athlete.', status: 'error' });
          return;
      }
      if (selectedExercises.length === 0 && !file) {
          toast({ title: 'Error', description: 'Please select exercises or upload a workout file.', status: 'error' });
          return;
      }
  
      setIsSaving(true);
      try {
        const workoutDataForApi = {
          name: 'Custom Workout ' + new Date().toLocaleDateString(), // Default name or add a field in modal
          description: '', // Add a notes/description field in modal if needed
          created_by: user.id,
          exercises: selectedExercises.map(name => ({ name, sets: 0, reps: 0 })), // Corrected structure
          date: workoutDate,
          time: workoutTime,
          location: workoutLocation,
          // file_url: null, // Handle file upload and get URL if implementing file uploads
        };
  
        const workout = await api.workouts.create(workoutDataForApi as any); // Use `as any` for now or define a stricter type for create
        
        await api.athleteWorkouts.assign(workout.id, selectedAthletes);
        toast({
          title: 'Workout Assigned!',
          description: `Successfully created and assigned workout to ${selectedAthletes.length} athlete(s).`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Reset form
        setSelectedExercises([]);
        setSelectedAthletes([]);
        setWorkoutDate('');
        setWorkoutTime('');
        setWorkoutLocation('');
        setFile(null);
        setSearchExercise('');
        onClose();
      } catch (err: any) {
        console.error("Error creating/assigning workout:", err);
        toast({
          title: 'Assignment Error',
          description: err.message || 'Could not create or assign workout. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsSaving(false);
      }
    }
  
    const averageCompletionRate = realAthletes.length > 0
      ? Math.round(realAthletes.reduce((acc, athlete) => acc + (athlete.completionRate || 0), 0) / realAthletes.length)
      : 0;
  
    // Effect for debugging user and athletes state
    useEffect(() => {
      console.log('[CoachDashboard] User:', user);
      console.log('[CoachDashboard] Fetched Athletes:', realAthletesData);
      console.log('[CoachDashboard] Processed realAthletes (array):', realAthletes);
    }, [user, realAthletesData, realAthletes]);
  
    // Add a refresh mechanism to ensure stats stay current
    useEffect(() => {
      // Set up periodic refresh
      const refreshInterval = setInterval(() => {
        // Refresh athlete data which will update completion stats
        queryClient.invalidateQueries({ queryKey: ['coachAthletes'] });
      }, 10000); // Every 10 seconds
      
      // Clean up on unmount
      return () => clearInterval(refreshInterval);
    }, [queryClient]);
  
    // Force refresh when returning to the page
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          queryClient.invalidateQueries({ queryKey: ['coachAthletes'] });
          queryClient.invalidateQueries({ queryKey: ['workouts'] });
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [queryClient]);
  
    return (
      <Box py={8}>
        <Heading mb={6}>Coach Dashboard</Heading>
        <Text mb={8} color="gray.600">
          Welcome back, Coach {profile?.last_name || ''}!
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          <Stat px={4} py={5} bg={cardBg} shadow="base" rounded="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justifyContent="space-between">
              <Box pl={2}>
                <StatLabel fontWeight="medium">Total Athletes</StatLabel>
                <StatNumber fontSize="3xl">{athletesLoading ? '...' : realAthletes.length}</StatNumber>
                <StatHelpText>Active team members</StatHelpText>
              </Box>
              <Box my="auto" color="blue.500" alignContent="center"><Icon as={FaUserFriends} w={8} h={8} /></Box>
            </Flex>
          </Stat>
          <Stat px={4} py={5} bg={cardBg} shadow="base" rounded="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justifyContent="space-between">
              <Box pl={2}>
                <StatLabel fontWeight="medium">Team Workouts</StatLabel>
                <StatNumber fontSize="3xl">{recentWorkouts.length}</StatNumber> 
                <StatHelpText>Active training plans</StatHelpText>
              </Box>
              <Box my="auto" color="purple.500" alignContent="center"><Icon as={FaRunning} w={8} h={8} /></Box>
            </Flex>
          </Stat>
          <Stat px={4} py={5} bg={cardBg} shadow="base" rounded="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justifyContent="space-between">
              <Box pl={2}>
                <StatLabel fontWeight="medium">Completion Rate</StatLabel>
                <StatNumber fontSize="3xl">
                  {athletesLoading ? '...' : `${averageCompletionRate}%`}
                </StatNumber>
                <StatHelpText>Average across team</StatHelpText>
              </Box>
              <Box my="auto" color="green.500" alignContent="center"><Icon as={FaClipboardCheck} w={8} h={8} /></Box>
            </Flex>
          </Stat>
          <Stat px={4} py={5} bg={cardBg} shadow="base" rounded="lg" borderWidth="1px" borderColor={borderColor}>
            <Flex justifyContent="space-between">
              <Box pl={2}>
                <StatLabel fontWeight="medium">Upcoming Events</StatLabel>
                <StatNumber fontSize="3xl">{upcomingEvents.length}</StatNumber>
                <StatHelpText>In the next 30 days</StatHelpText>
              </Box>
              <Box my="auto" color="red.500" alignContent="center"><Icon as={FaCalendarAlt} w={8} h={8} /></Box>
            </Flex>
          </Stat>
        </SimpleGrid>
        
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={8} bg={cardBg} p={5} rounded="lg" shadow="base" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={{ base: 2, md: 0 }}>Quick Actions:</Heading>
          <Button variant="primary" leftIcon={<Icon as={FaClipboardList} />} onClick={onOpen}>Create Workout</Button>
          <Button as={RouterLink} to="/coach/athletes" variant="primary" leftIcon={<Icon as={FaUserFriends} />}>Manage Athletes</Button>
          <Button as={RouterLink} to="/coach/events" variant="primary" leftIcon={<Icon as={FaCalendarAlt} />}>Schedule Event</Button>
          <Button as={RouterLink} to="/coach/stats" variant="accent" leftIcon={<Icon as={FaChartLine} />}>View Statistics</Button>
        </Stack>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={8}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="md" borderRadius="xl">
            <CardBody>
              <Heading size="md" mb={4}>Your Team</Heading>
              {athletesLoading ? (
                <Text>Loading athletes...</Text>
              ) : realAthletes.length === 0 ? (
                <Text>No athletes assigned yet.</Text>
              ) : (
                <Stack spacing={4}>
                  {realAthletes.map((athlete: any) => (
                    <Flex key={athlete.id} align="center" justify="space-between" p={2} borderRadius="md" _hover={{ bg: athleteItemHoverBg }}>
                      <HStack>
                        <Avatar size="sm" src={athlete.avatar_url || athlete.avatar} name={athlete.full_name || athlete.name} />
                        <Text fontWeight="medium">{athlete.full_name || athlete.name}</Text>
                      </HStack>
                      <Badge colorScheme={getCompletionColor(athlete.completionRate || 0)} fontSize="0.8em">
                        {athlete.completionRate || 0}%
                      </Badge>
                    </Flex>
                  ))}
                </Stack>
              )}
              <Button leftIcon={<FaUserPlus />} variant="primary" mt={4} w="full" borderRadius="md" size="sm" isDisabled>
                Add Athlete
              </Button>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="md" borderRadius="xl">
            <CardBody>
              <Heading size="md" mb={4}>Coach Tools</Heading>
              <Stack spacing={4}>
                <Button leftIcon={<FaUserPlus />} variant="ghost" w="full" borderRadius="md" size="sm" isDisabled>Add Athlete (Existing or New)</Button>
                <Button leftIcon={<FaDumbbell />} variant="primary" w="full" borderRadius="md" size="sm" onClick={onOpen}>Create Workout & Assign</Button>
                <Button leftIcon={<FaFlagCheckered />} variant="accent" w="full" borderRadius="md" size="sm" isDisabled>Create Track Meet & Assign</Button>
              </Stack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="md" borderRadius="xl">
            <CardBody>
              <Heading size="md" mb={4}>Upcoming Events</Heading>
              {athleteMeets.length === 0 ? (
                  <Text>No upcoming meets assigned to your athletes.</Text>
              ) : (
                  <Stack spacing={4}>
                  {athleteMeets.map(({ athlete, meets }) => (
                      <Box key={athlete}>
                      <Text fontWeight="medium" mb={1}>{athlete}</Text>
                      {meets.length > 0 ? (
                          <Stack pl={4} spacing={1}>
                          {meets.map((meet, idx) => (
                              <HStack key={idx}>
                              <Icon as={FaFlagCheckered} color="teal.400" boxSize={3} />
                              <Text fontSize="sm">{meet}</Text>
                              </HStack>
                          ))}
                          </Stack>
                      ) : (
                          <Text fontSize="sm" color="gray.400" pl={4}>No upcoming meets</Text>
                      )}
                      </Box>
                  ))}
                  </Stack>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
        
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create Workout</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4} isRequired>
                <FormLabel>Exercises</FormLabel>
                <Input placeholder="Search exercises..." value={searchExercise} onChange={e => setSearchExercise(e.target.value)} mb={2} />
                <CheckboxGroup value={selectedExercises} onChange={val => setSelectedExercises(val as string[])}>
                  <Stack spacing={2} maxH="120px" overflowY="auto"> {/* Replaced ChakraStack with Stack */}
                    {filteredExercises.map(ex => (
                      <Checkbox key={ex} value={ex}>{ex}</Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Or Upload File (PDF, Text, Image)</FormLabel>
                <Input type="file" accept=".pdf,.txt,image/*" onChange={e => {
                  if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                }} />
                {file && <Text fontSize="sm" mt={1}>Selected: {file.name}</Text>}
              </FormControl>
              <FormControl mb={4} isRequired>
                <FormLabel>Assign to Athletes</FormLabel>
                {athletesLoading ? (
                  <Text>Loading athletes...</Text>
                ) : realAthletes.length === 0 ? (
                  <Text color="orange.500">No athletes found for your team. Please add athletes first.</Text>
                ) : (
                  <CheckboxGroup value={selectedAthletes} onChange={val => setSelectedAthletes(val as string[])}>
                    <Stack spacing={2} maxH="100px" overflowY="auto"> {/* Replaced ChakraStack with Stack */}
                      {realAthletes.map((a: any) => (
                        <Checkbox key={a.id} value={a.id}>{a.full_name || a.name}</Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                )}
              </FormControl>
              <FormControl mb={2}>
                <FormLabel>Date</FormLabel>
                <Input type="date" value={workoutDate} onChange={e => setWorkoutDate(e.target.value)} />
              </FormControl>
              <FormControl mb={2}>
                <FormLabel>Time</FormLabel>
                <Input type="time" value={workoutTime} onChange={e => setWorkoutTime(e.target.value)} />
              </FormControl>
              <FormControl mb={2}>
                <FormLabel>Location</FormLabel>
                <Input placeholder="Enter location" value={workoutLocation} onChange={e => setWorkoutLocation(e.target.value)} />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" mr={3} onClick={handleSaveAndAssign} isLoading={isSaving} isDisabled={athletesLoading || realAthletes.length === 0}>
                Save & Assign
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  }