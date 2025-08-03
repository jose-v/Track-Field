import React, { useState, useMemo, useEffect } from 'react';
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
  CircularProgressLabel,
  IconButton
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
  FaExclamationCircle,
  FaTable,
  FaChartArea,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { usePageHeader } from '../../hooks/usePageHeader';
import { WorkoutAnalyticsService } from '../../services/analytics/workoutAnalyticsService';
import { RunTimesAnalyticsSection } from '../../components/analytics/RunTimesAnalyticsSection';

// TypeScript interfaces for rep analysis
interface RepData {
  id: string;
  setNumber: number;
  repNumber: number;
  time: number;
  formattedTime: string;
  notes?: string;
  created_at: string;
}

interface MultiRepWorkout {
  exerciseName: string;
  date: Date;
  dateKey: string;
  reps: RepData[];
  sets: Set<number>;
}

interface ChartDataPoint {
  date: Date;
  time: number;
  formattedTime: string;
  exerciseName: string;
}

interface RunTimesData {
  totalRunTimes: number;
  exerciseStats: any[];
  recentRuns: any[];
  chartData: Record<string, ChartDataPoint[]>;
  repAnalysisData: MultiRepWorkout[];
  allRuns: any[];
}

interface AnalyticsData {
  sleep: any;
  wellness: any;
  performance: any;
  training: any;
  runTimes: RunTimesData;
}

