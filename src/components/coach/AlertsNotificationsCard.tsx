import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaUserInjured, FaBolt, FaCommentDots, FaClipboardCheck } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AlertItem {
  id: string;
  type: 'injury_risk' | 'missed_workout' | 'athlete_issue' | 'pending_request';
  athleteId?: string;
  athleteName?: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  actionLink?: string;
  timestamp: Date;
}

interface AlertsNotificationsCardProps {
  onAlertClick?: (alert: AlertItem) => void;
}

const AlertsNotificationsCard: React.FC<AlertsNotificationsCardProps> = ({ onAlertClick }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  useEffect(() => {
    if (user?.id) {
      fetchAlerts();
    }
  }, [user?.id]);

  const fetchAlerts = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const alerts: AlertItem[] = [];

      // 1. Check for athletes with high injury risk (missed recent workouts)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: missedWorkouts, error: missedError } = await supabase
        .from('athlete_workouts')
        .select(`
          athlete_id,
          workout_name,
          scheduled_date,
          profiles!athlete_workouts_athlete_id_fkey(first_name, last_name)
        `)
        .is('completed_at', null)
        .gte('scheduled_date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('scheduled_date', new Date().toISOString().split('T')[0]);

      if (missedError) throw missedError;

      // Group by athlete and count missed workouts
      const missedByAthlete = new Map();
      (missedWorkouts || []).forEach(workout => {
        const key = workout.athlete_id;
        if (!missedByAthlete.has(key)) {
          missedByAthlete.set(key, {
            athleteId: workout.athlete_id,
            athleteName: `${workout.profiles?.first_name} ${workout.profiles?.last_name}`,
            count: 0,
            workouts: []
          });
        }
        const athleteData = missedByAthlete.get(key);
        athleteData.count++;
        athleteData.workouts.push(workout);
      });

      // Add alerts for athletes with 3+ missed workouts
      for (const [_, athleteData] of missedByAthlete) {
        if (athleteData.count >= 3) {
          alerts.push({
            id: `missed-${athleteData.athleteId}`,
            type: 'missed_workout',
            athleteId: athleteData.athleteId,
            athleteName: athleteData.athleteName,
            title: 'Multiple Missed Workouts',
            description: `${athleteData.athleteName} has missed ${athleteData.count} workouts in the past week`,
            severity: 'high',
            actionLink: `/coach/athletes/${athleteData.athleteId}`,
            timestamp: new Date()
          });
        } else if (athleteData.count >= 2) {
          alerts.push({
            id: `missed-${athleteData.athleteId}`,
            type: 'missed_workout',
            athleteId: athleteData.athleteId,
            athleteName: athleteData.athleteName,
            title: 'Missed Workouts',
            description: `${athleteData.athleteName} has missed ${athleteData.count} workouts recently`,
            severity: 'medium',
            actionLink: `/coach/athletes/${athleteData.athleteId}`,
            timestamp: new Date()
          });
        }
      }

      // 2. Check for low RPE completion rates (if athlete has been logging very high RPE consistently)
      const { data: rpeData, error: rpeError } = await supabase
        .from('athlete_workouts')
        .select(`
          athlete_id,
          rpe_rating,
          profiles!athlete_workouts_athlete_id_fkey(first_name, last_name)
        `)
        .not('rpe_rating', 'is', null)
        .gte('scheduled_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: false });

      if (rpeError) throw rpeError;

      // Group RPE by athlete and check for consistently high ratings
      const rpeByAthlete = new Map();
      (rpeData || []).forEach(workout => {
        const key = workout.athlete_id;
        if (!rpeByAthlete.has(key)) {
          rpeByAthlete.set(key, {
            athleteId: workout.athlete_id,
            athleteName: `${workout.profiles?.first_name} ${workout.profiles?.last_name}`,
            ratings: []
          });
        }
        rpeByAthlete.get(key).ratings.push(workout.rpe_rating);
      });

      // Add alerts for athletes with consistently high RPE (risk of overtraining)
      for (const [_, athleteData] of rpeByAthlete) {
        if (athleteData.ratings.length >= 3) {
          const avgRPE = athleteData.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / athleteData.ratings.length;
          if (avgRPE >= 8.5) {
            alerts.push({
              id: `high-rpe-${athleteData.athleteId}`,
              type: 'injury_risk',
              athleteId: athleteData.athleteId,
              athleteName: athleteData.athleteName,
              title: 'High Training Load Risk',
              description: `${athleteData.athleteName} has been reporting consistently high RPE (avg: ${avgRPE.toFixed(1)})`,
              severity: 'high',
              actionLink: `/coach/athletes/${athleteData.athleteId}`,
              timestamp: new Date()
            });
          }
        }
      }

      // 3. Check for pending coach-athlete relationship requests
      const { data: pendingRequests, error: requestError } = await supabase
        .from('coach_athlete_requests')
        .select(`
          id,
          athlete_id,
          status,
          created_at,
          profiles!coach_athlete_requests_athlete_id_fkey(first_name, last_name)
        `)
        .eq('coach_id', user.id)
        .eq('status', 'pending');

      if (requestError) throw requestError;

      (pendingRequests || []).forEach(request => {
        alerts.push({
          id: `request-${request.id}`,
          type: 'pending_request',
          athleteId: request.athlete_id,
          athleteName: `${request.profiles?.first_name} ${request.profiles?.last_name}`,
          title: 'Pending Team Request',
          description: `${request.profiles?.first_name} ${request.profiles?.last_name} wants to join your team`,
          severity: 'medium',
          actionLink: '/coach/athletes',
          timestamp: new Date(request.created_at)
        });
      });

      // Sort alerts by severity and timestamp
      const severityOrder = { high: 3, medium: 2, low: 1 };
      alerts.sort((a, b) => {
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setAlerts(alerts.slice(0, 5)); // Show top 5 alerts

    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error fetching alerts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'injury_risk': return FaUserInjured;
      case 'missed_workout': return FaClipboardCheck;
      case 'athlete_issue': return FaBolt;
      case 'pending_request': return FaCommentDots;
      default: return FaExclamationTriangle;
    }
  };

  const getAlertColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <HStack spacing={3} mb={4}>
          <Icon as={FaExclamationTriangle} boxSize={6} color="red.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
              Alerts & Notifications
            </Text>
            <Text fontSize="sm" color={statLabelColor}>
              Issues requiring attention
            </Text>
          </VStack>
        </HStack>
        <VStack spacing={3}>
          <Skeleton height="60px" width="100%" />
          <Skeleton height="60px" width="100%" />
          <Skeleton height="60px" width="100%" />
        </VStack>
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
      boxShadow={cardShadow}
    >
      <HStack spacing={3} mb={4} justify="space-between">
        <HStack spacing={3}>
          <Icon as={FaExclamationTriangle} boxSize={6} color="red.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
              Alerts & Notifications
            </Text>
            <Text fontSize="sm" color={statLabelColor}>
              {alerts.length > 0 ? `${alerts.length} items need attention` : 'All clear!'}
            </Text>
          </VStack>
        </HStack>
        {alerts.length > 0 && (
          <Badge colorScheme="red" variant="solid" fontSize="xs" px={2} py={1}>
            {alerts.length}
          </Badge>
        )}
      </HStack>

      {alerts.length === 0 ? (
        <Box
          bg={useColorModeValue('green.50', 'green.900')}
          p={4}
          borderRadius="lg"
          textAlign="center"
        >
          <Text fontSize="sm" color="green.600" fontWeight="medium">
            ✅ No urgent issues requiring attention
          </Text>
          <Text fontSize="xs" color="green.500" mt={1}>
            Your team is on track!
          </Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              status={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
              borderRadius="md"
              cursor="pointer"
              onClick={() => onAlertClick?.(alert)}
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
              transition="all 0.2s"
            >
              <AlertIcon as={getAlertIcon(alert.type)} />
              <Box flex="1">
                <AlertTitle fontSize="sm" lineHeight="tight">
                  {alert.title}
                </AlertTitle>
                <AlertDescription fontSize="xs" mt={1}>
                  {alert.description}
                </AlertDescription>
              </Box>
              {alert.actionLink && (
                <Button
                  as={RouterLink}
                  to={alert.actionLink}
                  size="xs"
                  colorScheme={getAlertColor(alert.severity)}
                  variant="outline"
                >
                  View
                </Button>
              )}
            </Alert>
          ))}
          
          {alerts.length >= 5 && (
            <Button
              as={RouterLink}
              to="/coach/alerts"
              size="sm"
              variant="ghost"
              colorScheme="blue"
            >
              View All Alerts
            </Button>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default AlertsNotificationsCard; 