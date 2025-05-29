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
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { 
  FaCheckCircle, 
  FaExclamationCircle,
  FaClock,
  FaArrowRight,
  FaCalendarCheck,
  FaChartLine
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

export const WorkoutComplianceCard: React.FC = () => {
  const { user } = useAuth();
  const [complianceData, setComplianceData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock workout compliance data
  const mockComplianceData = {
    weeklyStats: {
      prescribed: 6,
      completed: 5,
      completionRate: 83.3,
      avgRPE: 7.2,
      onTimeCompletion: 4
    },
    recentWorkouts: [
      {
        date: '2024-01-15',
        name: 'Speed Development',
        prescribed: { sets: 6, reps: '60m', rest: '3min' },
        completed: { sets: 6, reps: '60m', rest: '3min' },
        rpe: 8,
        status: 'completed',
        notes: 'Felt strong, good conditions'
      },
      {
        date: '2024-01-14',
        name: 'Strength Training',
        prescribed: { sets: 4, reps: '8', weight: '80kg' },
        completed: { sets: 4, reps: '8', weight: '75kg' },
        rpe: 7,
        status: 'modified',
        notes: 'Reduced weight due to fatigue'
      },
      {
        date: '2024-01-13',
        name: 'Recovery Run',
        prescribed: { duration: '30min', intensity: 'easy' },
        completed: { duration: '30min', intensity: 'easy' },
        rpe: 4,
        status: 'completed',
        notes: 'Perfect recovery session'
      },
      {
        date: '2024-01-12',
        name: 'Plyometrics',
        prescribed: { sets: 5, reps: '10', exercise: 'Box Jumps' },
        completed: null,
        rpe: null,
        status: 'missed',
        notes: 'Overslept, missed session'
      },
      {
        date: '2024-01-11',
        name: 'Track Session',
        prescribed: { sets: 8, reps: '200m', rest: '90s' },
        completed: { sets: 6, reps: '200m', rest: '90s' },
        rpe: 9,
        status: 'modified',
        notes: 'Cut short due to weather'
      }
    ],
    rpeHistory: [
      { date: '2024-01-15', rpe: 8, workoutType: 'speed' },
      { date: '2024-01-14', rpe: 7, workoutType: 'strength' },
      { date: '2024-01-13', rpe: 4, workoutType: 'recovery' },
      { date: '2024-01-11', rpe: 9, workoutType: 'endurance' },
      { date: '2024-01-10', rpe: 6, workoutType: 'technique' },
      { date: '2024-01-09', rpe: 8, workoutType: 'speed' },
      { date: '2024-01-08', rpe: 7, workoutType: 'strength' }
    ]
  };

  useEffect(() => {
    const analyzeCompliance = () => {
      try {
        const { weeklyStats, recentWorkouts, rpeHistory } = mockComplianceData;
        
        // Calculate additional metrics
        const modifiedWorkouts = recentWorkouts.filter(w => w.status === 'modified').length;
        const missedWorkouts = recentWorkouts.filter(w => w.status === 'missed').length;
        const perfectWorkouts = recentWorkouts.filter(w => w.status === 'completed').length;
        
        // RPE trend analysis
        const recentRPEs = rpeHistory.slice(0, 5).map(h => h.rpe);
        const avgRecentRPE = recentRPEs.reduce((sum, rpe) => sum + rpe, 0) / recentRPEs.length;
        
        // Calculate RPE trend
        const firstHalf = recentRPEs.slice(0, 2);
        const secondHalf = recentRPEs.slice(2);
        const firstAvg = firstHalf.reduce((sum, rpe) => sum + rpe, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, rpe) => sum + rpe, 0) / secondHalf.length;
        const rpeTrend = firstAvg > secondAvg ? 'increasing' : firstAvg < secondAvg ? 'decreasing' : 'stable';

        setComplianceData({
          weeklyStats,
          recentWorkouts,
          rpeHistory,
          metrics: {
            modifiedWorkouts,
            missedWorkouts,
            perfectWorkouts,
            avgRecentRPE,
            rpeTrend
          }
        });
      } catch (error) {
        console.error('Error analyzing compliance:', error);
      }
    };

    analyzeCompliance();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return FaCheckCircle;
      case 'modified': return FaExclamationCircle;
      case 'missed': return FaClock;
      default: return FaCalendarCheck;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green.500';
      case 'modified': return 'orange.500';
      case 'missed': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getComplianceLevel = (rate: number) => {
    if (rate >= 90) return { level: 'Excellent', color: 'green' };
    if (rate >= 80) return { level: 'Good', color: 'blue' };
    if (rate >= 70) return { level: 'Fair', color: 'yellow' };
    return { level: 'Needs Improvement', color: 'red' };
  };

  const getRPETrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'orange.500';
      case 'decreasing': return 'green.500';
      default: return 'gray.500';
    }
  };

  if (!complianceData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <Text color={statLabelColor}>Loading compliance data...</Text>
      </Box>
    );
  }

  const { weeklyStats, recentWorkouts, metrics } = complianceData;
  const complianceLevel = getComplianceLevel(weeklyStats.completionRate);

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
            <Icon as={FaCalendarCheck} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Workout Compliance
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                7-day overview
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme={complianceLevel.color} 
            variant="solid" 
            fontSize="sm"
            px={3}
            py={1}
          >
            {complianceLevel.level}
          </Badge>
        </HStack>

        {/* Completion Rate Circle */}
        <Box textAlign="center">
          <CircularProgress 
            value={weeklyStats.completionRate} 
            size="120px" 
            color={`${complianceLevel.color}.500`}
            thickness="8px"
          >
            <CircularProgressLabel>
              <VStack spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color={statNumberColor}>
                  {weeklyStats.completionRate.toFixed(0)}%
                </Text>
                <Text fontSize="xs" color={statLabelColor}>
                  Completion
                </Text>
              </VStack>
            </CircularProgressLabel>
          </CircularProgress>
          <Text fontSize="sm" color={statLabelColor} mt={2}>
            {weeklyStats.completed} of {weeklyStats.prescribed} workouts completed
          </Text>
        </Box>

        {/* Weekly Stats */}
        <SimpleGrid columns={3} spacing={4}>
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Perfect
            </StatLabel>
            <StatNumber fontSize="lg" color="green.500">
              {metrics.perfectWorkouts}
            </StatNumber>
            <StatHelpText fontSize="xs">
              As prescribed
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Modified
            </StatLabel>
            <StatNumber fontSize="lg" color="orange.500">
              {metrics.modifiedWorkouts}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Adjusted
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Missed
            </StatLabel>
            <StatNumber fontSize="lg" color="red.500">
              {metrics.missedWorkouts}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Skipped
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* RPE Analysis */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
              RPE Analysis
            </Text>
            <HStack spacing={2}>
              <Icon as={FaChartLine} color={getRPETrendColor(metrics.rpeTrend)} fontSize="sm" />
              <Text fontSize="sm" color={statLabelColor}>
                {metrics.rpeTrend} trend
              </Text>
            </HStack>
          </HStack>
          
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={statLabelColor}>
                Average RPE (7 days)
              </Text>
              <Text fontSize="sm" color={statNumberColor} fontWeight="medium">
                {metrics.avgRecentRPE.toFixed(1)}/10
              </Text>
            </HStack>
            <Progress 
              value={(metrics.avgRecentRPE / 10) * 100} 
              colorScheme="purple"
              size="sm" 
              borderRadius="full"
            />
            <Text fontSize="xs" color={statLabelColor}>
              Target range: 6-8 for most sessions
            </Text>
          </VStack>
        </Box>

        {/* Recent Workouts */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Recent Sessions
          </Text>
          <VStack spacing={2} align="stretch">
            {recentWorkouts.slice(0, 3).map((workout, index) => (
              <HStack key={index} justify="space-between" p={2} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <HStack spacing={3}>
                  <Icon 
                    as={getStatusIcon(workout.status)} 
                    color={getStatusColor(workout.status)} 
                    fontSize="sm"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color={statNumberColor}>
                      {workout.name}
                    </Text>
                    <Text fontSize="xs" color={statLabelColor}>
                      {new Date(workout.date).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
                <VStack align="end" spacing={0}>
                  {workout.rpe && (
                    <Text fontSize="sm" color={statNumberColor} fontWeight="medium">
                      RPE: {workout.rpe}
                    </Text>
                  )}
                  <Badge 
                    colorScheme={workout.status === 'completed' ? 'green' : workout.status === 'modified' ? 'orange' : 'red'}
                    variant="subtle"
                    size="sm"
                  >
                    {workout.status}
                  </Badge>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Action Button */}
        <Button
          size="sm"
          colorScheme="blue"
          variant="ghost"
          rightIcon={<FaArrowRight />}
          alignSelf="center"
        >
          View Detailed History
        </Button>
      </VStack>
    </Box>
  );
};

export default WorkoutComplianceCard; 