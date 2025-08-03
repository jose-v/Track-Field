import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Select,
  Icon
} from '@chakra-ui/react';
import { FaChartLine, FaDumbbell, FaArchive, FaHistory } from 'react-icons/fa';
import { WorkoutAnalyticsService, WorkoutAnalyticsFilters } from '../../services/analytics/workoutAnalyticsService';

interface WorkoutAnalyticsCardProps {
  userId: string;
  title?: string;
  showArchived?: boolean;
}

export function WorkoutAnalyticsCard({ 
  userId, 
  title = "Workout Analytics",
  showArchived = true 
}: WorkoutAnalyticsCardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: WorkoutAnalyticsFilters = {
        userId,
        includeArchived: showArchived
      };

      // Add date range based on timeframe
      if (timeframe !== 'all') {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        filters.startDate = startDate;
      }

      const analyticsData = await WorkoutAnalyticsService.getWorkoutStats(filters);
      setStats(analyticsData);
    } catch (err) {
      console.error('Error loading workout analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAnalytics();
    }
  }, [userId, timeframe, showArchived]);

  if (loading) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner size="lg" />
            <Text color={textColor}>Loading workout analytics...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={FaChartLine} color="blue.500" />
              <Heading size="md">{title}</Heading>
            </HStack>
            <Select 
              size="sm" 
              width="auto"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
          </HStack>

          {/* Stats Grid */}
          <Box>
            <StatGroup>
              <Stat>
                <StatLabel>Total Workouts</StatLabel>
                <StatNumber>{stats?.totalWorkouts || 0}</StatNumber>
                <StatHelpText>
                  <Icon as={FaDumbbell} boxSize={3} mr={1} />
                  {stats?.activeWorkouts || 0} active
                </StatHelpText>
              </Stat>

              {showArchived && (
                <Stat>
                  <StatLabel>Archived</StatLabel>
                  <StatNumber>{stats?.archivedWorkouts || 0}</StatNumber>
                  <StatHelpText>
                    <Icon as={FaArchive} boxSize={3} mr={1} />
                    Preserved data
                  </StatHelpText>
                </Stat>
              )}

              <Stat>
                <StatLabel>Templates</StatLabel>
                <StatNumber>{stats?.templates || 0}</StatNumber>
                <StatHelpText>
                  <Icon as={FaHistory} boxSize={3} mr={1} />
                  Reusable workouts
                </StatHelpText>
              </Stat>
            </StatGroup>
          </Box>

          {/* Additional Stats */}
          {stats && (
            <VStack align="start" spacing={2} pt={2}>
              <HStack spacing={4} fontSize="sm" color={textColor}>
                <HStack spacing={1}>
                  <Icon as={FaDumbbell} boxSize={3} />
                  <Text>
                    Avg exercises: {stats.averageExercisesPerWorkout.toFixed(1)}
                  </Text>
                </HStack>
                {stats.mostCommonType && (
                  <HStack spacing={1}>
                    <Icon as={FaChartLine} boxSize={3} />
                    <Text>
                      Most common: {stats.mostCommonType}
                    </Text>
                  </HStack>
                )}
              </HStack>

              {stats.dateRange.earliest && (
                <Text fontSize="xs" color={textColor}>
                  Date range: {new Date(stats.dateRange.earliest).toLocaleDateString()} - {new Date(stats.dateRange.latest).toLocaleDateString()}
                </Text>
              )}
            </VStack>
          )}

          {/* Data Source Info */}
          <Box bg="blue.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="blue.500">
            <Text fontSize="sm" color="blue.700">
              ℹ️ Analytics include {showArchived ? 'both active and archived' : 'active only'} workouts
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
} 