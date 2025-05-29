import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Avatar,
  Button,
  useColorModeValue,
  SimpleGrid,
  Flex,
  Tooltip,
  Progress,
  useToast,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react';
import { FaRunning, FaExclamationTriangle, FaCheckCircle, FaUser, FaEye } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AthleteStatus {
  id: string;
  name: string;
  avatarUrl?: string;
  injuryRisk: 'low' | 'medium' | 'high';
  compliance: number; // percentage 0-100
  lastActivity: string;
  recentRPE?: number;
  missedWorkouts: number;
  totalWorkouts: number;
}

interface AthleteRosterCardProps {
  onAthleteClick?: (athleteId: string) => void;
}

const AthleteRosterCard: React.FC<AthleteRosterCardProps> = ({ onAthleteClick }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [athletes, setAthletes] = useState<AthleteStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const athleteCardBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (user?.id) {
      fetchAthleteStatuses();
    }
  }, [user?.id]);

  const fetchAthleteStatuses = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get coach's athletes
      const { data: coachAthletes, error: athletesError } = await supabase
        .from('coach_athletes')
        .select(`
          athlete_id,
          profiles!coach_athletes_athlete_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('coach_id', user.id);

      if (athletesError) throw athletesError;

      if (!coachAthletes || coachAthletes.length === 0) {
        setAthletes([]);
        return;
      }

      const athleteIds = coachAthletes.map(ca => ca.athlete_id);

      // Get workout data for the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: workoutData, error: workoutError } = await supabase
        .from('athlete_workouts')
        .select('athlete_id, scheduled_date, completed_at, rpe_rating')
        .in('athlete_id', athleteIds)
        .gte('scheduled_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: false });

      if (workoutError) throw workoutError;

      // Process athlete statuses
      const athleteStatuses: AthleteStatus[] = coachAthletes.map(ca => {
        const profile = ca.profiles;
        const athleteWorkouts = (workoutData || []).filter(w => w.athlete_id === ca.athlete_id);
        
        // Calculate compliance (completed vs assigned workouts)
        const totalWorkouts = athleteWorkouts.length;
        const completedWorkouts = athleteWorkouts.filter(w => w.completed_at).length;
        const compliance = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
        const missedWorkouts = totalWorkouts - completedWorkouts;

        // Calculate recent RPE average for injury risk assessment
        const recentWorkouts = athleteWorkouts
          .filter(w => w.rpe_rating && w.completed_at)
          .slice(0, 5); // Last 5 completed workouts

        const recentRPE = recentWorkouts.length > 0
          ? recentWorkouts.reduce((sum, w) => sum + (w.rpe_rating || 0), 0) / recentWorkouts.length
          : undefined;

        // Determine injury risk
        let injuryRisk: 'low' | 'medium' | 'high' = 'low';
        if (missedWorkouts >= 3 || (recentRPE && recentRPE >= 8.5)) {
          injuryRisk = 'high';
        } else if (missedWorkouts >= 2 || (recentRPE && recentRPE >= 7.5) || compliance < 60) {
          injuryRisk = 'medium';
        }

        // Get last activity
        const lastCompletedWorkout = athleteWorkouts
          .filter(w => w.completed_at)
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
        
        const lastActivity = lastCompletedWorkout 
          ? new Date(lastCompletedWorkout.completed_at).toLocaleDateString()
          : 'No recent activity';

        return {
          id: ca.athlete_id,
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          avatarUrl: profile?.avatar_url,
          injuryRisk,
          compliance,
          lastActivity,
          recentRPE,
          missedWorkouts,
          totalWorkouts
        };
      });

      // Sort by injury risk (high first) then by compliance (low first)
      athleteStatuses.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        const riskDiff = riskOrder[b.injuryRisk] - riskOrder[a.injuryRisk];
        if (riskDiff !== 0) return riskDiff;
        return a.compliance - b.compliance;
      });

      setAthletes(athleteStatuses);

    } catch (error) {
      console.error('Error fetching athlete statuses:', error);
      toast({
        title: 'Error fetching athlete data',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return FaExclamationTriangle;
      case 'medium': return FaExclamationTriangle;
      case 'low': return FaCheckCircle;
      default: return FaUser;
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return 'green';
    if (compliance >= 60) return 'yellow';
    return 'red';
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <HStack spacing={3} mb={4}>
          <Icon as={FaRunning} boxSize={6} color="blue.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
              Team Roster
            </Text>
            <Text fontSize="sm" color={statLabelColor}>
              Athlete status overview
            </Text>
          </VStack>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <HStack key={i} spacing={3} p={3} bg={athleteCardBg} borderRadius="md">
              <SkeletonCircle size="12" />
              <VStack align="start" spacing={1} flex={1}>
                <Skeleton height="16px" width="80%" />
                <Skeleton height="12px" width="60%" />
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
    >
      <HStack spacing={3} mb={4} justify="space-between">
        <HStack spacing={3}>
          <Icon as={FaRunning} boxSize={6} color="blue.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
              Team Roster
            </Text>
            <Text fontSize="sm" color={statLabelColor}>
              {athletes.length} athletes • Click to view details
            </Text>
          </VStack>
        </HStack>
        <Button
          as={RouterLink}
          to="/coach/athletes"
          size="sm"
          variant="outline"
          colorScheme="blue"
          leftIcon={<Icon as={FaEye} />}
        >
          View All
        </Button>
      </HStack>

      {athletes.length === 0 ? (
        <Box
          bg={useColorModeValue('gray.50', 'gray.700')}
          p={6}
          borderRadius="lg"
          textAlign="center"
        >
          <Text fontSize="sm" color={statLabelColor}>
            No athletes in your team yet
          </Text>
          <Button
            as={RouterLink}
            to="/coach/athletes"
            size="sm"
            colorScheme="blue"
            mt={3}
          >
            Add Athletes
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} maxH="400px" overflowY="auto">
          {athletes.map(athlete => (
            <Box
              key={athlete.id}
              p={3}
              bg={athleteCardBg}
              borderRadius="md"
              cursor="pointer"
              onClick={() => onAthleteClick?.(athlete.id)}
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
              transition="all 0.2s"
              border="1px solid"
              borderColor={`${getRiskColor(athlete.injuryRisk)}.200`}
            >
              <HStack spacing={3} align="start">
                <Avatar
                  size="md"
                  name={athlete.name}
                  src={athlete.avatarUrl}
                  bg={`${getRiskColor(athlete.injuryRisk)}.100`}
                />
                <VStack align="start" spacing={1} flex={1} minW={0}>
                  <HStack spacing={2} w="100%">
                    <Text fontSize="sm" fontWeight="bold" color={statNumberColor} noOfLines={1} flex={1}>
                      {athlete.name}
                    </Text>
                    <Tooltip label={`${athlete.injuryRisk.charAt(0).toUpperCase() + athlete.injuryRisk.slice(1)} risk`}>
                      <Icon
                        as={getRiskIcon(athlete.injuryRisk)}
                        color={`${getRiskColor(athlete.injuryRisk)}.500`}
                        boxSize={4}
                      />
                    </Tooltip>
                  </HStack>
                  
                  <HStack spacing={2} w="100%">
                    <Text fontSize="xs" color={statLabelColor}>
                      Compliance:
                    </Text>
                    <Badge
                      colorScheme={getComplianceColor(athlete.compliance)}
                      variant="subtle"
                      fontSize="xs"
                    >
                      {athlete.compliance}%
                    </Badge>
                  </HStack>

                  <Progress
                    value={athlete.compliance}
                    size="xs"
                    colorScheme={getComplianceColor(athlete.compliance)}
                    w="100%"
                    bg={useColorModeValue('gray.200', 'gray.600')}
                  />

                  <Text fontSize="xs" color={statLabelColor}>
                    Last: {athlete.lastActivity}
                  </Text>

                  {athlete.recentRPE && (
                    <HStack spacing={1}>
                      <Text fontSize="xs" color={statLabelColor}>Avg RPE:</Text>
                      <Badge
                        colorScheme={athlete.recentRPE >= 8 ? 'red' : athlete.recentRPE >= 7 ? 'orange' : 'green'}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {athlete.recentRPE.toFixed(1)}
                      </Badge>
                    </HStack>
                  )}

                  {athlete.missedWorkouts > 0 && (
                    <Text fontSize="xs" color="red.500">
                      {athlete.missedWorkouts} missed workout{athlete.missedWorkouts !== 1 ? 's' : ''}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default AthleteRosterCard; 