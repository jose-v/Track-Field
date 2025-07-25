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
  Portal,
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
import { FaSearch, FaUserPlus, FaEnvelope, FaPhone, FaCalendarAlt, FaTrophy, FaRunning, FaEllipsisV, FaFilter, FaPlus, FaUsers, FaClock, FaCheckCircle, FaTh, FaList, FaUserFriends } from 'react-icons/fa'
import { useBreakpointValue } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoachAthletes } from '../../hooks/useCoachAthletes'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import CoachRequestStatusTable from '../../components/CoachRequestStatusTable'
import AthleteTeamManagementDrawer from '../../components/AthleteTeamManagementDrawer'
import { CreateTeamDrawer } from '../../components/CreateTeamDrawer'
import { InviteAthletesDrawer } from '../../components/InviteAthletesDrawer'
import { CoachTeamsCard } from '../../components/CoachTeamsCard'
import { MobileCoachTeamCard } from '../../components/MobileCoachTeamCard'
import { MobileAthleteDetailsDrawer } from '../../components/MobileAthleteDetailsDrawer'
import PageHeader from '../../components/PageHeader'
import { usePageHeader } from '../../hooks/usePageHeader'
import { supabase } from '../../lib/supabase'

export function CoachAthletes() {
  // Use page header hook
  usePageHeader({
    title: 'Teams & Athletes',
    subtitle: 'Manage your teams, athletes, and roster',
    icon: FaUsers
  });

  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { data: athletes = [], isLoading, isError, error, refetch } = useCoachAthletes({ includeStatuses: ['approved', 'pending'] })
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [selectedAthleteTeams, setSelectedAthleteTeams] = useState<any[]>([])
  const [selectedAthleteForTeamManagement, setSelectedAthleteForTeamManagement] = useState<any>(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid')
  const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'teams'>('overview')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isAddAthleteOpen, onOpen: onAddAthleteOpen, onClose: onAddAthleteClose } = useDisclosure()
  const { isOpen: isTeamManagementOpen, onOpen: onTeamManagementOpen, onClose: onTeamManagementClose } = useDisclosure()
  const { isOpen: isCreateTeamOpen, onOpen: onCreateTeamOpen, onClose: onCreateTeamClose } = useDisclosure()
  const { isOpen: isMobileDrawerOpen, onOpen: onMobileDrawerOpen, onClose: onMobileDrawerClose } = useDisclosure()
  
  // Detect if we're on mobile
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
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
  const mobileTabTextColor = useColorModeValue('gray.700', 'gray.200')
  
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
  
  // Function to fetch athlete teams
  const fetchAthleteTeams = async (athleteId: string) => {
    setIsLoadingTeams(true)
    try {
      const { data: teamMemberships, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          status,
          joined_at,
          teams!inner(id, name, team_type)
        `)
        .eq('user_id', athleteId)
        .eq('role', 'athlete')
        .eq('status', 'active')
        .order('joined_at', { ascending: false })

      if (error) throw error
      
      const teams = teamMemberships?.map(tm => tm.teams).filter(Boolean) || []
      setSelectedAthleteTeams(teams)
    } catch (error) {
      console.error('Error fetching athlete teams:', error)
      setSelectedAthleteTeams([])
    } finally {
      setIsLoadingTeams(false)
    }
  }
  
  // Function to open athlete details
  const openAthleteDetails = (athlete: any) => {
    setSelectedAthlete(athlete)
    setSelectedAthleteTeams([]) // Clear previous teams
    
    // Use mobile drawer on mobile, modal on desktop
    if (isMobile) {
      onMobileDrawerOpen()
    } else {
      onOpen()
    }
    
    fetchAthleteTeams(athlete.id) // Fetch teams for this athlete
  }
  
  // Function to open team management drawer
  const openTeamManagement = (athlete: any) => {
    setSelectedAthleteForTeamManagement(athlete)
    onTeamManagementOpen()
  }

  // Function to handle team management from mobile drawer
  const handleTeamManagementFromDrawer = () => {
    if (selectedAthlete) {
      setSelectedAthleteForTeamManagement(selectedAthlete)
      onTeamManagementOpen()
    }
  }

  // Function to view athlete performance/stats
  const viewAthletePerformance = (athlete: any) => {
    // Navigate to coach stats page with athlete ID as a URL parameter
    navigate(`/coach/stats?athlete=${athlete.id}`)
  }
  
  // Function to handle team changes and refresh data
  const handleTeamChange = () => {
    // Refetch athlete data when team memberships change
    refetch()
    
    // If athlete details modal is open, refresh the teams for that athlete
    if (isOpen && selectedAthlete?.id) {
      fetchAthleteTeams(selectedAthlete.id)
    }
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
    <Box>
      {/* Desktop Header */}
      <PageHeader
        title="Teams & Athletes"
        subtitle="Manage your teams, athletes, and roster"
        icon={FaUsers}
      />
        {/* Custom Mobile-Style Tab Bar */}
        <Box borderBottom="1px solid" borderColor={borderColor} mb={6}>
          <HStack spacing={0}>
            <Box
              flex="1"
              py={3}
              textAlign="center"
              borderBottom="3px solid"
              borderColor={activeTab === 'overview' ? 'blue.500' : 'transparent'}
              bg="transparent"
              cursor="pointer"
              onClick={() => setActiveTab('overview')}
            >
              <Text
                fontWeight={activeTab === 'overview' ? 'bold' : 'normal'}
                color={activeTab === 'overview' ? 'blue.500' : mobileTabTextColor}
                fontSize="sm"
              >
                Overview
              </Text>
            </Box>
            <Box
              flex="1"
              py={3}
              textAlign="center"
              borderBottom="3px solid"
              borderColor={activeTab === 'athletes' ? 'blue.500' : 'transparent'}
              bg="transparent"
              cursor="pointer"
              onClick={() => setActiveTab('athletes')}
            >
              <Text
                fontWeight={activeTab === 'athletes' ? 'bold' : 'normal'}
                color={activeTab === 'athletes' ? 'blue.500' : mobileTabTextColor}
                fontSize="sm"
              >
                Manage Athletes
              </Text>
            </Box>
            <Box
              flex="1"
              py={3}
              textAlign="center"
              borderBottom="3px solid"
              borderColor={activeTab === 'teams' ? 'blue.500' : 'transparent'}
              bg="transparent"
              cursor="pointer"
              onClick={() => setActiveTab('teams')}
            >
              <Text
                fontWeight={activeTab === 'teams' ? 'bold' : 'normal'}
                color={activeTab === 'teams' ? 'blue.500' : mobileTabTextColor}
                fontSize="sm"
              >
                Manage Teams
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Box>
              <VStack spacing={6} align="stretch">
                
                {/* Mobile Unified Stats Card */}
                <Box display={{ base: "block", lg: "none" }}>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody p={0}>
                      <Flex>
                        {/* Total Athletes */}
                        <Box flex="1" py={4} px={3} textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color={accentColor} mb={1}>
                            {totalAthletes}
                          </Text>
                          <Text fontSize="xs" fontWeight="medium" color={textColor} mb={0.5}>
                            TOTAL ATHLETES
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Active team member
                          </Text>
                        </Box>
                        
                        {/* Divider */}
                        <Box w="1px" bg={borderColor} />
                        
                        {/* Pending Requests */}
                        <Box flex="1" py={4} px={3} textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="orange.500" mb={1}>
                            {pendingRequestsCount}
                          </Text>
                          <Text fontSize="xs" fontWeight="medium" color={textColor} mb={0.5}>
                            PENDING REQUESTS
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Awaiting approval
                          </Text>
                        </Box>
                        
                        {/* Divider */}
                        <Box w="1px" bg={borderColor} />
                        
                        {/* Approved */}
                        <Box flex="1" py={4} px={3} textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="green.500" mb={1}>
                            {approvedRelationships}
                          </Text>
                          <Text fontSize="xs" fontWeight="medium" color={textColor} mb={0.5}>
                            APPROVED
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Active Relationships
                          </Text>
                        </Box>
                      </Flex>
                    </CardBody>
                  </Card>
                </Box>

                {/* Top Section: Invite Athletes Card (2/3) + Stats Stack (1/3) */}
                <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
                  {/* Main Action Card - 2/3 width */}
                  <Box flex="2">
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" h="100%">
                  <CardHeader>
                      <VStack align="start" spacing={1}>
                          <Heading size="md">Team & Athlete Management</Heading>
                        <Text fontSize="sm" color={textColor}>
                            Create teams, invite athletes, and build your coaching network
                        </Text>
                      </VStack>
                  </CardHeader>
                  
                  <CardBody pt={0}>
                    <Divider mb={4} />
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Icon as={FaUsers} color="white" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Browse & Invite:</strong> Search existing athlete accounts and send invitations
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaPlus} color="white" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Create & Invite:</strong> Create new athlete accounts and automatically send invitations
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaClock} color="white" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Pending Approval:</strong> Athletes receive notifications and can approve/decline your requests
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaCheckCircle} color="white" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Automatic Linking:</strong> Once approved, athletes appear in your roster automatically
                        </Text>
                      </HStack>
                          
                          <Stack 
                            direction={{ base: "column", md: "row" }} 
                            spacing={4} 
                            mt={4} 
                            alignSelf="start"
                            w={{ base: "100%", md: "auto" }}
                          >
                            <Button
                              leftIcon={<Icon as={FaUserPlus} />}
                              colorScheme="blue"
                              onClick={onAddAthleteOpen}
                              size={{ base: "md", md: "lg" }}
                              w={{ base: "100%", md: "auto" }}
                            >
                              Invite Athletes
                            </Button>
                            <Button
                              leftIcon={<Icon as={FaUserFriends} />}
                              colorScheme="green"
                              onClick={onCreateTeamOpen}
                              size={{ base: "md", md: "lg" }}
                              variant="outline"
                              w={{ base: "100%", md: "auto" }}
                            >
                              Add New Team
                            </Button>
                          </Stack>
                    </VStack>
                      </CardBody>
                    </Card>
                  </Box>

                  {/* Quick Stats Stack - 1/3 width - Desktop Only */}
                  <Box flex="1" display={{ base: "none", lg: "block" }}>
                    <VStack spacing={4} h="100%">
                      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
                        <CardBody py={3} px={4}>
                          <Flex align="center" gap={4}>
                            <Box flex="1" textAlign="center">
                              <Text fontSize="3xl" fontWeight="bold" color={accentColor}>
                                {totalAthletes}
                              </Text>
                            </Box>
                            <Box flex="2">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium" color={textColor}>Total Athletes</Text>
                                <Text fontSize="sm" color="gray.500">Active team members</Text>
                              </VStack>
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                      
                      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
                        <CardBody py={3} px={4}>
                          <Flex align="center" gap={4}>
                            <Box flex="1" textAlign="center">
                              <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                                {pendingRequestsCount}
                              </Text>
                            </Box>
                            <Box flex="2">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium" color={textColor}>Pending Requests</Text>
                                <Text fontSize="sm" color="gray.500">Awaiting athlete approval</Text>
                              </VStack>
                            </Box>
                          </Flex>
                  </CardBody>
                </Card>

                      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
                        <CardBody py={3} px={4}>
                          <Flex align="center" gap={4}>
                            <Box flex="1" textAlign="center">
                              <Text fontSize="3xl" fontWeight="bold" color="green.500">
                                {approvedRelationships}
                              </Text>
                            </Box>
                            <Box flex="2">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium" color={textColor}>Approved</Text>
                                <Text fontSize="sm" color="gray.500">Active relationships</Text>
                              </VStack>
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                    </VStack>
                  </Box>
                </Flex>

                {/* Current Athletes Section */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="md">Current Athletes</Heading>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      All athletes currently on your roster (both direct invitations and team members)
                    </Text>
                  </CardHeader>
                  <CardBody>
                    {isLoading ? (
                      <Flex justify="center" align="center" p={8}>
                        <Spinner />
                      </Flex>
                    ) : isError ? (
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        Error loading athletes: {error?.message || 'Please try again later'}
                      </Alert>
                    ) : athletes.length === 0 ? (
                      <Box textAlign="center" p={4}>
                        <Text color={textColor}>No athletes on your roster yet</Text>
                      </Box>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple">
                                                     <Thead>
                             <Tr>
                               <Th>Athlete</Th>
                               <Th>Email</Th>
                               <Th>Status</Th>
                             </Tr>
                           </Thead>
                          <Tbody>
                            {athletes.map(athlete => (
                              <Tr key={athlete.id}>
                                <Td>
                                  <HStack>
                                    <Avatar 
                                      size="sm" 
                                      name={`${athlete.first_name} ${athlete.last_name}`} 
                                      src={athlete.avatar_url}
                                    />
                                    <Text>{`${athlete.first_name} ${athlete.last_name}`}</Text>
                                  </HStack>
                                </Td>
                                                                 <Td>{athlete.email || 'No email'}</Td>
                                 <Td>
                                   <Badge 
                                     colorScheme={
                                       athlete.approval_status === 'pending' 
                                         ? 'yellow' 
                                         : 'green'
                                     }
                                   >
                                     {athlete.approval_status === 'pending' ? 'Pending' : 'Active'}
                                   </Badge>
                                 </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </CardBody>
                </Card>

                {/* Pending Invitations */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <HStack justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">Pending Invitations</Heading>
                        <Text fontSize="sm" color={textColor}>
                          Invitations awaiting athlete approval - send reminders or cancel requests
                        </Text>
                    </VStack>
                      {pendingRequestsCount > 0 && (
                        <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                          {pendingRequestsCount} pending
                        </Badge>
                      )}
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <CoachRequestStatusTable showOnlyPending={true} />
                  </CardBody>
                </Card>

              </VStack>
          </Box>
        )}
            
        {/* Manage Athletes Tab Panel */}
        {activeTab === 'athletes' && (
          <Box>
              {/* Search, Filter, and View Toggle */}
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
                
                <Flex gap={4} align="center">
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
                  
                  {/* View Toggle Buttons */}
                  <HStack spacing={0}>
                    <Button
                      leftIcon={<Icon as={FaTh} />}
                      size="sm"
                      variant={viewType === 'grid' ? 'solid' : 'outline'}
                      colorScheme={viewType === 'grid' ? 'blue' : 'gray'}
                      onClick={() => setViewType('grid')}
                      borderRightRadius={0}
                    >
                      Grid
                    </Button>
                    <Button
                      leftIcon={<Icon as={FaList} />}
                      size="sm"
                      variant={viewType === 'table' ? 'solid' : 'outline'}
                      colorScheme={viewType === 'table' ? 'blue' : 'gray'}
                      onClick={() => setViewType('table')}
                      borderLeftRadius={0}
                    >
                      Table
                    </Button>
                  </HStack>
                </Flex>
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
                  {viewType === 'grid' ? (
                    /* Grid View */
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
                              <HStack mb={4} justify="space-between">
                                <HStack>
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
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    aria-label="Options"
                                    icon={<FaEllipsisV />}
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Portal>
                                    <MenuList zIndex={1500}>
                                      <MenuItem onClick={(e) => { e.stopPropagation(); openAthleteDetails(athlete); }}>View Details</MenuItem>
                                      <MenuItem onClick={(e) => { e.stopPropagation(); openTeamManagement(athlete); }}>Team Assignment</MenuItem>
                                      <MenuItem onClick={(e) => { e.stopPropagation(); viewAthletePerformance(athlete); }}>View Performance</MenuItem>
                                      <MenuItem color="red.500" onClick={(e) => e.stopPropagation()}>Remove Athlete</MenuItem>
                                    </MenuList>
                                  </Portal>
                                </Menu>
                          </HStack>
                          
                          <Stack spacing={2} mb={4}>
                            <Flex align="center">
                              <Icon as={FaPhone} color="white" mr={2} />
                              <Text fontSize="sm" color={bodyTextColor}>{athlete.phone || 'No phone number'}</Text>
                            </Flex>
                            <Flex align="center">
                              <Icon as={FaEnvelope} color="white" mr={2} />
                              <Text fontSize="sm" color={bodyTextColor}>{athlete.email || 'No email'}</Text>
                            </Flex>
                            <Flex align="center">
                              <Icon as={FaRunning} color="white" mr={2} />
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
                  ) : (
                    /* Table View */
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
                                  <Portal>
                                    <MenuList zIndex={1500}>
                                  <MenuItem onClick={() => openAthleteDetails(athlete)}>View Details</MenuItem>
                                      <MenuItem onClick={() => openTeamManagement(athlete)}>Team Assignment</MenuItem>
                                  <MenuItem onClick={() => viewAthletePerformance(athlete)}>View Performance</MenuItem>
                                  <MenuItem color="red.500">Remove Athlete</MenuItem>
                                </MenuList>
                                  </Portal>
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
                  )}
                </>
              )}
          </Box>
        )}
            
        {/* Manage Teams Tab Panel */}
        {activeTab === 'teams' && (
          <Box>
              <VStack spacing={6} align="stretch">
                
                {/* Page Header */}
                <Box>
                  <Heading size="lg" mb={2}>Team Management</Heading>
                  <Text color={textColor}>
                    Manage your teams, view members, and track team statistics
                  </Text>
                </Box>

                {/* Create New Team Card */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <VStack align="start" spacing={1}>
                      <Heading size="md">Create New Team</Heading>
                      <Text fontSize="sm" color={textColor}>
                        Start a new team and invite athletes to join
                      </Text>
                    </VStack>
                  </CardHeader>
                  
                  <CardBody pt={0}>
                    <Divider mb={4} />
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Icon as={FaUserFriends} color="green.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Team Creation:</strong> Create coach teams for specific groups of athletes
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaUsers} color="blue.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Invite System:</strong> Each team gets a unique invite code for easy joining
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaTrophy} color="purple.500" />
                        <Text fontSize="sm" color={textColor}>
                          <strong>Team Management:</strong> Manage members, assign workouts, and track progress
                        </Text>
                      </HStack>
                      
                      <Button
                        leftIcon={<Icon as={FaUserFriends} />}
                        colorScheme="green"
                        onClick={onCreateTeamOpen}
                        size="lg"
                        mt={2}
                      >
                        Create New Team
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Teams Overview Card */}
                {/* Mobile Teams Card */}
                <Box display={{ base: "block", md: "none" }}>
                  <MobileCoachTeamCard />
                </Box>
                {/* Desktop Teams Card */}
                <Box display={{ base: "none", md: "block" }}>
                  <CoachTeamsCard />
                </Box>
                
              </VStack>
          </Box>
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
                  {isLoadingTeams ? (
                    <Flex align="center" gap={2}>
                      <Spinner size="sm" />
                      <Text fontSize="sm">Loading teams...</Text>
                    </Flex>
                  ) : selectedAthleteTeams.length === 0 ? (
                    <Text>No teams assigned</Text>
                  ) : (
                    <VStack align="start" spacing={2}>
                      {selectedAthleteTeams.map((team: any) => (
                        <HStack key={team.id} justify="space-between" w="100%">
                          <Text fontWeight="medium">{team.name}</Text>
                          <Badge colorScheme="blue" size="sm">
                            {team.team_type}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  )}
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
            <Button 
              colorScheme="purple" 
              mr={3}
              leftIcon={<Icon as={FaUsers} />}
              onClick={() => {
                onClose()
                openTeamManagement(selectedAthlete)
              }}
            >
              Team Assignment
            </Button>
            <Button onClick={() => {
              onClose()
              setSelectedAthleteTeams([]) // Clear teams when closing
            }}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Athlete Modal */}
      {/* Invite Athletes Drawer */}
      <InviteAthletesDrawer 
        isOpen={isAddAthleteOpen} 
        onClose={onAddAthleteClose}
        onAthleteInvited={() => {
          // Refresh data after athlete invitation
          refetch()
        }}
      />

      {/* Athlete Team Management Drawer */}
      <AthleteTeamManagementDrawer
        isOpen={isTeamManagementOpen}
        onClose={() => {
          onTeamManagementClose()
          setSelectedAthleteForTeamManagement(null)
        }}
        athlete={selectedAthleteForTeamManagement}
        onTeamChange={handleTeamChange}
      />

      {/* Create Team Drawer */}
      <CreateTeamDrawer
        isOpen={isCreateTeamOpen}
        onClose={onCreateTeamClose}
        onTeamCreated={() => {
          // Refresh data after team creation if needed
          refetch()
        }}
      />

      {/* Mobile Athlete Details Drawer */}
      <MobileAthleteDetailsDrawer
        isOpen={isMobileDrawerOpen}
        onClose={onMobileDrawerClose}
        athlete={selectedAthlete}
        athleteTeams={selectedAthleteTeams}
        isLoadingTeams={isLoadingTeams}
        onTeamManagement={handleTeamManagementFromDrawer}
      />
    </Box>
  )
} 