import React, { useState, useEffect, useCallback } from 'react';
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

  // Color mode values - moved to ensure hooks are called in consistent order
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const successBoxBg = useColorModeValue('green.50', 'green.900');

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const alerts: AlertItem[] = [];

      // 1. Check for athletes with missed workouts using simple joins
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get missed workouts with athlete info using separate queries to avoid complex joins
      const { data: missedWorkouts, error: missedError } = await supabase
        .from('athlete_workouts')
        .select(`
          athlete_id,
          workout_id,
          assigned_at,
          status
        `)
        .eq('status', 'assigned')
        .gte('assigned_at', sevenDaysAgo.toISOString());

      if (missedError) {
        console.warn('Error fetching missed workouts:', missedError);
      } else if (missedWorkouts && missedWorkouts.length > 0) {
        // Get athlete names separately, but ONLY for athletes assigned to this coach
        const athleteIds = [...new Set(missedWorkouts.map(w => w.athlete_id))];
        
        // First get athletes that are assigned to this coach
        const { data: coachAthleteRelations, error: relationError } = await supabase
          .from('coach_athletes')
          .select('athlete_id')
          .eq('coach_id', user.id)
          .eq('approval_status', 'approved')
          .in('athlete_id', athleteIds);

        if (relationError) {
          console.warn('Error fetching coach relations:', relationError);
        }

        const assignedAthleteIds = coachAthleteRelations?.map(r => r.athlete_id) || [];
        
        // Only proceed if there are athletes assigned to this coach
        const { data: athletes, error: athleteError } = assignedAthleteIds.length > 0 
          ? await supabase
              .from('athletes')
              .select(`
                id,
                profiles!inner(first_name, last_name)
              `)
              .in('id', assignedAthleteIds)
          : { data: [], error: null };

        if (!athleteError && athletes) {
          // Group by athlete and count missed workouts
          const missedByAthlete = new Map();
          missedWorkouts.forEach(workout => {
            const athlete = athletes.find(a => a.id === workout.athlete_id);
            if (athlete) {
              const key = workout.athlete_id;
              if (!missedByAthlete.has(key)) {
                missedByAthlete.set(key, {
                  athleteId: workout.athlete_id,
                  athleteName: `${(athlete.profiles as any)?.first_name || ''} ${(athlete.profiles as any)?.last_name || ''}`.trim(),
                  count: 0,
                  workouts: []
                });
              }
              const athleteData = missedByAthlete.get(key);
              athleteData.count++;
              athleteData.workouts.push(workout);
            }
          });

          // Add alerts for athletes with missed workouts
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
        }
      }

      // 2. Check for pending coach-athlete relationships
      const { data: pendingRequests, error: requestError } = await supabase
        .from('coach_athletes')
        .select(`
          id,
          athlete_id,
          approval_status,
          created_at
        `)
        .eq('coach_id', user.id)
        .eq('approval_status', 'pending');

      if (requestError) {
        console.warn('Error fetching pending requests:', requestError);
      } else if (pendingRequests && pendingRequests.length > 0) {
        // Get athlete names for pending requests
        const pendingAthleteIds = pendingRequests.map(r => r.athlete_id);
        const { data: pendingAthletes, error: pendingAthleteError } = await supabase
          .from('athletes')
          .select(`
            id,
            profiles!inner(first_name, last_name)
          `)
          .in('id', pendingAthleteIds);

        if (!pendingAthleteError && pendingAthletes) {
          pendingRequests.forEach(request => {
            const athlete = pendingAthletes.find(a => a.id === request.athlete_id);
            if (athlete) {
              const athleteName = `${(athlete.profiles as any)?.first_name || ''} ${(athlete.profiles as any)?.last_name || ''}`.trim();
              alerts.push({
                id: `request-${request.id}`,
                type: 'pending_request',
                athleteId: request.athlete_id,
                athleteName: athleteName,
                title: 'Pending Team Request',
                description: `${athleteName} wants to join your team`,
                severity: 'medium',
                actionLink: '/coach/athletes',
                timestamp: new Date(request.created_at)
              });
            }
          });
        }
      }

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
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.id) {
      fetchAlerts();
    }
  }, [user?.id, fetchAlerts]);

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
          bg={successBoxBg}
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