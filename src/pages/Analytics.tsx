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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
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
import { useProfileDisplay } from '../hooks/useProfileDisplay';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CoachAnalyticsDashboard } from '../components/analytics/CoachAnalyticsDashboard';
import { MobileHeader } from '../components';

// Import existing analytics components
import { SleepStatsCard } from '../components/SleepStatsCard';

// Import analytics components
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
  const { profile: displayProfile } = useProfileDisplay();
  const [selectedTab, setSelectedTab] = useState(0);

  // All useColorModeValue calls moved to top level to fix Rules of Hooks violations
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const desktopHeaderText = useColorModeValue('gray.600', 'gray.300');
  const sleepHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const workoutHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const workoutSubtitleColor = useColorModeValue('gray.600', 'gray.400');
  const injuryHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const injurySubtitleColor = useColorModeValue('gray.600', 'gray.400');
  const trainingHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const wellnessHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const performanceHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const footerHeadingColor = useColorModeValue('gray.700', 'gray.300');
  const footerTextColor = useColorModeValue('gray.600', 'gray.400');

  const isCoach = displayProfile?.role === 'coach';
  const isAthlete = displayProfile?.role === 'athlete';

  // If user is a coach, show the comprehensive coach analytics dashboard
  if (isCoach) {
    return <CoachAnalyticsDashboard />;
  }

  // For athletes, show the existing tabbed analytics interface
  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="7xl" py={8}>
        {/* Mobile Header using reusable component */}
        <MobileHeader
          title="Analytics Dashboard"
          subtitle="Track your progress"
          isLoading={false}
        />

        {/* Header */}
        <VStack spacing={8} align="stretch" mt={{ base: "20px", lg: 0 }}>
          {/* Desktop Header */}
          <Box display={{ base: "none", lg: "block" }}>
            <Heading size="lg" mb={2}>Analytics Dashboard</Heading>
            <Text color={desktopHeaderText}>
              Track your progress and performance metrics
            </Text>
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
            </TabList>

            <TabPanels>
              {/* Sleep & Recovery Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color={sleepHeadingColor}>
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
                    <Heading size="md" mb={4} color={workoutHeadingColor}>
                      Workout Performance & Compliance
                    </Heading>
                    <Text color={workoutSubtitleColor} mb={6}>
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
                    <Heading size="md" mb={4} color={injuryHeadingColor}>
                      Injury Risk Assessment
                    </Heading>
                    <Text color={injurySubtitleColor} mb={6}>
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
                    <Heading size="md" mb={4} color={trainingHeadingColor}>
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
                    <Heading size="md" mb={4} color={wellnessHeadingColor}>
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
                    <Heading size="md" mb={4} color={performanceHeadingColor}>
                      Performance Metrics
                    </Heading>
                    <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6}>
                      <PerformanceMetricsCard />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>
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
              <Heading size="sm" color={footerHeadingColor}>
                Analytics Architecture Information
              </Heading>
              <Text fontSize="sm" color={footerTextColor} textAlign="center">
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