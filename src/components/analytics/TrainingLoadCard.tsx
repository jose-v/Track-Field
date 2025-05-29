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
  FaDumbbell, 
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaArrowRight,
  FaCalendarAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { 
  calculateSessionRPE,
  calculateTrainingMonotony,
  getTrainingLoadCategory,
  calculateWeeklyDistribution
} from '../../utils/analytics/training';
import { TrainingLoadData } from '../../utils/analytics/types';

export const TrainingLoadCard: React.FC = () => {
  const { user } = useAuth();
  const [trainingData, setTrainingData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock training load data for the last 7 days
  const mockTrainingLoads: TrainingLoadData[] = [
    { date: '2024-01-15', rpe: 7, duration: 60, load: 420, workoutType: 'endurance' },
    { date: '2024-01-14', rpe: 8, duration: 45, load: 360, workoutType: 'speed' },
    { date: '2024-01-13', rpe: 6, duration: 90, load: 540, workoutType: 'recovery' },
    { date: '2024-01-12', rpe: 9, duration: 75, load: 675, workoutType: 'strength' },
    { date: '2024-01-11', rpe: 7, duration: 60, load: 420, workoutType: 'endurance' },
    { date: '2024-01-10', rpe: 8, duration: 50, load: 400, workoutType: 'speed' },
    { date: '2024-01-09', rpe: 5, duration: 30, load: 150, workoutType: 'recovery' },
  ];

  useEffect(() => {
    const analyzeTrainingLoad = () => {
      try {
        // Calculate weekly distribution
        const weeklyStats = calculateWeeklyDistribution(mockTrainingLoads);
        
        // Calculate training monotony
        const loads = mockTrainingLoads.map(data => data.load);
        const monotony = calculateTrainingMonotony(loads);
        
        // Get latest session details
        const latestSession = mockTrainingLoads[0];
        const latestCategory = getTrainingLoadCategory(latestSession.load);
        
        // Calculate trend (simplified - comparing first half vs second half of week)
        const firstHalf = mockTrainingLoads.slice(0, 3);
        const secondHalf = mockTrainingLoads.slice(3);
        const firstHalfAvg = firstHalf.reduce((sum, data) => sum + data.load, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, data) => sum + data.load, 0) / secondHalf.length;
        const trendDirection = firstHalfAvg > secondHalfAvg ? 'increasing' : 
                              firstHalfAvg < secondHalfAvg ? 'decreasing' : 'stable';

        setTrainingData({
          weeklyStats,
          monotony,
          latestSession,
          latestCategory,
          trendDirection,
          trendPercentage: Math.abs(((firstHalfAvg - secondHalfAvg) / secondHalfAvg) * 100)
        });
      } catch (error) {
        console.error('Error analyzing training load:', error);
      }
    };

    analyzeTrainingLoad();
  }, []);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return FaArrowUp;
      case 'decreasing': return FaArrowDown;
      default: return FaMinus;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'orange.500';
      case 'decreasing': return 'blue.500';
      default: return 'gray.500';
    }
  };

  const getLoadColorScheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'low': return 'blue';
      case 'moderate': return 'green';
      case 'high': return 'orange';
      case 'very high': return 'red';
      default: return 'gray';
    }
  };

  const getMonotonyLevel = (monotony: number) => {
    if (monotony < 1.5) return { level: 'Low', color: 'green', description: 'Good variety' };
    if (monotony < 2.0) return { level: 'Moderate', color: 'yellow', description: 'Acceptable' };
    return { level: 'High', color: 'red', description: 'Consider more variety' };
  };

  if (!trainingData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <Text color={statLabelColor}>Loading training load data...</Text>
      </Box>
    );
  }

  const { weeklyStats, monotony, latestSession, latestCategory, trendDirection, trendPercentage } = trainingData;
  const monotonyLevel = getMonotonyLevel(monotony);

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaDumbbell} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Training Load Analysis
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                7-day overview
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme={getLoadColorScheme(latestCategory.category)} 
            variant="solid" 
            fontSize="sm"
            px={3}
            py={1}
          >
            {latestCategory.category.toUpperCase()}
          </Badge>
        </HStack>

        {/* Weekly Stats */}
        <SimpleGrid columns={3} spacing={4}>
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Total Load
            </StatLabel>
            <StatNumber fontSize="xl" color={statNumberColor}>
              {weeklyStats.totalLoad.toLocaleString()}
            </StatNumber>
            <StatHelpText fontSize="xs">
              This week
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Avg per Session
            </StatLabel>
            <StatNumber fontSize="xl" color={statNumberColor}>
              {weeklyStats.averageLoad.toFixed(0)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              RPE × Duration
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Sessions
            </StatLabel>
            <StatNumber fontSize="xl" color={statNumberColor}>
              {weeklyStats.sessionCount}
            </StatNumber>
            <StatHelpText fontSize="xs">
              This week
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* Training Trend */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
              Weekly Trend
            </Text>
            <HStack spacing={2}>
              <Icon 
                as={getTrendIcon(trendDirection)} 
                color={getTrendColor(trendDirection)} 
                fontSize="sm"
              />
              <Text fontSize="sm" color={statLabelColor}>
                {trendDirection} {trendPercentage.toFixed(1)}%
              </Text>
            </HStack>
          </HStack>
          
          {/* Load Distribution */}
          <VStack spacing={2} align="stretch">
            <Text fontSize="xs" color={statLabelColor}>Load Distribution</Text>
            {Object.entries(weeklyStats.distribution).map(([category, count]) => (
              <HStack key={category} justify="space-between">
                <HStack spacing={2}>
                  <Badge 
                    colorScheme={getLoadColorScheme(category)} 
                    variant="subtle" 
                    size="sm"
                  >
                    {category}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={statLabelColor}>
                  {count as number} sessions
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        <Divider />

        {/* Training Monotony */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
              Training Monotony
            </Text>
            <Badge 
              colorScheme={monotonyLevel.color} 
              variant="subtle"
              fontSize="xs"
            >
              {monotonyLevel.level}
            </Badge>
          </HStack>
          
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>
                Monotony Score
              </Text>
              <Text fontSize="sm" color={statNumberColor} fontWeight="medium">
                {monotony.toFixed(2)}
              </Text>
            </HStack>
            <Progress 
              value={Math.min((monotony / 3) * 100, 100)} 
              colorScheme={monotonyLevel.color}
              size="sm" 
              borderRadius="full"
            />
            <Text fontSize="xs" color={statLabelColor}>
              {monotonyLevel.description}
            </Text>
          </VStack>
        </Box>

        {/* Latest Session */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Latest Session
          </Text>
          <HStack spacing={4} justify="space-between">
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={statLabelColor}>Date</Text>
              <Text fontSize="sm" color={statNumberColor}>
                {new Date(latestSession.date).toLocaleDateString()}
              </Text>
            </VStack>
            <VStack align="center" spacing={1}>
              <Text fontSize="xs" color={statLabelColor}>RPE</Text>
              <Text fontSize="sm" color={statNumberColor} fontWeight="bold">
                {latestSession.rpe}/10
              </Text>
            </VStack>
            <VStack align="center" spacing={1}>
              <Text fontSize="xs" color={statLabelColor}>Duration</Text>
              <Text fontSize="sm" color={statNumberColor}>
                {latestSession.duration}min
              </Text>
            </VStack>
            <VStack align="end" spacing={1}>
              <Text fontSize="xs" color={statLabelColor}>Load</Text>
              <Text fontSize="sm" color={statNumberColor} fontWeight="bold">
                {latestSession.load}
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Action Button */}
        <Button
          size="sm"
          colorScheme="blue"
          variant="ghost"
          rightIcon={<FaArrowRight />}
          alignSelf="center"
        >
          View Training History
        </Button>
      </VStack>
    </Box>
  );
};

export default TrainingLoadCard; 