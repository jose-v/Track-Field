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
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { FaSearch, FaUserPlus, FaEnvelope, FaPhone, FaCalendarAlt, FaTrophy, FaRunning, FaEllipsisV, FaFilter } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'

export function CoachAthletes() {
  const { data: athletes = [], isLoading, isError, error } = useCoachAthletes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  const filteredAthletes = !searchTerm
    ? athletes
    : athletes.filter(athlete =>
        (athlete.first_name + ' ' + athlete.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (athlete.events || []).some((event: string) => event.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  
  // Function to handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
        <Button 
          variant="solid" 
          colorScheme="blue" 
          leftIcon={<Icon as={FaUserPlus} />}
        >
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
      
      {/* Loading and Error States */}
      {isLoading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : isError ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Error loading athletes: {error?.message || 'Please try again later'}
        </Alert>
      ) : (
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Grid View</Tab>
            <Tab>Table View</Tab>
          </TabList>
          
          <TabPanels>
            {/* Grid View */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredAthletes.map(athlete => (
                  <Card 
                    key={athlete.id}
                    cursor="pointer"
                    onClick={() => openAthleteDetails(athlete)}
                    _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    transition="all 0.2s"
                    bg={useColorModeValue('white', 'gray.800')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                  >
                    <CardBody bg={useColorModeValue('white', 'gray.800')} borderRadius="inherit">
                      <HStack mb={4}>
                        <Avatar 
                          size="md" 
                          name={`${athlete.first_name} ${athlete.last_name}`} 
                          src={athlete.avatar_url} 
                        />
                        <Box>
                          <Heading size="md" color={useColorModeValue('gray.800', 'gray.100')}>{`${athlete.first_name} ${athlete.last_name}`}</Heading>
                          <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>Age: {athlete.age}</Text>
                        </Box>
                      </HStack>
                      
                      <Stack spacing={2} mb={4}>
                        <Flex align="center">
                          <Icon as={FaPhone} color="green.500" mr={2} />
                          <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>{athlete.phone || 'No phone number'}</Text>
                        </Flex>
                        <Flex align="center">
                          <Icon as={FaEnvelope} color="blue.500" mr={2} />
                          <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>{athlete.email || 'No email'}</Text>
                        </Flex>
                        <Flex align="center">
                          <Icon as={FaRunning} color="purple.500" mr={2} />
                          <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>{(athlete.events || []).join(', ') || 'No events assigned'}</Text>
                        </Flex>
                      </Stack>
                      
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.700', 'gray.200')}>Workout Completion:</Text>
                        <Badge colorScheme={getCompletionColor(athlete.completion_rate || 0)}>
                          {athlete.completion_rate || 0}%
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
            <TabPanel px={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Athlete</Th>
                      <Th>Events</Th>
                      <Th>Phone</Th>
                      <Th>Email</Th>
                      <Th>Completion Rate</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAthletes.map(athlete => (
                      <Tr key={athlete.id} _hover={{ bg: tableRowHoverBg }}>
                        <Td>
                          <HStack>
                            <Avatar 
                              size="sm" 
                              name={`${athlete.first_name} ${athlete.last_name}`} 
                              src={athlete.avatar_url}
                            />
                            <Box>
                              <Text fontWeight="medium">{`${athlete.first_name} ${athlete.last_name}`}</Text>
                              <Text fontSize="xs" color="gray.500">Age: {athlete.age}</Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>{(athlete.events || []).join(', ') || 'No events'}</Td>
                        <Td>{athlete.phone || 'No phone'}</Td>
                        <Td>{athlete.email || 'No email'}</Td>
                        <Td>
                          <Badge colorScheme={getCompletionColor(athlete.completion_rate || 0)}>
                            {athlete.completion_rate || 0}%
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
      )}
      
      {/* Athlete Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader>Athlete Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAthlete && (
              <VStack align="stretch" spacing={4}>
                <HStack>
                  <Avatar 
                    size="xl" 
                    name={`${selectedAthlete.first_name} ${selectedAthlete.last_name}`} 
                    src={selectedAthlete.avatar_url}
                  />
                  <Box>
                    <Heading size="lg">{`${selectedAthlete.first_name} ${selectedAthlete.last_name}`}</Heading>
                    <Text color={useColorModeValue('gray.500', 'gray.400')}>Age: {selectedAthlete.age}</Text>
                  </Box>
                </HStack>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={2}>Contact Information</Heading>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FaPhone} color="green.500" />
                      <Text>{selectedAthlete.phone || 'No phone number'}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaEnvelope} color="blue.500" />
                      <Text>{selectedAthlete.email || 'No email'}</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={2}>Events</Heading>
                  <Flex gap={2} flexWrap="wrap">
                    {(selectedAthlete.events || []).map((event: string, index: number) => (
                      <Badge key={index} colorScheme="purple" py={1} px={2}>
                        {event}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={2}>Team Information</Heading>
                  <Text>{selectedAthlete.team_id || 'No team assigned'}</Text>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={2}>Performance</Heading>
                  <HStack justify="space-between">
                    <Text>Workout Completion Rate:</Text>
                    <Badge colorScheme={getCompletionColor(selectedAthlete.completion_rate || 0)}>
                      {selectedAthlete.completion_rate || 0}%
                    </Badge>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3}>
              Edit Profile
            </Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 