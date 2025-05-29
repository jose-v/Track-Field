import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Icon,
  Badge,
  SimpleGrid,
  Divider,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Tooltip,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaShieldAlt,
  FaChartLine,
  FaEye
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

export const TeamOverviewCard: React.FC = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock team data for coach dashboard
  const mockTeamData = {
    teamStats: {
      totalAthletes: 12,
      activeAthletes: 11,
      avgCompliance: 87.5,
      atRiskAthletes: 2,
      newPBsThisWeek: 5
    },
    athletes: [
      {
        id: 1,
        name: 'Sarah Johnson',
        avatar: null,
        event: 'Sprints',
        trainingPhase: 'Speed Development',
        compliance: 95,
        injuryRisk: 'low',
        lastActivity: '2024-01-15',
        wellnessScore: 8.2,
        recentPB: true,
        status: 'excellent'
      },
      {
        id: 2,
        name: 'Mike Chen',
        avatar: null,
        event: 'Distance',
        trainingPhase: 'Base Building',
        compliance: 78,
        injuryRisk: 'moderate',
        lastActivity: '2024-01-14',
        wellnessScore: 6.5,
        recentPB: false,
        status: 'attention'
      },
      {
        id: 3,
        name: 'Emma Davis',
        avatar: null,
        event: 'Jumps',
        trainingPhase: 'Competition Prep',
        compliance: 92,
        injuryRisk: 'low',
        lastActivity: '2024-01-15',
        wellnessScore: 7.8,
        recentPB: true,
        status: 'good'
      },
      {
        id: 4,
        name: 'Alex Rodriguez',
        avatar: null,
        event: 'Throws',
        trainingPhase: 'Strength Phase',
        compliance: 65,
        injuryRisk: 'high',
        lastActivity: '2024-01-13',
        wellnessScore: 5.2,
        recentPB: false,
        status: 'concern'
      },
      {
        id: 5,
        name: 'Jordan Smith',
        avatar: null,
        event: 'Sprints',
        trainingPhase: 'Recovery Week',
        compliance: 88,
        injuryRisk: 'low',
        lastActivity: '2024-01-15',
        wellnessScore: 7.5,
        recentPB: false,
        status: 'good'
      }
    ],
    riskDistribution: {
      low: 8,
      moderate: 2,
      high: 2
    },
    complianceDistribution: {
      excellent: 4,  // 90%+
      good: 5,       // 80-89%
      fair: 2,       // 70-79%
      poor: 1        // <70%
    }
  };

  useEffect(() => {
    const analyzeTeam = () => {
      try {
        const { teamStats, athletes, riskDistribution, complianceDistribution } = mockTeamData;
        
        // Calculate additional metrics
        const avgWellness = athletes.reduce((sum, athlete) => sum + athlete.wellnessScore, 0) / athletes.length;
        const athletesNeedingAttention = athletes.filter(a => a.status === 'concern' || a.status === 'attention').length;
        const recentPBCount = athletes.filter(a => a.recentPB).length;
        
        // Sort athletes by priority (concern first, then attention, etc.)
        const sortedAthletes = [...athletes].sort((a, b) => {
          const priorityOrder = { concern: 0, attention: 1, good: 2, excellent: 3 };
          return priorityOrder[a.status as keyof typeof priorityOrder] - priorityOrder[b.status as keyof typeof priorityOrder];
        });

        setTeamData({
          teamStats,
          athletes: sortedAthletes,
          riskDistribution,
          complianceDistribution,
          metrics: {
            avgWellness,
            athletesNeedingAttention,
            recentPBCount
          }
        });
      } catch (error) {
        console.error('Error analyzing team:', error);
      }
    };

    analyzeTeam();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'attention': return 'yellow';
      case 'concern': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return FaCheckCircle;
      case 'good': return FaCheckCircle;
      case 'attention': return FaClock;
      case 'concern': return FaExclamationTriangle;
      default: return FaClock;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'green.500';
      case 'moderate': return 'yellow.500';
      case 'high': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!teamData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <Text color={statLabelColor}>Loading team data...</Text>
      </Box>
    );
  }

  const { teamStats, athletes, riskDistribution, metrics } = teamData;

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaUsers} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Team Overview
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Monitor all athletes at a glance
              </Text>
            </VStack>
          </HStack>
          {metrics.athletesNeedingAttention > 0 && (
            <Badge 
              colorScheme="orange" 
              variant="solid" 
              fontSize="sm"
              px={3}
              py={1}
            >
              {metrics.athletesNeedingAttention} Need Attention
            </Badge>
          )}
        </HStack>

        {/* Team Stats */}
        <SimpleGrid columns={4} spacing={4}>
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Total Athletes
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {teamStats.totalAthletes}
            </StatNumber>
            <StatHelpText fontSize="xs">
              {teamStats.activeAthletes} active
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Avg Compliance
            </StatLabel>
            <StatNumber fontSize="lg" color="blue.500">
              {teamStats.avgCompliance.toFixed(0)}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              This week
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              At Risk
            </StatLabel>
            <StatNumber fontSize="lg" color="red.500">
              {teamStats.atRiskAthletes}
            </StatNumber>
            <StatHelpText fontSize="xs">
              High injury risk
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              New PBs
            </StatLabel>
            <StatNumber fontSize="lg" color="green.500">
              {teamStats.newPBsThisWeek}
            </StatNumber>
            <StatHelpText fontSize="xs">
              This week
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Risk Distribution */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Injury Risk Distribution
          </Text>
          <HStack spacing={4}>
            <HStack spacing={2}>
              <Box w="12px" h="12px" bg="green.500" borderRadius="full" />
              <Text fontSize="sm" color={statLabelColor}>
                Low: {riskDistribution.low}
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Box w="12px" h="12px" bg="yellow.500" borderRadius="full" />
              <Text fontSize="sm" color={statLabelColor}>
                Moderate: {riskDistribution.moderate}
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Box w="12px" h="12px" bg="red.500" borderRadius="full" />
              <Text fontSize="sm" color={statLabelColor}>
                High: {riskDistribution.high}
              </Text>
            </HStack>
          </HStack>
        </Box>

        <Divider />

        {/* Athletes Needing Attention */}
        {metrics.athletesNeedingAttention > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="medium">
                {metrics.athletesNeedingAttention} athletes need your attention
              </Text>
              <Text fontSize="xs" color={statLabelColor}>
                Check injury risk, compliance, or wellness scores below
              </Text>
            </Box>
          </Alert>
        )}

        {/* Athlete Roster */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Athlete Roster
          </Text>
          <VStack spacing={2} align="stretch">
            {athletes.slice(0, 5).map((athlete) => (
              <HStack 
                key={athlete.id} 
                p={3} 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                borderRadius="md"
                justify="space-between"
                borderLeft="4px solid"
                borderColor={`${getStatusColor(athlete.status)}.500`}
              >
                <HStack spacing={3}>
                  <Avatar 
                    size="sm" 
                    name={athlete.name}
                    src={athlete.avatar}
                    bg="blue.500"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                      {athlete.name}
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="xs" color={statLabelColor}>
                        {athlete.event}
                      </Text>
                      <Text fontSize="xs" color={statLabelColor}>
                        •
                      </Text>
                      <Text fontSize="xs" color={statLabelColor}>
                        {athlete.trainingPhase}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>

                <HStack spacing={4}>
                  {/* Compliance */}
                  <VStack spacing={0} align="center">
                    <Text fontSize="xs" color={statLabelColor}>Compliance</Text>
                    <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                      {athlete.compliance}%
                    </Text>
                  </VStack>

                  {/* Injury Risk */}
                  <VStack spacing={0} align="center">
                    <Text fontSize="xs" color={statLabelColor}>Risk</Text>
                    <Tooltip label={`Injury risk: ${athlete.injuryRisk}`}>
                      <Box 
                        w="8px" 
                        h="8px" 
                        bg={getRiskColor(athlete.injuryRisk)} 
                        borderRadius="full"
                      />
                    </Tooltip>
                  </VStack>

                  {/* Wellness */}
                  <VStack spacing={0} align="center">
                    <Text fontSize="xs" color={statLabelColor}>Wellness</Text>
                    <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                      {athlete.wellnessScore.toFixed(1)}
                    </Text>
                  </VStack>

                  {/* Status */}
                  <VStack spacing={0} align="center">
                    <Icon 
                      as={getStatusIcon(athlete.status)} 
                      color={`${getStatusColor(athlete.status)}.500`}
                      fontSize="lg"
                    />
                  </VStack>

                  {/* Actions */}
                  <Button size="xs" variant="ghost" colorScheme="blue">
                    <Icon as={FaEye} />
                  </Button>
                </HStack>
              </HStack>
            ))}
          </VStack>
          
          {athletes.length > 5 && (
            <Button
              size="sm"
              variant="ghost"
              colorScheme="blue"
              mt={3}
              rightIcon={<FaArrowRight />}
            >
              View All {athletes.length} Athletes
            </Button>
          )}
        </Box>

        {/* Quick Actions */}
        <HStack spacing={3} justify="center">
          <Button
            size="sm"
            colorScheme="blue"
            variant="ghost"
            leftIcon={<FaChartLine />}
          >
            Team Analytics
          </Button>
          <Button
            size="sm"
            colorScheme="orange"
            variant="ghost"
            leftIcon={<FaShieldAlt />}
          >
            Risk Assessment
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            variant="ghost"
            leftIcon={<FaUsers />}
          >
            Manage Athletes
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default TeamOverviewCard; 