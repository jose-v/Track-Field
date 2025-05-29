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
  Progress,
  SimpleGrid,
  Divider,
  Button,
} from '@chakra-ui/react';
import { 
  FaChartLine, 
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaArrowRight,
  FaTrophy,
  FaStopwatch
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { 
  calculatePerformanceImprovement,
  calculateAge
} from '../../utils/analytics/performance';

export const PerformanceMetricsCard: React.FC = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock performance data
  const mockPerformanceData = {
    currentSeason: {
      event: '100m Sprint',
      currentPB: 11.45,
      previousPB: 11.67,
      eventType: 'time'
    },
    recentPerformances: [
      { date: '2024-01-15', time: 11.45, event: '100m', conditions: 'Good' },
      { date: '2024-01-10', time: 11.52, event: '100m', conditions: 'Windy' },
      { date: '2024-01-05', time: 11.48, event: '100m', conditions: 'Perfect' },
      { date: '2023-12-20', time: 11.67, event: '100m', conditions: 'Cold' },
    ],
    seasonGoals: {
      target: 11.30,
      progress: 75
    },
    athleteInfo: {
      birthDate: '2000-05-15',
      specialization: 'Sprints'
    }
  };

  useEffect(() => {
    const analyzePerformance = () => {
      try {
        const { currentSeason, recentPerformances, seasonGoals, athleteInfo } = mockPerformanceData;
        
        // Calculate performance improvement
        const improvementResult = calculatePerformanceImprovement(
          currentSeason.currentPB,
          currentSeason.previousPB,
          'time' as 'time' | 'distance' | 'height'
        );
        const improvement = improvementResult.improvement;

        // Calculate age
        const age = calculateAge(athleteInfo.birthDate);

        // Calculate season trend
        const performances = recentPerformances.map(p => p.time);
        const firstHalf = performances.slice(0, 2);
        const secondHalf = performances.slice(2);
        const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
        
        // For time events, lower is better
        const trendDirection = firstAvg < secondAvg ? 'improving' : 
                              firstAvg > secondAvg ? 'declining' : 'stable';
        const trendPercentage = Math.abs(((firstAvg - secondAvg) / secondAvg) * 100);

        // Calculate consistency (coefficient of variation)
        const mean = performances.reduce((sum, time) => sum + time, 0) / performances.length;
        const variance = performances.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / performances.length;
        const stdDev = Math.sqrt(variance);
        const consistency = ((1 - (stdDev / mean)) * 100);

        // Progress to goal
        const progressToGoal = ((currentSeason.previousPB - currentSeason.currentPB) / 
                               (currentSeason.previousPB - seasonGoals.target)) * 100;

        setPerformanceData({
          improvement,
          age,
          trendDirection,
          trendPercentage,
          consistency,
          progressToGoal: Math.min(Math.max(progressToGoal, 0), 100),
          currentSeason,
          recentPerformances,
          seasonGoals
        });
      } catch (error) {
        console.error('Error analyzing performance:', error);
      }
    };

    analyzePerformance();
  }, []);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return FaArrowUp;
      case 'declining': return FaArrowDown;
      default: return FaMinus;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'improving': return 'green.500';
      case 'declining': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'green';
    if (improvement < 0) return 'red';
    return 'gray';
  };

  const getConsistencyLevel = (consistency: number) => {
    if (consistency >= 95) return { level: 'Excellent', color: 'green' };
    if (consistency >= 90) return { level: 'Good', color: 'blue' };
    if (consistency >= 85) return { level: 'Fair', color: 'yellow' };
    return { level: 'Needs Work', color: 'red' };
  };

  if (!performanceData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <Text color={statLabelColor}>Loading performance data...</Text>
      </Box>
    );
  }

  const { 
    improvement, 
    age, 
    trendDirection, 
    trendPercentage, 
    consistency, 
    progressToGoal,
    currentSeason,
    seasonGoals
  } = performanceData;

  const consistencyLevel = getConsistencyLevel(consistency);

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
            <Icon as={FaChartLine} boxSize={6} color="purple.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Performance Metrics
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                {currentSeason.event} • Age {age}
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme={getImprovementColor(improvement)} 
            variant="solid" 
            fontSize="sm"
            px={3}
            py={1}
          >
            {improvement > 0 ? '+' : ''}{improvement.toFixed(2)}%
          </Badge>
        </HStack>

        {/* Current Performance */}
        <Box textAlign="center">
          <Text fontSize="sm" color={statLabelColor} mb={2}>
            Current Personal Best
          </Text>
          <Text fontSize="4xl" fontWeight="bold" color={statNumberColor}>
            {currentSeason.currentPB}s
          </Text>
          <HStack justify="center" spacing={2} mt={2}>
            <Icon 
              as={getTrendIcon(trendDirection)} 
              color={getTrendColor(trendDirection)} 
            />
            <Text fontSize="sm" color={statLabelColor}>
              {trendDirection} {trendPercentage.toFixed(1)}%
            </Text>
          </HStack>
        </Box>

        {/* Key Metrics */}
        <SimpleGrid columns={2} spacing={4}>
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Season Improvement
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {improvement > 0 ? '+' : ''}{improvement.toFixed(2)}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              vs Previous PB
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Consistency
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {consistency.toFixed(1)}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              <Badge 
                colorScheme={consistencyLevel.color} 
                variant="subtle" 
                size="sm"
              >
                {consistencyLevel.level}
              </Badge>
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* Season Goal Progress */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
              Season Goal Progress
            </Text>
            <HStack spacing={2}>
              <Icon as={FaTrophy} color="gold" fontSize="sm" />
              <Text fontSize="sm" color={statLabelColor}>
                Target: {seasonGoals.target}s
              </Text>
            </HStack>
          </HStack>
          
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>
                Progress to Goal
              </Text>
              <Text fontSize="sm" color={statNumberColor} fontWeight="medium">
                {progressToGoal.toFixed(1)}%
              </Text>
            </HStack>
            <Progress 
              value={progressToGoal} 
              colorScheme="purple"
              size="lg" 
              borderRadius="full"
            />
            <HStack justify="space-between" fontSize="xs" color={statLabelColor}>
              <Text>Previous PB: {currentSeason.previousPB}s</Text>
              <Text>Current: {currentSeason.currentPB}s</Text>
              <Text>Goal: {seasonGoals.target}s</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Recent Performance Summary */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Recent Performance Summary
          </Text>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>Best Recent Time</Text>
              <Text fontSize="sm" color={statNumberColor} fontWeight="bold">
                {Math.min(...performanceData.recentPerformances.map((p: any) => p.time))}s
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>Average (Last 4)</Text>
              <Text fontSize="sm" color={statNumberColor}>
                {(performanceData.recentPerformances.reduce((sum: number, p: any) => sum + p.time, 0) / 
                  performanceData.recentPerformances.length).toFixed(2)}s
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>Races This Season</Text>
              <Text fontSize="sm" color={statNumberColor}>
                {performanceData.recentPerformances.length}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Action Button */}
        <Button
          size="sm"
          colorScheme="purple"
          variant="ghost"
          rightIcon={<FaArrowRight />}
          alignSelf="center"
        >
          View Performance History
        </Button>
      </VStack>
    </Box>
  );
};

export default PerformanceMetricsCard; 