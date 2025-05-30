import React, { useState, useEffect } from 'react';
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
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Progress,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { 
  FaChartLine, 
  FaUsers, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaShieldAlt,
  FaBrain,
  FaCalendarAlt,
  FaTrophy,
  FaEye,
  FaCog,
  FaDownload,
  FaFilter,
  FaSort,
  FaEllipsisV,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

// Import chart components
import TrainingLoadChart from './charts/TrainingLoadChart';
import PerformanceChart from './charts/PerformanceChart';

// Types for our analytics data
interface AthleteMetrics {
  id: string;
  name: string;
  avatar?: string;
  event: string;
  acwr: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  wellnessScore: number;
  compliance: number;
  trainingDays: number;
  lastActivity: string;
  recentPRs: number;
  status: 'excellent' | 'good' | 'attention' | 'concern';
  weeklyLoad: number;
  performanceTrend: 'up' | 'down' | 'stable';
}

interface TeamKPIs {
  totalAthletes: number;
  adherenceRate: number;
  avgACWR: number;
  atRiskCount: number;
  recentPRs: number;
  avgWellness: number;
  injuryPrevention: number;
  performanceImprovement: number;
}

interface AIInsight {
  id: string;
  type: 'warning' | 'recommendation' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  athleteId?: string;
  athleteName?: string;
  action?: string;
  timestamp: string;
}

export const CoachAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [teamKPIs, setTeamKPIs] = useState<TeamKPIs | null>(null);
  const [athletes, setAthletes] = useState<AthleteMetrics[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);

  // Enhanced color mode values for better dark mode support
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const chartCardBg = useColorModeValue('white', 'gray.600'); // Much lighter background for charts
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textPrimary = useColorModeValue('gray.800', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const textMuted = useColorModeValue('gray.500', 'gray.400');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableStripe = useColorModeValue('gray.50', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableHeaderText = useColorModeValue('gray.700', 'gray.200');
  const insightsBg = useColorModeValue('white', 'gray.750');

  // Mock data - in production this would come from your database
  const mockTeamKPIs: TeamKPIs = {
    totalAthletes: 12,
    adherenceRate: 87.5,
    avgACWR: 1.12,
    atRiskCount: 2,
    recentPRs: 8,
    avgWellness: 7.3,
    injuryPrevention: 94.2,
    performanceImprovement: 15.8
  };

  const mockAthletes: AthleteMetrics[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      event: 'Sprints',
      acwr: 1.45,
      riskLevel: 'high',
      wellnessScore: 6.2,
      compliance: 95,
      trainingDays: 6,
      lastActivity: '2024-01-15',
      recentPRs: 2,
      status: 'concern',
      weeklyLoad: 2840,
      performanceTrend: 'up'
    },
    {
      id: '2',
      name: 'Mike Chen',
      event: 'Distance',
      acwr: 0.85,
      riskLevel: 'low',
      wellnessScore: 8.1,
      compliance: 92,
      trainingDays: 5,
      lastActivity: '2024-01-15',
      recentPRs: 1,
      status: 'good',
      weeklyLoad: 3200,
      performanceTrend: 'stable'
    },
    {
      id: '3',
      name: 'Emma Davis',
      event: 'Jumps',
      acwr: 1.15,
      riskLevel: 'moderate',
      wellnessScore: 7.5,
      compliance: 88,
      trainingDays: 5,
      lastActivity: '2024-01-14',
      recentPRs: 3,
      status: 'attention',
      weeklyLoad: 2650,
      performanceTrend: 'up'
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      event: 'Throws',
      acwr: 0.92,
      riskLevel: 'low',
      wellnessScore: 8.0,
      compliance: 90,
      trainingDays: 6,
      lastActivity: '2024-01-15',
      recentPRs: 1,
      status: 'excellent',
      weeklyLoad: 2980,
      performanceTrend: 'up'
    },
  ];

  const mockAIInsights: AIInsight[] = [
    {
      id: '1',
      type: 'warning',
      priority: 'high',
      title: 'High Injury Risk Detected',
      description: 'Sarah Johnson\'s ACWR is 1.45 (optimal: 0.8-1.3). Consider reducing training load this week.',
      athleteId: '1',
      athleteName: 'Sarah Johnson',
      action: 'Reduce load by 20%',
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'recommendation',
      priority: 'medium',
      title: 'Training Load Optimization',
      description: 'Mike Chen has been under optimal load for 3 days. Consider increasing intensity.',
      athleteId: '2',
      athleteName: 'Mike Chen',
      action: 'Increase intensity 10%',
      timestamp: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      type: 'achievement',
      priority: 'low',
      title: 'Performance Milestone',
      description: 'Emma Davis achieved 3 PRs this week with excellent recovery metrics.',
      athleteId: '3',
      athleteName: 'Emma Davis',
      timestamp: '2024-01-15T08:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setIsLoading(true);
      // In production, fetch from your API here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTeamKPIs(mockTeamKPIs);
      setAthletes(mockAthletes);
      setAIInsights(mockAIInsights);
      setIsLoading(false);
    };

    loadData();
  }, [selectedTimeframe]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'green.500';
      case 'moderate': return 'yellow.500';
      case 'high': return 'orange.500';
      case 'very-high': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'attention': return 'yellow';
      case 'concern': return 'red';
      default: return 'gray';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return FaArrowUp;
      case 'down': return FaArrowDown;
      case 'stable': return FaMinus;
      default: return FaMinus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'green.500';
      case 'down': return 'red.500';
      case 'stable': return 'gray.500';
      default: return 'gray.500';
    }
  };

  if (isLoading) {
    return (
      <Box bg={bgColor} minH="100vh" p={8}>
        <Container maxW="7xl">
          <VStack spacing={6}>
            <Text color={textPrimary}>Loading coach analytics...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Box>
            <HStack justify="space-between" align="center" mb={6}>
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Icon as={FaUsers} boxSize={8} color="blue.500" />
                  <Heading size="xl" color={textPrimary}>
                    Coach Analytics Dashboard
                  </Heading>
                </HStack>
                <Text color={textSecondary} fontSize="lg">
                  Team performance insights with AI-powered recommendations
                </Text>
              </VStack>
              
              <HStack spacing={4}>
                <Menu>
                  <MenuButton as={Button} leftIcon={<FaCalendarAlt />} size="sm" variant="outline" color={textPrimary} borderColor={borderColor}>
                    {selectedTimeframe === '7d' ? 'Last 7 Days' : 
                     selectedTimeframe === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                  </MenuButton>
                  <MenuList bg={cardBg} borderColor={borderColor}>
                    <MenuItem onClick={() => setSelectedTimeframe('7d')} _hover={{ bg: tableStripe }} color={textPrimary}>Last 7 Days</MenuItem>
                    <MenuItem onClick={() => setSelectedTimeframe('30d')} _hover={{ bg: tableStripe }} color={textPrimary}>Last 30 Days</MenuItem>
                    <MenuItem onClick={() => setSelectedTimeframe('90d')} _hover={{ bg: tableStripe }} color={textPrimary}>Last 90 Days</MenuItem>
                  </MenuList>
                </Menu>
                
                <Button leftIcon={<FaDownload />} size="sm" variant="outline" color={textPrimary} borderColor={borderColor}>
                  Export
                </Button>
              </HStack>
            </HStack>

            {/* AI Insights Bar */}
            <Box 
              bg={insightsBg} 
              p={4} 
              borderRadius="lg" 
              border="1px solid" 
              borderColor={borderColor}
              mb={6}
            >
              <HStack spacing={3} align="center">
                <Icon as={FaBrain} color="purple.500" boxSize={5} />
                <Text fontWeight="semibold" color={textPrimary}>
                  AI Insights ({aiInsights.length})
                </Text>
                <Divider orientation="vertical" borderColor={borderColor} />
                <HStack spacing={4} flex={1} overflow="hidden">
                  {aiInsights.slice(0, 2).map((insight) => (
                    <Alert 
                      key={insight.id} 
                      status={insight.type === 'warning' ? 'warning' : insight.type === 'achievement' ? 'success' : 'info'} 
                      size="sm" 
                      borderRadius="md" 
                      maxW="400px"
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={borderColor}
                      border="1px solid"
                    >
                      <AlertIcon boxSize={4} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" fontWeight="bold" noOfLines={1} color={textPrimary}>
                          {insight.title}
                        </Text>
                        <Text fontSize="xs" noOfLines={2} color={textSecondary}>
                          {insight.description}
                        </Text>
                      </VStack>
                    </Alert>
                  ))}
                </HStack>
                <Button size="xs" variant="outline" leftIcon={<FaEye />} color={textPrimary} borderColor={borderColor}>
                  View All
                </Button>
              </HStack>
            </Box>
          </Box>

          {/* Team KPIs Section */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <Heading size="md" color={textPrimary}>Team Performance Overview</Heading>
                <Badge colorScheme="blue" variant="outline">Real-time</Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <StatGroup>
                <SimpleGrid columns={{ base: 2, md: 4, lg: 8 }} spacing={6}>
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Total Athletes</StatLabel>
                    <StatNumber fontSize="2xl" color="blue.500">{teamKPIs?.totalAthletes}</StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>Active</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Training Adherence</StatLabel>
                    <StatNumber fontSize="2xl" color="green.500">{teamKPIs?.adherenceRate}%</StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>
                      <StatArrow type="increase" />
                      +2.3%
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Avg ACWR</StatLabel>
                    <StatNumber fontSize="2xl" color={teamKPIs?.avgACWR && teamKPIs.avgACWR > 1.3 ? "orange.500" : "green.500"}>
                      {teamKPIs?.avgACWR}
                    </StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>Optimal: 0.8-1.3</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>At Risk Athletes</StatLabel>
                    <StatNumber fontSize="2xl" color={teamKPIs?.atRiskCount && teamKPIs.atRiskCount > 0 ? "red.500" : "green.500"}>
                      {teamKPIs?.atRiskCount}
                    </StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>High injury risk</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Recent PRs</StatLabel>
                    <StatNumber fontSize="2xl" color="purple.500">{teamKPIs?.recentPRs}</StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>This week</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Avg Wellness</StatLabel>
                    <StatNumber fontSize="2xl" color="teal.500">{teamKPIs?.avgWellness}/10</StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>Daily surveys</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Injury Prevention</StatLabel>
                    <StatNumber fontSize="2xl" color="green.500">{teamKPIs?.injuryPrevention}%</StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>
                      <StatArrow type="increase" />
                      Effectiveness
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel fontSize="xs" color={textSecondary}>Performance ↑</StatLabel>
                    <StatNumber fontSize="2xl" color="blue.500">+{teamKPIs?.performanceImprovement}%</StatNumber>
                    <StatHelpText fontSize="xs" color={textMuted}>vs last month</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </StatGroup>
            </CardBody>
          </Card>

          {/* Athlete Comparison Grid */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <Heading size="md" color={textPrimary}>Athlete Status Grid</Heading>
                <HStack spacing={2}>
                  <Button size="xs" leftIcon={<FaFilter />} variant="outline" color={textPrimary} borderColor={borderColor}>Filter</Button>
                  <Button size="xs" leftIcon={<FaSort />} variant="outline" color={textPrimary} borderColor={borderColor}>Sort</Button>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Box overflowX="auto">
                <Table size="md" variant="simple" bg={tableBg}>
                  <Thead bg={tableHeaderBg}>
                    <Tr>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Athlete</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Event</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>ACWR</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Risk</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Wellness</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Compliance</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Load</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Trend</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>PRs</Th>
                      <Th color={tableHeaderText} borderColor={borderColor} py={4}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {athletes.map((athlete, index) => (
                      <Tr key={athlete.id} bg={index % 2 === 1 ? tableStripe : 'transparent'}>
                        <Td borderColor={borderColor} py={4}>
                          <HStack spacing={3}>
                            <Avatar name={athlete.name} size="sm" />
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium" fontSize="sm" color={textPrimary}>{athlete.name}</Text>
                              <Badge colorScheme={getStatusColor(athlete.status)} size="sm" variant="solid">
                                {athlete.status}
                              </Badge>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <Text fontSize="sm" color={textPrimary}>{athlete.event}</Text>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color={athlete.acwr > 1.3 ? 'red.500' : athlete.acwr < 0.8 ? 'yellow.500' : 'green.500'}>
                              {athlete.acwr}
                            </Text>
                            <Progress
                              value={Math.min(athlete.acwr * 100, 200)}
                              max={200}
                              size="xs"
                              width="60px"
                              colorScheme={athlete.acwr > 1.3 ? 'red' : athlete.acwr < 0.8 ? 'yellow' : 'green'}
                            />
                          </VStack>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <Badge 
                            colorScheme={athlete.riskLevel === 'low' ? 'green' : athlete.riskLevel === 'moderate' ? 'yellow' : 'red'}
                            size="sm"
                            variant="solid"
                          >
                            {athlete.riskLevel}
                          </Badge>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color={textPrimary}>{athlete.wellnessScore}/10</Text>
                            <Progress
                              value={athlete.wellnessScore * 10}
                              size="xs"
                              width="60px"
                              colorScheme={athlete.wellnessScore >= 7 ? 'green' : athlete.wellnessScore >= 5 ? 'yellow' : 'red'}
                            />
                          </VStack>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <Text fontSize="sm" color={textPrimary}>{athlete.compliance}%</Text>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <Text fontSize="sm" color={textPrimary}>{athlete.weeklyLoad}</Text>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <HStack spacing={1}>
                            <Icon as={getTrendIcon(athlete.performanceTrend)} color={getTrendColor(athlete.performanceTrend)} boxSize={3} />
                            <Text fontSize="xs" color={getTrendColor(athlete.performanceTrend)}>
                              {athlete.performanceTrend}
                            </Text>
                          </HStack>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <Badge colorScheme="purple" variant="outline" size="sm">
                            {athlete.recentPRs}
                          </Badge>
                        </Td>
                        <Td borderColor={borderColor} py={4}>
                          <Menu>
                            <MenuButton as={IconButton} icon={<FaEllipsisV />} size="xs" variant="ghost" color={textSecondary} />
                            <MenuList bg={cardBg} borderColor={borderColor}>
                              <MenuItem icon={<FaEye />} color={textPrimary} _hover={{ bg: tableStripe }}>View Details</MenuItem>
                              <MenuItem icon={<FaCog />} color={textPrimary} _hover={{ bg: tableStripe }}>Adjust Program</MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>

          {/* Interactive Charts Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <Card bg={chartCardBg} borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between" align="center">
                  <Heading size="md" color={textPrimary}>Training Load & ACWR</Heading>
                  <Badge colorScheme="blue" variant="outline" fontSize="xs">
                    {selectedTimeframe === '7d' ? '7 Days' : selectedTimeframe === '30d' ? '30 Days' : '90 Days'}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={textSecondary} mt={2}>
                  Team training load distribution with injury risk monitoring
                </Text>
              </CardHeader>
              <CardBody>
                <TrainingLoadChart timeframe={selectedTimeframe} />
              </CardBody>
            </Card>

            <Card bg={chartCardBg} borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between" align="center">
                  <Heading size="md" color={textPrimary}>Performance by Event</Heading>
                  <Badge colorScheme="purple" variant="outline" fontSize="xs">
                    Improvement %
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={textSecondary} mt={2}>
                  Performance trends across sprints, distance, jumps, and throws
                </Text>
              </CardHeader>
              <CardBody>
                <PerformanceChart timeframe={selectedTimeframe} />
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default CoachAnalyticsDashboard; 