// Main Component
export function AthleteStats() {
  const { user } = useAuth();
  // Flag to hide the old runtimes section (for testing)
  const SHOW_OLD_RUNTIMES = false;
  
  // State for date range selection
  const [dateRange, setDateRange] = useState('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // State for view modes
  const [sleepViewMode, setSleepViewMode] = useState<'week' | 'month'>('week');
  const [wellnessViewMode, setWellnessViewMode] = useState<'week' | 'month'>('week');
  const [runTimesViewMode, setRunTimesViewMode] = useState<'chart' | 'table' | 'reps'>('chart');
  const [repAnalysisStartDate, setRepAnalysisStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [repAnalysisEndDate, setRepAnalysisEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [repAnalysisEventFilter, setRepAnalysisEventFilter] = useState<string>('all');
  const [repAnalysisTab, setRepAnalysisTab] = useState<'all' | 'set1' | 'set2' | 'set3'>('all');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState<{ text: string; x: number; y: number } | null>(null);

      // Use page header hook for mobile nav
    usePageHeader({
      title: 'My Analytics',
      subtitle: 'Your performance, sleep, and wellness data',
    icon: FaChartBar
  });

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

  // Fetch detailed athlete data for current user
  const { data: athleteData, isLoading: dataLoading } = useQuery({
    queryKey: ['athlete-detailed-analytics', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      // Get sleep records
      const { data: sleepData } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('sleep_date', startDate.split('T')[0])
        .order('sleep_date', { ascending: false });
      
      // Get wellness data
      const { data: wellnessData } = await supabase
        .from('athlete_wellness_surveys')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('survey_date', startDate.split('T')[0])
        .order('survey_date', { ascending: false });
      
      // Get exercise results from unified analytics view (includes both active and archived)
      const { data: exerciseResultsData } = await supabase
        .from('exercise_results_for_analytics')
        .select(`
          *
        `)
        .eq('athlete_id', user.id)
        .gte('completed_at', startDate)
        .order('completed_at', { ascending: false });

      // Get ALL exercise results for calendar (unfiltered by date range)
      const { data: allExerciseResultsData } = await supabase
        .from('exercise_results_for_analytics')
        .select(`
          *
        `)
        .eq('athlete_id', user.id)
        .order('completed_at', { ascending: false });

      console.log('Exercise results data for athlete:', user.id, exerciseResultsData);
      console.log('All exercise results data for athlete:', user.id, allExerciseResultsData);
      
      // Get unique workout IDs from exercise results and fetch actual workout names directly from workouts table
      const uniqueWorkoutIds = [...new Set(exerciseResultsData?.map(result => result.workout_id).filter(Boolean) || [])];
      
      // Fetch workout names from analytics view (includes both active and archived workouts)
      const workoutIdToName: Record<string, string> = {};
      if (uniqueWorkoutIds.length > 0) {
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts_for_analytics')
          .select('id, name, source')
          .in('id', uniqueWorkoutIds);
        
        if (!workoutError && workoutData) {
          workoutData.forEach(workout => {
            workoutIdToName[workout.id] = workout.name || `Workout ${workout.id.slice(-4).toUpperCase()}`;
          });
        }
        
        console.log('Fetched workout names from analytics view (includes archived):', workoutIdToName);
      }
      
      // Get training load entries (RPE data) for this athlete and date range
      const { data: trainingLoadData } = await supabase
        .from('training_load_entries')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('date', startDate.split('T')[0])
        .order('date', { ascending: false });

      console.log('Training load data for athlete:', user.id, trainingLoadData);

      // Create a map of workout_id to RPE for quick lookup
      const workoutRPEMap = new Map();
      trainingLoadData?.forEach((entry: any) => {
        workoutRPEMap.set(entry.workout_id, entry.rpe);
      });

      // Transform exercise results to the format expected by the analytics
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
          rpe_rating: workoutRPEMap.get(result.workout_id) || null,
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
        .eq('athlete_id', user.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      return {
        sleep: sleepData || [],
        wellness: wellnessData || [],
        performance: transformedPerformanceData || [],
        assignments: assignmentsData || [],
        allExerciseResults: allExerciseResultsData || []
      };
    },
    enabled: !!user?.id
  });

  // Calculate analytics from data (same logic as coach stats)
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
    
    const expectedSleepEntries = 30; // Always 30 days
    const sleepCompliance = Math.round((sleepRecords.length / expectedSleepEntries) * 100);

    // Prepare sleep chart data
    const sleepChartData = (() => {
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

    // Performance analytics - use filtered data for charts and stats
    const performanceRecords = athleteData.performance;
    // For reps tab, use unfiltered data to be independent of top date range selector
    const allPerformanceRecords = athleteData.allExerciseResults?.map((result: any) => {
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
        workout: { id: result.workout_id, name: `Workout ${result.workout_id.slice(0, 8)}` },
        rpe_rating: null,
        has_time_data: !!(result.time_minutes || result.time_seconds || result.time_hundredths),
        sets_completed: result.sets_completed,
        reps_completed: result.reps_completed,
        weight_used: result.weight_used,
        distance_meters: result.distance_meters,
        notes: result.notes
      };
    }) || [];
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

    // Run times analytics - use filtered data for charts and stats
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

      const runsWithTimes = runResults.filter(p => p.has_time_data);
      const runsWithoutTimes = runResults.filter(p => !p.has_time_data);

      // Group by exercise type
      const groupedResults = runResults.reduce((groups, result) => {
        const exerciseName = result.exercise_name;
        if (!groups[exerciseName]) groups[exerciseName] = [];
        
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
        const resultsWithTimes = results.filter(r => r.has_time_data && r.totalSeconds !== null);
        const resultsWithoutTimes = results.filter(r => !r.has_time_data);
        
        const sortedResults = resultsWithTimes.sort((a, b) => a.totalSeconds - b.totalSeconds);
        const bestTime = sortedResults.length > 0 ? sortedResults[0] : null;
        
        const recentResults = results
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
        
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
          improvement: Math.round(improvement * 100) / 100,
          lastAttempt: recentResults.length > 0 ? recentResults[0].formattedTime : 'N/A',
          lastAttemptDate: recentResults.length > 0 ? new Date(recentResults[0].created_at).toLocaleDateString() : 'N/A'
        };
      });

    // Prepare chart data for runtime trends
    const runtimeChartData = (() => {
      // Group runs by distance/event type
      const eventGroups = {
        '100m': [],
        '200m': [],
        '400m': [],
        '800m': [],
        '1500m': [],
        '5000m': []
      };

      console.log('Processing runsWithTimes for chart:', runsWithTimes.length);
      console.log('Sample run data:', runsWithTimes.slice(0, 2));
      console.log('All exercise names:', runsWithTimes.map(r => r.exercise_name));
      console.log('400m exercises found:', runsWithTimes.filter(r => r.exercise_name.toLowerCase().includes('400m')).map(r => r.exercise_name));

      // Categorize runs by distance
      runsWithTimes.forEach(run => {
        const exerciseName = run.exercise_name.toLowerCase();
        let eventKey = null;
        
        console.log(`Processing exercise: "${run.exercise_name}" (lowercase: "${exerciseName}")`);
        if (exerciseName.includes('400')) {
          console.log('Found potential 400m exercise:', run.exercise_name, 'lowercase:', exerciseName);
        }
        
        if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
          eventKey = '100m';
        } else if (exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter')) {
          eventKey = '200m';
        } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
          eventKey = '400m';
        } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter')) {
          eventKey = '800m';
        } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
          eventKey = '1500m';
        } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km')) {
          eventKey = '5000m';
        }
        
        console.log(`Exercise: ${run.exercise_name}, Event: ${eventKey}, Has time: ${run.has_time_data}`);
        
        if (eventKey && run.has_time_data) {
          // Calculate total seconds from the time components
          const totalSeconds = (run.time_minutes || 0) * 60 + (run.time_seconds || 0) + (run.time_hundredths || 0) / 100;
          const formattedTime = `${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`;
          
          console.log(`Adding to ${eventKey}: ${formattedTime} (${totalSeconds}s)`);
          
          eventGroups[eventKey].push({
            date: new Date(run.created_at),
            time: totalSeconds,
            formattedTime: formattedTime,
            exerciseName: run.exercise_name
          });
        }
      });

      // Sort each group by date and keep only the best time per date
      Object.keys(eventGroups).forEach(key => {
        const runs = eventGroups[key];
        
        // Group by date and keep only the best time for each date
        const dateGroups: Record<string, any[]> = {};
        runs.forEach(run => {
          const dateKey = run.date.toISOString().split('T')[0];
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
          }
          dateGroups[dateKey].push(run);
        });
        
        // For each date, keep only the best time (lowest time value)
        const bestTimesPerDate: any[] = [];
        Object.values(dateGroups).forEach(dateRuns => {
          const bestRun = dateRuns.reduce((best, current) => 
            current.time < best.time ? current : best
          );
          bestTimesPerDate.push(bestRun);
        });
        
        // Sort by date
        bestTimesPerDate.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        eventGroups[key] = bestTimesPerDate;
      });

      console.log('Final chart data (best times only):', eventGroups);
      return eventGroups;
    })();

    // Prepare rep analysis data - use ALL data (unfiltered) for reps tab
    const repAnalysisData = (() => {
      // Transform all exercise results to the format expected by the analytics
      const allPerformanceRecords = athleteData.allExerciseResults?.map((result: any) => {
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
          workout: { id: result.workout_id, name: `Workout ${result.workout_id.slice(0, 8)}` },
          rpe_rating: null,
          has_time_data: !!(result.time_minutes || result.time_seconds || result.time_hundredths),
          sets_completed: result.sets_completed,
          reps_completed: result.reps_completed,
          weight_used: result.weight_used,
          distance_meters: result.distance_meters,
          notes: result.notes
        };
      }) || [];

      // Filter for running exercises from all data
      const allRunResults = allPerformanceRecords.filter(p => {
        const exerciseName = p.exercise_name?.toLowerCase() || '';
        const isRunningExercise = exerciseName.includes('run') ||
                                 exerciseName.includes('sprint') ||
                                 exerciseName.includes('dash') ||
                                 exerciseName.includes('meter') ||
                                 exerciseName.includes('mile') ||
                                 exerciseName.includes('jog');
        return isRunningExercise;
      });

      const allRunsWithTimes = allRunResults.filter(p => p.has_time_data);
      
      // Group runs by exercise name and date to find multi-rep workouts
      const workoutGroups: Record<string, MultiRepWorkout> = {};
      
      allRunsWithTimes.forEach(run => {
        const exerciseName = run.exercise_name;
        const dateKey = new Date(run.created_at).toISOString().split('T')[0];
        const groupKey = `${exerciseName}_${dateKey}`;
        
        if (!workoutGroups[groupKey]) {
          workoutGroups[groupKey] = {
            exerciseName,
            date: new Date(run.created_at),
            dateKey,
            reps: [],
            sets: new Set()
          };
        }
        
        // Calculate total seconds
        const totalSeconds = (run.time_minutes || 0) * 60 + (run.time_seconds || 0) + (run.time_hundredths || 0) / 100;
        const formattedTime = `${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`;
        
        // Extract set number from notes or exercise name
        let setNumber = 1;
        if (run.notes) {
          const setMatch = run.notes.match(/set\s*(\d+)/i);
          if (setMatch) setNumber = parseInt(setMatch[1]);
        }
        
        workoutGroups[groupKey].reps.push({
          id: run.id,
          setNumber,
          repNumber: workoutGroups[groupKey].reps.length + 1,
          time: totalSeconds,
          formattedTime,
          notes: run.notes,
          created_at: run.created_at
        });
        
        workoutGroups[groupKey].sets.add(setNumber);
      });
      
      // Include all workouts (including single rep workouts)
      const multiRepWorkouts = Object.values(workoutGroups)
        .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
      
      console.log('All workouts found (including single rep):', multiRepWorkouts);
      
      return multiRepWorkouts;
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
        chartData: sleepChartData
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
      runTimes: {
        totalRunTimes: runResults.length,
        exerciseStats: exerciseStats.sort((a, b) => b.totalAttempts - a.totalAttempts),
        recentRuns: runResults
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        chartData: runtimeChartData,
        repAnalysisData,
        // Add all runs data for reps tab (most recent runs only)
        allRuns: (() => {
          const allRunsData = allPerformanceRecords.filter(p => {
            const exerciseName = p.exercise_name?.toLowerCase() || '';
            const isRunningExercise = exerciseName.includes('run') ||
                                     exerciseName.includes('sprint') ||
                                     exerciseName.includes('dash') ||
                                     exerciseName.includes('meter') ||
                                     exerciseName.includes('mile') ||
                                     exerciseName.includes('jog');
            return isRunningExercise;
          }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          // Return all historical runs for the reps tab (this is the point - to show historical data!)
          const historicalRuns = allRunsData;
          
          console.log('Historical runs data for reps tab:', historicalRuns.map(run => ({
            exercise_name: run.exercise_name,
            created_at: run.created_at,
            has_time_data: run.has_time_data,
            date: new Date(run.created_at).toLocaleDateString(),
            time_minutes: run.time_minutes,
            time_seconds: run.time_seconds,
            time_hundredths: run.time_hundredths
          })));
          
          return historicalRuns;
        })()
      }
    };
  }, [athleteData, sleepViewMode, wellnessViewMode]);

  // Debug chart data
  useEffect(() => {
    if (runTimesViewMode === 'chart') {
      console.log('Chart view mode active');
      console.log('Analytics data:', analytics?.runTimes);
      if (analytics?.runTimes?.chartData) {
        console.log('Chart data available:', analytics.runTimes.chartData);
        Object.entries(analytics.runTimes.chartData).forEach(([event, data]) => {
          console.log(`${event}: ${data.length} data points`);
        });
      }
    }
  }, [runTimesViewMode, analytics]);

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

  if (dataLoading) {
    return (
      <Box bg={pageBg} minH="100vh">
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color={textPrimary}>My Analytics</Heading>
            <Spinner />
          </Flex>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} height="200px" />
            ))}
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header - Hide on mobile since it's in nav bar */}
        <Box display={{ base: "none", md: "block" }}>
          <Heading size="lg" color={textPrimary}>My Analytics</Heading>
          <Text color="gray.500">Your performance, sleep, and wellness data from the last {getDateRangeText()}.</Text>
        </Box>

        {/* Date Range Selector */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                  Date Range
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Select time period for analytics
                </Text>
              </VStack>
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
            </Flex>
          </CardBody>
        </Card>

        {analytics ? (
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
                        variant={sleepViewMode === 'week' ? 'solid' : 'outline'}
                        onClick={() => setSleepViewMode('week')}
                        fontWeight={sleepViewMode === 'week' ? 'bold' : 'normal'}
                        bg={sleepViewMode === 'week' ? 'blue.500' : 'transparent'}
                        color={sleepViewMode === 'week' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={sleepViewMode === 'week' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: sleepViewMode === 'week' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
                      >
                        Week
                      </Button>
                      <Button 
                        colorScheme={sleepViewMode === 'month' ? 'blue' : 'gray'}
                        variant={sleepViewMode === 'month' ? 'solid' : 'outline'}
                        onClick={() => setSleepViewMode('month')}
                        fontWeight={sleepViewMode === 'month' ? 'bold' : 'normal'}
                        bg={sleepViewMode === 'month' ? 'blue.500' : 'transparent'}
                        color={sleepViewMode === 'month' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={sleepViewMode === 'month' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: sleepViewMode === 'month' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
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

                        {/* Chart area - same as coach stats */}
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
                            <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                              {/* Gradient definitions */}
                              <defs>
                                <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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
                                fill="url(#sleepGradient)"
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
                        variant={wellnessViewMode === 'week' ? 'solid' : 'outline'}
                        onClick={() => setWellnessViewMode('week')}
                        fontWeight={wellnessViewMode === 'week' ? 'bold' : 'normal'}
                        bg={wellnessViewMode === 'week' ? 'blue.500' : 'transparent'}
                        color={wellnessViewMode === 'week' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={wellnessViewMode === 'week' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: wellnessViewMode === 'week' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
                      >
                        Week
                      </Button>
                      <Button 
                        colorScheme={wellnessViewMode === 'month' ? 'blue' : 'gray'}
                        variant={wellnessViewMode === 'month' ? 'solid' : 'outline'}
                        onClick={() => setWellnessViewMode('month')}
                        fontWeight={wellnessViewMode === 'month' ? 'bold' : 'normal'}
                        bg={wellnessViewMode === 'month' ? 'blue.500' : 'transparent'}
                        color={wellnessViewMode === 'month' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={wellnessViewMode === 'month' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: wellnessViewMode === 'month' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
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

                    {/* Visual Wellness Chart - same complex chart as coach stats */}
                    <Box>
                      <Text fontWeight="bold" mb={0}>Wellness Trends (Last {wellnessViewMode === 'week' ? '7 Days' : '30 Days'})</Text>
                      <Box bg={{ base: 'transparent', md: useColorModeValue('gray.50', 'transparent') }} borderRadius="lg" px={1} py={10}>
                        {/* Chart area - same complex chart as coach stats */}
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
                                            <Text color="gray.400">-</Text>
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

              {/* OLD RUNTIMES SECTION - Hidden for testing */}
              {SHOW_OLD_RUNTIMES && (
                <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                  <HStack>
                    <Heading size="md">Run Times</Heading>
                    </HStack>
                    <ButtonGroup isAttached size="sm">
                      <Button 
                        colorScheme={runTimesViewMode === 'chart' ? 'blue' : 'gray'}
                        variant={runTimesViewMode === 'chart' ? 'solid' : 'outline'}
                        onClick={() => setRunTimesViewMode('chart')}
                        leftIcon={<FaChartArea />}
                        fontWeight={runTimesViewMode === 'chart' ? 'bold' : 'normal'}
                        bg={runTimesViewMode === 'chart' ? 'blue.500' : 'transparent'}
                        color={runTimesViewMode === 'chart' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={runTimesViewMode === 'chart' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: runTimesViewMode === 'chart' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
                      >
                        Chart
                      </Button>
                      <Button 
                        colorScheme={runTimesViewMode === 'table' ? 'blue' : 'gray'}
                        variant={runTimesViewMode === 'table' ? 'solid' : 'outline'}
                        onClick={() => setRunTimesViewMode('table')}
                        leftIcon={<FaTable />}
                        fontWeight={runTimesViewMode === 'table' ? 'bold' : 'normal'}
                        bg={runTimesViewMode === 'table' ? 'blue.500' : 'transparent'}
                        color={runTimesViewMode === 'table' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={runTimesViewMode === 'table' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: runTimesViewMode === 'table' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
                      >
                        Table
                      </Button>
                      <Button 
                        colorScheme={runTimesViewMode === 'reps' ? 'blue' : 'gray'}
                        variant={runTimesViewMode === 'reps' ? 'solid' : 'outline'}
                        onClick={() => setRunTimesViewMode('reps')}
                        leftIcon={<FaRunning />}
                        fontWeight={runTimesViewMode === 'reps' ? 'bold' : 'normal'}
                        bg={runTimesViewMode === 'reps' ? 'blue.500' : 'transparent'}
                        color={runTimesViewMode === 'reps' ? 'white' : useColorModeValue('gray.600', 'gray.300')}
                        borderColor={runTimesViewMode === 'reps' ? 'blue.500' : useColorModeValue('gray.300', 'gray.600')}
                        _hover={{
                          bg: runTimesViewMode === 'reps' ? 'blue.600' : useColorModeValue('gray.50', 'gray.700')
                        }}
                      >
                        Reps
                      </Button>
                    </ButtonGroup>
                  </HStack>
                </CardHeader>
                <CardBody px={{ base: 0, md: 6 }} py={{ base: 4, md: 6 }}>
                  {runTimesViewMode === 'chart' ? (
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
                              
                                if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
                                eventKey = '100m';
                                } else if (exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter')) {
                                eventKey = '200m';
                                } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
                                eventKey = '400m';
                                } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter')) {
                                eventKey = '800m';
                                } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
                                eventKey = '1500m';
                                } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km')) {
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

                      {/* Runtime Chart */}
                      <Box>
                        <Text fontWeight="bold" mb={3} px={{ base: 4, md: 0 }}>Runtime Performance Over Time</Text>
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3} px={{ base: 4, md: 0 }}>
                          {(() => {
                            const today = new Date();
                            if (dateRange === 'week') {
                              const dayOfWeek = today.getDay();
                              const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                              const monday = new Date(today);
                              monday.setDate(today.getDate() - daysFromMonday);
                              const sunday = new Date(monday);
                              sunday.setDate(monday.getDate() + 6);
                              return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                            } else if (dateRange === 'month') {
                              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                              return `${firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
                            } else if (dateRange === 'quarter') {
                              const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                              return `${threeMonthsAgo.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                            }
                            return '';
                          })()}
                        </Text>
                        <Box bg={{ base: 'transparent', md: useColorModeValue('gray.50', 'transparent') }} borderRadius="lg" px={1} py={10} position="relative">
                          <Box h="300px" position="relative" pt={2}>
                            {(() => {
                              // Calculate date range based on selected date range (moved to component level)
                              const getDateRange = () => {
                                if (dateRange === 'week') {
                                  // Week view: 7 days starting Monday
                                  const today = new Date();
                                  const dayOfWeek = today.getDay();
                                  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so Monday = 1
                                  const monday = new Date(today);
                                  monday.setDate(today.getDate() - daysFromMonday);
                                  monday.setHours(0, 0, 0, 0);
                                  
                                  const sunday = new Date(monday);
                                  sunday.setDate(monday.getDate() + 6);
                                  sunday.setHours(23, 59, 59, 999);
                                  
                                  return {
                                    minDate: monday.getTime(),
                                    maxDate: sunday.getTime()
                                  };
                                } else if (dateRange === 'month') {
                                  // Month view: current month with all days
                                  const today = new Date();
                                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                  
                                  return {
                                    minDate: firstDay.getTime(),
                                    maxDate: lastDay.getTime()
                                  };
                                } else if (dateRange === 'quarter') {
                                  // 3-month view: last 3 months
                                  const today = new Date();
                                  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                                  
                                  return {
                                    minDate: threeMonthsAgo.getTime(),
                                    maxDate: today.getTime()
                                  };
                                } else {
                                  // Fallback to data-based range
                                  const allDataPoints = Object.values(analytics.runTimes.chartData).flat();
                                  const allDates = allDataPoints.map(d => d.date.getTime());
                                  return {
                                    minDate: Math.min(...allDates),
                                    maxDate: Math.max(...allDates)
                                  };
                                }
                              };
                              
                              const { minDate, maxDate } = getDateRange();
                              const chartDateRange = maxDate - minDate;
                              
                              // Check if we have any chart data
                              if (!analytics?.runTimes?.chartData || Object.keys(analytics.runTimes.chartData).length === 0) {
                                console.log('No chart data available');
                                return (
                                  <Box position="relative">
                                    {/* Chart container with padding for labels */}
                                    <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                      <Box 
                                        w="100%" 
                                        h="240px" 
                                        bg={useColorModeValue('gray.100', 'gray.700')}
                                        borderRadius="md"
                                        border="2px solid"
                                        borderColor={useColorModeValue('gray.300', 'gray.500')}
                                        position="relative"
                                      >
                                        {/* Grid lines */}
                                        {Array.from({ length: 5 }, (_, i) => (
                                          <Box
                                            key={i}
                                            position="absolute"
                                            left="0"
                                            right="0"
                                            top={`${(i * 240) / 4}px`}
                                            h="2px"
                                            bg={useColorModeValue('gray.300', 'gray.500')}
                                            opacity={0.8}
                                          />
                                        ))}
                                        
                                        {/* Empty state message centered in chart */}
                                        <Box position="absolute" top="0" left="0" right="0" bottom="0" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                                          <VStack spacing={2}>
                                            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
                                              {selectedDate ? `No runtime data for ${selectedDate.toLocaleDateString()}` : 'No runtime data available'}
                                            </Text>
                                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center">
                                              {selectedDate ? 'Try selecting a different date' : 'Complete running exercises with time data'}
                                            </Text>
                                          </VStack>
                                        </Box>
                                      </Box>
                                    </Box>
                                    
                                    {/* Y-axis labels positioned outside chart */}
                                    <Box position="absolute" left="0" top="0" h="240px" w="60px" display="flex" flexDirection="column" justifyContent="space-between" py={2}>
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Text key={i} fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} textAlign="right" pr={2}>
                                          {i === 0 ? '0s' : i === 4 ? '60s' : `${i * 15}s`}
                                        </Text>
                                      ))}
                                    </Box>
                                    
                                    {/* X-axis labels positioned outside chart */}
                                    <Box position="absolute" bottom="-40px" left="80px" right="20px" display="flex" justifyContent="space-between">
                                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Date</Text>
                                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Date</Text>
                                    </Box>
                                  </Box>
                                );
                              }
                              
                              const hasData = Object.values(analytics.runTimes.chartData).some(data => data.length > 0);
                              console.log('Chart data check:', analytics.runTimes.chartData);
                              console.log('Has data:', hasData);
                              console.log('Data breakdown:', Object.entries(analytics.runTimes.chartData).map(([event, data]) => `${event}: ${data.length} points`));
                              
                              if (!hasData) {
                                console.log('No data points found, showing empty state');
                                return (
                                  <Box position="relative">
                                    {/* Chart container with padding for labels */}
                                    <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                      <Box 
                                        w="100%" 
                                        h="240px" 
                                        bg={useColorModeValue('gray.100', 'gray.700')}
                                        borderRadius="md"
                                        border="2px solid"
                                        borderColor={useColorModeValue('gray.300', 'gray.500')}
                                        position="relative"
                                      >
                                        {/* Grid lines */}
                                        {Array.from({ length: 5 }, (_, i) => (
                                          <Box
                                            key={i}
                                            position="absolute"
                                            left="0"
                                            right="0"
                                            top={`${(i * 240) / 4}px`}
                                            h="2px"
                                            bg={useColorModeValue('gray.300', 'gray.500')}
                                            opacity={0.8}
                                          />
                                        ))}
                                        
                                        {/* Empty state message centered in chart */}
                                        <Box position="absolute" top="0" left="0" right="0" bottom="0" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                                          <VStack spacing={2}>
                                            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
                                              {selectedDate ? `No runtime data for ${selectedDate.toLocaleDateString()}` : 'No runtime data available'}
                                    </Text>
                                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center">
                                              {selectedDate ? 'Try selecting a different date' : 'Complete running exercises with time data'}
                                    </Text>
                                  </VStack>
                                        </Box>
                                      </Box>
                                    </Box>
                                    
                                    {/* Y-axis labels positioned outside chart */}
                                    <Box position="absolute" left="0" top="0" h="240px" w="60px" display="flex" flexDirection="column" justifyContent="space-between" py={2}>
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Text key={i} fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} textAlign="right" pr={2}>
                                          {i === 0 ? '0s' : i === 4 ? '60s' : `${i * 15}s`}
                                        </Text>
                                      ))}
                                    </Box>
                                    
                                    {/* X-axis labels positioned outside chart */}
                                    <Box position="absolute" bottom="-40px" left="80px" right="20px" display="flex" justifyContent="space-between">
                                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Date</Text>
                                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Date</Text>
                                    </Box>
                                  </Box>
                                );
                              }
                              

                              
                              // Get filtered data points for chart calculations
                              const allDataPoints = Object.values(analytics.runTimes.chartData).flat();
                              
                              // Filter data points to only include those within the selected date range
                              const dataInRange = allDataPoints.filter(d => d.date.getTime() >= minDate && d.date.getTime() <= maxDate);
                              console.log('Data in range:', dataInRange.length, 'out of', allDataPoints.length);
                              console.log('Date range:', new Date(minDate).toISOString(), 'to', new Date(maxDate).toISOString());
                              
                              // Use only the data within the selected range for Y-axis calculations
                              const chartDataPoints = dataInRange;
                              const allTimes = chartDataPoints.map(d => d.time);
                              const globalMinTime = Math.min(...allTimes);
                              const globalMaxTime = Math.max(...allTimes);
                              
                              // Handle case where there's only one data point or all times are the same
                              let adjustedMinTime, adjustedMaxTime, globalTimeRange;
                              if (globalMinTime === globalMaxTime) {
                                // Single data point or all times are the same - create a small range
                                adjustedMinTime = globalMinTime - 1; // 1 second below
                                adjustedMaxTime = globalMaxTime + 1; // 1 second above
                                globalTimeRange = 2; // 2 second range
                              } else {
                                // Add padding to ensure all data points are visible
                                const padding = (globalMaxTime - globalMinTime) * 0.1; // 10% padding
                                adjustedMinTime = globalMinTime - padding;
                                adjustedMaxTime = globalMaxTime + padding;
                                globalTimeRange = adjustedMaxTime - adjustedMinTime;
                              }
                              
                              console.log('Global time range:', globalMinTime, 'to', globalMaxTime, 'seconds');
                              console.log('Date range:', new Date(minDate), 'to', new Date(maxDate));
                              console.log('Current dateRange setting:', dateRange);
                              console.log('All chart data points:', allDataPoints.map(d => ({ date: d.date.toISOString(), time: d.time, exercise: d.exerciseName })));
                              
                              // Debug output visible in UI
                              const debugInfo = {
                                dateRange,
                                minDate: new Date(minDate).toISOString(),
                                maxDate: new Date(maxDate).toISOString(),
                                totalDataPoints: allDataPoints.length,
                                dataPoints: allDataPoints.map(d => ({ date: d.date.toISOString(), time: d.time, exercise: d.exerciseName }))
                              };
                              console.log('DEBUG INFO:', debugInfo);
                              
                              return (
                                <Box position="relative">
                                  {/* Chart container with padding for labels */}
                                  <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                    <svg width="100%" height="240" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                                      {/* Y-axis labels (seconds) - positioned outside chart */}
                                      {(() => {
                                        const timeSteps = 5;
                                        const stepSize = globalTimeRange / (timeSteps - 1);
                                        return Array.from({ length: timeSteps }, (_, i) => {
                                          const timeValue = adjustedMinTime + (i * stepSize);
                                          const y = 240 - (i * (240 / (timeSteps - 1)));
                                          return (
                                            <g key={`y-${i}`}>
                                              <line
                                                x1="0"
                                                y1={y}
                                                x2="1000"
                                                y2={y}
                                                stroke={useColorModeValue('#F3F4F6', '#374151')}
                                                strokeWidth="1"
                                                opacity={0.3}
                                              />
                                            </g>
                                          );
                                        });
                                      })()}
                                      
                                      {/* Event lines with different colors */}
                                      {(() => {
                                        if (!analytics?.runTimes?.chartData) return null;
                                        
                                        const eventColors = {
                                          '100m': '#EF4444',
                                          '200m': '#F59E0B', 
                                          '400m': '#10B981',
                                          '800m': '#3B82F6',
                                          '1500m': '#8B5CF6',
                                          '5000m': '#EC4899'
                                        };
                                        
                                        return Object.entries(analytics.runTimes.chartData).map(([event, data]) => {
                                          // Filter data to only include points within the selected date range
                                          const filteredData = data.filter(point => 
                                            point.date.getTime() >= minDate && point.date.getTime() <= maxDate
                                          );
                                          if (filteredData.length === 0) return null;
                                          
                                          console.log(`Rendering ${event} with ${filteredData.length} data points:`, filteredData);
                                          console.log(`${event} data dates:`, filteredData.map(d => d.date.toISOString()));
                                          console.log(`${event} data times:`, filteredData.map(d => d.time));
                                          console.log(`${event} data formatted times:`, filteredData.map(d => d.formattedTime));
                                          
                                          const color = eventColors[event] || '#6B7280';
                                          
                                          // Sort data by date to ensure proper line drawing
                                          const sortedData = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime());
                                          
                                          console.log(`Sorted data for ${event}:`, sortedData);
                                          
                                          // Create path for this event using actual dates and times
                                          const points = sortedData.map((point) => {
                                            const x = chartDateRange > 0 ? ((point.date.getTime() - minDate) / chartDateRange) * 1000 : 0;
                                            const y = 240 - ((point.time - adjustedMinTime) / globalTimeRange) * 200; // Reduced height for labels
                                            console.log(`${event} Y calculation: time=${point.time}, adjustedMinTime=${adjustedMinTime}, globalTimeRange=${globalTimeRange}, y=${y}`);
                                            console.log(`Point for ${event}: date=${point.date}, time=${point.time}s, x=${x}, y=${y}, inRange=${point.date.getTime() >= minDate && point.date.getTime() <= maxDate}`);
                                            console.log(`Chart date range: ${chartDateRange}, minDate: ${new Date(minDate).toISOString()}, maxDate: ${new Date(maxDate).toISOString()}`);
                                            return { x, y, point };
                                          });
                                          
                                          console.log(`Calculated points for ${event}:`, points);
                                          
                                          if (points.length < 1) {
                                            console.log(`No points for ${event}`);
                                            return null;
                                          }
                                          
                                          // Create the path string for the line
                                          const pathData = points.map((point, index) => {
                                            if (index === 0) {
                                              return `M ${point.x},${point.y}`;
                                            } else {
                                              return `L ${point.x},${point.y}`;
                                            }
                                          }).join(' ');
                                          
                                          console.log(`Path for ${event}:`, pathData);
                                          console.log(`Path coordinates for ${event}:`, points.map(p => `(${p.x}, ${p.y})`));
                                          
                                          // Check if coordinates are valid
                                          const validPoints = points.filter(p => !isNaN(p.x) && !isNaN(p.y) && p.x >= 0 && p.x <= 1000 && p.y >= 0 && p.y <= 240);
                                          console.log(`Valid points for ${event}:`, validPoints.length, 'out of', points.length);
                                          console.log(`${event} point validation:`, points.map(p => ({ x: p.x, y: p.y, isValid: !isNaN(p.x) && !isNaN(p.y) && p.x >= 0 && p.x <= 1000 && p.y >= 0 && p.y <= 240 })));
                                          console.log(`${event} point coordinates:`, points.map(p => ({ x: p.x, y: p.y, date: p.point.date.toISOString() })));
                                          
                                          if (validPoints.length < 1) {
                                            console.log(`No valid points for ${event}`);
                                            return null;
                                          }
                                          
                                          // Create a simplified path for debugging
                                          const simplePath = validPoints.map((point, index) => {
                                            if (index === 0) {
                                              return `M ${point.x},${point.y}`;
                                            } else {
                                              return `L ${point.x},${point.y}`;
                                            }
                                          }).join(' ');
                                          
                                          console.log(`Simple path for ${event}:`, simplePath);
                                          
                                          return (
                                            <g key={event}>
                                              {/* Line - only draw if there are 2 or more points */}
                                              {points.length >= 2 && (
                                              <path
                                                d={pathData}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeOpacity="0.8"
                                                style={{ pointerEvents: 'none' }}
                                              />
                                              )}
                                              {/* Data points with tooltips - always show dots */}
                                              {points.map((point, index) => {
                                                const timeString = point.point.formattedTime || `${Math.floor(point.point.time / 60)}:${(point.point.time % 60).toFixed(2).padStart(5, '0')}`;
                                                const dateString = point.point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                const tooltipText = `${dateString}: ${timeString}`;
                                                
                                                console.log(`Rendering ${event} circle ${index}:`, { x: point.x, y: point.y, color, timeString });
                                                
                                                return (
                                                  <circle
                                                    key={index}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r="4"
                                                    fill={color}
                                                    fillOpacity="0.9"
                                                    stroke="white"
                                                    strokeWidth="1"
                                                    style={{ cursor: 'pointer' }}
                                                    vectorEffect="non-scaling-stroke"
                                                    onMouseEnter={(e) => {
                                                      setTooltipData({
                                                        text: tooltipText,
                                                        x: e.clientX + 10,
                                                        y: e.clientY - 30
                                                      });
                                                    }}
                                                    onMouseLeave={() => {
                                                      setTooltipData(null);
                                                    }}
                                                  />
                                                );
                                              })}
                                            </g>
                                          );
                                        });
                                      })()}
                                    </svg>
                                  </Box>
                                  
                                  {/* Custom Tooltip */}
                                  {tooltipData && (
                                    <Box
                                      position="fixed"
                                      left={`${tooltipData.x}px`}
                                      top={`${tooltipData.y}px`}
                                      bg={useColorModeValue('gray.800', 'gray.200')}
                                      color={useColorModeValue('white', 'black')}
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      fontSize="xs"
                                      zIndex={1000}
                                      pointerEvents="none"
                                      boxShadow="lg"
                                    >
                                      {tooltipData.text}
                                    </Box>
                                  )}
                                  
                                  {/* Y-axis labels positioned outside chart */}
                                  <Box position="absolute" left="0" top="0" h="240px" w="70px">
                                    {(() => {
                                      const timeSteps = 5;
                                      const stepSize = globalTimeRange / (timeSteps - 1);
                                      return Array.from({ length: timeSteps }, (_, i) => {
                                        const timeValue = globalMinTime + (i * stepSize);
                                        const y = 240 - (i * (240 / (timeSteps - 1)));
                                        return (
                                          <Text
                                            key={`y-label-${i}`}
                                            position="absolute"
                                            left="0"
                                            top={`${y - 8}px`}
                                            fontSize="10px"
                                            color={useColorModeValue('#6B7280', '#9CA3AF')}
                                            textAlign="right"
                                            w="70px"
                                            pr="10px"
                                          >
                                            {timeValue.toFixed(1)}s
                                          </Text>
                                        );
                                      });
                                    })()}
                                  </Box>
                                  
                                  {/* X-axis labels positioned outside chart */}
                                  <Box position="absolute" left="80px" right="20px" bottom="-30px" h="30px">
                                    {(() => {
                                      let labels = [];
                                      
                                      if (dateRange === 'week') {
                                        // Week view: show all 7 days starting Monday
                                        const monday = new Date(minDate);
                                        for (let i = 0; i < 7; i++) {
                                          const date = new Date(monday);
                                          date.setDate(monday.getDate() + i);
                                          const x = `${(i / 6) * 100}%`;
                                          
                                          labels.push({
                                            x,
                                            text: date.toLocaleDateString('en-US', { weekday: 'short' }),
                                            textAlign: i === 0 ? "left" : i === 6 ? "right" : "center",
                                            transform: i === 0 ? "translateX(0%)" : i === 6 ? "translateX(-100%)" : "translateX(-50%)"
                                          });
                                        }
                                      } else if (dateRange === 'month') {
                                        // Month view: show all days of the month
                                        const firstDay = new Date(minDate);
                                        const lastDay = new Date(maxDate);
                                        const daysInMonth = lastDay.getDate();
                                        
                                        // Show every 3rd day to avoid overcrowding
                                        for (let i = 1; i <= daysInMonth; i += 3) {
                                          const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), i);
                                          const x = `${((i - 1) / (daysInMonth - 1)) * 100}%`;
                                          
                                          labels.push({
                                            x,
                                            text: date.getDate().toString(),
                                            textAlign: i === 1 ? "left" : i === daysInMonth ? "right" : "center",
                                            transform: i === 1 ? "translateX(0%)" : i === daysInMonth ? "translateX(-100%)" : "translateX(-50%)"
                                          });
                                        }
                                      } else if (dateRange === 'quarter') {
                                        // 3-month view: show month names
                                        const startDate = new Date(minDate);
                                        const endDate = new Date(maxDate);
                                        
                                        for (let i = 0; i < 3; i++) {
                                          const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                                          const x = `${(i / 2) * 100}%`;
                                          
                                          labels.push({
                                            x,
                                            text: date.toLocaleDateString('en-US', { month: 'short' }),
                                            textAlign: i === 0 ? "left" : i === 2 ? "right" : "center",
                                            transform: i === 0 ? "translateX(0%)" : i === 2 ? "translateX(-100%)" : "translateX(-50%)"
                                          });
                                        }
                                      } else {
                                        // Fallback: 5 evenly spaced labels
                                      const dateSteps = 5;
                                        const stepSize = chartDateRange > 0 ? chartDateRange / (dateSteps - 1) : 1;
                                        for (let i = 0; i < dateSteps; i++) {
                                        const dateValue = minDate + (i * stepSize);
                                        const date = new Date(dateValue);
                                          const x = `${(i / (dateSteps - 1)) * 100}%`;
                                          
                                          labels.push({
                                            x,
                                            text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                            textAlign: i === 0 ? "left" : i === dateSteps - 1 ? "right" : "center",
                                            transform: i === 0 ? "translateX(0%)" : i === dateSteps - 1 ? "translateX(-100%)" : "translateX(-50%)"
                                          });
                                        }
                                      }
                                      
                                      return labels.map((label, index) => (
                                          <Text
                                          key={`x-label-${index}`}
                                            position="absolute"
                                          left={label.x}
                                            bottom="0"
                                            fontSize="10px"
                                            color={useColorModeValue('#6B7280', '#9CA3AF')}
                                          textAlign={label.textAlign}
                                          transform={label.transform}
                                            maxW="80px"
                                            isTruncated
                                          >
                                          {label.text}
                                          </Text>
                                      ));
                                    })()}
                                  </Box>
                                </Box>
                              );
                            })()}
                            
                            {/* Legend */}
                            <HStack spacing={4} mt={4} px={2} flexWrap="wrap" justify="flex-start">
                              {(() => {
                                if (!analytics?.runTimes?.chartData) return null;
                                
                                // Calculate date range for legend (same logic as chart)
                                const getLegendDateRange = () => {
                                  if (dateRange === 'week') {
                                    const today = new Date();
                                    const dayOfWeek = today.getDay();
                                    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                                    const monday = new Date(today);
                                    monday.setDate(today.getDate() - daysFromMonday);
                                    monday.setHours(0, 0, 0, 0);
                                    const sunday = new Date(monday);
                                    sunday.setDate(monday.getDate() + 6);
                                    sunday.setHours(23, 59, 59, 999);
                                    return { minDate: monday.getTime(), maxDate: sunday.getTime() };
                                  } else if (dateRange === 'month') {
                                    const today = new Date();
                                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                    return { minDate: firstDay.getTime(), maxDate: lastDay.getTime() };
                                  } else if (dateRange === 'quarter') {
                                    const today = new Date();
                                    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                                    return { minDate: threeMonthsAgo.getTime(), maxDate: today.getTime() };
                                  } else {
                                    const allDataPoints = Object.values(analytics.runTimes.chartData).flat();
                                    const allDates = allDataPoints.map(d => d.date.getTime());
                                    return { minDate: Math.min(...allDates), maxDate: Math.max(...allDates) };
                                  }
                                };
                                
                                const { minDate, maxDate } = getLegendDateRange();
                                
                                return Object.entries(analytics.runTimes.chartData).map(([event, data]) => {
                                  // Filter data to only include points within the selected date range (same as chart)
                                  const filteredData = data.filter(point => 
                                    point.date.getTime() >= minDate && point.date.getTime() <= maxDate
                                  );
                                  if (filteredData.length === 0) return null;
                                  
                                  const eventColors = {
                                    '100m': '#EF4444',
                                    '200m': '#F59E0B', 
                                    '400m': '#10B981',
                                    '800m': '#3B82F6',
                                    '1500m': '#8B5CF6',
                                    '5000m': '#EC4899'
                                  };
                                  
                                  const color = eventColors[event] || '#6B7280';
                                  
                                  return (
                                    <HStack key={event} spacing={1}>
                                      <Box w="3" h="3" bg={color} borderRadius="sm" />
                                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                                        {event} ({filteredData.length} runs)
                                      </Text>
                                    </HStack>
                                  );
                                });
                              })()}
                            </HStack>
                          </Box>
                        </Box>
                      </Box>
                    </VStack>
                  ) : runTimesViewMode === 'reps' ? (
                    <VStack spacing={8} align="stretch">
                      {/* Content Above the Graph - Left Column Layout */}
                      <Box px={{ base: 0, md: 0 }}>
                        <HStack spacing={0} align="start">
                          {/* Column 1 - Event, Date Picker, Stats */}
                          <VStack spacing={6} align="stretch" flex="1">
                            {/* Top Section - Filters/Inputs */}
                            <VStack spacing={4} align="stretch">
                              {/* Event Filter */}
                              <VStack spacing={1} align="start">
                                <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>
                                  Event
                                </Text>
                                <Select
                                  size="sm"
                                  value={repAnalysisEventFilter}
                                  onChange={(e) => setRepAnalysisEventFilter(e.target.value)}
                                  w="120px"
                                  fontSize="xs"
                                >
                                  <option value="all">All Events</option>
                                  <option value="100m">100m</option>
                                  <option value="200m">200m</option>
                                  <option value="400m">400m</option>
                                  <option value="800m">800m</option>
                                  <option value="1500m">1500m</option>
                                  <option value="5000m">5000m</option>
                                </Select>
                              </VStack>
                              
                              {/* Date Range Filter */}
                              <HStack spacing={4} align="start">
                                <VStack spacing={1} align="start">
                                  <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>
                                    From
                                  </Text>
                                  <input
                                    type="date"
                                    value={repAnalysisStartDate}
                                    onChange={(e) => setRepAnalysisStartDate(e.target.value)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      backgroundColor: 'transparent',
                                      color: 'inherit'
                                    }}
                                  />
                                </VStack>
                                <VStack spacing={1} align="start">
                                  <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>
                                    To
                                  </Text>
                                  <input
                                    type="date"
                                    value={repAnalysisEndDate}
                                    onChange={(e) => setRepAnalysisEndDate(e.target.value)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '4px',
                                      backgroundColor: 'transparent',
                                      color: 'inherit'
                                    }}
                                  />
                                </VStack>
                              </HStack>
                            </VStack>
                            
                            {/* Middle Section - Stats Sub-header */}
                            <Box>
                              <Divider mb={4} />
                              <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
                                Stats
                              </Text>
                              
                              {/* Bottom Section - Three Summary Columns */}
                              <SimpleGrid columns={3} spacing={4}>
                                <Box 
                                  p={3} 
                                  textAlign="center"
                                >
                                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>
                                    Runs
                                  </Text>
                                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                                    {(() => {
                                      const allRuns = analytics.runTimes.recentRuns || [];
                                      const filteredRuns = allRuns.filter(run => {
                                        // Date range filter
                                        const runDate = new Date(run.created_at);
                                        let dateFilter = true;
                                        
                                        if (repAnalysisStartDate) {
                                          const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                                          const startDate = new Date(year, month - 1, day);
                                          startDate.setHours(0, 0, 0, 0);
                                          const runDateOnly = new Date(runDate);
                                          runDateOnly.setHours(0, 0, 0, 0);
                                          dateFilter = dateFilter && runDateOnly.getTime() === startDate.getTime();
                                        }
                                        
                                        if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                                          const [year, month, day] = repAnalysisEndDate.split('-').map(Number);
                                          const endDate = new Date(year, month - 1, day);
                                          endDate.setHours(23, 59, 59, 999);
                                          const runDateOnly = new Date(runDate);
                                          runDateOnly.setHours(0, 0, 0, 0);
                                          dateFilter = dateFilter && runDateOnly.getTime() === endDate.getTime();
                                        }
                                        
                                        // Event filter
                                        const exerciseName = run.exercise_name.toLowerCase();
                                        let eventMatch = true;
                                        
                                        if (repAnalysisEventFilter !== 'all') {
                                          if (repAnalysisEventFilter === '100m') {
                                            eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                                          } else if (repAnalysisEventFilter === '200m') {
                                            eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                                          } else if (repAnalysisEventFilter === '400m') {
                                            eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                                          } else if (repAnalysisEventFilter === '800m') {
                                            eventMatch = exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter');
                                          } else if (repAnalysisEventFilter === '1500m') {
                                            eventMatch = exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter');
                                          } else if (repAnalysisEventFilter === '5000m') {
                                            eventMatch = exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km');
                                          }
                                        }
                                        
                                        return dateFilter && eventMatch;
                                      });
                                      
                                      // Use the same deduplication logic as the chart
                                      const uniqueSetReps = new Set();
                                      
                                      filteredRuns.forEach(run => {
                                        const notes = run.notes || '';
                                        const setRepMatch = notes.match(/Set (\d+), Rep (\d+)/);
                                        if (setRepMatch) {
                                          const setNumber = parseInt(setRepMatch[1]);
                                          const repNumber = parseInt(setRepMatch[2]);
                                          uniqueSetReps.add(`${setNumber}-${repNumber}`);
                                        } else {
                                          // For runs without set/rep info, use id
                                          uniqueSetReps.add(run.id);
                                        }
                                      });
                                      
                                      return uniqueSetReps.size;
                                    })()}
                                  </Text>
                                </Box>
                                
                                <Box 
                                  p={3} 
                                  textAlign="center"
                                >
                                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>
                                    Best Time
                                  </Text>
                                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                                    {(() => {
                                      const allRuns = analytics.runTimes.recentRuns || [];
                                      const filteredRuns = allRuns.filter(run => {
                                        // Date range filter
                                        const runDate = new Date(run.created_at);
                                        let dateFilter = true;
                                        
                                        if (repAnalysisStartDate) {
                                          const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                                          const startDate = new Date(year, month - 1, day);
                                          startDate.setHours(0, 0, 0, 0);
                                          const runDateOnly = new Date(runDate);
                                          runDateOnly.setHours(0, 0, 0, 0);
                                          dateFilter = dateFilter && runDateOnly.getTime() === startDate.getTime();
                                        }
                                        
                                        if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                                          const [year, month, day] = repAnalysisEndDate.split('-').map(Number);
                                          const endDate = new Date(year, month - 1, day);
                                          endDate.setHours(23, 59, 59, 999);
                                          const runDateOnly = new Date(runDate);
                                          runDateOnly.setHours(0, 0, 0, 0);
                                          dateFilter = dateFilter && runDateOnly.getTime() === endDate.getTime();
                                        }
                                        
                                        // Event filter
                                        const exerciseName = run.exercise_name.toLowerCase();
                                        let eventMatch = true;
                                        
                                        if (repAnalysisEventFilter !== 'all') {
                                          if (repAnalysisEventFilter === '100m') {
                                            eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                                          } else if (repAnalysisEventFilter === '200m') {
                                            eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                                          } else if (repAnalysisEventFilter === '400m') {
                                            eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                                          } else if (repAnalysisEventFilter === '800m') {
                                            eventMatch = exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter');
                                          } else if (repAnalysisEventFilter === '1500m') {
                                            eventMatch = exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter');
                                          } else if (repAnalysisEventFilter === '5000m') {
                                            eventMatch = exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km');
                                          }
                                        }
                                        
                                        return dateFilter && eventMatch;
                                      });
                                      
                                      // Parse notes to extract set/rep information (same logic as chart)
                                      const parsedRuns = filteredRuns.map(run => {
                                        const notes = run.notes || '';
                                        const setRepMatch = notes.match(/Set (\d+), Rep (\d+)/);
                                        if (setRepMatch) {
                                          const setNumber = parseInt(setRepMatch[1]);
                                          const repNumber = parseInt(setRepMatch[2]);
                                          return {
                                            ...run,
                                            setNumber,
                                            repNumber
                                          };
                                        }
                                        return run;
                                      });
                                      
                                      // Remove duplicates based on set/rep combination (same logic as chart)
                                      const uniqueRuns = [];
                                      const seen = new Set();
                                      
                                      parsedRuns.forEach(run => {
                                        if (run.setNumber && run.repNumber) {
                                          const key = `${run.setNumber}-${run.repNumber}`;
                                          if (!seen.has(key)) {
                                            seen.add(key);
                                            uniqueRuns.push(run);
                                          }
                                        } else {
                                          // For runs without set/rep info, use the original deduplication
                                          const uniqueKey = `${run.id}-${run.created_at}-${run.exercise_name}`;
                                          if (!seen.has(uniqueKey)) {
                                            seen.add(uniqueKey);
                                            uniqueRuns.push(run);
                                          }
                                        }
                                      });
                                      
                                      if (uniqueRuns.length === 0) return 'N/A';
                                      
                                      // Calculate total time in seconds for each run
                                      const runTimes = uniqueRuns.map(run => {
                                        const totalSeconds = (run.time_minutes * 60) + run.time_seconds + (run.time_hundredths / 100);
                                        return totalSeconds;
                                      });
                                      
                                      const bestTime = Math.min(...runTimes);
                                      const minutes = Math.floor(bestTime / 60);
                                      const seconds = (bestTime % 60).toFixed(2);
                                      return `${minutes}:${seconds.padStart(5, '0')}`;
                                    })()}
                                  </Text>
                                </Box>
                                
                                <Box 
                                  p={3} 
                                  textAlign="center"
                                >
                                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>
                                    Avg Time
                                  </Text>
                                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                                    {(() => {
                                      const allRuns = analytics.runTimes.recentRuns || [];
                                      const filteredRuns = allRuns.filter(run => {
                                        // Date range filter
                                        const runDate = new Date(run.created_at);
                                        let dateFilter = true;
                                        
                                        if (repAnalysisStartDate) {
                                          const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                                          const startDate = new Date(year, month - 1, day);
                                          startDate.setHours(0, 0, 0, 0);
                                          const runDateOnly = new Date(runDate);
                                          runDateOnly.setHours(0, 0, 0, 0);
                                          dateFilter = dateFilter && runDateOnly.getTime() === startDate.getTime();
                                        }
                                        
                                        if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                                          const [year, month, day] = repAnalysisEndDate.split('-').map(Number);
                                          const endDate = new Date(year, month - 1, day);
                                          endDate.setHours(23, 59, 59, 999);
                                          const runDateOnly = new Date(runDate);
                                          runDateOnly.setHours(0, 0, 0, 0);
                                          dateFilter = dateFilter && runDateOnly.getTime() === endDate.getTime();
                                        }
                                        
                                        // Event filter
                                        const exerciseName = run.exercise_name.toLowerCase();
                                        let eventMatch = true;
                                        
                                        if (repAnalysisEventFilter !== 'all') {
                                          if (repAnalysisEventFilter === '100m') {
                                            eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                                          } else if (repAnalysisEventFilter === '200m') {
                                            eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                                          } else if (repAnalysisEventFilter === '400m') {
                                            eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                                          } else if (repAnalysisEventFilter === '800m') {
                                            eventMatch = exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter');
                                          } else if (repAnalysisEventFilter === '1500m') {
                                            eventMatch = exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter');
                                          } else if (repAnalysisEventFilter === '5000m') {
                                            eventMatch = exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km');
                                          }
                                        }
                                        
                                        return dateFilter && eventMatch;
                                      });
                                      
                                      // Deduplicate runs based on id, created_at, and exercise_name combination
                                      const uniqueRuns = [];
                                      const seen = new Set();
                                      filteredRuns.forEach(run => {
                                        // Create a unique key based on multiple fields to avoid duplicates
                                        const uniqueKey = `${run.id}-${run.created_at}-${run.exercise_name}`;
                                        if (!seen.has(uniqueKey)) {
                                          seen.add(uniqueKey);
                                          uniqueRuns.push(run);
                                        }
                                      });
                                      
                                      if (uniqueRuns.length === 0) return 'N/A';
                                      
                                      // Calculate total time in seconds for each run
                                      const runTimes = uniqueRuns.map(run => {
                                        const totalSeconds = (run.time_minutes * 60) + run.time_seconds + (run.time_hundredths / 100);
                                        return totalSeconds;
                                      });
                                      
                                      const avgTime = runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length;
                                      const minutes = Math.floor(avgTime / 60);
                                      const seconds = (avgTime % 60).toFixed(2);
                                      return `${minutes}:${seconds.padStart(5, '0')}`;
                                    })()}
                                  </Text>
                                </Box>
                              </SimpleGrid>
                            </Box>
                          </VStack>
                          
                          {/* Divider */}
                          <Box w="1px" bg={useColorModeValue('gray.200', 'gray.600')} />
                          
                          {/* Column 2 - Calendar */}
                          <Box 
                            position="relative"
                            p={4} 
                            h="400px"
                            left="20px"
                            right="20px"
                            flex="1"
                            display="flex"
                            flexDirection="column"
                          >
                            {/* Left divider */}
                            <Box 
                              position="absolute" 
                              left="0" 
                              top="0" 
                              bottom="0" 
                              w="1px" 
                              bg={useColorModeValue('gray.200', 'gray.700')} 
                              zIndex={1}
                            />
                            {/* Right divider */}
                            <Box 
                              position="absolute" 
                              right="0" 
                              top="0" 
                              bottom="0" 
                              w="1px" 
                              bg={useColorModeValue('gray.200', 'gray.700')} 
                              zIndex={1}
                            />
                            {/* Simple Calendar */}
                            <VStack spacing={3} flex="1">
                              {/* Calendar Header */}
                              <HStack justify="space-between" align="center" w="100%">
                                <IconButton
                                  size="sm"
                                  icon={<Icon as={FaChevronLeft} />}
                                  onClick={() => {
                                    const newDate = new Date(calendarDate);
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    setCalendarDate(newDate);
                                  }}
                                  variant="ghost"
                                  colorScheme="gray"
                                  aria-label="Previous month"
                                />
                                <Text fontSize="md" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                                </Text>
                                <IconButton
                                  size="sm"
                                  icon={<Icon as={FaChevronRight} />}
                                  onClick={() => {
                                    const newDate = new Date(calendarDate);
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    setCalendarDate(newDate);
                                  }}
                                  variant="ghost"
                                  colorScheme="gray"
                                  aria-label="Next month"
                                />
                              </HStack>
                              
                              {/* Weekday Headers */}
                              <SimpleGrid columns={7} spacing={0} w="100%">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                  <Box key={day} textAlign="center" py={2}>
                                    <Text fontSize="xs" fontWeight="medium" color={useColorModeValue('gray.500', 'gray.400')}>
                                      {day}
                                    </Text>
                                  </Box>
                                ))}
                              </SimpleGrid>
                              
                              {/* Calendar Days */}
                              <SimpleGrid columns={7} spacing={4} w="100%" flex="1">
                                {(() => {
                                  const year = calendarDate.getFullYear();
                                  const month = calendarDate.getMonth();
                                  const firstDay = new Date(year, month, 1);
                                  const lastDay = new Date(year, month + 1, 0);
                                  const startWeekday = firstDay.getDay();
                                  const daysInMonth = lastDay.getDate();
                                  const today = new Date();
                                  
                                  // Get workout dates and types for the current month
                                  const workoutDates = new Map(); // date -> workout types
                                  
                                  // Check all recent runs (not just multi-rep workouts) - calendar should show all data regardless of top date range
                                  const allRuns = athleteData?.allExerciseResults || [];
                                  
                                  allRuns.forEach(run => {
                                    const workoutDate = new Date(run.created_at);
                                    if (workoutDate.getMonth() === month && workoutDate.getFullYear() === year) {
                                      const day = workoutDate.getDate();
                                      const exerciseName = run.exercise_name.toLowerCase();
                                      
                                      // Determine workout type based on exercise name
                                      let workoutType = 'general';
                                      if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
                                        workoutType = 'sprint';
                                      } else if (exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter')) {
                                        workoutType = 'sprint';
                                      } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
                                        workoutType = '400m';
                                      } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter')) {
                                        workoutType = 'midDistance';
                                      } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
                                        workoutType = 'longDistance';
                                      } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km')) {
                                        workoutType = 'longDistance';
                                      }
                                      
                                      if (!workoutDates.has(day)) {
                                        workoutDates.set(day, new Set());
                                      }
                                      workoutDates.get(day).add(workoutType);
                                    }
                                  });
                                  
                                  const days = [];
                                  
                                  // Add empty cells for days before month starts
                                  for (let i = 0; i < startWeekday; i++) {
                                    days.push(<Box key={`empty-${i}`} h="32px" />);
                                  }
                                  
                                  // Add days of the month
                                  for (let day = 1; day <= daysInMonth; day++) {
                                    const dayWorkouts = workoutDates.get(day);
                                    const hasWorkout = dayWorkouts && dayWorkouts.size > 0;
                                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                    const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                                    
                                    days.push(
                                      <Box 
                                        key={day} 
                                        h="32px" 
                                        w="32px"
                                        position="relative"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        cursor="pointer"
                                        className="group"
                                        onClick={() => {
                                          const newSelectedDate = new Date(year, month, day);
                                          setSelectedDate(newSelectedDate);
                                          // Update filters to show only this day
                                          const dateString = newSelectedDate.toISOString().split('T')[0];
                                          setRepAnalysisStartDate(dateString);
                                          setRepAnalysisEndDate(dateString);
                                          console.log('Calendar day clicked:', dateString, 'Selected date:', newSelectedDate);
                                          console.log('Setting date range to:', dateString, 'to', dateString);
                                        }}
                                        _hover={{
                                          bg: useColorModeValue('gray.100', 'gray.600'),
                                          borderRadius: 'full'
                                        }}
                                      >
                                        <Text 
                                          fontSize="xs" 
                                          color={isSelected ? 'white' : useColorModeValue('gray.700', 'gray.300')}
                                          fontWeight={isSelected ? 'bold' : 'normal'}
                                          zIndex={2}
                                          position="relative"
                                        >
                                          {day}
                                        </Text>
                                        {isSelected && (() => {
                                          // Determine background color based on workout types
                                          let bgColor = 'green.500'; // default
                                          if (dayWorkouts && dayWorkouts.has('sprint')) {
                                            bgColor = 'red.500'; // Sprint - Red
                                          } else if (dayWorkouts && dayWorkouts.has('400m')) {
                                            bgColor = 'green.500'; // 400m - Green
                                          } else if (dayWorkouts && dayWorkouts.has('midDistance')) {
                                            bgColor = 'orange.500'; // Mid Distance - Orange
                                          } else if (dayWorkouts && dayWorkouts.has('longDistance')) {
                                            bgColor = 'blue.500'; // Long Distance - Blue
                                          } else if (hasWorkout) {
                                            bgColor = 'green.500'; // General - Green
                                          } else {
                                            bgColor = useColorModeValue('gray.100', 'gray.600'); // Default gray for selected without workout
                                          }
                                          
                                          return (
                                            <Box
                                              position="absolute"
                                              top="50%"
                                              left="50%"
                                              transform="translate(-50%, -50%)"
                                              w="32px"
                                              h="32px"
                                              borderRadius="full"
                                              bg={bgColor}
                                              zIndex={0}
                                            />
                                          );
                                        })()}
                                        <Box
                                          position="absolute"
                                          top="50%"
                                          left="50%"
                                          transform="translate(-50%, -50%)"
                                          w="32px"
                                          h="32px"
                                          borderRadius="full"
                                          opacity="0"
                                          _groupHover={{
                                            opacity: isSelected ? 0 : 1,
                                            bg: (() => {
                                              // Determine hover color based on workout types
                                              let bgColor = 'green.500'; // default
                                              if (dayWorkouts && dayWorkouts.has('sprint')) {
                                                bgColor = 'red.500'; // Sprint - Red
                                              } else if (dayWorkouts && dayWorkouts.has('400m')) {
                                                bgColor = 'green.500'; // 400m - Green
                                              } else if (dayWorkouts && dayWorkouts.has('midDistance')) {
                                                bgColor = 'orange.500'; // Mid Distance - Orange
                                              } else if (dayWorkouts && dayWorkouts.has('longDistance')) {
                                                bgColor = 'blue.500'; // Long Distance - Blue
                                              } else if (hasWorkout) {
                                                bgColor = 'green.500'; // General - Green
                                              } else {
                                                bgColor = useColorModeValue('gray.100', 'gray.600'); // Default gray
                                              }
                                              return bgColor;
                                            })()
                                          }}
                                          transition="opacity 0.2s"
                                          zIndex={-1}
                                        />
                                        {hasWorkout && !isSelected && (() => {
                                          // Determine circle color based on workout types
                                          let borderColor = 'green.500'; // default
                                          if (dayWorkouts.has('sprint')) {
                                            borderColor = 'red.500'; // Sprint - Red
                                          } else if (dayWorkouts.has('400m')) {
                                            borderColor = 'green.500'; // 400m - Green
                                          } else if (dayWorkouts.has('midDistance')) {
                                            borderColor = 'orange.500'; // Mid Distance - Orange
                                          } else if (dayWorkouts.has('longDistance')) {
                                            borderColor = 'blue.500'; // Long Distance - Blue
                                          } else {
                                            borderColor = 'green.500'; // General - Green
                                          }
                                          
                                          return (
                                            <Box
                                              position="absolute"
                                              top="50%"
                                              left="50%"
                                              transform="translate(-50%, -50%)"
                                              w="26px"
                                              h="26px"
                                              borderRadius="full"
                                              border="2px solid"
                                              borderColor={borderColor}
                                              opacity="0.8"
                                            />
                                          );
                                        })()}
                                        {isToday && (
                                          <Box
                                            position="absolute"
                                            bottom="-2px"
                                            left="50%"
                                            transform="translateX(-50%)"
                                            w="4px"
                                            h="4px"
                                            borderRadius="full"
                                            bg="blue.500"
                                          />
                                        )}
                                      </Box>
                                    );
                                  }
                                  
                                  // Fill remaining cells to complete the grid
                                  const totalCells = 42; // 6 weeks * 7 days
                                  while (days.length < totalCells) {
                                    days.push(<Box key={`empty-end-${days.length}`} h="32px" />);
                                  }
                                  
                                  return days;
                                })()}
                              </SimpleGrid>
                            </VStack>
                          </Box>
                          
                          {/* Divider */}
                          <Box w="1px" bg={useColorModeValue('gray.200', 'gray.600')} />
                          
                          {/* Column 3 - Calendar Tags */}
                          <Box 
                            p={8} 
                            h="300px"
                            flex="1"
                            display="flex"
                            flexDirection="column"
                            alignItems="start"
                            justifyContent="start"
                          >
                            <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.700', 'white')} mb={3}>
                              Calendar Tags
                            </Text>
                            <VStack spacing={2} align="start" w="100%">
                              {/* 100m Tag */}
                              <HStack spacing={2}>
                                <Box 
                                  w="12px" 
                                  h="12px" 
                                  borderRadius="full" 
                                  border="2px solid" 
                                  borderColor="red.500"
                                  bg="transparent"
                                />
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                                  100m
                                </Text>
                              </HStack>
                              
                              {/* 200m Tag */}
                              <HStack spacing={2}>
                                <Box 
                                  w="12px" 
                                  h="12px" 
                                  borderRadius="full" 
                                  border="2px solid" 
                                  borderColor="orange.500"
                                  bg="transparent"
                                />
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                                  200m
                                </Text>
                              </HStack>
                              
                              {/* 400m Tag */}
                              <HStack spacing={2}>
                                <Box 
                                  w="12px" 
                                  h="12px" 
                                  borderRadius="full" 
                                  border="2px solid" 
                                  borderColor="green.500"
                                  bg="transparent"
                                />
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                                  400m
                                </Text>
                              </HStack>
                              
                              {/* Today Tag */}
                              <HStack spacing={2}>
                                <Box 
                                  w="12px" 
                                  h="12px" 
                                  borderRadius="full" 
                                  bg="blue.500"
                                />
                                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                                  Today
                                </Text>
                              </HStack>
                            </VStack>
                          </Box>
                          

                        </HStack>
                      </Box>

                      {/* Main Chart Section */}
                      <Box>
                        <Text fontWeight="bold" mb={3} px={{ base: 4, md: 0 }}>Rep Progression Analysis</Text>
                        
                        {/* Tabbed Interface */}
                        <Box mb={4} px={{ base: 4, md: 0 }}>
                                                  {(() => {
                          // Get all runs for the selected date range to calculate set counts
                          const allRuns = analytics.runTimes.allRuns || [];
                          
                          // Apply the same filters as the main logic
                          const filteredRunsForTabs = allRuns.filter(run => {
                            // Date range filter
                            const runDate = new Date(run.created_at);
                              let dateFilter = true;
                              
                              if (repAnalysisStartDate) {
                                const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                                const startDate = new Date(year, month - 1, day);
                                startDate.setHours(0, 0, 0, 0);
                                const runDateOnly = new Date(runDate);
                                runDateOnly.setHours(0, 0, 0, 0);
                                dateFilter = dateFilter && (runDateOnly.getTime() === startDate.getTime());
                              }
                              
                              if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                                const endDate = new Date(repAnalysisEndDate);
                                endDate.setHours(23, 59, 59, 999);
                                dateFilter = dateFilter && (runDate <= endDate);
                              }
                              
                              // Event type filter
                              const exerciseName = run.exercise_name.toLowerCase();
                              let eventMatch = true;
                              
                              if (repAnalysisEventFilter !== 'all') {
                                if (repAnalysisEventFilter === '100m') {
                                  eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                                } else if (repAnalysisEventFilter === '200m') {
                                  eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                                } else if (repAnalysisEventFilter === '400m') {
                                  eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                                }
                              }
                              
                              return dateFilter && eventMatch;
                            });
                            
                            // Parse set information for tab calculation
                            const parsedRunsForTabs = filteredRunsForTabs.map(run => {
                              let setNumber = 1;
                              if (run.notes) {
                                const setRepMatch = run.notes.match(/Set (\d+), Rep (\d+)/);
                                if (setRepMatch) {
                                  setNumber = parseInt(setRepMatch[1]);
                                }
                              }
                              return { setNumber };
                            });
                            
                            // Calculate set counts
                            const set1Count = parsedRunsForTabs.filter(r => r.setNumber === 1).length;
                            const set2Count = parsedRunsForTabs.filter(r => r.setNumber === 2).length;
                            const set3Count = parsedRunsForTabs.filter(r => r.setNumber === 3).length;
                            
                            return (
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant={repAnalysisTab === 'all' ? 'solid' : 'outline'}
                              colorScheme="blue"
                              onClick={() => setRepAnalysisTab('all')}
                            >
                              All Runs
                            </Button>
                                {set1Count > 0 && (
                            <Button
                              size="sm"
                              variant={repAnalysisTab === 'set1' ? 'solid' : 'outline'}
                              colorScheme="blue"
                              onClick={() => setRepAnalysisTab('set1')}
                            >
                              Set 1
                            </Button>
                                )}
                                {set2Count > 0 && (
                            <Button
                              size="sm"
                              variant={repAnalysisTab === 'set2' ? 'solid' : 'outline'}
                              colorScheme="blue"
                              onClick={() => setRepAnalysisTab('set2')}
                            >
                              Set 2
                            </Button>
                                )}
                                {set3Count > 0 && (
                            <Button
                              size="sm"
                              variant={repAnalysisTab === 'set3' ? 'solid' : 'outline'}
                              colorScheme="blue"
                              onClick={() => setRepAnalysisTab('set3')}
                            >
                              Set 3
                            </Button>
                                )}
                          </HStack>
                            );
                          })()}
                        </Box>
                        {(() => {
                          // Get all runs for the selected date range
                          const allRuns = analytics.runTimes.allRuns || [];
                          
                          // Apply filters
                          console.log('Filtering runs with dates:', repAnalysisStartDate, repAnalysisEndDate);
                          console.log('Total runs to filter:', allRuns.length);
                          console.log('All runs data:', allRuns.map(run => ({
                            id: run.id,
                            exercise_name: run.exercise_name,
                            created_at: run.created_at,
                            time_minutes: run.time_minutes,
                            time_seconds: run.time_seconds,
                            time_hundredths: run.time_hundredths,
                            has_time_data: run.has_time_data,
                            date: new Date(run.created_at).toLocaleDateString()
                          })));
                          const filteredRuns = allRuns.filter(run => {
                            // Date range filter - reps tab is independent of top date range selector
                            const runDate = new Date(run.created_at);
                            const runDateOnly = new Date(runDate);
                            runDateOnly.setHours(0, 0, 0, 0);
                            let dateFilter = true;
                            
                            // Only apply date filtering if specific dates are selected (from calendar)
                            if (repAnalysisStartDate && repAnalysisEndDate) {
                              const [startYear, startMonth, startDay] = repAnalysisStartDate.split('-').map(Number);
                              const [endYear, endMonth, endDay] = repAnalysisEndDate.split('-').map(Number);
                              
                              const startDate = new Date(startYear, startMonth - 1, startDay);
                              startDate.setHours(0, 0, 0, 0);
                              
                              const endDate = new Date(endYear, endMonth - 1, endDay);
                              endDate.setHours(23, 59, 59, 999);
                              
                              dateFilter = runDateOnly >= startDate && runDateOnly <= endDate;
                              
                              console.log('Reps tab date filtering:', {
                                runDate: runDateOnly.toISOString(),
                                startDate: startDate.toISOString(),
                                endDate: endDate.toISOString(),
                                dateFilter,
                                exerciseName: run.exercise_name,
                                repAnalysisStartDate,
                                repAnalysisEndDate
                              });
                            } else {
                              // If no specific dates selected in reps tab calendar, show no data (empty graphs)
                              // But since we auto-select today's date, this should rarely happen
                              dateFilter = false;
                              console.log('No date filter applied - showing no data for:', run.exercise_name, 'dateFilter:', dateFilter, 'date:', runDateOnly.toLocaleDateString());
                            }
                            
                            // Event type filter
                            const exerciseName = run.exercise_name.toLowerCase();
                            let eventMatch = true;
                            
                            console.log('Event filter check:', { exerciseName, repAnalysisEventFilter });
                            
                            if (repAnalysisEventFilter !== 'all') {
                              if (repAnalysisEventFilter === '100m') {
                                eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                              } else if (repAnalysisEventFilter === '200m') {
                                eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                              } else if (repAnalysisEventFilter === '400m') {
                                eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                              } else if (repAnalysisEventFilter === '800m') {
                                eventMatch = exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter');
                              } else if (repAnalysisEventFilter === '1500m') {
                                eventMatch = exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter');
                              } else if (repAnalysisEventFilter === '5000m') {
                                eventMatch = exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km');
                              }
                            }
                            
                            const finalResult = dateFilter && eventMatch;
                            console.log('Final filter result for', run.exercise_name, ':', { dateFilter, eventMatch, finalResult });
                            return finalResult;
                          });
                          
                          console.log('Filtered runs count:', filteredRuns.length);
                          console.log('Runs filtered out by date:', allRuns.filter(run => {
                            const runDate = new Date(run.created_at);
                            const runDateOnly = new Date(runDate);
                            runDateOnly.setHours(0, 0, 0, 0);
                            const today = new Date();
                            today.setHours(23, 59, 59, 999);
                            return runDateOnly > today;
                          }).map(run => ({
                            exercise_name: run.exercise_name,
                            created_at: run.created_at,
                            date: new Date(run.created_at).toLocaleDateString()
                          })));
                          
                          if (filteredRuns.length === 0) {
                            return (
                              <VStack spacing={4}>
                                <Card bg={cardBg} borderColor={borderColor} boxShadow="none">
                                  <CardBody>
                                    <VStack spacing={3} align="stretch">
                                      <HStack justify="space-between">
                                        <Text fontWeight="bold" fontSize="sm">
                                          No Exercise Data
                                  </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {selectedDate ? selectedDate.toLocaleDateString() : 'No date selected'}
                                        </Text>
                                      </HStack>
                                      
                                      <HStack spacing={6} mb={4}>
                                        <VStack spacing={1}>
                                          <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                            Total Runs
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            0
                                  </Text>
                                </VStack>
                                        <VStack spacing={1}>
                                          <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                            Best Time
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            N/A
                                          </Text>
                                        </VStack>
                                        <VStack spacing={1}>
                                          <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                            Avg Time
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            N/A
                                          </Text>
                                        </VStack>
                                      </HStack>
                                      
                                      {/* Run Times Chart */}
                                      <Box>
                                        <Text fontSize="xs" fontWeight="medium" mb={2}>Run Times:</Text>
                                        <Box bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" px={1} py={10} position="relative">
                                          <Box h="300px" position="relative" pt={2}>
                                            <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                  <svg width="100%" height="240" viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                    {/* Grid lines */}
                                    {Array.from({ length: 5 }, (_, i) => {
                                      const y = 240 - (i * (240 / 4));
                                      return (
                                        <g key={`y-${i}`}>
                                          <line
                                            x1="0"
                                            y1={y}
                                            x2="1000"
                                            y2={y}
                                            stroke={useColorModeValue('#F3F4F6', '#374151')}
                                            strokeWidth="1"
                                            opacity={0.3}
                                          />
                                        </g>
                                      );
                                    })}
                                    
                                    {/* Empty state message centered in chart */}
                                    <g>
                                      <text x="500" y="120" textAnchor="middle" fill={useColorModeValue('#6B7280', '#9CA3AF')} fontSize="14" fontFamily="system-ui">
                                        {selectedDate ? `No runtime data for ${selectedDate.toLocaleDateString()}` : 'No runtime data available'}
                                      </text>
                                      <text x="500" y="140" textAnchor="middle" fill={useColorModeValue('#9CA3AF', '#6B7280')} fontSize="12" fontFamily="system-ui">
                                        {selectedDate ? 'Try selecting a different date' : 'Complete running exercises with time data'}
                                      </text>
                                    </g>
                                  </svg>
                              </Box>
                                
                                {/* Y-axis labels positioned outside chart */}
                                <Box position="absolute" left="0" top="0" h="240px" w="70px">
                                  {Array.from({ length: 5 }, (_, i) => {
                                    const y = 240 - (i * (240 / 4));
                                    return (
                                      <Text
                                        key={`y-label-${i}`}
                                        position="absolute"
                                        left="0"
                                        top={`${y - 8}px`}
                                        fontSize="10px"
                                        color={useColorModeValue('#6B7280', '#9CA3AF')}
                                        textAlign="right"
                                        w="70px"
                                        pr="10px"
                                      >
                                        {i === 0 ? '22.0s' : i === 1 ? '23.5s' : i === 2 ? '25.0s' : i === 3 ? '26.5s' : '28.0s'}
                                      </Text>
                                    );
                                  })}
                                </Box>
                                
                                {/* X-axis labels positioned outside chart */}
                                <Box position="absolute" left="80px" right="20px" bottom="-30px" h="30px">
                                  {Array.from({ length: 5 }, (_, i) => {
                                    let x;
                                    if (i === 0) {
                                      x = "0%";
                                    } else if (i === 4) {
                                      x = "100%";
                                    } else {
                                      x = `${(i / 4) * 100}%`;
                                    }
                                    
                                    return (
                                      <Text
                                        key={`x-label-${i}`}
                                        position="absolute"
                                        left={x}
                                        bottom="0"
                                        fontSize="10px"
                                        color={useColorModeValue('#6B7280', '#9CA3AF')}
                                        textAlign={i === 4 ? "right" : i === 0 ? "left" : "center"}
                                        transform={i === 4 ? "translateX(-100%)" : i === 0 ? "translateX(0%)" : "translateX(-50%)"}
                                        maxW="80px"
                                        isTruncated
                                      >
                                        {i === 0 ? 'Jul 1' : i === 1 ? 'Jul 8' : i === 2 ? 'Jul 15' : i === 3 ? 'Jul 22' : 'Jul 29'}
                                      </Text>
                                    );
                                  })}
                                </Box>
                                  </Box>
                                </Box>
                              </Box>
                                    </VStack>
                                  </CardBody>
                                </Card>
                              </VStack>
                            );
                          }
                          
                          // Parse set/rep information and group runs
                          const parsedRuns = filteredRuns.map(run => {
                            const totalSeconds = (run.time_minutes || 0) * 60 + (run.time_seconds || 0) + (run.time_hundredths || 0) / 100;
                            const formattedTime = `${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`;
                            
                            // Parse set and rep from notes
                            let setNumber = 1;
                            let repNumber = 1;
                            if (run.notes) {
                              console.log('Parsing notes:', run.notes);
                              const setRepMatch = run.notes.match(/Set (\d+), Rep (\d+)/);
                              if (setRepMatch) {
                                setNumber = parseInt(setRepMatch[1]);
                                repNumber = parseInt(setRepMatch[2]);
                                console.log('Parsed set/rep:', { setNumber, repNumber, notes: run.notes });
                              } else {
                                console.log('No set/rep match found in notes:', run.notes);
                              }
                            } else {
                              console.log('No notes field for run:', run.id);
                            }
                            
                            return {
                              id: run.id,
                              exerciseName: run.exercise_name,
                              time: totalSeconds,
                              formattedTime,
                              created_at: run.created_at,
                              notes: run.notes,
                              setNumber,
                              repNumber
                            };
                          });
                          
                          // Remove duplicates based on set/rep combination
                          const uniqueRuns = [];
                          const seen = new Set();
                          
                          parsedRuns.forEach(run => {
                            const key = `${run.setNumber}-${run.repNumber}`;
                            if (!seen.has(key)) {
                              seen.add(key);
                              uniqueRuns.push(run);
                            } else {
                              console.log('Duplicate found and removed:', { setNumber: run.setNumber, repNumber: run.repNumber, id: run.id, exerciseName: run.exerciseName });
                            }
                          });
                          
                          // Check for 100m sprint data specifically
                          const sprint100mRuns = parsedRuns.filter(run => run.exerciseName.toLowerCase().includes('100m'));
                          console.log('100m sprint runs found:', sprint100mRuns.length);
                          if (sprint100mRuns.length > 0) {
                            console.log('100m sprint runs:', sprint100mRuns.map(run => ({
                              id: run.id,
                              exerciseName: run.exerciseName,
                              setNumber: run.setNumber,
                              repNumber: run.repNumber,
                              time: run.time,
                              notes: run.notes,
                              created_at: run.created_at,
                              date: new Date(run.created_at).toLocaleDateString()
                            })));
                          }
                          
                          console.log('After removing duplicates:', {
                            originalCount: parsedRuns.length,
                            uniqueCount: uniqueRuns.length,
                            duplicatesRemoved: parsedRuns.length - uniqueRuns.length
                          });
                          
                          console.log('Parsed runs:', parsedRuns.map(r => ({
                            id: r.id,
                            exerciseName: r.exerciseName,
                            setNumber: r.setNumber,
                            repNumber: r.repNumber,
                            time: r.time,
                            notes: r.notes,
                            created_at: r.created_at,
                            date: new Date(r.created_at).toLocaleDateString()
                          })));
                          
                          // Filter runs based on selected tab
                          let filteredByTab = uniqueRuns;
                          if (repAnalysisTab === 'set1') {
                            filteredByTab = uniqueRuns.filter(run => run.setNumber === 1);
                          } else if (repAnalysisTab === 'set2') {
                            filteredByTab = uniqueRuns.filter(run => run.setNumber === 2);
                          } else if (repAnalysisTab === 'set3') {
                            filteredByTab = uniqueRuns.filter(run => run.setNumber === 3);
                          }
                          
                          console.log('Tab filtering:', {
                            selectedTab: repAnalysisTab,
                            totalParsedRuns: parsedRuns.length,
                            filteredByTabCount: filteredByTab.length,
                            set1Count: parsedRuns.filter(r => r.setNumber === 1).length,
                            set2Count: parsedRuns.filter(r => r.setNumber === 2).length,
                            set3Count: parsedRuns.filter(r => r.setNumber === 3).length
                          });
                          
                          // Group runs by exercise name
                          const runsByExercise = {};
                          
                          console.log('Final filtered runs for display:', filteredByTab.map(run => ({
                            id: run.id,
                            exerciseName: run.exerciseName,
                            setNumber: run.setNumber,
                            repNumber: run.repNumber,
                            time: run.time,
                            notes: run.notes,
                            created_at: run.created_at,
                            date: new Date(run.created_at).toLocaleDateString()
                          })));
                          
                          filteredByTab.forEach(run => {
                            const exerciseName = run.exerciseName;
                            if (!runsByExercise[exerciseName]) {
                              runsByExercise[exerciseName] = [];
                            }
                            runsByExercise[exerciseName].push(run);
                          });
                          
                          return (
                            <VStack spacing={4}>
                              {Object.entries(runsByExercise).map(([exerciseName, runs], index) => {
                                const runsArray = runs as any[];
                                
                                // Sort runs by rep number for proper ordering
                                const sortedRuns = runsArray.sort((a, b) => a.repNumber - b.repNumber);
                                
                                const bestTime = Math.min(...sortedRuns.map(r => r.time));
                                const avgTime = sortedRuns.reduce((sum, r) => sum + r.time, 0) / sortedRuns.length;
                                const bestTimeFormatted = `${Math.floor(bestTime / 60)}:${(bestTime % 60).toFixed(2).padStart(5, '0')}`;
                                const avgTimeFormatted = `${Math.floor(avgTime / 60)}:${(avgTime % 60).toFixed(2).padStart(5, '0')}`;
                                
                                return (
                                  <Card key={index} bg={cardBg} borderColor={borderColor} boxShadow="none">
                                    <CardBody>
                                      <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between">
                                          <Text fontWeight="bold" fontSize="sm">
                                            {exerciseName}
                                          </Text>
                                          <Text fontSize="xs" color="gray.500">
                                            {new Date(runsArray[0].created_at).toLocaleDateString()}
                                          </Text>
                                        </HStack>
                                        
                                        <HStack spacing={6} mb={4}>
                                          <VStack spacing={1}>
                                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                              {repAnalysisTab === 'all' ? 'Total Runs' : 'Runs'}
                                            </Text>
                                            <Text fontSize="sm" fontWeight="medium">
                                              {sortedRuns.length}
                                            </Text>
                                          </VStack>
                                          <VStack spacing={1}>
                                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                              Best Time
                                            </Text>
                                            <Text fontSize="sm" fontWeight="medium">
                                              {bestTimeFormatted}
                                            </Text>
                                          </VStack>
                                          <VStack spacing={1}>
                                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                              Avg Time
                                            </Text>
                                            <Text fontSize="sm" fontWeight="medium">
                                              {avgTimeFormatted}
                                            </Text>
                                          </VStack>
                                        </HStack>
                                        
                                        {/* Run Times Chart */}
                                        <Box>
                                          <Text fontSize="xs" fontWeight="medium" mb={2}>Run Times:</Text>
                                          <Box bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" px={1} py={10} position="relative">
                                            <Box h="300px" position="relative" pt={2}>
                                              <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                                <svg width="100%" height="240" viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                  {/* Grid lines */}
                                                  {Array.from({ length: 5 }, (_, i) => (
                                                    <line
                                                      key={`grid-${i}`}
                                                      x1="0"
                                                      y1={i * 48}
                                                      x2="1000"
                                                      y2={i * 48}
                                                      stroke={useColorModeValue('#E5E7EB', '#374151')}
                                                      strokeWidth="1"
                                                      opacity="0.3"
                                                    />
                                                  ))}
                                                  
                                                  {/* Run times line */}
                                                  {(() => {
                                                    const times = sortedRuns.map(r => r.time);
                                                    const minTime = Math.min(...times);
                                                    const maxTime = Math.max(...times);
                                                    const timeRange = maxTime - minTime;
                                                    
                                                    // Handle single data point case
                                                    if (timeRange === 0) {
                                                      // For single data point, create a small range for visualization
                                                      const adjustedMinTime = minTime - 1;
                                                      const adjustedMaxTime = maxTime + 1;
                                                      const adjustedTimeRange = adjustedMaxTime - adjustedMinTime;
                                                      
                                                      const point = {
                                                        x: 500, // Center of chart
                                                        y: 120, // Center of chart
                                                        run: sortedRuns[0]
                                                      };
                                                      
                                                      return (
                                                        <g>
                                                          {/* Single point */}
                                                          <circle
                                                            cx={point.x}
                                                            cy={point.y}
                                                            r="6"
                                                            fill="#10B981"
                                                            stroke="white"
                                                            strokeWidth="2"
                                                            style={{ cursor: 'pointer' }}
                                                            onMouseEnter={(e) => {
                                                              setTooltipData({
                                                                text: `${point.run.formattedTime}`,
                                                                x: e.clientX + 10,
                                                                y: e.clientY - 30
                                                              });
                                                            }}
                                                            onMouseLeave={() => setTooltipData(null)}
                                                          />
                                                        </g>
                                                      );
                                                    }
                                                    
                                                    const points = sortedRuns.map((run, index) => {
                                                      const x = (index / (sortedRuns.length - 1)) * 900 + 50;
                                                      const y = 240 - ((run.time - minTime) / timeRange) * 200;
                                                      return { x, y, run };
                                                    });
                                                    
                                                    const pathData = points.map((point, index) => {
                                                      if (index === 0) return `M ${point.x},${point.y}`;
                                                      return `L ${point.x},${point.y}`;
                                                    }).join(' ');
                                                    
                                                    return (
                                                      <g>
                                                        {/* Average line */}
                                                        <line
                                                          x1="50"
                                                          y1={240 - ((avgTime - minTime) / timeRange) * 200}
                                                          x2="950"
                                                          y2={240 - ((avgTime - minTime) / timeRange) * 200}
                                                          stroke="#6B7280"
                                                          strokeWidth="1"
                                                          strokeDasharray="5,5"
                                                          opacity="0.6"
                                                        />
                                                        <path
                                                          d={pathData}
                                                          fill="none"
                                                          stroke="#10B981"
                                                          strokeWidth="3"
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeOpacity="0.8"
                                                        />
                                                        {points.map((point, index) => {
                                                          const timeString = point.run.formattedTime;
                                                          const repInfo = `Rep ${point.run.repNumber}${point.run.setNumber > 1 ? ` (Set ${point.run.setNumber})` : ''}`;
                                                          const tooltipText = `${repInfo}: ${timeString}`;
                                                          
                                                          return (
                                                            <circle
                                                              key={index}
                                                              cx={point.x}
                                                              cy={point.y}
                                                              r="4"
                                                              fill={point.run.time === bestTime ? "#10B981" : "#6B7280"}
                                                              stroke="white"
                                                              strokeWidth="1"
                                                              style={{ cursor: 'pointer' }}
                                                              onMouseEnter={(e) => {
                                                                setTooltipData({
                                                                  text: tooltipText,
                                                                  x: e.clientX + 10,
                                                                  y: e.clientY - 30
                                                                });
                                                              }}
                                                                                                                            onMouseLeave={() => {
                                                                setTooltipData(null);
                                                              }}
                                                            />
                                                          );
                                                        })}
                                                      </g>
                                                    );
                                                  })()}
                                                </svg>
                                              </Box>
                                              
                                              {/* Y-axis labels positioned outside chart */}
                                              <Box position="absolute" left="0" top="0" h="240px" w="70px">
                                                {(() => {
                                                  const times = sortedRuns.map(r => r.time);
                                                  const minTime = Math.min(...times);
                                                  const maxTime = Math.max(...times);
                                                  const timeRange = maxTime - minTime;
                                                  
                                                  return Array.from({ length: 5 }, (_, i) => {
                                                    const timeValue = minTime + (i * timeRange / 4);
                                                    const y = 240 - (i * (240 / 4));
                                                    return (
                                                      <Text
                                                        key={`y-label-${i}`}
                                                        position="absolute"
                                                        left="0"
                                                        top={`${y - 8}px`}
                                                        fontSize="10px"
                                                        color={useColorModeValue('#6B7280', '#9CA3AF')}
                                                        textAlign="right"
                                                        w="70px"
                                                        pr="10px"
                                                      >
                                                        {timeValue.toFixed(1)}s
                                                      </Text>
                                                    );
                                                  });
                                                })()}
                                              </Box>
                                              
                                              {/* X-axis labels positioned outside chart */}
                                              <Box position="absolute" left="130px" right="70px" bottom="-30px" h="30px">
                                                {sortedRuns.map((run, index) => {
                                                  // Use the exact same mathematical formula as the data points
                                                  // Data points: (index / (sortedRuns.length - 1)) * 900 + 50
                                                  // Labels: (index / (sortedRuns.length - 1)) * 100
                                                  const xPercent = (index / (sortedRuns.length - 1)) * 100;
                                                  
                                                  // For "All Runs" tab, show sequential numbers with color coding
                                                  if (repAnalysisTab === 'all') {
                                                    const runNumber = index + 1;
                                                    
                                                    // Color coding based on run number (every 7 runs = new color)
                                                    let textColor = '#6B7280'; // default gray
                                                    if (runNumber <= 7) {
                                                      textColor = '#3B82F6'; // blue for runs 1-7
                                                    } else if (runNumber <= 14) {
                                                      textColor = '#10B981'; // green for runs 8-14
                                                    } else if (runNumber <= 21) {
                                                      textColor = '#F59E0B'; // orange for runs 15-21
                                                    } else if (runNumber <= 28) {
                                                      textColor = '#8B5CF6'; // purple for runs 22-28
                                                    } else if (runNumber <= 35) {
                                                      textColor = '#EF4444'; // red for runs 29-35
                                                    } else if (runNumber <= 42) {
                                                      textColor = '#06B6D4'; // cyan for runs 36-42
                                                    } else {
                                                      textColor = '#F97316'; // amber for runs 43+
                                                    }
                                                    
                                                    return (
                                                      <Text
                                                        key={`x-label-${index}`}
                                                        position="absolute"
                                                        left={`${xPercent}%`}
                                                        bottom="0"
                                                        fontSize="10px"
                                                        color={textColor}
                                                        fontWeight="medium"
                                                        textAlign="center"
                                                        transform="translateX(-50%)"
                                                        maxW="40px"
                                                        isTruncated
                                                      >
                                                        {runNumber}
                                                      </Text>
                                                    );
                                                  } else {
                                                    // For individual set tabs, show "Run X"
                                                    return (
                                                      <Text
                                                        key={`x-label-${index}`}
                                                        position="absolute"
                                                        left={`${xPercent}%`}
                                                        bottom="0"
                                                        fontSize="10px"
                                                        color={useColorModeValue('#6B7280', '#9CA3AF')}
                                                        textAlign="center"
                                                        transform="translateX(-50%)"
                                                        maxW="40px"
                                                        isTruncated
                                                      >
                                                        Run {index + 1}
                                                      </Text>
                                                    );
                                                  }
                                                })}
                                              </Box>
                                            </Box>
                                          </Box>
                                        </Box>
                                      </VStack>
                                    </CardBody>
                                  </Card>
                                );
                              })}
                            </VStack>
                          );
                        })()}
                      </Box>
                      
                      {/* Custom Tooltip for Reps Tab */}
                      {tooltipData && (
                        <Box
                          position="fixed"
                          left={`${tooltipData.x}px`}
                          top={`${tooltipData.y}px`}
                          bg={useColorModeValue('gray.800', 'gray.200')}
                          color={useColorModeValue('white', 'black')}
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          zIndex={1000}
                          pointerEvents="none"
                          boxShadow="lg"
                        >
                          {tooltipData.text}
                        </Box>
                      )}
                    </VStack>
                  ) : (
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
                                
                                if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
                                  eventKey = '100m';
                                } else if (exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter')) {
                                  eventKey = '200m';
                                } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
                                  eventKey = '400m';
                                } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter')) {
                                  eventKey = '800m';
                                } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
                                  eventKey = '1500m';
                                } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km')) {
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
                  )}
                </CardBody>
              </Card>
              )}
            </VStack>

            {/* NEW COMPONENT - RunTimesAnalyticsSection - Remove old section when testing is complete*/}
            <Box mt={6}>
              <RunTimesAnalyticsSection 
                analytics={analytics}
                dateRange={dateRange}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </Box>
            
            {/* OLD RUNTIMES SECTION - Hidden for testing */}
            {SHOW_OLD_RUNTIMES && (
              <Box>
                {/* All the old runtimes code would go here */}
                <Text>Old runtimes section hidden</Text>
              </Box>
            )}
          </>
        ) : (
          <Card bg={cardBg}>
            <CardBody>
              <Text textAlign="center" color="gray.500" py={8}>
                No data available for the last {getDateRangeText()}.
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
} 