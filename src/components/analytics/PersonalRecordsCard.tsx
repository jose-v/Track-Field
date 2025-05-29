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
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FaTrophy, 
  FaArrowUp,
  FaArrowRight,
  FaStar,
  FaFire,
  FaCalendarAlt,
  FaStopwatch
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

export const PersonalRecordsCard: React.FC = () => {
  const { user } = useAuth();
  const [pbData, setPbData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock personal records data
  const mockPBData = {
    currentPBs: [
      {
        event: '100m Sprint',
        current: 11.45,
        previous: 11.67,
        improvement: 1.89,
        date: '2024-01-15',
        isNew: true,
        unit: 's',
        type: 'time'
      },
      {
        event: '200m Sprint',
        current: 23.12,
        previous: 23.45,
        improvement: 1.41,
        date: '2024-01-08',
        isNew: false,
        unit: 's',
        type: 'time'
      },
      {
        event: 'Long Jump',
        current: 6.85,
        previous: 6.72,
        improvement: 1.93,
        date: '2024-01-12',
        isNew: true,
        unit: 'm',
        type: 'distance'
      },
      {
        event: 'Squat 1RM',
        current: 140,
        previous: 135,
        improvement: 3.70,
        date: '2024-01-10',
        isNew: false,
        unit: 'kg',
        type: 'weight'
      }
    ],
    recentAchievements: [
      {
        event: '100m Sprint',
        time: 11.45,
        date: '2024-01-15',
        improvement: 0.22,
        conditions: 'Perfect weather, slight tailwind'
      },
      {
        event: 'Long Jump',
        distance: 6.85,
        date: '2024-01-12',
        improvement: 0.13,
        conditions: 'Good runway, calm conditions'
      }
    ],
    seasonGoals: [
      {
        event: '100m Sprint',
        current: 11.45,
        target: 11.30,
        progress: 68.2
      },
      {
        event: '200m Sprint',
        current: 23.12,
        target: 22.80,
        progress: 43.8
      }
    ],
    milestones: {
      totalPBs: 12,
      thisMonth: 3,
      thisYear: 8,
      streak: 2
    }
  };

  useEffect(() => {
    const analyzePBs = () => {
      try {
        const { currentPBs, recentAchievements, seasonGoals, milestones } = mockPBData;
        
        // Calculate additional metrics
        const newPBsCount = currentPBs.filter(pb => pb.isNew).length;
        const avgImprovement = currentPBs.reduce((sum, pb) => sum + pb.improvement, 0) / currentPBs.length;
        const mostImproved = currentPBs.reduce((max, pb) => pb.improvement > max.improvement ? pb : max);
        
        // Calculate days since last PB
        const lastPBDate = new Date(Math.max(...currentPBs.map(pb => new Date(pb.date).getTime())));
        const daysSinceLastPB = Math.floor((new Date().getTime() - lastPBDate.getTime()) / (1000 * 60 * 60 * 24));

        setPbData({
          currentPBs,
          recentAchievements,
          seasonGoals,
          milestones,
          metrics: {
            newPBsCount,
            avgImprovement,
            mostImproved,
            daysSinceLastPB
          }
        });
      } catch (error) {
        console.error('Error analyzing PBs:', error);
      }
    };

    analyzePBs();
  }, []);

  const formatValue = (value: number, unit: string, type: string) => {
    if (type === 'time') {
      return `${value.toFixed(2)}${unit}`;
    }
    return `${value.toFixed(type === 'distance' ? 2 : 0)}${unit}`;
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 2) return 'green';
    if (improvement > 1) return 'blue';
    if (improvement > 0) return 'yellow';
    return 'gray';
  };

  const getEventIcon = (event: string) => {
    if (event.includes('Sprint') || event.includes('m ')) return FaStopwatch;
    if (event.includes('Jump')) return FaArrowUp;
    if (event.includes('Squat') || event.includes('RM')) return FaTrophy;
    return FaStar;
  };

  if (!pbData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <Text color={statLabelColor}>Loading personal records...</Text>
      </Box>
    );
  }

  const { currentPBs, recentAchievements, seasonGoals, milestones, metrics } = pbData;

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
            <Icon as={FaTrophy} boxSize={6} color="gold" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Personal Records
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Track your best performances
              </Text>
            </VStack>
          </HStack>
          {metrics.newPBsCount > 0 && (
            <Badge 
              colorScheme="green" 
              variant="solid" 
              fontSize="sm"
              px={3}
              py={1}
            >
              {metrics.newPBsCount} NEW!
            </Badge>
          )}
        </HStack>

        {/* Milestones Overview */}
        <SimpleGrid columns={4} spacing={4}>
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Total PBs
            </StatLabel>
            <StatNumber fontSize="lg" color={statNumberColor}>
              {milestones.totalPBs}
            </StatNumber>
            <StatHelpText fontSize="xs">
              All time
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              This Year
            </StatLabel>
            <StatNumber fontSize="lg" color="green.500">
              {milestones.thisYear}
            </StatNumber>
            <StatHelpText fontSize="xs">
              New records
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              This Month
            </StatLabel>
            <StatNumber fontSize="lg" color="blue.500">
              {milestones.thisMonth}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Recent PBs
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              <HStack spacing={1} justify="center">
                <Icon as={FaFire} color="orange.500" fontSize="xs" />
                <Text>Streak</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="lg" color="orange.500">
              {milestones.streak}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Months
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* Current PBs */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Current Personal Bests
          </Text>
          <VStack spacing={3} align="stretch">
            {currentPBs.map((pb, index) => (
              <Box 
                key={index} 
                p={3} 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                borderRadius="md"
                border={pb.isNew ? "2px solid" : "1px solid"}
                borderColor={pb.isNew ? "green.300" : borderColor}
                position="relative"
              >
                {pb.isNew && (
                  <Badge
                    position="absolute"
                    top="-8px"
                    right="8px"
                    colorScheme="green"
                    variant="solid"
                    fontSize="xs"
                    px={2}
                  >
                    NEW PB!
                  </Badge>
                )}
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Icon 
                      as={getEventIcon(pb.event)} 
                      color="blue.500" 
                      fontSize="lg"
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                        {pb.event}
                      </Text>
                      <Text fontSize="xs" color={statLabelColor}>
                        {new Date(pb.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                      {formatValue(pb.current, pb.unit, pb.type)}
                    </Text>
                    <HStack spacing={1}>
                      <Icon as={FaArrowUp} color="green.500" fontSize="xs" />
                      <Text fontSize="xs" color="green.500">
                        {pb.improvement.toFixed(1)}%
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Divider />

        {/* Season Goals Progress */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Season Goal Progress
          </Text>
          <VStack spacing={3} align="stretch">
            {seasonGoals.map((goal, index) => (
              <Box key={index}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" color={statLabelColor}>
                    {goal.event}
                  </Text>
                  <Text fontSize="sm" color={statNumberColor} fontWeight="medium">
                    {goal.progress.toFixed(1)}%
                  </Text>
                </HStack>
                <Box 
                  bg={useColorModeValue('gray.100', 'gray.600')} 
                  borderRadius="full" 
                  h="6px" 
                  overflow="hidden"
                >
                  <Box
                    bg="blue.500"
                    h="100%"
                    w={`${Math.min(goal.progress, 100)}%`}
                    borderRadius="full"
                    transition="width 0.3s ease"
                  />
                </Box>
                <HStack justify="space-between" fontSize="xs" color={statLabelColor} mt={1}>
                  <Text>Current: {goal.current}</Text>
                  <Text>Target: {goal.target}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
              Recent Achievements
            </Text>
            <VStack spacing={2} align="stretch">
              {recentAchievements.map((achievement, index) => (
                <HStack 
                  key={index} 
                  p={2} 
                  bg={useColorModeValue('green.50', 'green.900')} 
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderColor="green.500"
                >
                  <Icon as={FaStar} color="green.500" />
                  <VStack align="start" spacing={0} flex="1">
                    <Text fontSize="sm" color={statNumberColor} fontWeight="medium">
                      {achievement.event} PB: {achievement.time || achievement.distance}
                    </Text>
                    <Text fontSize="xs" color={statLabelColor}>
                      {new Date(achievement.date).toLocaleDateString()} • Improved by {achievement.improvement.toFixed(2)}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Action Buttons */}
        <HStack spacing={3} justify="center">
          <Button
            size="sm"
            colorScheme="blue"
            variant="ghost"
            rightIcon={<FaArrowRight />}
          >
            View All Records
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            variant="ghost"
            rightIcon={<FaCalendarAlt />}
          >
            Set New Goals
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default PersonalRecordsCard; 