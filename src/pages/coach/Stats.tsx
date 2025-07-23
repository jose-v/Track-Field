import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Avatar,
  Badge,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Button,
  Select,
  Skeleton,
  SkeletonText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Spinner,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react';
import {
  FaChartLine,
  FaBed,
  FaHeartbeat,
  FaDumbbell,
  FaShieldAlt,
  FaUser,
  FaUsers,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaRedo,
  FaEye,
  FaClock,
  FaTrophy,
  FaRunning,
  FaSearch,
  FaThumbsUp,
  FaThumbsDown,
  FaExclamationCircle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

// Individual Athlete Data Interface
interface AthleteAnalytics {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  events?: string[];
  age?: number;
  gender?: string;
  email?: string;
  phone?: string;
}

// Main Component
export function CoachStats() {
  const { user } = useAuth();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('week');

  // Fetch coach's athletes
  const { data: athletes = [], isLoading: athletesLoading } = useCoachAthletes({
    includeStatuses: ['approved']
  });

  // Auto-select first athlete when athletes load
  useEffect(() => {
    if (athletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  // Filter athletes based on search
  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete =>
      `${athlete.first_name} ${athlete.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [athletes, searchQuery]);

  // Get selected athlete
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  // Fetch detailed athlete data
  const { data: athleteData, isLoading: dataLoading } = useQuery({
    queryKey: ['athlete-detailed-analytics', selectedAthleteId, dateRange],
    queryFn: async () => {
      if (!selectedAthleteId) return null;
      
      const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      // Get sleep records
      const { data: sleepData } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('sleep_date', startDate.split('T')[0])
        .order('sleep_date', { ascending: false });
      
      // Get wellness data
      const { data: wellnessData } = await supabase
        .from('athlete_wellness_surveys')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('survey_date', startDate.split('T')[0])
        .order('survey_date', { ascending: false });
      
      // Get exercise results directly from exercise_results table
      const { data: exerciseResultsData } = await supabase
        .from('exercise_results')
        .select(`
          *
        `)
        .eq('athlete_id', selectedAthleteId)
        .gte('completed_at', startDate)
        .order('completed_at', { ascending: false });

      console.log('Exercise results data for athlete:', selectedAthleteId, exerciseResultsData);
      
      // Get unique workout IDs from exercise results and fetch actual workout names directly from workouts table (same as other components)
      const uniqueWorkoutIds = [...new Set(exerciseResultsData?.map(result => result.workout_id).filter(Boolean) || [])];
      
      // Fetch workout names directly from workouts table (same approach as MonthlyPlanCard, RPEPromptCard, etc.)
      const workoutIdToName: Record<string, string> = {};
      if (uniqueWorkoutIds.length > 0) {
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('id, name')
          .in('id', uniqueWorkoutIds);
        
        if (!workoutError && workoutData) {
          workoutData.forEach(workout => {
            workoutIdToName[workout.id] = workout.name || `Workout ${workout.id.slice(-4).toUpperCase()}`;
          });
        }
        
        console.log('Fetched workout names directly from workouts table:', workoutIdToName);
      }
      
      // Transform exercise results to the format expected by the analytics
      // Filter to only include running exercises
      const filteredExerciseResults = exerciseResultsData?.filter((result: any) => {
        const exerciseName = result.exercise_name?.toLowerCase() || '';
        const isRunningExercise = exerciseName.includes('run') ||
                                 exerciseName.includes('sprint') ||
                                 exerciseName.includes('dash') ||
                                 exerciseName.includes('meter') ||
                                 exerciseName.includes('mile') ||
                                 exerciseName.includes('jog');
        return isRunningExercise;
      }) || [];
      
      const transformedPerformanceData = filteredExerciseResults?.map((result: any) => {
        const workoutName = workoutIdToName[result.workout_id] || `Workout ${result.workout_id.slice(0, 8)}`;
        
        return {
          id: result.id,
          athlete_id: result.athlete_id,
          workout_id: result.workout_id,
          exercise_index: result.exercise_index,
          exercise_name: result.exercise_name,
          time_minutes: result.time_minutes,
          time_seconds: result.time_seconds,
          time_hundredths: result.time_hundredths,
          created_at: result.completed_at,
          workout: { id: result.workout_id, name: workoutName },
          rpe_rating: result.rpe_rating,
          has_time_data: !!(result.time_minutes || result.time_seconds || result.time_hundredths),
          sets_completed: result.sets_completed,
          reps_completed: result.reps_completed,
          weight_used: result.weight_used,
          distance_meters: result.distance_meters,
          notes: result.notes
        };
      }) || [];

      console.log('Transformed performance data:', transformedPerformanceData);

      // Get training assignments
      const { data: assignmentsData } = await supabase
        .from('unified_workout_assignments')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      return {
        sleep: sleepData || [],
        wellness: wellnessData || [],
        performance: transformedPerformanceData || [],
        assignments: assignmentsData || []
      };
    },
    enabled: !!selectedAthleteId
  });

  // Calculate analytics from data
  const analytics = useMemo(() => {
    if (!athleteData) return null;

    // Sleep analytics
    const sleepRecords = athleteData.sleep;
    const avgSleepDuration = sleepRecords.length > 0 ? 
      sleepRecords.reduce((sum, record) => {
        if (record.start_time && record.end_time) {
          const start = new Date(`2000-01-01T${record.start_time}`);
          const end = new Date(`2000-01-01T${record.end_time}`);
          let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (duration < 0) duration += 24;
          return sum + duration;
        }
        return sum;
      }, 0) / sleepRecords.length : 0;
    
    const avgSleepQuality = sleepRecords.length > 0 ?
      sleepRecords.reduce((sum, record) => sum + (record.quality || 0), 0) / sleepRecords.length : 0;
    
    const expectedSleepEntries = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
    const sleepCompliance = Math.round((sleepRecords.length / expectedSleepEntries) * 100);

    // Prepare sleep chart data
    const chartData = (() => {
      if (dateRange !== 'week') {
        // For month/quarter, show last 7 days
        const days = 7;
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date);
        }
        
        return dates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const record = sleepRecords.find(r => r.sleep_date === dateStr);
          
          if (!record) {
            return {
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              hasData: false,
              sleepStart: 0,
              sleepEnd: 0,
              duration: 0
            };
          }

          // Convert time strings to hour values for chart positioning
          const [startHours, startMinutes] = record.start_time.split(':').map(Number);
          const [endHours, endMinutes] = record.end_time.split(':').map(Number);
          
          let sleepStart = startHours + startMinutes / 60;
          let sleepEnd = endHours + endMinutes / 60;
          
          // Handle overnight sleep (bedtime after midnight)
          if (sleepStart > 12) sleepStart -= 24; // Convert to negative hours for evening
          if (sleepEnd < sleepStart) sleepEnd += 24; // Handle crossing midnight
          
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            hasData: true,
            sleepStart,
            sleepEnd,
            duration: sleepEnd - sleepStart,
            record
          };
        });
      } else {
        // For week view, show last 7 days
        const days = 7;
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date);
        }
        
        return dates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const record = sleepRecords.find(r => r.sleep_date === dateStr);
          
          if (!record) {
            return {
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              hasData: false,
              sleepStart: 0,
              sleepEnd: 0,
              duration: 0
            };
          }

          // Convert time strings to hour values for chart positioning
          const [startHours, startMinutes] = record.start_time.split(':').map(Number);
          const [endHours, endMinutes] = record.end_time.split(':').map(Number);
          
          let sleepStart = startHours + startMinutes / 60;
          let sleepEnd = endHours + endMinutes / 60;
          
          // Handle overnight sleep (bedtime after midnight)
          if (sleepStart > 12) sleepStart -= 24; // Convert to negative hours for evening
          if (sleepEnd < sleepStart) sleepEnd += 24; // Handle crossing midnight
          
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            hasData: true,
            sleepStart,
            sleepEnd,
            duration: sleepEnd - sleepStart,
            record
          };
        });
      }
    })();

    // Wellness analytics
    const wellnessRecords = athleteData.wellness;
    const avgWellness = wellnessRecords.length > 0 ?
      wellnessRecords.reduce((sum, record) => sum + (record.overall_feeling || 0), 0) / wellnessRecords.length : 0;
    
    const avgStress = wellnessRecords.length > 0 ?
      wellnessRecords.reduce((sum, record) => sum + (record.stress_level || 0), 0) / wellnessRecords.length : 0;
    
    const avgFatigue = wellnessRecords.length > 0 ?
      wellnessRecords.reduce((sum, record) => sum + (record.fatigue_level || 0), 0) / wellnessRecords.length : 0;

    const wellnessCompliance = Math.round((wellnessRecords.length / expectedSleepEntries) * 100);

    // Prepare wellness chart data
    const wellnessChartData = (() => {
      const days = 7;
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
      }
      
      return dates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const record = wellnessRecords.find(r => r.survey_date === dateStr);
        
        if (!record) {
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            hasData: false,
            fatigue: 0,
            stress: 0,
            motivation: 0,
            overall: 0,
            soreness: 0
          };
        }

        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          hasData: true,
          fatigue: record.fatigue_level || 0,
          stress: record.stress_level || 0,
          motivation: record.motivation_level || 0,
          overall: record.overall_feeling || 0,
          soreness: record.muscle_soreness || 0,
          record
        };
      });
    })();

    // Performance analytics
    const performanceRecords = athleteData.performance;
    const sessionsCompleted = performanceRecords.length;
    const runningExercises = performanceRecords.filter(p => 
      p.time_minutes !== null || p.time_seconds !== null || p.time_hundredths !== null
    );

    // Run times analytics (all running exercises, with or without logged times)
    const runTimesData = (() => {
      // Get ALL running exercises (with or without logged time data)
      const runResults = performanceRecords.filter(p => {
        return p.exercise_name; // Show all running exercises
      });

              // Separate exercises with and without time data
        const runsWithTimes = runResults.filter(p => p.has_time_data);
        const runsWithoutTimes = runResults.filter(p => !p.has_time_data);
        
        console.log('All performance records:', performanceRecords.length);
        console.log('Total running exercises:', runResults.length);
        console.log('Runs with logged times:', runsWithTimes.length);
        console.log('Runs without times:', runsWithoutTimes.length);
        console.log('Sample run results:', runResults.slice(0, 5));
        console.log('All exercise names found:', performanceRecords.map(p => p.exercise_name).filter(Boolean));

      // Group by exercise type
      const groupedResults = runResults.reduce((groups, result) => {
        const exerciseName = result.exercise_name;
        if (!groups[exerciseName]) groups[exerciseName] = [];
        
        // Convert time to total seconds for comparison (only if has time data)
        const totalSeconds = result.has_time_data ? 
          (result.time_minutes || 0) * 60 + (result.time_seconds || 0) + (result.time_hundredths || 0) / 100 : 
          null;
        
        groups[exerciseName].push({
          ...result,
          totalSeconds,
          formattedTime: result.has_time_data ? 
            `${result.time_minutes || 0}:${(result.time_seconds || 0).toString().padStart(2, '0')}.${(result.time_hundredths || 0).toString().padStart(2, '0')}` :
            'Not logged'
        });
        return groups;
      }, {} as Record<string, any[]>);

      // Get best times and recent times for each exercise
      const exerciseStats = Object.entries(groupedResults).map(([exerciseName, results]: [string, any[]]) => {
        // Separate results with and without time data
        const resultsWithTimes = results.filter(r => r.has_time_data && r.totalSeconds !== null);
        const resultsWithoutTimes = results.filter(r => !r.has_time_data);
        
        // Sort by time (fastest first) - only for results with times
        const sortedResults = resultsWithTimes.sort((a, b) => a.totalSeconds - b.totalSeconds);
        const bestTime = sortedResults.length > 0 ? sortedResults[0] : null;
        
        // Get recent results (last 3) - all results, prioritizing those with times
        const recentResults = results
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
        
        // Calculate improvement (compare recent average to best) - only for timed results
        const recentTimedResults = recentResults.filter(r => r.has_time_data);
        const recentAvg = recentTimedResults.length > 0 ? 
          recentTimedResults.reduce((sum, r) => sum + r.totalSeconds, 0) / recentTimedResults.length : 0;
        
        const improvement = bestTime && recentAvg > 0 ? 
          ((recentAvg - bestTime.totalSeconds) / bestTime.totalSeconds * 100) : 0;
        
        return {
          exerciseName,
          bestTime: bestTime ? bestTime.formattedTime : 'Not logged',
          bestTimeSeconds: bestTime ? bestTime.totalSeconds : 0,
          recentResults,
          totalAttempts: results.length,
          totalWithTimes: resultsWithTimes.length,
          totalWithoutTimes: resultsWithoutTimes.length,
          improvement: Math.round(improvement * 100) / 100, // Positive = slower, Negative = faster
          lastAttempt: recentResults.length > 0 ? recentResults[0].formattedTime : 'N/A',
          lastAttemptDate: recentResults.length > 0 ? new Date(recentResults[0].created_at).toLocaleDateString() : 'N/A'
        };
      });

      return {
        totalRunTimes: runResults.length,
        exerciseStats: exerciseStats.sort((a, b) => b.totalAttempts - a.totalAttempts), // Sort by most attempts
        recentRuns: runResults
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      };
    })();

    // Assignment analytics
    const assignments = athleteData.assignments;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const trainingAdherence = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

    return {
      sleep: {
        avgDuration: avgSleepDuration,
        avgQuality: avgSleepQuality,
        compliance: sleepCompliance,
        status: avgSleepDuration >= 7 && avgSleepQuality >= 2.5 ? 'good' : avgSleepDuration >= 6 ? 'caution' : 'poor',
        records: sleepRecords,
        chartData
      },
      wellness: {
        avgScore: avgWellness,
        avgStress: avgStress,
        avgFatigue: avgFatigue,
        compliance: wellnessCompliance,
        status: avgWellness >= 7 && avgStress <= 5 ? 'good' : avgWellness >= 5 ? 'caution' : 'poor',
        records: wellnessRecords,
        chartData: wellnessChartData
      },
      performance: {
        sessionsCompleted,
        runningTimes: runningExercises.length,
        lastActivity: performanceRecords.length > 0 ? 
          new Date(performanceRecords[0].created_at).toLocaleDateString() : 'N/A',
        status: sessionsCompleted >= 3 ? 'excellent' : sessionsCompleted >= 1 ? 'good' : 'attention',
        records: performanceRecords
      },
      training: {
        adherence: trainingAdherence,
        totalAssignments: assignments.length,
        completedAssignments,
        status: trainingAdherence >= 80 ? 'excellent' : trainingAdherence >= 60 ? 'good' : 'attention'
      },
      runTimes: runTimesData
    };
  }, [athleteData, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'excellent':
        return 'green';
      case 'caution':
      case 'attention':
        return 'yellow';
      case 'poor':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'excellent':
        return FaThumbsUp;
      case 'caution':
      case 'attention':
        return FaExclamationCircle;
      case 'poor':
        return FaThumbsDown;
      default:
        return FaUser;
    }
  };

  if (athletesLoading) {
    return (
      <Box py={8} px={{ base: 2, md: 8 }} bg={pageBg} minH="100vh">
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color={textPrimary}>Athlete Analytics</Heading>
            <Spinner />
          </Flex>
          <Skeleton height="100px" />
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} height="200px" />
            ))}
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  if (athletes.length === 0) {
    return (
      <Box py={8} px={{ base: 2, md: 8 }} bg={pageBg} minH="100vh">
        <VStack spacing={6} align="stretch">
          <Heading size="lg" color={textPrimary}>Athlete Analytics</Heading>
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FaUsers} boxSize={12} color="gray.400" />
                <Text fontSize="lg" fontWeight="medium" color={textPrimary}>No Athletes Yet</Text>
                <Text color="gray.500" textAlign="center">
                  Once you have athletes assigned to your team, their analytics will appear here.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    );
  }

  return (
    <Box py={8} px={{ base: 2, md: 8 }} bg={pageBg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Heading size="lg" color={textPrimary}>Athlete Analytics</Heading>

        {/* Athlete Selector */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'center' }}>
              {/* Athlete Dropdown */}
              <VStack align="start" spacing={2} flex={1}>
                <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                  Select Athlete
                </Text>
                <Select
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  placeholder="Choose an athlete..."
                  size="lg"
                >
                  {filteredAthletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.first_name} {athlete.last_name}
                    </option>
                  ))}
                </Select>
              </VStack>

              {/* Search Bar */}
              <VStack align="start" spacing={2} flex={1}>
                <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                  Search Athletes
                </Text>
                <InputGroup size="lg">
                  <InputLeftElement>
                    <Icon as={FaSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Filter athletes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </VStack>

              {/* Date Range */}
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                  Date Range
                </Text>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  size="lg"
                  w="150px"
                >
                  <option value="week">1 Week</option>
                  <option value="month">1 Month</option>
                  <option value="quarter">3 Months</option>
                </Select>
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {selectedAthlete && (
          <>
            {/* Athlete Profile Header */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Flex align="center" gap={6}>
                  <Avatar
                    size="xl"
                    src={selectedAthlete.avatar_url}
                    name={`${selectedAthlete.first_name} ${selectedAthlete.last_name}`}
                  />
                  <VStack align="start" spacing={1}>
                    <Heading size="lg" color={textPrimary}>
                      {selectedAthlete.first_name} {selectedAthlete.last_name}
                    </Heading>
                    <HStack spacing={4}>
                      <Text color="gray.500">Age: {selectedAthlete.age || 'N/A'}</Text>
                      <Text color="gray.500">Gender: {selectedAthlete.gender || 'N/A'}</Text>
                    </HStack>
                    <HStack spacing={2} mt={2}>
                      {selectedAthlete.events?.map((event, idx) => (
                        <Badge key={idx} colorScheme="blue">
                          {event}
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                </Flex>
              </CardBody>
            </Card>

            {dataLoading ? (
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} height="200px" />
                ))}
              </SimpleGrid>
            ) : analytics ? (
              <>
                {/* Status Overview Cards */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody p={2} textAlign="center" display="flex" flexDirection="column" justifyContent="space-between" minH="120px">
                      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                        <Icon 
                          as={getStatusIcon(analytics.sleep.status)} 
                          color={`${getStatusColor(analytics.sleep.status)}.500`} 
                          boxSize={8}
                        />
                      </Box>
                      <Text fontSize="sm" fontWeight="bold" color={textPrimary}>Sleep Quality</Text>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody p={2} textAlign="center" display="flex" flexDirection="column" justifyContent="space-between" minH="120px">
                      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                        <Icon 
                          as={getStatusIcon(analytics.wellness.status)} 
                          color={`${getStatusColor(analytics.wellness.status)}.500`} 
                          boxSize={8}
                        />
                      </Box>
                      <Text fontSize="sm" fontWeight="bold" color={textPrimary}>Wellness</Text>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody p={2} textAlign="center" display="flex" flexDirection="column" justifyContent="space-between" minH="120px">
                      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                        <Icon 
                          as={getStatusIcon(analytics.performance.status)} 
                          color={`${getStatusColor(analytics.performance.status)}.500`} 
                          boxSize={8}
                        />
                      </Box>
                      <Text fontSize="sm" fontWeight="bold" color={textPrimary}>Performance</Text>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody p={2} textAlign="center" display="flex" flexDirection="column" justifyContent="space-between" minH="120px">
                      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                        <Box position="relative" display="inline-block">
                          <Box 
                            position="relative" 
                            overflow="hidden" 
                            height="50px" 
                            width="100px"
                          >
                            <CircularProgress 
                              value={analytics.training.adherence * 2} 
                              color={getStatusColor(analytics.training.status) + '.500'}
                              size="100px"
                              thickness="12px"
                              trackColor="gray.200"
                              sx={{
                                transform: 'rotate(-90deg)',
                                '> svg > circle:last-child': {
                                  strokeDasharray: `${(analytics.training.adherence / 100) * Math.PI * 88}, ${Math.PI * 88}`
                                }
                              }}
                            />
                          </Box>
                          <Text 
                            position="absolute" 
                            bottom="-8px" 
                            left="50%" 
                            transform="translateX(-50%)"
                            fontSize="sm" 
                            fontWeight="bold"
                            color={textPrimary}
                          >
                            {analytics.training.adherence}%
                          </Text>
                        </Box>
                      </Box>
                      <Text fontSize="sm" fontWeight="bold" color={textPrimary}>Training Adherence</Text>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Detailed Analytics Grid */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {/* Sleep Analytics */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack>
                        <Icon as={FaBed} color="blue.500" />
                        <Heading size="md">Sleep Analytics</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <SimpleGrid columns={3} spacing={4}>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Avg Duration</StatLabel>
                            <StatNumber fontSize="lg">{analytics.sleep.avgDuration.toFixed(1)}h</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Avg Quality</StatLabel>
                            <StatNumber fontSize="lg">{analytics.sleep.avgQuality.toFixed(1)}/4</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Compliance</StatLabel>
                            <StatNumber fontSize="lg">{analytics.sleep.compliance}%</StatNumber>
                          </Stat>
                        </SimpleGrid>

                        {/* Visual Sleep Chart */}
                        <Box>
                          <Text fontWeight="bold" mb={3}>Sleep Pattern (Last 7 Days)</Text>
                          <Box bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" p={4} position="relative">
                            {/* Time labels on the right */}
                            <Box position="absolute" right={2} top={4} bottom={4}>
                              <VStack justify="space-between" h="full" spacing={0}>
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>2am</Text>
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>4am</Text>
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>6am</Text>
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>8am</Text>
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>10am</Text>
                              </VStack>
                            </Box>

                            {/* Chart area */}
                            <HStack spacing={2} align="end" justify="space-between" h="120px" pr={8}>
                              {analytics.sleep.chartData.map((day, index) => (
                                <VStack key={index} spacing={1} align="center" flex={1}>
                                  {/* Sleep bar */}
                                  <Box 
                                    position="relative" 
                                    h="80px" 
                                    w="12px" 
                                    bg="gray.200" 
                                    borderRadius="full"
                                    overflow="hidden"
                                  >
                                    {day.hasData && (
                                      <>
                                        {/* Sleep duration bar */}
                                        <Box
                                          position="absolute"
                                          bottom={`${Math.max(0, (day.sleepStart + 12) / 16 * 100)}%`}
                                          h={`${Math.min(80, Math.max(10, (day.duration / 12) * 80))}%`}
                                          w="full"
                                          bg="#6366F1"
                                          borderRadius="full"
                                        />
                                        {/* Bedtime indicator (small circle) */}
                                        <Box
                                          position="absolute"
                                          bottom={`${(day.sleepStart + 12) / 16 * 100}%`}
                                          left="50%"
                                          transform="translateX(-50%)"
                                          w="6px"
                                          h="6px"
                                          bg="#6366F1"
                                          borderRadius="full"
                                          border="2px solid white"
                                        />
                                      </>
                                    )}
                                  </Box>
                                  {/* Day label */}
                                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')} fontWeight="medium">
                                    {day.day}
                                  </Text>
                                </VStack>
                              ))}
                            </HStack>
                          </Box>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Wellness Analytics */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack>
                        <Icon as={FaHeartbeat} color="red.500" />
                        <Heading size="md">Wellness Analytics</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <SimpleGrid columns={3} spacing={4}>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Overall</StatLabel>
                            <StatNumber fontSize="lg">{analytics.wellness.avgScore.toFixed(1)}/10</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Stress</StatLabel>
                            <StatNumber fontSize="lg">{analytics.wellness.avgStress.toFixed(1)}/10</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Fatigue</StatLabel>
                            <StatNumber fontSize="lg">{analytics.wellness.avgFatigue.toFixed(1)}/10</StatNumber>
                          </Stat>
                        </SimpleGrid>

                        {/* Visual Wellness Chart */}
                        <Box>
                          <Text fontWeight="bold" mb={3}>Wellness Trends (Last 7 Days)</Text>
                          <Box bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" p={4}>
                            {/* Legend */}
                            <HStack spacing={4} mb={4} fontSize="xs" justify="center">
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#10B981" borderRadius="sm" />
                                <Text color={useColorModeValue('gray.600', 'gray.300')}>Motivation</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#3B82F6" borderRadius="sm" />
                                <Text color={useColorModeValue('gray.600', 'gray.300')}>Overall</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#F59E0B" borderRadius="sm" />
                                <Text color={useColorModeValue('gray.600', 'gray.300')}>Stress</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#EF4444" borderRadius="sm" />
                                <Text color={useColorModeValue('gray.600', 'gray.300')}>Fatigue</Text>
                              </HStack>
                            </HStack>

                            {/* Chart area */}
                            <HStack spacing={2} align="end" justify="space-between" h="120px">
                              {analytics.wellness.chartData.map((day, index) => (
                                <VStack key={index} spacing={1} align="center" flex={1}>
                                  {/* Stacked wellness bars */}
                                  <Box 
                                    position="relative" 
                                    h="80px" 
                                    w="20px" 
                                    bg="gray.200" 
                                    borderRadius="sm"
                                    overflow="hidden"
                                  >
                                    {day.hasData && (
                                      <VStack spacing={0} h="full" justify="end">
                                        {/* Fatigue (bottom) - inverted scale (higher is worse) */}
                                        <Box
                                          w="full"
                                          h={`${(day.fatigue / 10) * 20}%`}
                                          bg="#EF4444"
                                        />
                                        {/* Stress */}
                                        <Box
                                          w="full"
                                          h={`${(day.stress / 10) * 20}%`}
                                          bg="#F59E0B"
                                        />
                                        {/* Overall feeling */}
                                        <Box
                                          w="full"
                                          h={`${(day.overall / 10) * 30}%`}
                                          bg="#3B82F6"
                                        />
                                        {/* Motivation (top) */}
                                        <Box
                                          w="full"
                                          h={`${(day.motivation / 10) * 30}%`}
                                          bg="#10B981"
                                        />
                                      </VStack>
                                    )}
                                  </Box>
                                  {/* Day label */}
                                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')} fontWeight="medium">
                                    {day.day}
                                  </Text>
                                </VStack>
                              ))}
                            </HStack>

                            {/* Scale indicator */}
                            <Flex justify="space-between" mt={2} fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              <Text>Poor</Text>
                              <Text>Excellent</Text>
                            </Flex>
                          </Box>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>




                </SimpleGrid>

                {/* Training Log and Run Times - Stacked Vertically */}
                <VStack spacing={6} align="stretch">
                  {/* Training Log */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack>
                        <Icon as={FaRunning} color="green.500" />
                        <Heading size="md">Training Log</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <SimpleGrid columns={3} spacing={4}>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Sessions</StatLabel>
                            <StatNumber fontSize="lg">{analytics.performance.sessionsCompleted}</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Run Times</StatLabel>
                            <StatNumber fontSize="lg">{analytics.performance.runningTimes}</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Last Activity</StatLabel>
                            <StatNumber fontSize="sm">{analytics.performance.lastActivity}</StatNumber>
                          </Stat>
                        </SimpleGrid>

                        {analytics.performance.records.length > 0 && (
                          <Box>
                            <Text fontWeight="bold" mb={3}>Recent Training Sessions</Text>
                            <Table size="sm">
                              <Thead>
                                <Tr>
                                  <Th>Date</Th>
                                  <Th>Exercise</Th>
                                  <Th>Time</Th>
                                  <Th>RPE</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {analytics.performance.records.slice(0, 5).map((record) => {
                                  const time = record.time_minutes || record.time_seconds || record.time_hundredths ? 
                                    `${record.time_minutes || 0}:${(record.time_seconds || 0).toString().padStart(2, '0')}.${(record.time_hundredths || 0).toString().padStart(2, '0')}` 
                                    : 'N/A';
                                  
                                  return (
                                    <Tr key={record.id}>
                                      <Td>{new Date(record.created_at).toLocaleDateString()}</Td>
                                      <Td fontSize="xs">{record.exercise_name}</Td>
                                      <Td>{time}</Td>
                                      <Td>
                                        {record.rpe_rating ? (
                                          <Badge colorScheme={record.rpe_rating <= 6 ? 'green' : record.rpe_rating <= 8 ? 'yellow' : 'red'}>
                                            {record.rpe_rating}/10
                                          </Badge>
                                        ) : 'N/A'}
                                      </Td>
                                    </Tr>
                                  );
                                })}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Run Times */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack>
                        <Icon as={FaClock} color="orange.500" />
                        <Heading size="md">Run Times</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <SimpleGrid columns={3} spacing={4}>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Total Runs</StatLabel>
                            <StatNumber fontSize="lg">{analytics.runTimes.totalRunTimes}</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Run Types</StatLabel>
                            <StatNumber fontSize="lg">{analytics.runTimes.exerciseStats.length}</StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel fontSize="xs">Recent</StatLabel>
                            <StatNumber fontSize="sm">
                              {analytics.runTimes.recentRuns.length > 0 ? (
                                analytics.runTimes.recentRuns[0].has_time_data ? 
                                  `${analytics.runTimes.recentRuns[0].time_minutes || 0}:${(analytics.runTimes.recentRuns[0].time_seconds || 0).toString().padStart(2, '0')}.${(analytics.runTimes.recentRuns[0].time_hundredths || 0).toString().padStart(2, '0')}` :
                                  'Not logged'
                              ) : 'N/A'}
                            </StatNumber>
                          </Stat>
                        </SimpleGrid>

                        <Box>
                          <Text fontWeight="bold" mb={3}>Recent Run Times</Text>
                          {analytics.runTimes.recentRuns.length > 0 ? (
                            <Table size="sm">
                              <Thead>
                                <Tr>
                                  <Th>Date</Th>
                                  <Th>Exercise</Th>
                                  <Th>From Workout</Th>
                                  <Th>Time</Th>
                                  <Th>RPE</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {analytics.runTimes.recentRuns.slice(0, 10).map((run) => (
                                  <Tr key={run.id}>
                                    <Td fontSize="xs">
                                      {new Date(run.created_at).toLocaleDateString()}
                                    </Td>
                                    <Td fontSize="xs" fontWeight="medium">
                                      {run.exercise_name}
                                    </Td>
                                    <Td fontSize="xs" color="blue.500" maxW="150px" isTruncated>
                                      {run.workout?.name || (run.workout_id ? `ID: ${run.workout_id.slice(0, 8)}` : 'Unknown')}
                                    </Td>
                                    <Td fontSize="sm" fontWeight="bold">
                                      {run.has_time_data ? (
                                        <Text color="green.500">
                                          {`${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`}
                                        </Text>
                                      ) : (
                                        <Text color="gray.400" fontStyle="italic">
                                          Not logged
                                        </Text>
                                      )}
                                    </Td>
                                    <Td>
                                      {run.rpe_rating ? (
                                        <Badge 
                                          size="sm" 
                                          colorScheme={run.rpe_rating <= 6 ? 'green' : run.rpe_rating <= 8 ? 'yellow' : 'red'}
                                        >
                                          {run.rpe_rating}
                                        </Badge>
                                      ) : (
                                        <Text fontSize="xs" color="gray.400">N/A</Text>
                                      )}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          ) : (
                            <VStack spacing={2} py={6}>
                              <Text color="gray.500" textAlign="center">
                                No running exercises found.
                              </Text>
                              <Text color="gray.400" fontSize="xs" textAlign="center">
                                Complete workouts with running exercises to see them here.
                              </Text>
                            </VStack>
                          )}
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </>
            ) : (
              <Card bg={cardBg}>
                <CardBody>
                  <Text textAlign="center" color="gray.500" py={8}>
                    No data available for the selected period.
                  </Text>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
} 