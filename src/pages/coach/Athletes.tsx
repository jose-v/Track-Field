import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  HStack,
  VStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Flex,
  Badge,
  Avatar,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
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
  Select,
} from '@chakra-ui/react'
import { FaSearch, FaUserPlus, FaEnvelope, FaPhone, FaCalendarAlt, FaTrophy, FaRunning, FaEllipsisV, FaFilter } from 'react-icons/fa'
import { useState } from 'react'

// Mock data for athletes
const athletes = [
  { 
    id: '1', 
    name: 'John Smith', 
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    avatar: '/images/athlete-avatar.jpg', 
    age: 22,
    events: ['100m Sprint', '200m Sprint', '4x100m Relay'],
    completionRate: 85,
    personalBests: [
      { event: '100m Sprint', time: '10.45s', date: '2023-06-15' },
      { event: '200m Sprint', time: '21.32s', date: '2023-07-22' },
    ]
  },
  { 
    id: '2', 
    name: 'Sarah Williams', 
    email: 'sarah.w@example.com',
    phone: '(555) 987-6543',
    avatar: '/images/athlete-avatar3.jpg', 
    age: 19,
    events: ['Long Jump', 'Triple Jump'],
    completionRate: 92,
    personalBests: [
      { event: 'Long Jump', distance: '6.45m', date: '2023-05-10' },
      { event: 'Triple Jump', distance: '13.67m', date: '2023-06-05' },
    ]
  },
  { 
    id: '3', 
    name: 'Mike Johnson', 
    email: 'mike.j@example.com',
    phone: '(555) 456-7890',
    avatar: '/images/athlete-avatar2.jpg', 
    age: 24,
    events: ['400m Hurdles', '400m Sprint'],
    completionRate: 78,
    personalBests: [
      { event: '400m Hurdles', time: '49.87s', date: '2023-04-18' },
      { event: '400m Sprint', time: '45.92s', date: '2023-06-30' },
    ]
  },
  { 
    id: '4', 
    name: 'Emily Davis', 
    email: 'emily.d@example.com',
    phone: '(555) 789-0123',
    avatar: '', 
    age: 20,
    events: ['800m', '1500m'],
    completionRate: 64,
    personalBests: [
      { event: '800m', time: '2:05.45', date: '2023-05-22' },
      { event: '1500m', time: '4:15.33', date: '2023-06-12' },
    ]
  },
  { 
    id: '5', 
    name: 'Robert Wilson', 
    email: 'robert.w@example.com',
    phone: '(555) 321-0987',
    avatar: '', 
    age: 21,
    events: ['Shot Put', 'Discus'],
    completionRate: 89,
    personalBests: [
      { event: 'Shot Put', distance: '18.75m', date: '2023-05-15' },
      { event: 'Discus', distance: '57.23m', date: '2023-06-25' },
    ]
  },
];

