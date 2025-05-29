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
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { 
  FaHeartbeat, 
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaArrowRight,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { 
  calculateWellnessScore,
  calculateWellnessTrend,
  identifyWellnessRedFlags,
  generateWellnessRecommendations
} from '../../utils/analytics/wellness';
import { WellnessMetrics } from '../../utils/analytics/types';

export const WellnessCard: React.FC = () => {
  const { user } = useAuth();
  const [wellnessData, setWellnessData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock wellness data for the last 7 days
  const mockWellnessData: WellnessMetrics[] = [
    {
      date: '2024-01-15',
      fatigue: 4,
      soreness: 3,
      stress: 5,
      motivation: 8,
      overallFeeling: 7,
      sleepQuality: 8,
      sleepDuration: 7.5
    },
    {
      date: '2024-01-14',
      fatigue: 6,
      soreness: 5,
      stress: 4,
      motivation: 7,
      overallFeeling: 6,
      sleepQuality: 6,
      sleepDuration: 6.8
    },
    {
      date: '2024-01-13',
      fatigue: 3,
      soreness: 2,
      stress: 3,
      motivation: 9,
      overallFeeling: 8,
      sleepQuality: 9,
      sleepDuration: 8.2
    },
    {
      date: '2024-01-12',
      fatigue: 7,
      soreness: 6,
      stress: 6,
      motivation: 6,
      overallFeeling: 5,
      sleepQuality: 5,
      sleepDuration: 6.5
    },
    {
      date: '2024-01-11',
      fatigue: 5,
      soreness: 4,
      stress: 4,
      motivation: 7,
      overallFeeling: 7,
      sleepQuality: 7,
      sleepDuration: 7.8
    },
    {
      date: '2024-01-10',
      fatigue: 4,
      soreness: 3,
      stress: 5,
      motivation: 8,
      overallFeeling: 8,
      sleepQuality: 8,
      sleepDuration: 8.0
    },
    {
      date: '2024-01-09',
      fatigue: 2,
      soreness: 2,
      stress: 2,
      motivation: 9,
      overallFeeling: 9,
      sleepQuality: 9,
      sleepDuration: 8.5
    }
  ];

  useEffect(() => {
    const analyzeWellness = () => {
      try {
        // Calculate wellness scores for each day
        const scoresWithDates = mockWellnessData.map(metrics => ({
          date: metrics.date,
          score: calculateWellnessScore(metrics),
          metrics
        }));

        // Get latest wellness data
        const latestMetrics = mockWellnessData[0];
        const latestScore = calculateWellnessScore(latestMetrics);

        // Analyze trend
        const trendAnalysis = calculateWellnessTrend(mockWellnessData);

        // Identify red flags
        const redFlags = identifyWellnessRedFlags(latestMetrics);

        // Generate recommendations
        const recommendations = generateWellnessRecommendations(latestMetrics);

        // Calculate averages
        const avgFatigue = mockWellnessData.reduce((sum, m) => sum + m.fatigue, 0) / mockWellnessData.length;
        const avgStress = mockWellnessData.reduce((sum, m) => sum + m.stress, 0) / mockWellnessData.length;
        const avgMotivation = mockWellnessData.reduce((sum, m) => sum + m.motivation, 0) / mockWellnessData.length;

        setWellnessData({
          latestScore,
          latestMetrics,
          trendAnalysis,
          redFlags,
          recommendations,
          averages: {
            fatigue: avgFatigue,
            stress: avgStress,
            motivation: avgMotivation
          },
          weeklyScores: scoresWithDates
        });
      } catch (error) {
        console.error('Error analyzing wellness:', error);
      }
    };

    analyzeWellness();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    if (score >= 4) return 'orange';
    return 'red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return FaArrowUp;
      case 'declining': return FaArrowDown;
      default: return FaMinus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'green.500';
      case 'declining': return 'red.500';
      default: return 'gray.500';
    }
  };

  if (!wellnessData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <Text color={statLabelColor}>Loading wellness data...</Text>
      </Box>
    );
  }

  const { 
    latestScore, 
    latestMetrics, 
    trendAnalysis, 
    redFlags, 
    recommendations, 
    averages 
  } = wellnessData;

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
            <Icon as={FaHeartbeat} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Wellness Monitoring
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                7-day overview
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme={getScoreColor(latestScore)} 
            variant="solid" 
            fontSize="sm"
            px={3}
            py={1}
          >
            {getScoreLabel(latestScore)}
          </Badge>
        </HStack>

        {/* Current Wellness Score */}
        <Box textAlign="center">
          <Text fontSize="sm" color={statLabelColor} mb={2}>
            Current Wellness Score
          </Text>
          <Text fontSize="4xl" fontWeight="bold" color={statNumberColor}>
            {latestScore.toFixed(1)}
          </Text>
          <HStack justify="center" spacing={2} mt={2}>
            <Icon 
              as={getTrendIcon(trendAnalysis.trend)} 
              color={getTrendColor(trendAnalysis.trend)} 
            />
            <Text fontSize="sm" color={statLabelColor}>
              {trendAnalysis.trend} trend
            </Text>
          </HStack>
        </Box>

        {/* Key Metrics */}
        <SimpleGrid columns={3} spacing={4}>
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Fatigue
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {latestMetrics.fatigue}/10
            </StatNumber>
            <StatHelpText fontSize="xs">
              Avg: {averages.fatigue.toFixed(1)}
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Stress
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {latestMetrics.stress}/10
            </StatNumber>
            <StatHelpText fontSize="xs">
              Avg: {averages.stress.toFixed(1)}
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Motivation
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {latestMetrics.motivation}/10
            </StatNumber>
            <StatHelpText fontSize="xs">
              Avg: {averages.motivation.toFixed(1)}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* Red Flags Alert */}
        {redFlags.length > 0 && (
          <Alert status="warning" borderRadius="md" size="sm">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="medium">
                Wellness Alerts ({redFlags.length})
              </Text>
              <Text fontSize="xs" color={statLabelColor}>
                {redFlags[0]} {redFlags.length > 1 && `+${redFlags.length - 1} more`}
              </Text>
            </Box>
          </Alert>
        )}

        {/* Wellness Breakdown */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Latest Assessment
          </Text>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>Overall Feeling</Text>
              <HStack spacing={2}>
                <Progress 
                  value={(latestMetrics.overallFeeling / 10) * 100} 
                  colorScheme="blue"
                  size="sm" 
                  w="60px"
                  borderRadius="full"
                />
                <Text fontSize="sm" color={statNumberColor}>
                  {latestMetrics.overallFeeling}/10
                </Text>
              </HStack>
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>Muscle Soreness</Text>
              <HStack spacing={2}>
                <Progress 
                  value={(latestMetrics.soreness / 10) * 100} 
                  colorScheme="orange"
                  size="sm" 
                  w="60px"
                  borderRadius="full"
                />
                <Text fontSize="sm" color={statNumberColor}>
                  {latestMetrics.soreness}/10
                </Text>
              </HStack>
            </HStack>

            {latestMetrics.sleepQuality && (
              <HStack justify="space-between">
                <Text fontSize="sm" color={statLabelColor}>Sleep Quality</Text>
                <HStack spacing={2}>
                  <Progress 
                    value={(latestMetrics.sleepQuality / 10) * 100} 
                    colorScheme="purple"
                    size="sm" 
                    w="60px"
                    borderRadius="full"
                  />
                  <Text fontSize="sm" color={statNumberColor}>
                    {latestMetrics.sleepQuality}/10
                  </Text>
                </HStack>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={2}>
              Recommendations
            </Text>
            <VStack spacing={2} align="stretch">
              {recommendations.slice(0, 2).map((rec, index) => (
                <HStack key={index} spacing={2} align="start">
                  <Icon as={FaArrowRight} color="blue.500" mt={0.5} fontSize="xs" />
                  <Text fontSize="sm" color={statLabelColor}>
                    {rec}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Action Button */}
        <Button
          size="sm"
          colorScheme="green"
          variant="ghost"
          rightIcon={<FaArrowRight />}
          alignSelf="center"
        >
          Log Today's Wellness
        </Button>
      </VStack>
    </Box>
  );
};

export default WellnessCard; 