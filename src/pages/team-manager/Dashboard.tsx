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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Flex,
  useColorModeValue,
  useToast,
  Spinner,
  useDisclosure
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaUserFriends, 
  FaUsers, 
  FaClipboardCheck, 
  FaCalendarAlt, 
  FaChartLine, 
  FaClipboardList, 
  FaTrophy, 
  FaCloudSun, 
  FaUserTie,
  FaShieldAlt,
  FaPlus
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useProfileDisplay } from '../../hooks/useProfileDisplay';
import { WeatherCard, TrackMeetsCard, AlertsNotificationsCard, TodaysFocusCard } from '../../components';
import { TeamSetupModal } from '../../components/TeamSetupModal';


export function TeamManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const toast = useToast();
  
  // Team setup modal
  const { isOpen: isTeamSetupOpen, onOpen: onTeamSetupOpen, onClose: onTeamSetupClose } = useDisclosure();

  // Mock data for now - in production this would come from your database
  const mockStats = {
    totalTeams: 3,
    totalCoaches: 8,
    totalAthletes: 45,
    upcomingMeets: 2,
    completionRate: 89,
    teamPerformance: 92.4
  };

  // Color mode styles
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('none', 'base');
  const subtitleColor = useColorModeValue('gray.600', 'gray.200');
  const statHelpTextColor = useColorModeValue('gray.500', 'gray.200');
  const statLabelColor = useColorModeValue('gray.600', 'gray.200');

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const firstName = profile?.first_name || 'Manager';
    
    if (hour < 12) {
      return `Good morning, ${firstName}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${firstName}!`;
    } else {
      return `Good evening, ${firstName}!`;
    }
  };

  const handleAlertClick = (alert: any) => {
    console.log('Alert clicked:', alert);
    // Handle alert navigation
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Box py={8}>
      {/* Mobile Layout */}
      <Box display={{ base: "block", md: "none" }}>
        {/* Mobile Welcome Message - positioned on same line as hamburger */}
        <Box 
          position="absolute"
          top="24px"
          right="15px"
          zIndex="999"
        >
          <Text 
            fontSize="md" 
            fontWeight="semibold" 
            color="white"
            textAlign="left"
          >
            {getWelcomeMessage()}
          </Text>
        </Box>
        
        {/* Weather Card - Full width with 10px padding */}
        <Box px="10px" mb={4}>
          <WeatherCard 
            city={profile?.city || "Greensboro"}
            state={profile?.state || "NC"}
            weather={{
              temp: "71", 
              condition: "Clouds",
              description: "scattered clouds"
            }}
            isLoading={profileLoading}
          />
        </Box>

        {/* Quick Actions - 3 buttons in one line */}
        <Box px="10px" mb={8}>
          <HStack spacing={3} justify="space-between">
            <Button 
              variant="solid" 
              colorScheme="orange"
              size="sm"
              leftIcon={<FaPlus />}
              onClick={onTeamSetupOpen}
              flex="1"
            >
              Create Team
            </Button>
            <Button 
              as={RouterLink} 
              to="/team-manager/coaches" 
              variant="solid" 
              colorScheme="orange"
              size="sm"
              flex="1"
            >
              Manage Coaches
            </Button>
            <Button 
              as={RouterLink} 
              to="/team-manager/athletes" 
              variant="solid" 
              colorScheme="orange"
              size="sm"
              flex="1"
            >
              View Athletes
            </Button>
          </HStack>
        </Box>
      </Box>

      {/* Desktop Layout */}
      <Box display={{ base: "none", md: "block" }}>
        {/* Header Section */}
        <Flex justify="space-between" align="start" mb={8}>
          <Box flex={1}>
            <Heading mb={2}>Team Manager Dashboard</Heading>
            <Text color={subtitleColor} mb={4}>
              {getWelcomeMessage()}
            </Text>
            
            {/* Quick Actions integrated into header */}
            <HStack spacing={3} flexWrap="wrap">
              <Button 
                variant="solid" 
                colorScheme="orange"
                size="sm"
                leftIcon={<FaPlus />}
                onClick={onTeamSetupOpen}
              >
                Create Team
              </Button>
              <Button 
                as={RouterLink} 
                to="/team-manager/coaches" 
                variant="solid" 
                colorScheme="orange"
                size="sm"
              >
                Manage Coaches
              </Button>
              <Button 
                as={RouterLink} 
                to="/team-manager/athletes" 
                variant="solid" 
                colorScheme="orange"
                size="sm"
              >
                View Athletes
              </Button>
              <Button 
                as={RouterLink} 
                to="/team-manager/stats" 
                variant="solid" 
                colorScheme="teal"
                size="sm"
              >
                View Analytics
              </Button>
            </HStack>
          </Box>
          
          {/* Weather Widget */}
          <Box width="390px" minW="390px">
            <WeatherCard 
              city={profile?.city || "Greensboro"}
              state={profile?.state || "NC"}
              weather={{
                temp: "71", 
                condition: "Clouds",
                description: "scattered clouds"
            }}
              isLoading={profileLoading}
            />
          </Box>
        </Flex>
      </Box>

      {/* Priority Section 1: Alerts & Notifications (High Priority) */}
      <Box mb={8}>
        <AlertsNotificationsCard onAlertClick={handleAlertClick} />
      </Box>

      {/* Today's Focus Section */}
      <Box mb={8}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Heading size="md" mb={4}>Today's Team Management Focus</Heading>
            <VStack spacing={3} align="stretch">
              <Text>• Review coach applications</Text>
              <Text>• Approve athlete registrations</Text>
              <Text>• Update team settings</Text>
              <Text>• Schedule team meetings</Text>
            </VStack>
          </CardBody>
        </Card>
      </Box>

      {/* Dashboard Stats - At-a-Glance Metrics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Teams Managed</StatLabel>
              <StatNumber fontSize="3xl">{mockStats.totalTeams}</StatNumber>
              <StatHelpText color={statHelpTextColor}>Active teams</StatHelpText>
            </Box>
            <Box my="auto" color="orange.500" alignContent="center"><Icon as={FaTrophy} w={8} h={8} /></Box>
          </Flex>
        </Stat>
        
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Total Coaches</StatLabel>
              <StatNumber fontSize="3xl">{mockStats.totalCoaches}</StatNumber>
              <StatHelpText color={statHelpTextColor}>Across all teams</StatHelpText>
            </Box>
            <Box my="auto" color="purple.500" alignContent="center"><Icon as={FaUserTie} w={8} h={8} /></Box>
          </Flex>
        </Stat>
        
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Total Athletes</StatLabel>
              <StatNumber fontSize="3xl">{mockStats.totalAthletes}</StatNumber>
              <StatHelpText color={statHelpTextColor}>All team members</StatHelpText>
            </Box>
            <Box my="auto" color="blue.500" alignContent="center"><Icon as={FaUserFriends} w={8} h={8} /></Box>
          </Flex>
        </Stat>
        
        <Stat px={4} py={5} bg={cardBg} shadow={cardShadow} rounded="lg" borderWidth="1px" borderColor={borderColor}>
          <Flex justifyContent="space-between">
            <Box pl={2}>
              <StatLabel fontWeight="medium" color={statLabelColor}>Team Performance</StatLabel>
              <StatNumber fontSize="3xl" color="green.500">
                {mockStats.teamPerformance}%
              </StatNumber>
              <StatHelpText color={statHelpTextColor}>Overall success rate</StatHelpText>
            </Box>
            <Box my="auto" color="green.500" alignContent="center"><Icon as={FaChartLine} w={8} h={8} /></Box>
          </Flex>
        </Stat>
      </SimpleGrid>
      
      {/* Secondary Information Cards */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        {/* Teams Overview Card */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stack spacing={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Your Teams</Heading>
                <Button 
                  size="sm" 
                  variant="outline" 
                  as={RouterLink} 
                  to="/team-manager/teams"
                  colorScheme="orange"
                >
                  Manage All
                </Button>
              </Flex>
              
              <VStack spacing={3} align="stretch">
                <Flex justify="space-between" align="center" p={3} bg={useColorModeValue('gray.50', 'gray.700')} rounded="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">Track & Field Varsity</Text>
                    <Text fontSize="sm" color={subtitleColor}>15 athletes • 3 coaches</Text>
                  </VStack>
                  <Box color="green.500">
                    <Icon as={FaClipboardCheck} />
                  </Box>
                </Flex>
                
                <Flex justify="space-between" align="center" p={3} bg={useColorModeValue('gray.50', 'gray.700')} rounded="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">Track & Field JV</Text>
                    <Text fontSize="sm" color={subtitleColor}>20 athletes • 2 coaches</Text>
                  </VStack>
                  <Box color="green.500">
                    <Icon as={FaClipboardCheck} />
                  </Box>
                </Flex>
                
                <Flex justify="space-between" align="center" p={3} bg={useColorModeValue('gray.50', 'gray.700')} rounded="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">Cross Country</Text>
                    <Text fontSize="sm" color={subtitleColor}>10 athletes • 3 coaches</Text>
                  </VStack>
                  <Box color="yellow.500">
                    <Icon as={FaUsers} />
                  </Box>
                </Flex>
              </VStack>
            </Stack>
          </CardBody>
        </Card>

        {/* Administrative Tools Card */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stack spacing={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Administrative Tools</Heading>
                <Button 
                  size="sm" 
                  variant="outline" 
                  as={RouterLink} 
                  to="/team-manager/admin"
                  colorScheme="orange"
                >
                  View All
                </Button>
              </Flex>
              
              <VStack spacing={3} align="stretch">
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  leftIcon={<FaShieldAlt />}
                  as={RouterLink}
                  to="/team-manager/admin/permissions"
                >
                  Manage Permissions
                </Button>
                
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  leftIcon={<FaClipboardList />}
                  as={RouterLink}
                  to="/team-manager/admin/reports"
                >
                  Generate Reports
                </Button>
                
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  leftIcon={<FaUsers />}
                  as={RouterLink}
                  to="/team-manager/admin/invitations"
                >
                  Manage Invitations
                </Button>
                
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  leftIcon={<FaCalendarAlt />}
                  as={RouterLink}
                  to="/team-manager/admin/settings"
                >
                  Team Settings
                </Button>
              </VStack>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Track Meets Calendar View */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Upcoming Track Meets</Heading>
        <TrackMeetsCard 
          viewAllLink="/team-manager/meets" 
          userRole="coach"
        />
      </Box>

      {/* Team Setup Modal */}
      <TeamSetupModal
        isOpen={isTeamSetupOpen}
        onClose={onTeamSetupClose}
        userRole="team_manager"
      />

    </Box>
  );
} 