export function CoachAthletes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [filteredAthletes, setFilteredAthletes] = useState(athletes);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Function to handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term === '') {
      setFilteredAthletes(athletes);
    } else {
      const filtered = athletes.filter(athlete => 
        athlete.name.toLowerCase().includes(term.toLowerCase()) ||
        athlete.email.toLowerCase().includes(term.toLowerCase()) ||
        athlete.events.some(event => event.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredAthletes(filtered);
    }
  };
  
  // Function to open athlete details
  const openAthleteDetails = (athlete: any) => {
    setSelectedAthlete(athlete);
    onOpen();
  };
  
  // Helper function to get Badge color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Box py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>My Athletes</Heading>
        <Button colorScheme="blue" leftIcon={<Icon as={FaUserPlus} />}>
          Add Athlete
        </Button>
      </Flex>
      
      {/* Search and Filter */}
      <Flex 
        mb={6} 
        direction={{ base: 'column', md: 'row' }} 
        gap={4}
        bg={cardBg}
        p={4}
        borderRadius="md"
        shadow="base"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <InputGroup maxW={{ base: '100%', md: '400px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Search by name, email, or event" 
            value={searchTerm}
            onChange={handleSearch}
          />
        </InputGroup>
        
        <Menu>
          <MenuButton as={Button} rightIcon={<Icon as={FaFilter} />} variant="outline">
            Filter
          </MenuButton>
          <MenuList>
            <MenuItem>All Athletes</MenuItem>
            <MenuItem>High Completion Rate (&gt;80%)</MenuItem>
            <MenuItem>Medium Completion Rate (60-80%)</MenuItem>
            <MenuItem>Low Completion Rate (&lt;60%)</MenuItem>
            <MenuItem>Sprint Events</MenuItem>
            <MenuItem>Field Events</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      
      {/* Athletes List */}
      <Tabs variant="enclosed" bg={cardBg} borderRadius="md" shadow="base" borderWidth="1px" borderColor={borderColor}>
        <TabList>
          <Tab>Card View</Tab>
          <Tab>Table View</Tab>
        </TabList>
        
        <TabPanels>
          {/* Card View */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredAthletes.map(athlete => (
                <Card 
                  key={athlete.id} 
                  shadow="md" 
                  borderWidth="1px" 
                  borderColor={borderColor}
                  transition="transform 0.2s"
                  _hover={{ transform: "translateY(-5px)" }}
                  cursor="pointer"
                  onClick={() => openAthleteDetails(athlete)}
                >
                  <CardBody>
                    <HStack mb={4}>
                      <Avatar size="md" name={athlete.name} src={athlete.avatar} />
                      <Box>
                        <Heading size="md">{athlete.name}</Heading>
                        <Text fontSize="sm" color="gray.500">Age: {athlete.age}</Text>
                      </Box>
                    </HStack>
                    
                    <Stack spacing={2} mb={4}>
                      <Flex align="center">
                        <Icon as={FaEnvelope} color="blue.500" mr={2} />
                        <Text fontSize="sm">{athlete.email}</Text>
                      </Flex>
                      <Flex align="center">
                        <Icon as={FaPhone} color="green.500" mr={2} />
                        <Text fontSize="sm">{athlete.phone}</Text>
                      </Flex>
                      <Flex align="center">
                        <Icon as={FaRunning} color="purple.500" mr={2} />
                        <Text fontSize="sm">{athlete.events.join(', ')}</Text>
                      </Flex>
                    </Stack>
                    
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="medium">Completion Rate:</Text>
                      <Badge colorScheme={getCompletionColor(athlete.completionRate)}>
                        {athlete.completionRate}%
                      </Badge>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
            
            {filteredAthletes.length === 0 && (
              <Box textAlign="center" py={10}>
                <Text>No athletes found matching your search criteria.</Text>
              </Box>
            )}
          </TabPanel>
          
          {/* Table View */}
          <TabPanel>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Athlete</Th>
                    <Th>Events</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Completion Rate</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredAthletes.map(athlete => (
                    <Tr key={athlete.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Td>
                        <HStack>
                          <Avatar size="sm" name={athlete.name} src={athlete.avatar} />
                          <Box>
                            <Text fontWeight="medium">{athlete.name}</Text>
                            <Text fontSize="xs" color="gray.500">Age: {athlete.age}</Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>{athlete.events.join(', ')}</Td>
                      <Td>{athlete.email}</Td>
                      <Td>{athlete.phone}</Td>
                      <Td>
                        <Badge colorScheme={getCompletionColor(athlete.completionRate)}>
                          {athlete.completionRate}%
                        </Badge>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<FaEllipsisV />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem onClick={() => openAthleteDetails(athlete)}>View Details</MenuItem>
                            <MenuItem>Edit Athlete</MenuItem>
                            <MenuItem>Assign Workout</MenuItem>
                            <MenuItem>View Performance</MenuItem>
                            <MenuItem color="red.500">Remove Athlete</MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredAthletes.length === 0 && (
                <Box textAlign="center" py={10}>
                  <Text>No athletes found matching your search criteria.</Text>
                </Box>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Athlete Details Modal */}
      {selectedAthlete && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Athlete Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                <HStack spacing={4}>
                  <Avatar size="xl" name={selectedAthlete.name} src={selectedAthlete.avatar} />
                  <Box>
                    <Heading size="md">{selectedAthlete.name}</Heading>
                    <Text color="gray.500">Age: {selectedAthlete.age}</Text>
                    <Badge colorScheme={getCompletionColor(selectedAthlete.completionRate)} mt={1}>
                      {selectedAthlete.completionRate}% Completion Rate
                    </Badge>
                  </Box>
                </HStack>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={2}>Contact Information</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Flex align="center">
                      <Icon as={FaEnvelope} color="blue.500" mr={2} />
                      <Text>{selectedAthlete.email}</Text>
                    </Flex>
                    <Flex align="center">
                      <Icon as={FaPhone} color="green.500" mr={2} />
                      <Text>{selectedAthlete.phone}</Text>
                    </Flex>
                  </SimpleGrid>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={2}>Events</Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedAthlete.events.map((event: string) => (
                      <Badge key={event} colorScheme="blue" py={1} px={2}>
                        {event}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={2}>Personal Bests</Heading>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Event</Th>
                        <Th>Result</Th>
                        <Th>Date</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedAthlete.personalBests.map((pb: any, index: number) => (
                        <Tr key={index}>
                          <Td>{pb.event}</Td>
                          <Td>{pb.time || pb.distance}</Td>
                          <Td>{new Date(pb.date).toLocaleDateString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" leftIcon={<Icon as={FaRunning} />}>
                Assign Workout
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  )
} 