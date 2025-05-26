import {
  Box,
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  Text,
  VStack,
  Heading,
  SimpleGrid,
  Checkbox,
  Avatar,
  HStack,
  Button,
  Badge,
  useColorModeValue,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Spinner,
  Center,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaSearch, FaRunning, FaPlus, FaTrash } from 'react-icons/fa';
import { useSignup } from '../../contexts/SignupContext';
import { getAllAthletes, searchAthletes, getMockAthletes, createAthlete, createMockAthlete } from '../../services/athleteService';
import type { AthleteFrontend } from '../../services/athleteService';

export function AthleteSelection() {
  const { signupData, updateSignupData } = useSignup();
  const [searchTerm, setSearchTerm] = useState('');
  const [athletes, setAthletes] = useState<AthleteFrontend[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteFrontend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New athlete form state
  const [isAddAthleteModalOpen, setIsAddAthleteModalOpen] = useState(false);
  const [newAthleteFirstName, setNewAthleteFirstName] = useState('');
  const [newAthleteLastName, setNewAthleteLastName] = useState('');
  const [newAthleteAge, setNewAthleteAge] = useState(18);
  const [newAthleteEvents, setNewAthleteEvents] = useState<string[]>([]);
  const [newEventInput, setNewEventInput] = useState('');
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    events: '',
  });
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  
  // Initialize selected athletes
  useEffect(() => {
    if (!signupData.selectedAthletes) {
      updateSignupData({ selectedAthletes: [] });
    }
  }, [signupData.selectedAthletes, updateSignupData]);
  
  // Fetch athletes from database or use mock data if there's an error
  useEffect(() => {
    let isMounted = true;
    
    async function fetchAthletes() {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getAllAthletes();
        
        if (isMounted) {
          setAthletes(data);
          setFilteredAthletes(data);
          
          // Check if we're using mock data
          if (data.some(athlete => athlete.id === '1' && athlete.name === 'John Smith')) {
            // We got mock data
            toast({
              title: 'Using demo data',
              description: 'Could not connect to the database. Using demo data instead.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch athletes:', err);
        
        if (isMounted) {
          setError('Could not load athletes data');
          
          // Fallback to mock data
          const mockData = getMockAthletes();
          setAthletes(mockData);
          setFilteredAthletes(mockData);
          
          toast({
            title: 'Using demo data',
            description: 'Could not connect to the database. Using demo data instead.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchAthletes();
    
    // Cleanup function to prevent state updates if component unmounts during fetch
    return () => {
      isMounted = false;
    };
  }, [toast]);
  
  // Handle search
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term === '') {
      setFilteredAthletes(athletes);
      return;
    }
    
    try {
      // Try to search from database
      const results = await searchAthletes(term);
      setFilteredAthletes(results);
    } catch (err) {
      // Fallback to local filtering if database search fails
      const filtered = athletes.filter(athlete => 
        athlete.name.toLowerCase().includes(term.toLowerCase()) ||
        athlete.events.some(event => event.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredAthletes(filtered);
    }
  };
  
  // Toggle athlete selection
  const toggleAthleteSelection = (athleteId: string) => {
    updateSignupData({
      selectedAthletes: signupData.selectedAthletes.includes(athleteId)
        ? signupData.selectedAthletes.filter(id => id !== athleteId)
        : [...signupData.selectedAthletes, athleteId]
    });
  };
  
  // Remove athlete from selection
  const removeAthlete = (athleteId: string) => {
    updateSignupData({
      selectedAthletes: signupData.selectedAthletes.filter(id => id !== athleteId)
    });
  };
  
  // Get athlete by ID
  const getAthleteById = (id: string) => {
    return athletes.find(athlete => athlete.id === id);
  };
  
  // Get role-specific text
  const roleText = signupData.role === 'coach' ? 'coach' : 'team manager';
  
  // Open the add athlete modal
  const openAddAthleteModal = () => {
    setIsAddAthleteModalOpen(true);
    resetNewAthleteForm();
  };
  
  // Close the add athlete modal
  const closeAddAthleteModal = () => {
    setIsAddAthleteModalOpen(false);
  };
  
  // Reset the new athlete form
  const resetNewAthleteForm = () => {
    setNewAthleteFirstName('');
    setNewAthleteLastName('');
    setNewAthleteAge(18);
    setNewAthleteEvents([]);
    setNewEventInput('');
    setFormErrors({
      firstName: '',
      lastName: '',
      events: '',
    });
  };
  
  // Add event to the list
  const addEvent = () => {
    if (!newEventInput.trim()) return;
    
    if (!newAthleteEvents.includes(newEventInput.trim())) {
      setNewAthleteEvents([...newAthleteEvents, newEventInput.trim()]);
    }
    
    setNewEventInput('');
  };
  
  // Remove event from the list
  const removeEvent = (event: string) => {
    setNewAthleteEvents(newAthleteEvents.filter(e => e !== event));
  };
  
  // Validate the form
  const validateNewAthleteForm = (): boolean => {
    const errors = {
      firstName: '',
      lastName: '',
      events: '',
    };
    
    if (!newAthleteFirstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!newAthleteLastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (newAthleteEvents.length === 0) {
      errors.events = 'At least one event is required';
    }
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error !== '');
  };
  
  // Handle the creation of a new athlete
  const handleCreateAthlete = async () => {
    if (!validateNewAthleteForm()) return;
    
    try {
      // Calculate birth date from age (approximate)
      const today = new Date();
      const birthYear = today.getFullYear() - newAthleteAge;
      const birthDate = new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split('T')[0];
      
      // Use the new createAthlete function that handles both DB and mock creation
      const newAthlete = await createAthlete(
        newAthleteFirstName,
        newAthleteLastName,
        birthDate,
        newAthleteEvents
      );
      
      if (!newAthlete) {
        throw new Error('Failed to create athlete');
      }
      
      // Add the new athlete to the list
      const updatedAthletes = [...athletes, newAthlete];
      setAthletes(updatedAthletes);
      setFilteredAthletes(updatedAthletes);
      
      // Auto-select the new athlete
      updateSignupData({
        selectedAthletes: [...signupData.selectedAthletes, newAthlete.id]
      });
      
      toast({
        title: 'Athlete added',
        description: `${newAthlete.name} has been added to your team.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      closeAddAthleteModal();
    } catch (error) {
      console.error('Error creating athlete:', error);
      
      // Fallback to mock athlete creation if database creation fails
      const mockAthlete = createMockAthlete(
        newAthleteFirstName,
        newAthleteLastName,
        newAthleteAge,
        newAthleteEvents
      );
      
      // Add the mock athlete to the list
      const updatedAthletes = [...athletes, mockAthlete];
      setAthletes(updatedAthletes);
      setFilteredAthletes(updatedAthletes);
      
      // Auto-select the new athlete
      updateSignupData({
        selectedAthletes: [...signupData.selectedAthletes, mockAthlete.id]
      });
      
      toast({
        title: 'Demo athlete added',
        description: `${mockAthlete.name} has been added as a demo athlete.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      
      closeAddAthleteModal();
    }
  };
  
  // Handle add new athlete
  const handleAddNewAthlete = () => {
    openAddAthleteModal();
  };
  
  if (isLoading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading athletes...</Text>
        </VStack>
      </Center>
    );
  }
  
  return (
    <Box width="100%">
      <Heading size="md" mb={2} textAlign="center">
        Select Your Athletes
      </Heading>
      
      <Text textAlign="center" mb={4}>
        As a {roleText}, you can select the athletes you'll be working with. This step is optional - you can always add or remove athletes later.
      </Text>
      
      {/* Search input */}
      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search athletes by name or event"
          value={searchTerm}
          onChange={handleSearch}
        />
      </InputGroup>
      
      {/* Loading state */}
      {isLoading && (
        <Center py={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading athletes...</Text>
          </VStack>
        </Center>
      )}
      
      {/* Error state */}
      {!isLoading && error && (
        <VStack spacing={4} p={6} bg="red.50" borderRadius="md">
          <Text color="red.500">{error}</Text>
          <Text>Using demo data instead.</Text>
        </VStack>
      )}

      {/* Athletes grid */}
      {!isLoading && !error && filteredAthletes.length === 0 && (
        <VStack spacing={4} p={6} bg="gray.50" borderRadius="md">
          <Text>No athletes found matching your search.</Text>
          <Button leftIcon={<FaPlus />} onClick={openAddAthleteModal}>Add New Athlete</Button>
        </VStack>
      )}
      
      {/* Selected Athletes */}
      {signupData.selectedAthletes.length > 0 && (
        <Box mb={6}>
          <Text fontWeight="medium" mb={2}>
            Selected Athletes ({signupData.selectedAthletes.length}):
          </Text>
          <Wrap spacing={2}>
            {signupData.selectedAthletes.map(athleteId => {
              const athlete = getAthleteById(athleteId);
              return athlete ? (
                <WrapItem key={athleteId}>
                  <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                    <Avatar
                      src={athlete.avatar}
                      name={athlete.name}
                      size="xs"
                      ml={-1}
                      mr={2}
                    />
                    <TagLabel>{athlete.name}</TagLabel>
                    <TagCloseButton onClick={() => removeAthlete(athleteId)} />
                  </Tag>
                </WrapItem>
              ) : null;
            })}
          </Wrap>
        </Box>
      )}
      
      {/* Athletes Grid */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {filteredAthletes.map(athlete => (
          <Box
            key={athlete.id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            borderColor={cardBorder}
            bg={cardBg}
          >
            <HStack spacing={4}>
              <Checkbox
                isChecked={signupData.selectedAthletes.includes(athlete.id)}
                onChange={() => toggleAthleteSelection(athlete.id)}
                colorScheme="blue"
              />
              
              <Avatar size="md" name={athlete.name} src={athlete.avatar} />
              
              <VStack align="start" spacing={1} flex={1}>
                <Text fontWeight="medium">{athlete.name}</Text>
                <Text fontSize="sm" color="gray.500">Age: {athlete.age}</Text>
                <HStack mt={1}>
                  <Icon as={FaRunning} color="blue.500" fontSize="xs" />
                  <Text fontSize="xs">{athlete.events.join(', ')}</Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
      
      {/* Add New Athlete Modal */}
      <Modal isOpen={isAddAthleteModalOpen} onClose={closeAddAthleteModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Athlete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl isRequired isInvalid={!!formErrors.firstName}>
                  <FormLabel>First Name</FormLabel>
                  <Input 
                    value={newAthleteFirstName}
                    onChange={(e) => setNewAthleteFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                  <FormErrorMessage>{formErrors.firstName}</FormErrorMessage>
                </FormControl>
                
                <FormControl isRequired isInvalid={!!formErrors.lastName}>
                  <FormLabel>Last Name</FormLabel>
                  <Input 
                    value={newAthleteLastName}
                    onChange={(e) => setNewAthleteLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                  <FormErrorMessage>{formErrors.lastName}</FormErrorMessage>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Age</FormLabel>
                <NumberInput
                  min={5}
                  max={100}
                  value={newAthleteAge}
                  onChange={(valueString) => setNewAthleteAge(parseInt(valueString))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!formErrors.events}>
                <FormLabel>Events</FormLabel>
                <InputGroup>
                  <Input 
                    value={newEventInput}
                    onChange={(e) => setNewEventInput(e.target.value)}
                    placeholder="Add event (e.g., '100m Sprint')"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEvent();
                      }
                    }}
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={addEvent}>
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{formErrors.events}</FormErrorMessage>
              </FormControl>
              
              {newAthleteEvents.length > 0 && (
                <Box width="100%">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Events:
                  </Text>
                  <Wrap>
                    {newAthleteEvents.map((event, index) => (
                      <WrapItem key={index}>
                        <Tag size="md" borderRadius="full" variant="solid" colorScheme="blue">
                          <TagLabel>{event}</TagLabel>
                          <TagCloseButton onClick={() => removeEvent(event)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAddAthleteModal}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateAthlete}>
              Create Athlete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 