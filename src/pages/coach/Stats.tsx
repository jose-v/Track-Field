import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ButtonGroup,
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
  FaChartBar,
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
import { usePageHeader } from '../../hooks/usePageHeader';
import PageHeader from '../../components/PageHeader';

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
  const [searchParams] = useSearchParams();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [sleepViewMode, setSleepViewMode] = useState<'week' | 'month'>('week');
  const [wellnessViewMode, setWellnessViewMode] = useState<'week' | 'month'>('week');

  // Use page header hook for mobile nav
  usePageHeader({
    title: 'Athlete Analytics',
    subtitle: 'Performance and wellness insights',
    icon: FaChartBar
  });

  // Fetch coach's athletes
  const { data: athletes = [], isLoading: athletesLoading } = useCoachAthletes({
    includeStatuses: ['approved']
  });

  // Auto-select athlete from URL parameter or first athlete when athletes load
  useEffect(() => {
    if (athletes.length > 0) {
      const athleteFromUrl = searchParams.get('athlete');
      if (athleteFromUrl && athletes.some(a => a.id === athleteFromUrl)) {
        // If athlete ID from URL is valid, select it
        setSelectedAthleteId(athleteFromUrl);
      } else if (!selectedAthleteId) {
        // Otherwise, select first athlete
        setSelectedAthleteId(athletes[0].id);
      }
    }
  }, [athletes, selectedAthleteId, searchParams]);

  // Helper function to get date range text
  const getDateRangeText = () => {
    switch(dateRange) {
      case 'week': return '7 days';
      case 'month': return '30 days';
      case 'quarter': return '3 months';
      default: return '30 days';
    }
  };

  // Helper function for MM/DD/YY date format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

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
      
      // Get training load entries (RPE data) for this athlete and date range
      const { data: trainingLoadData } = await supabase
        .from('training_load_entries')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('date', startDate.split('T')[0])
        .order('date', { ascending: false });

      console.log('Training load data for athlete:', selectedAthleteId, trainingLoadData);

      // Create a map of workout_id to RPE for quick lookup
      const workoutRPEMap = new Map();
      trainingLoadData?.forEach((entry: any) => {
        workoutRPEMap.set(entry.workout_id, entry.rpe);
      });
      
      // Transform exercise results to the format expected by the analytics
      // Include ALL exercises (both running and non-running)
      const filteredExerciseResults = exerciseResultsData || [];
      
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
          rpe_rating: workoutRPEMap.get(result.workout_id) || null, // Get RPE from training_load_entries
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
      const days = sleepViewMode === 'week' ? 7 : 30;
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
            day: sleepViewMode === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.getDate().toString(),
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
          day: sleepViewMode === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.getDate().toString(),
            hasData: true,
            sleepStart,
            sleepEnd,
            duration: sleepEnd - sleepStart,
            record
          };
        });
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
      const days = wellnessViewMode === 'week' ? 7 : 30;
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
            day: wellnessViewMode === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.getDate().toString(),
            hasData: false,
            fatigue: 0,
            stress: 0,
            motivation: 0,
            overall: 0,
            soreness: 0
          };
        }

        return {
          day: wellnessViewMode === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.getDate().toString(),
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
    const runningExercises = performanceRecords.filter(p => {
      const exerciseName = p.exercise_name?.toLowerCase() || '';
      const isRunningExercise = exerciseName.includes('run') ||
                               exerciseName.includes('sprint') ||
                               exerciseName.includes('dash') ||
                               exerciseName.includes('meter') ||
                               exerciseName.includes('mile') ||
                               exerciseName.includes('jog');
      return isRunningExercise && (p.time_minutes !== null || p.time_seconds !== null || p.time_hundredths !== null);
    });

    // Run times analytics (all running exercises, with or without logged times)
    const runTimesData = (() => {
      // Get ONLY running exercises (with or without logged time data)
      const runResults = performanceRecords.filter(p => {
        const exerciseName = p.exercise_name?.toLowerCase() || '';
        const isRunningExercise = exerciseName.includes('run') ||
                                 exerciseName.includes('sprint') ||
                                 exerciseName.includes('dash') ||
                                 exerciseName.includes('meter') ||
                                 exerciseName.includes('mile') ||
                                 exerciseName.includes('jog');
        return isRunningExercise;
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
  }, [athleteData, dateRange, sleepViewMode, wellnessViewMode]);

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
      <Box bg={pageBg} minH="100vh">
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
      <Box bg={pageBg} minH="100vh">
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
    <Box bg={pageBg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Desktop Header */}
        <Box display={{ base: "none", md: "block" }}>
          <PageHeader
            title="Athlete Analytics"
            subtitle="Performance and wellness insights"
            icon={FaChartBar}
          />
        </Box>

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
                {/* Mobile Layout */}
                <Box display={{ base: "block", md: "none" }}>
                  <VStack align="start" spacing={4}>
                    <Flex align="center" gap={4} width="100%">
                      <Avatar
                        size="xl"
                        src={selectedAthlete.avatar_url}
                        name={`${selectedAthlete.first_name} ${selectedAthlete.last_name}`}
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <Heading size="lg" color={textPrimary}>
                          {selectedAthlete.first_name} {selectedAthlete.last_name}
                        </Heading>
                        <HStack spacing={4}>
                          <Text color="gray.500">Age: {selectedAthlete.age || 'N/A'}</Text>
                          <Text color="gray.500">Gender: {selectedAthlete.gender || 'N/A'}</Text>
                        </HStack>
                      </VStack>
                    </Flex>
                    {/* Events under avatar, left aligned */}
                    <HStack spacing={2} flexWrap="wrap" align="start">
                      {selectedAthlete.events?.map((event, idx) => (
                        <Badge key={idx} colorScheme="blue">
                          {event}
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                </Box>

                {/* Desktop Layout */}
                <Box display={{ base: "none", md: "block" }}>
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
                </Box>
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
              <Card bg={cardBg} borderColor={borderColor} position="relative">
                <Badge 
                  position="absolute" 
                  top={2} 
                  left={2} 
                  colorScheme="blue" 
                  fontSize="xs" 
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {dateRange === 'week' ? '7 Days' : dateRange === 'month' ? '30 Days' : '3 Months'}
                </Badge>
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

                                <Card bg={cardBg} borderColor={borderColor} position="relative">
                <Badge 
                  position="absolute" 
                  top={2} 
                  left={2} 
                  colorScheme="blue" 
                  fontSize="xs" 
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {dateRange === 'week' ? '7 Days' : dateRange === 'month' ? '30 Days' : '3 Months'}
                </Badge>
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

              <Card bg={cardBg} borderColor={borderColor} position="relative">
                <Badge 
                  position="absolute" 
                  top={2} 
                  left={2} 
                  colorScheme="blue" 
                  fontSize="xs" 
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {dateRange === 'week' ? '7 Days' : dateRange === 'month' ? '30 Days' : '3 Months'}
                </Badge>
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

              <Card bg={cardBg} borderColor={borderColor} position="relative">
                <Badge 
                  position="absolute" 
                  top={2} 
                  left={2} 
                  colorScheme="blue" 
                  fontSize="xs" 
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {dateRange === 'week' ? '7 Days' : dateRange === 'month' ? '30 Days' : '3 Months'}
                </Badge>
                    <CardBody p={2} textAlign="center" display="flex" flexDirection="column" justifyContent="space-between" minH="120px">
                      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                        <Box position="relative" display="inline-block">
                          {/* Half-circle progress chart */}
                          <svg width="100" height="60" viewBox="0 0 100 60">
                            {/* Background semicircle */}
                            <path
                              d="M 10 50 A 40 40 0 0 1 90 50"
                              fill="none"
                              stroke={useColorModeValue('#E5E7EB', '#374151')}
                              strokeWidth="12"
                              strokeLinecap="round"
                            />
                            {/* Progress semicircle */}
                            <path
                              d="M 10 50 A 40 40 0 0 1 90 50"
                              fill="none"
                              stroke={getStatusColor(analytics.training.status) === 'green' ? '#10B981' : 
                                     getStatusColor(analytics.training.status) === 'yellow' ? '#F59E0B' : '#EF4444'}
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${(analytics.training.adherence / 100) * 125.66} 125.66`}
                              style={{
                                transition: 'stroke-dasharray 0.5s ease-in-out'
                              }}
                            />
                          </svg>
                          <Text 
                            position="absolute" 
                            bottom="0px" 
                            left="50%" 
                            transform="translateX(-50%)"
                            fontSize="lg" 
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
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  {/* Sleep Analytics */}
                  <Card bg={cardBg} borderColor={borderColor} h="550px" display="flex" flexDirection="column">
                    <CardHeader>
                      <HStack justify="space-between">
                      <HStack>
                        <Heading size="md">Sleep Analytics</Heading>
                        </HStack>
                        <ButtonGroup isAttached size="sm">
                          <Button 
                            colorScheme={sleepViewMode === 'week' ? 'blue' : 'gray'}
                            onClick={() => setSleepViewMode('week')}
                          >
                            Week
                          </Button>
                          <Button 
                            colorScheme={sleepViewMode === 'month' ? 'blue' : 'gray'}
                            onClick={() => setSleepViewMode('month')}
                          >
                            Month
                          </Button>
                        </ButtonGroup>
                      </HStack>
                    </CardHeader>
                    <CardBody flex="1" px={{ base: 0, md: 2 }}>
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
                          <Text fontWeight="bold" mb={3}>Sleep Duration (Last {sleepViewMode === 'week' ? '7 Days' : '30 Days'})</Text>
                          <Box bg={{ base: 'transparent', md: useColorModeValue('gray.50', 'transparent') }} borderRadius="lg" px={1} py={10} position="relative">
                            {/* Goal line at 7 hours */}
                            <Box
                              position="absolute"
                              top={`${30}%`}
                              left={4}
                              right={4}
                              h="1px"
                              bg="#06B6D4"
                              opacity={0.4}
                            />

                            {/* Chart area */}
                            {sleepViewMode === 'week' ? (
                              /* Weekly Bar Chart */
                              <HStack spacing={2} align="end" justify="space-between" h="190px">
                              {analytics.sleep.chartData.map((day, index) => (
                                  <VStack key={index} spacing={2} align="center" flex={1}>
                                    {/* Duration text above bar */}
                                    <Box h="56px" display="flex" alignItems="center">
                                      {day.hasData && (
                                        <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} fontWeight="medium">
                                          {day.duration.toFixed(1)}h
                                        </Text>
                                      )}
                                    </Box>
                                    {/* Sleep duration bar */}
                                  <Box 
                                    position="relative" 
                                      h="130px" 
                                      w="16px"
                                    bg="gray.200" 
                                      borderRadius="sm"
                                    overflow="hidden"
                                  >
                                    {day.hasData && (
                                        <Box
                                          position="absolute"
                                          bottom="0%"
                                          h={`${Math.min(100, Math.max(5, (day.duration / 10) * 100))}%`}
                                          w="full"
                                          bg={day.duration >= 7 ? "#10B981" : day.duration >= 6 ? "#F59E0B" : "#EF4444"}
                                          borderRadius="sm"
                                        />
                                    )}
                                  </Box>
                                  {/* Day label */}
                                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')} fontWeight="medium">
                                    {day.day}
                                  </Text>
                                </VStack>
                                ))}
                              </HStack>
                            ) : (
                              /* Monthly Wave Chart */
                              <Box h="190px" position="relative" pt={2}>
                                {/* SVG Wave Chart */}
                                <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                                  {/* Gradient definitions */}
                                  <defs>
                                    <linearGradient id="sleepGradientCoach" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
                                      <stop offset="50%" stopColor="#0891B2" stopOpacity="0.6" />
                                      <stop offset="100%" stopColor="#0E7490" stopOpacity="0.2" />
                                    </linearGradient>
                                  </defs>
                                  
                                  {/* Horizontal grid lines */}
                                  {[0, 25, 50, 75, 100].map((percentage) => (
                                    <line
                                      key={`h-${percentage}`}
                                      x1="0"
                                      y1={160 - (percentage * 1.6)}
                                      x2="400"
                                      y2={160 - (percentage * 1.6)}
                                      stroke={useColorModeValue('#F3F4F6', '#374151')}
                                      strokeWidth="1"
                                      opacity={0.1}
                                    />
                                  ))}
                                  
                                  {/* Vertical grid lines for each day with data */}
                                  {analytics.sleep.chartData.map((day, index) => {
                                    if (!day.hasData) return null;
                                    const x = (index / (analytics.sleep.chartData.length - 1)) * 400;
                                    return (
                                      <line
                                        key={`v-${index}`}
                                        x1={x}
                                        y1="0"
                                        x2={x}
                                        y2="160"
                                        stroke={useColorModeValue('#F3F4F6', '#374151')}
                                        strokeWidth="1"
                                        opacity={0.15}
                                      />
                                    );
                                  })}
                                  
                                  {/* Area fill */}
                                  <path
                                    d={(() => {
                                      const points = analytics.sleep.chartData.map((day, index) => {
                                        const x = (index / (analytics.sleep.chartData.length - 1)) * 400;
                                        const y = day.hasData ? 
                                          160 - Math.min(160, Math.max(8, (day.duration / 10) * 160)) : 
                                          160 - 80; // Default middle position for no data
                                        return { x, y };
                                      });
                                      
                                      if (points.length < 2) return `M 0,160 L 0,80 L 400,80 L 400,160 Z`;
                                      
                                      // Create smooth curve using quadratic bezier curves
                                      let path = `M ${points[0].x},160 L ${points[0].x},${points[0].y}`;
                                      
                                      for (let i = 1; i < points.length; i++) {
                                        const current = points[i];
                                        const previous = points[i - 1];
                                        
                                        if (i === 1) {
                                          // First curve
                                          const controlX = previous.x + (current.x - previous.x) * 0.5;
                                          const controlY = previous.y;
                                          path += ` Q ${controlX},${controlY} ${current.x},${current.y}`;
                                        } else {
                                          // Subsequent curves
                                          const prev2 = points[i - 2];
                                          const controlX = previous.x + (current.x - prev2.x) * 0.25;
                                          const controlY = previous.y;
                                          path += ` Q ${controlX},${controlY} ${current.x},${current.y}`;
                                        }
                                      }
                                      
                                      // Close the path at the bottom
                                      path += ` L ${points[points.length - 1].x},160 Z`;
                                      
                                      return path;
                                    })()}
                                    fill="url(#sleepGradientCoach)"
                                    stroke="none"
                                  />
                                  
                                  {/* Wave line */}
                                  <path
                                    d={(() => {
                                      const points = analytics.sleep.chartData.map((day, index) => {
                                        const x = (index / (analytics.sleep.chartData.length - 1)) * 400;
                                        const y = day.hasData ? 
                                          160 - Math.min(160, Math.max(8, (day.duration / 10) * 160)) : 
                                          160 - 80; // Default middle position for no data
                                        return { x, y };
                                      });
                                      
                                      if (points.length < 2) return `M 0,80`;
                                      
                                      // Create smooth curve using quadratic bezier curves
                                      let path = `M ${points[0].x},${points[0].y}`;
                                      
                                      for (let i = 1; i < points.length; i++) {
                                        const current = points[i];
                                        const previous = points[i - 1];
                                        
                                        if (i === 1) {
                                          // First curve
                                          const controlX = previous.x + (current.x - previous.x) * 0.5;
                                          const controlY = previous.y;
                                          path += ` Q ${controlX},${controlY} ${current.x},${current.y}`;
                                        } else {
                                          // Subsequent curves
                                          const prev2 = points[i - 2];
                                          const controlX = previous.x + (current.x - prev2.x) * 0.25;
                                          const controlY = previous.y;
                                          path += ` Q ${controlX},${controlY} ${current.x},${current.y}`;
                                        }
                                      }
                                      
                                      return path;
                                    })()}
                                    fill="none"
                                    stroke="#06B6D4"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  
                                  {/* Data points */}
                                  {analytics.sleep.chartData.map((day, index) => {
                                    if (!day.hasData) return null;
                                    const x = (index / (analytics.sleep.chartData.length - 1)) * 400;
                                    const y = 160 - Math.min(160, Math.max(8, (day.duration / 10) * 160));
                                    
                                    return (
                                      <circle
                                        key={index}
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill="#06B6D4"
                                        fillOpacity="0.8"
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    );
                                  })}
                                </svg>
                                
                                {/* X-axis labels */}
                                <HStack justify="space-between" mt={2} px={2}>
                                  {analytics.sleep.chartData.filter((_, index) => index % 5 === 0).map((day, index) => (
                                    <Text key={index} fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                      {day.day}
                                    </Text>
                              ))}
                            </HStack>
                              </Box>
                            )}

                            {/* Color legend - moved to bottom */}
                            <HStack spacing={6} mt="20px" justify="flex-start">
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#10B981" borderRadius="sm" />
                                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>7+ Hrs</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#F59E0B" borderRadius="sm" />
                                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>6-7 Hrs</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Box w="3" h="3" bg="#EF4444" borderRadius="sm" />
                                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Under 6 Hrs</Text>
                              </HStack>
                            </HStack>
                          </Box>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Wellness Analytics */}
                  <Card bg={cardBg} borderColor={borderColor} h="550px" display="flex" flexDirection="column">
                    <CardHeader>
                      <HStack justify="space-between">
                      <HStack>
                        <Heading size="md">Wellness Analytics</Heading>
                        </HStack>
                        <ButtonGroup isAttached size="sm">
                          <Button 
                            colorScheme={wellnessViewMode === 'week' ? 'blue' : 'gray'}
                            onClick={() => setWellnessViewMode('week')}
                          >
                            Week
                          </Button>
                          <Button 
                            colorScheme={wellnessViewMode === 'month' ? 'blue' : 'gray'}
                            onClick={() => setWellnessViewMode('month')}
                          >
                            Month
                          </Button>
                        </ButtonGroup>
                      </HStack>
                    </CardHeader>
                    <CardBody flex="1" px={{ base: 1, md: 6 }}>
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
                          <Text fontWeight="bold" mb={0}>Wellness Trends (Last {wellnessViewMode === 'week' ? '7 Days' : '30 Days'})</Text>
                          <Box bg={{ base: 'transparent', md: useColorModeValue('gray.50', 'transparent') }} borderRadius="lg" px={1} py={10}>
                            {/* Chart area */}
                            {wellnessViewMode === 'week' ? (
                              /* Weekly Stacked Bar Chart */
                              <HStack spacing={2} align="end" justify="space-between" h="190px">
                              {analytics.wellness.chartData.map((day, index) => (
                                <VStack key={index} spacing={1} align="center" flex={1}>
                                  {/* Stacked wellness bars */}
                                  <Box 
                                    position="relative" 
                                      h="150px" 
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
                            ) : (
                              /* Monthly Multi-Wave Chart */
                              <Box h="190px" position="relative" pt={2}>
                                <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                  {/* Grid lines */}
                                  {[0, 25, 50, 75, 100].map((percentage) => (
                                    <line
                                      key={percentage}
                                      x1="0"
                                      y1={160 - (percentage * 1.6)}
                                      x2="400"
                                      y2={160 - (percentage * 1.6)}
                                      stroke={useColorModeValue('#F3F4F6', '#374151')}
                                      strokeWidth="1"
                                      opacity={0.3}
                                    />
                                  ))}
                                  
                                  {/* Motivation wave (top priority) */}
                                  <path
                                    d={(() => {
                                      const points = analytics.wellness.chartData.map((day, index) => {
                                        const x = (index / (analytics.wellness.chartData.length - 1)) * 400;
                                        const y = day.hasData ? 
                                          160 - Math.min(160, Math.max(8, (day.motivation / 10) * 160)) : 
                                          160 - 80;
                                        return `${x},${y}`;
                                      });
                                      return `M ${points.join(' L ')}`;
                                    })()}
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  
                                  {/* Overall feeling wave */}
                                  <path
                                    d={(() => {
                                      const points = analytics.wellness.chartData.map((day, index) => {
                                        const x = (index / (analytics.wellness.chartData.length - 1)) * 400;
                                        const y = day.hasData ? 
                                          160 - Math.min(160, Math.max(8, (day.overall / 10) * 160)) : 
                                          160 - 80;
                                        return `${x},${y}`;
                                      });
                                      return `M ${points.join(' L ')}`;
                                    })()}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={0.9}
                                  />
                                  
                                  {/* Stress wave (inverted - lower is better) */}
                                  <path
                                    d={(() => {
                                      const points = analytics.wellness.chartData.map((day, index) => {
                                        const x = (index / (analytics.wellness.chartData.length - 1)) * 400;
                                        const y = day.hasData ? 
                                          160 - Math.min(160, Math.max(8, ((10 - day.stress) / 10) * 160)) : 
                                          160 - 80;
                                        return `${x},${y}`;
                                      });
                                      return `M ${points.join(' L ')}`;
                                    })()}
                                    fill="none"
                                    stroke="#F59E0B"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={0.8}
                                    strokeDasharray="4 2"
                                  />
                                </svg>
                                
                                {/* X-axis labels */}
                                <HStack justify="space-between" mt={2} px={2}>
                                  {analytics.wellness.chartData.filter((_, index) => index % 5 === 0).map((day, index) => (
                                    <Text key={index} fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                      {day.day}
                                    </Text>
                                  ))}
                                </HStack>
                              </Box>
                            )}

                            {/* Legend - moved to bottom */}
                            {wellnessViewMode === 'week' ? (
                              <HStack spacing={6} mt="20px" fontSize="xs" justify="flex-start">
                                <HStack spacing={1}>
                                  <Box w="3" h="3" bg="#10B981" borderRadius="sm" />
                                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Motivation</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Box w="3" h="3" bg="#3B82F6" borderRadius="sm" />
                                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Overall</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Box w="3" h="3" bg="#F59E0B" borderRadius="sm" />
                                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Stress</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Box w="3" h="3" bg="#EF4444" borderRadius="sm" />
                                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Fatigue</Text>
                                </HStack>
                              </HStack>
                            ) : (
                              <HStack spacing={6} mt="20px" fontSize="xs" justify="flex-start">
                                <HStack spacing={1}>
                                  <Box w="3" h="2" bg="#10B981" borderRadius="sm" />
                                  <Text color={useColorModeValue('gray.600', 'gray.300')}>Motivation</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Box w="3" h="2" bg="#3B82F6" borderRadius="sm" />
                                  <Text color={useColorModeValue('gray.600', 'gray.300')}>Overall Feeling</Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Box w="3" h="1" bg="#F59E0B" borderRadius="sm" style={{borderStyle: 'dashed', borderWidth: '1px'}} />
                                  <Text color={useColorModeValue('gray.600', 'gray.300')}>Low Stress (Good)</Text>
                                </HStack>
                              </HStack>
                            )}

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
                        <Heading size="md">Training Log</Heading>
                        <Badge colorScheme="purple" ml={2}>Non-Running</Badge>
                      </HStack>
                    </CardHeader>
                                      <CardBody px={{ base: 0, md: 6 }} py={{ base: 4, md: 6 }}>
                    <VStack spacing={4} align="stretch">
                      {(() => {
                          // Filter out running exercises to focus on strength, plyometric, drills, flexibility
                          const nonRunningExercises = analytics.performance.records.filter(record => {
                            const exerciseName = record.exercise_name?.toLowerCase() || '';
                            const isRunning = exerciseName.includes('run') || 
                                            exerciseName.includes('sprint') || 
                                            exerciseName.includes('jog') ||
                                            exerciseName.includes('dash') ||
                                            exerciseName.includes('meter') ||
                                            exerciseName.includes('mile') ||
                                            exerciseName.includes('400m') ||
                                            exerciseName.includes('800m') ||
                                            exerciseName.includes('1500m') ||
                                            exerciseName.includes('5k') ||
                                            exerciseName.includes('10k');
                            return !isRunning;
                          });



                          const strengthExercises = nonRunningExercises.filter(r => {
                            const name = r.exercise_name?.toLowerCase() || '';
                            return name.includes('squat') || name.includes('press') || name.includes('lift') || 
                                   name.includes('curl') || name.includes('row') || r.weight_used;
                          });

                          const plyometricExercises = nonRunningExercises.filter(r => {
                            const name = r.exercise_name?.toLowerCase() || '';
                            return name.includes('jump') || name.includes('hop') || name.includes('bound') || 
                                   name.includes('plyometric');
                          });

                          return (
                            <>
                              <Box px={{ base: 4, md: 0 }}>
                                <Flex justify="flex-end">
                              <Stat textAlign="right" maxW="200px">
                                <StatLabel fontSize="xs">Last Activity</StatLabel>
                                <StatNumber fontSize="sm">{analytics.performance.lastActivity}</StatNumber>
                              </Stat>
                            </Flex>
                              </Box>

                              {nonRunningExercises.length > 0 ? (
                          <Box>
                            <Text fontWeight="bold" mb={3} px={{ base: 4, md: 0 }}>Recent Training Sessions</Text>
                                  <Box overflowX="auto" maxW="100vw">
                                    <Table size="sm" minW="600px">
                              <Thead>
                                <Tr>
                                  <Th position="sticky" left={0} bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor}>Date</Th>
                                  <Th position="sticky" left="80px" bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor}>Exercise</Th>
                                        <Th>Category</Th>
                                        <Th>Sets x Reps</Th>
                                        <Th>Weight</Th>
                                  <Th>RPE</Th>
                                        <Th>Elapsed</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                      {nonRunningExercises.slice(0, 10).map((record) => {
                                        // Determine category based on exercise name and characteristics
                                        const exerciseName = record.exercise_name?.toLowerCase() || '';
                                        let category = 'General';
                                        
                                        if (record.weight_used || exerciseName.includes('squat') || exerciseName.includes('press') || 
                                            exerciseName.includes('lift') || exerciseName.includes('curl') || exerciseName.includes('row')) {
                                          category = 'Strength';
                                        } else if (exerciseName.includes('jump') || exerciseName.includes('hop') || 
                                                  exerciseName.includes('bound') || exerciseName.includes('plyometric')) {
                                          category = 'Plyometric';
                                        } else if (exerciseName.includes('stretch') || exerciseName.includes('flexibility') || 
                                                  exerciseName.includes('mobility')) {
                                          category = 'Flexibility';
                                        } else if (exerciseName.includes('drill') || exerciseName.includes('ladder') || 
                                                  exerciseName.includes('cone')) {
                                          category = 'Drills';
                                        }

                                        // Get category color
                                        const getCategoryColor = (cat: string) => {
                                          switch (cat) {
                                            case 'Strength': return 'purple';
                                            case 'Plyometric': return 'orange';
                                            case 'Flexibility': return 'green';
                                            case 'Drills': return 'blue';
                                            default: return 'gray';
                                          }
                                        };
                                  
                                  return (
                                    <Tr key={record.id} h="48px">
                                      <Td position="sticky" left={0} bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor} fontSize="sm" fontWeight="medium" h="48px">{formatDate(record.created_at)}</Td>
                                            <Td position="sticky" left="80px" bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor} fontSize="sm" fontWeight="medium" maxW="150px" isTruncated h="48px">
                                              {record.exercise_name}
                                            </Td>
                                            <Td fontSize="sm" fontWeight="medium" h="48px">
                                              <Badge colorScheme={getCategoryColor(category)} size="sm">
                                                {category}
                                              </Badge>
                                            </Td>
                                            <Td fontSize="sm" fontWeight="medium" h="48px">
                                              {record.sets_completed && record.reps_completed ? 
                                                `${record.sets_completed} x ${record.reps_completed}` : 
                                                'N/A'
                                              }
                                            </Td>
                                            <Td fontSize="sm" fontWeight="medium" h="48px">
                                              {record.weight_used ? 
                                                `${record.weight_used} lbs` : 
                                                <Text color="gray.400" fontSize="sm" fontWeight="medium">-</Text>
                                              }
                                            </Td>
                                      <Td fontSize="sm" fontWeight="medium" h="48px">
                                        {record.rpe_rating ? (
                                          <Badge colorScheme={record.rpe_rating <= 6 ? 'green' : record.rpe_rating <= 8 ? 'yellow' : 'red'}>
                                                  {record.rpe_rating}
                                          </Badge>
                                              ) : <Text color="gray.400" fontSize="sm" fontWeight="medium">N/A</Text>}
                                            </Td>
                                            <Td fontSize="sm" fontWeight="medium" maxW="120px" isTruncated h="48px">
                                              {record.notes ? (
                                                <HStack spacing={1}>
                                                  <Text color="gray.600" fontSize="sm" fontWeight="medium">
                                                    {record.notes
                                                      .replace(/Set (\d+), Rep (\d+)/g, 'S$1,R$2')
                                                      .replace(/ - Duration:/g, '')}
                                                  </Text>
                                                  <Icon as={FaClock} color="white" w={3} h={3} />
                                                </HStack>
                                              ) : (
                                                <Text color="gray.400" fontSize="sm" fontWeight="medium">-</Text>
                                              )}
                                      </Td>
                                    </Tr>
                                  );
                                })}
                              </Tbody>
                            </Table>
                          </Box>
                                </Box>
                              ) : (
                                <Box px={{ base: 4, md: 0 }}>
                                  <VStack spacing={2} py={6}>
                                    <Text color="gray.500" textAlign="center">
                                      No non-running exercises found.
                                    </Text>
                                    <Text color="gray.400" fontSize="xs" textAlign="center">
                                      Complete workouts with strength, plyometric, or drill exercises to see them here.
                                    </Text>
                                  </VStack>
                                </Box>
                              )}
                            </>
                          );
                        })()}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Run Times */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack>
                        <Heading size="md">Run Times</Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody px={{ base: 0, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={8} align="stretch">
                        <Box px={{ base: 0, md: 0 }}>
                          <VStack spacing={6} align="flex-end">
                            <Text fontSize="sm" pr="12px" color={useColorModeValue('gray.600', 'yellow.500')} fontWeight="medium">
                              Best Training Times
                            </Text>
                            <HStack spacing={2} divider={<Box w="1px" h="40px" bg={useColorModeValue('gray.200', 'gray.600')} />}>
                              {(() => {
                                // Find best times for different events
                                const runsWithTime = analytics.runTimes.recentRuns.filter(run => run.has_time_data);
                                const eventBestTimes = {};
                                
                                // Group runs by event and find best time for each
                                runsWithTime.forEach(run => {
                                  const exerciseName = run.exercise_name.toLowerCase();
                                  let eventKey = null;
                                  
                                  if (exerciseName.includes('100m') || exerciseName.includes('100 m')) {
                                    eventKey = '100m';
                                  } else if (exerciseName.includes('200m') || exerciseName.includes('200 m')) {
                                    eventKey = '200m';
                                  } else if (exerciseName.includes('400m') || exerciseName.includes('400 m')) {
                                    eventKey = '400m';
                                  } else if (exerciseName.includes('800m') || exerciseName.includes('800 m')) {
                                    eventKey = '800m';
                                  } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m')) {
                                    eventKey = '1500m';
                                  } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5k')) {
                                    eventKey = '5000m';
                                  }
                                  
                                  if (eventKey) {
                                    const totalMs = ((run.time_minutes || 0) * 60 + (run.time_seconds || 0)) * 1000 + (run.time_hundredths || 0) * 10;
                                    if (!eventBestTimes[eventKey] || totalMs < eventBestTimes[eventKey].totalMs) {
                                      eventBestTimes[eventKey] = {
                                        totalMs,
                                        minutes: run.time_minutes || 0,
                                        seconds: run.time_seconds || 0,
                                        hundredths: run.time_hundredths || 0
                                      };
                                    }
                                  }
                                });
                                
                                // Get top 3 events or all available events
                                const availableEvents = Object.keys(eventBestTimes).slice(0, 3);
                                
                                if (availableEvents.length === 0) {
                                  return (
                                    <VStack spacing={1} px={4}>
                                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>No Events</Text>
                                      <Text fontSize="sm" fontWeight="medium">N/A</Text>
                                    </VStack>
                                  );
                                }
                                
                                return availableEvents.map((event, index) => {
                                  const bestTime = eventBestTimes[event];
                                  const timeString = bestTime.minutes > 0 
                                    ? `${bestTime.minutes}:${bestTime.seconds.toString().padStart(2, '0')}.${bestTime.hundredths.toString().padStart(2, '0')}`
                                    : `${bestTime.seconds}.${bestTime.hundredths.toString().padStart(2, '0')}`;
                                  
                                  return (
                                    <VStack key={event} spacing={1} px={4} minW="60px">
                                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} textAlign="center">
                                        {event}
                                      </Text>
                                      <Text fontSize="sm" fontWeight="medium" textAlign="center">
                                        {timeString}
                                      </Text>
                                    </VStack>
                                  );
                                });
                              })()}
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Text fontWeight="bold" mb={3} px={{ base: 4, md: 0 }}>Recent Run Times</Text>
                          {analytics.runTimes.recentRuns.length > 0 ? (
                            <Box overflowX="auto" maxW="100vw">
                              <Table size="sm" minW="500px">
                              <Thead>
                                <Tr>
                                  <Th position="sticky" left={0} bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor}>Date</Th>
                                  <Th position="sticky" left="80px" bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor}>Exercise</Th>
                                  <Th>From Workout</Th>
                                  <Th>Time</Th>
                                  <Th>RPE</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {analytics.runTimes.recentRuns.slice(0, 10).map((run) => (
                                  <Tr key={run.id} h="48px">
                                    <Td position="sticky" left={0} bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor} fontSize="sm" fontWeight="medium" h="48px">
                                      {formatDate(run.created_at)}
                                    </Td>
                                    <Td position="sticky" left="80px" bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor} fontSize="sm" fontWeight="medium" h="48px">
                                      {run.exercise_name}
                                    </Td>
                                    <Td fontSize="sm" fontWeight="medium" color="blue.500" maxW="150px" isTruncated h="48px">
                                      {run.workout?.name || (run.workout_id ? `ID: ${run.workout_id.slice(0, 8)}` : 'Unknown')}
                                    </Td>
                                    <Td fontSize="sm" fontWeight="medium" h="48px">
                                      {run.has_time_data ? (
                                        <Text color="green.500" fontSize="sm" fontWeight="medium">
                                          {`${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`}
                                        </Text>
                                      ) : (
                                        <Text color="gray.400" fontSize="sm" fontWeight="medium" fontStyle="italic">
                                          Not logged
                                        </Text>
                                      )}
                                    </Td>
                                    <Td fontSize="sm" fontWeight="medium" h="48px">
                                      {run.rpe_rating ? (
                                        <Badge 
                                          size="sm" 
                                          colorScheme={run.rpe_rating <= 6 ? 'green' : run.rpe_rating <= 8 ? 'yellow' : 'red'}
                                        >
                                          {run.rpe_rating}
                                        </Badge>
                                      ) : (
                                        <Text fontSize="sm" fontWeight="medium" color="gray.400">N/A</Text>
                                      )}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                            </Box>
                          ) : (
                            <Box px={{ base: 4, md: 0 }}>
                              <VStack spacing={2} py={6}>
                                <Text color="gray.500" textAlign="center">
                                  No running exercises found.
                                </Text>
                                <Text color="gray.400" fontSize="xs" textAlign="center">
                                  Complete workouts with running exercises to see them here.
                                </Text>
                              </VStack>
                            </Box>
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