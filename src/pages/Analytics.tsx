import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Badge,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  FaChartLine, 
  FaBed, 
  FaHeartbeat, 
  FaDumbbell, 
  FaShieldAlt,
  FaUser,
  FaUsers,
  FaCalendarAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

// Import existing analytics components
import { SleepStatsCard } from '../components/SleepStatsCard';

// Import new analytics components we'll create
import { InjuryRiskCard } from '../components/analytics/InjuryRiskCard';
import { TrainingLoadCard } from '../components/analytics/TrainingLoadCard';
import { WellnessCard } from '../components/analytics/WellnessCard';
import { PerformanceMetricsCard } from '../components/analytics/PerformanceMetricsCard';
import { AnalyticsOverviewCard } from '../components/analytics/AnalyticsOverviewCard';
import { WorkoutComplianceCard } from '../components/analytics/WorkoutComplianceCard';
import { PersonalRecordsCard } from '../components/analytics/PersonalRecordsCard';
import { TeamOverviewCard } from '../components/analytics/TeamOverviewCard';

export function Analytics() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [selectedTab, setSelectedTab] = useState(0);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isCoach = profile?.role === 'coach';
  const isAthlete = profile?.role === 'athlete';

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="7xl" py={8}>
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Icon as={FaChartLine} boxSize={8} color="blue.500" />
                  <Heading size="xl" color={useColorModeValue('gray.800', 'gray.100')}>
                    Analytics Dashboard
                  </Heading>
                </HStack>
                <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
                  {isCoach 
                    ? 'Monitor your athletes\' performance, wellness, and injury risk'
                    : 'Track your performance, recovery, and training insights'
                  }
                </Text>
              </VStack>
              <VStack align="end" spacing={2}>
                <Badge 
                  colorScheme={isCoach ? 'purple' : 'green'} 
                  variant="solid" 
                  fontSize="sm"
                  px={3}
                  py={1}
                >
                  {isCoach ? 'COACH VIEW' : 'ATHLETE VIEW'}
                </Badge>
                <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                  Real-time analytics powered by AI
                </Text>
              </VStack>
            </HStack>

            {/* Development Notice */}
            <Alert status="info" borderRadius="md" mb={6}>
              <AlertIcon />
              <Box>
                <AlertTitle>Analytics Testing Dashboard</AlertTitle>
                <AlertDescription>
                  This page serves as both a user interface and testing ground for all analytics components. 
                  Data shown includes both real user data and demo calculations.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>

          {/* Analytics Overview */}
          <AnalyticsOverviewCard />

          {/* Main Analytics Tabs */}
          <Tabs 
            index={selectedTab} 
            onChange={setSelectedTab}
            variant="enclosed"
            colorScheme="blue"
          >
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaBed} />
                  <Text>Sleep & Recovery</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaCalendarAlt} />
                  <Text>Workout Performance</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaShieldAlt} />
                  <Text>Injury Risk</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaDumbbell} />
                  <Text>Training Load</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaHeartbeat} />
                  <Text>Wellness</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaChartLine} />
                  <Text>Performance</Text>
                </HStack>
              </Tab>
              {isCoach && (
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaUsers} />
                    <Text>Team Overview</Text>
                  </HStack>
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Sleep & Recovery Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                      Sleep & Recovery Analytics
                    </Heading>
                    <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6}>
                      <SleepStatsCard />
                      {/* Additional sleep components can go here */}
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Workout Performance Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                      Workout Performance & Compliance
                    </Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')} mb={6}>
                      Track workout adherence, RPE trends, and personal record achievements
                    </Text>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      <WorkoutComplianceCard />
                      <PersonalRecordsCard />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Injury Risk Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                      Injury Risk Assessment
                    </Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')} mb={6}>
                      Based on Acute:Chronic Workload Ratio (ACWR) methodology and wellness indicators
                    </Text>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      <InjuryRiskCard />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Training Load Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                      Training Load Analysis
                    </Heading>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      <TrainingLoadCard />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Wellness Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                      Wellness Monitoring
                    </Heading>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      <WellnessCard />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Performance Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                      Performance Metrics
                    </Heading>
                    <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6}>
                      <PerformanceMetricsCard />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Team Overview Tab (Coach only) */}
              {isCoach && (
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} color={useColorModeValue('gray.700', 'gray.300')}>
                        Team Analytics Overview
                      </Heading>
                      <Text color={useColorModeValue('gray.600', 'gray.400')} mb={6}>
                        Monitor all athletes' key metrics and identify those needing attention
                      </Text>
                      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
                        <TeamOverviewCard />
                        {/* Additional team analytics components can go here */}
                      </SimpleGrid>
                    </Box>
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>

          {/* Footer Info */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            border="1px solid" 
            borderColor={borderColor}
          >
            <VStack spacing={4}>
              <Heading size="sm" color={useColorModeValue('gray.700', 'gray.300')}>
                Analytics Architecture Information
              </Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} textAlign="center">
                This dashboard showcases our centralized analytics architecture with real-time calculations, 
                trend analysis, and AI-ready data processing. All metrics use consistent calculation methods 
                across the application.
              </Text>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Badge colorScheme="blue" variant="outline">Sleep Analytics</Badge>
                <Badge colorScheme="red" variant="outline">Injury Risk (ACWR)</Badge>
                <Badge colorScheme="green" variant="outline">Training Load</Badge>
                <Badge colorScheme="purple" variant="outline">Wellness Scoring</Badge>
                <Badge colorScheme="orange" variant="outline">Performance Metrics</Badge>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export default Analytics; 