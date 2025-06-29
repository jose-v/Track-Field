import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { FaSearch, FaUserPlus, FaEnvelope, FaPhone, FaCalendarAlt, FaTrophy, FaRunning, FaEllipsisV, FaFilter, FaPlus, FaUsers, FaClock, FaCheckCircle } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import AddAthleteModal from '../../components/AddAthleteModal'
import CoachRequestStatusTable from '../../components/CoachRequestStatusTable'
import { MobileHeader } from '../../components'
import { supabase } from '../../lib/supabase'

export function CoachAthletes() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { data: athletes = [], isLoading, isError, error } = useCoachAthletes()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isAddAthleteOpen, onOpen: onAddAthleteOpen, onClose: onAddAthleteClose } = useDisclosure()
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const accentColor = useColorModeValue('blue.500', 'blue.300')
  
  // Additional color values for JSX elements
  const cardBgSecondary = useColorModeValue('white', 'gray.800')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700')
  const headingColor = useColorModeValue('gray.800', 'gray.100')
  const subTextColor = useColorModeValue('gray.500', 'gray.400')
  const bodyTextColor = useColorModeValue('gray.700', 'gray.300')
  const labelTextColor = useColorModeValue('gray.700', 'gray.200')
  
  const filteredAthletes = !searchTerm
    ? athletes
    : athletes.filter(athlete =>
        (athlete.first_name + ' ' + athlete.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (athlete.events || []).some((event: string) => event.toLowerCase().includes(searchTerm.toLowerCase()))
      )
  
  // Fetch pending requests count
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('coach_athletes')
          .select('id')
          .eq('coach_id', user.id)
          .eq('approval_status', 'pending')
        
        if (error) throw error
        setPendingRequestsCount(data?.length || 0)
      } catch (error) {
        console.error('Error fetching pending requests:', error)
        setPendingRequestsCount(0)
      }
    }
    
    fetchPendingRequests()
  }, [user?.id])
  
  // Function to handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }
  
  // Function to open athlete details
  const openAthleteDetails = (athlete: any) => {
    setSelectedAthlete(athlete)
    onOpen()
  }
  
  // Helper function to get Badge color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green'
    if (rate >= 60) return 'yellow'
    return 'red'
  }

  // Calculate stats
  const totalAthletes = athletes.length
  const approvedRelationships = athletes.length // All returned athletes are approved

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={bgColor} 
      minH="100vh"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* Mobile Header */}
      <MobileHeader
        title="Athletes"
        subtitle="Manage and view your team"
        isLoading={profileLoading}
      />

      {/* Desktop Header */}
      <Box display={{ base: "none", lg: "block" }} px={{ base: 4, md: 6 }} pt={6}>
        <Heading size="lg" mb={2}>
          Athletes
        </Heading>
        <Text color={textColor}>
          Manage your athletes and view your team roster
        </Text>
      </Box>

      <Container maxW="container.xl" px={{ base: 4, md: 6 }} mt={{ base: "20px", lg: 8 }}>
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Manage Athletes</Tab>
            <Tab>Grid View</Tab>
            <Tab>Table View</Tab>
          </TabList>
          
          <TabPanels>
            {/* Manage Athletes Tab Panel */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                
                {/* Quick Stats */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <Stat>
                        <StatLabel color={textColor}>Total Athletes</StatLabel>
                        <StatNumber color={accentColor}>{totalAthletes}</StatNumber>
                        <StatHelpText>Active team members</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <Stat>
                        <StatLabel color={textColor}>Pending Requests</StatLabel>
                        <StatNumber color="orange.500">{pendingRequestsCount}</StatNumber>
                        <StatHelpText>Awaiting athlete approval</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <Stat>
                        <StatLabel color={textColor}>Approved</StatLabel>
                        <StatNumber color="green.500">{approvedRelationships}</StatNumber>
                        <StatHelpText>Active relationships</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Main Action Card */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <HStack justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">Invite Athletes</Heading>
                        <Text fontSize="sm" color={textColor}>
                          Add existing athletes or create new accounts to build your team
                        </Text>
                      </VStack>
                      <Button
                        leftIcon={<Icon as={FaUserPlus} />}
                        colorScheme="blue"
                        onClick={onAddAthleteOpen}
                        size="lg"
                      >
                        Invite Athletes
                      </Button>
                    </HStack>
                  </CardHeader>
                  
                  <CardBody pt={0}>
                    <Divider mb={4} />
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Icon as={FaUsers} color="blue.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Browse & Invite:</strong> Search existing athlete accounts and send invitations
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaPlus} color="green.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Create & Invite:</strong> Create new athlete accounts and automatically send invitations
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaClock} color="orange.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Pending Approval:</strong> Athletes receive notifications and can approve/decline your requests
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaCheckCircle} color="purple.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Automatic Linking:</strong> Once approved, athletes appear in your roster automatically
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Request Status Table */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="md">Invitation Status</Heading>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      Track your sent invitations and their current status
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <CoachRequestStatusTable />
                  </CardBody>
                </Card>

                {/* How It Works */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="md">How the Invitation System Works</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="start" spacing={4}>
                      <Box>
                        <Badge colorScheme="blue" mb={2}>Step 1</Badge>
                        <Text fontSize="sm" color={textColor}>
                          <strong>Send Invitation:</strong> Click "Invite Athletes" to browse existing athletes or create new accounts. 
                          When you select athletes, the system automatically creates pending coach-athlete relationships.
                        </Text>
                      </Box>
                      
                      <Box>
                        <Badge colorScheme="orange" mb={2}>Step 2</Badge>
                        <Text fontSize="sm" color={textColor}>
                          <strong>Athlete Notification:</strong> Athletes receive notifications about your invitation. 
                          They can view details about you and choose to approve or decline the request.
                        </Text>
                      </Box>
                      
                      <Box>
                        <Badge colorScheme="green" mb={2}>Step 3</Badge>
                        <Text fontSize="sm" color={textColor}>
                          <strong>Automatic Integration:</strong> Once an athlete approves your request, they automatically 
                          appear in your Athletes page, workout assignment lists, and all coaching tools.
                        </Text>
                      </Box>
                      
                      <Box>
                        <Badge colorScheme="purple" mb={2}>Monitoring</Badge>
                        <Text fontSize="sm" color={textColor}>
                          <strong>Track Progress:</strong> Use the "Invitation Status" table above to monitor all your sent 
                          requests. You can send reminders for pending requests or see which athletes have declined.
                        </Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Grid View Tab Panel */}
            <TabPanel px={0}>
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
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {filteredAthletes.map(athlete => (
                      <Card 
                        key={athlete.id}
                        cursor="pointer"
                        onClick={() => openAthleteDetails(athlete)}
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        transition="all 0.2s"
                        bg={cardBgSecondary}
                        borderWidth="1px"
                        borderColor={cardBorderColor}
                      >
                        <CardBody bg={cardBgSecondary} borderRadius="inherit">
                          <HStack mb={4}>
                            <Avatar 
                              size="md" 
                              name={`${athlete.first_name} ${athlete.last_name}`} 
                              src={athlete.avatar_url} 
                            />
                            <Box>
                              <Heading size="md" color={headingColor}>{`${athlete.first_name} ${athlete.last_name}`}</Heading>
                              <Text fontSize="sm" color={subTextColor}>Age: {athlete.age}</Text>
                            </Box>
                          </HStack>
                          
                          <Stack spacing={2} mb={4}>
                            <Flex align="center">
                              <Icon as={FaPhone} color="green.500" mr={2} />
                              <Text fontSize="sm" color={bodyTextColor}>{athlete.phone || 'No phone number'}</Text>
                            </Flex>
                            <Flex align="center">
                              <Icon as={FaEnvelope} color="blue.500" mr={2} />
                              <Text fontSize="sm" color={bodyTextColor}>{athlete.email || 'No email'}</Text>
                            </Flex>
                            <Flex align="center">
                              <Icon as={FaRunning} color="purple.500" mr={2} />
                              <Text fontSize="sm" color={bodyTextColor}>{(athlete.events || []).join(', ') || 'No events assigned'}</Text>
                            </Flex>
                          </Stack>
                          
                          <Flex justify="space-between" align="center">
                            <Text fontSize="sm" fontWeight="medium" color={labelTextColor}>Workout Completion:</Text>
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
                </>
              )}
            </TabPanel>
            
            {/* Table View Tab Panel */}
            <TabPanel px={0}>
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
                <>
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
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
      
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
                    <Text color={subTextColor}>Age: {selectedAthlete.age}</Text>
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

      {/* Add Athlete Modal */}
      <AddAthleteModal isOpen={isAddAthleteOpen} onClose={onAddAthleteClose} />
    </Box>
  )
} 