import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Box, Container, Flex, Heading, Text, VStack, Grid, GridItem, Icon, Badge, Card, CardHeader, CardBody, Image, Tag,
  Button, SimpleGrid, Progress, HStack, Stack, Spinner, Divider, Stat, StatLabel, StatNumber, StatHelpText, useToast,
  useColorModeValue, Skeleton, SkeletonText, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, IconButton, useDisclosure, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { dateUtils } from '../utils/date'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useSleepStats, getQualityText } from '../hooks/useSleepRecords'
import { useNutritionStats } from '../hooks/useNutritionRecords'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { MdPerson, MdOutlineWbSunny, MdKeyboardArrowRight } from 'react-icons/md'
import { FaCalendarAlt, FaRunning, FaBolt, FaMedal, FaListAlt, FaUsers, FaMapMarkerAlt, FaChartLine, FaCloudRain, FaSnowflake, FaSun, FaCloudSun, FaCloudMeatball, FaRegClock, FaPlayCircle, FaRobot } from 'react-icons/fa'
import { CheckIcon } from '@chakra-ui/icons'
import { useWorkoutStore } from '../lib/workoutStore'
import { 
  WeatherCard, 
  SleepStatsCard, 
  NutritionStatsCard, 
  WorkoutCard, 
  TeamCard,
  ProgressBar,
  TrackMeetsCard,
  TodaysCheckInSection,
  AIModal,
  SparkleIcon,
  MobileHeader,
  // ExerciseExecutionModal, // Replaced with WorkoutExecutionRouter
  MonthlyPlanAssignments,
  MyTeamsCard,
  MobileTopNavBar
} from '../components'
import SleepQuickLogCard from '../components/SleepQuickLogCard'
import WellnessQuickLogCard from '../components/WellnessQuickLogCard'
import RPEPromptCard from '../components/RPEPromptCard'
import { supabase } from '../lib/supabase'
import TodayWorkoutsCard from '../components/TodayWorkoutsCard'
import usePageClass from '../hooks/usePageClass'
import { api } from '../services/api'
import { startTodaysWorkoutExecution } from '../utils/monthlyPlanWorkoutHelper'
import { markExerciseCompletedWithSync } from '../utils/monthlyPlanWorkoutHelper'
import PageHeader from '../components/PageHeader'
import { usePageHeader } from '../hooks/usePageHeader'
import { WorkoutExecutionRouter } from '../components/WorkoutExecutionRouter'

// Function to format date in "Month Day, Year" format
function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
  } catch (e) {
    console.error('Error formatting date:', e)
    return dateStr
  }
}

// Helper to format date string to YYYY-MM-DD for comparison
function formatDateForComparison(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    return dateUtils.localDateString(dateUtils.parseLocalDate(dateStr));
  } catch (e) {
    console.error('Error formatting date for comparison:', e);
    return '';
  }
}

// Function to get meal type text for nutrition records
function getMealTypeText(mealType: string): string {
  switch (mealType?.toLowerCase()) {
    case 'breakfast': return 'Breakfast';
    case 'lunch': return 'Lunch';
    case 'dinner': return 'Dinner';
    case 'snack': return 'Snack';
    default: return 'Meal';
  }
}

// Create a skeleton card component for loading states
const SkeletonCard = ({ 
  height = "330px",
  cardBg,
  borderColor, 
  cardShadow,
  skeletonStartColor,
  skeletonEndColor
}: { 
  height?: string;
  cardBg: string;
  borderColor: string;
  cardShadow: string;
  skeletonStartColor: string;
  skeletonEndColor: string;
}) => (
  <Box
    bg={cardBg}
    borderRadius="xl"
    p={6}
    border="1px solid"
    borderColor={borderColor}
    boxShadow={cardShadow}
    h={height}
  >
    <Skeleton 
      height="80px" 
      borderRadius="lg"
      mb={4}
      startColor={skeletonStartColor}
      endColor={skeletonEndColor}
    />
    <VStack spacing={4} align="stretch">
      <SkeletonText 
        mt="2" 
        noOfLines={1} 
        spacing="2" 
        skeletonHeight="4" 
        width="60%" 
        startColor={skeletonStartColor}
        endColor={skeletonEndColor}
      />
      <VStack spacing={3} align="stretch">
        <Skeleton 
          height="16px" 
          width="100%" 
          borderRadius="md"
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
        <Skeleton 
          height="16px" 
          width="90%" 
          borderRadius="md"
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
        <Skeleton 
          height="16px" 
          width="75%" 
          borderRadius="md"
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
        <Skeleton 
          height="40px" 
          width="120px" 
          borderRadius="lg"
          mx="auto"
          mt={4}
          startColor={skeletonStartColor}
          endColor={skeletonEndColor}
        />
      </VStack>
    </VStack>
  </Box>
);

export function Dashboard() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const { workouts, isLoading: workoutsLoading } = useWorkouts()
  const { stats: sleepStats, isLoading: sleepLoading } = useSleepStats()
  const { stats: nutritionStats, isLoading: nutritionLoading } = useNutritionStats()
  const { isHeaderVisible } = useScrollDirection(20)
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  // Default weather data as fallback
  const [weather] = useState({
    temp: '72',
    condition: 'Loading...',
    description: 'Fetching current conditions'
  })
  const navigate = useNavigate()
  const toast = useToast()

  // State for reset confirmation modal
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const [workoutToReset, setWorkoutToReset] = useState<{ id: string; name: string } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Official USPS state codes mapping
  const STATE_ABBR: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC', 'washington dc': 'DC'
  };

  // Add state for exercise execution modal
  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any,
    exerciseIdx: 0,
    timer: 0,
    running: false,
  });

  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' });

  // Modal control functions
  const handleUpdateTimer = useCallback((newTimer: number) => {
    setExecModal(prev => ({ ...prev, timer: newTimer }));
  }, []);

  const handleUpdateRunning = useCallback((newRunning: boolean) => {
    setExecModal(prev => ({ ...prev, running: newRunning }));
  }, []);

  const handleNextExercise = useCallback(async () => {
    const workoutId = execModal.workout.id;
    const exIdx = execModal.exerciseIdx;
    
    // Check if this is a monthly plan workout (daily- prefix)
    if (workoutId.startsWith('daily-') && user?.id) {
      // Use the sync function for monthly plans
      await markExerciseCompletedWithSync(user.id, workoutId, exIdx, workoutStore);
    } else {
      // Mark current exercise as completed for regular workouts
      workoutStore.markExerciseCompleted(workoutId, exIdx);
    }
    
    // Update progress in store - DON'T mark as completed (false)
    workoutStore.updateProgress(workoutId, exIdx + 1, execModal.workout.exercises.length, false);
    
    // Update modal state
    setExecModal(prev => ({
      ...prev,
      exerciseIdx: exIdx + 1,
      timer: 0,
      running: true,
    }));
  }, [execModal.workout, execModal.exerciseIdx, user?.id]);

  const handlePreviousExercise = useCallback(() => {
    const exIdx = execModal.exerciseIdx;
    
    // Only allow going back if not on the first exercise
    if (exIdx > 0) {
      // Reset timer and pause when going back
      setExecModal(prev => ({
        ...prev,
        exerciseIdx: exIdx - 1,
        timer: 0,
        running: false, // Pause when going back
      }));
    }
  }, [execModal.exerciseIdx]);

  const handleFinishWorkout = async () => {
    if (!execModal.workout) return;
    
    const workoutId = execModal.workout.id;
    const totalExercises = execModal.workout.exercises.length;
    const finalExerciseIdx = execModal.exerciseIdx;
    
    // Check if this is a monthly plan workout (daily- prefix)  
    if (workoutId.startsWith('daily-') && user?.id) {
      // Use the sync function for monthly plans
      await markExerciseCompletedWithSync(user.id, workoutId, finalExerciseIdx, workoutStore);
    } else {
      // Mark the final exercise as completed if it hasn't been marked yet
      workoutStore.markExerciseCompleted(workoutId, finalExerciseIdx);
    }
    
    // Check current progress to ensure all exercises are actually completed
    const currentProgress = workoutStore.getProgress(workoutId);
    const completedCount = currentProgress?.completedExercises?.length || 0;
    
    // Only mark as fully completed if all exercises are actually done
    if (completedCount >= totalExercises) {
      // Mark workout as completed in store
      workoutStore.updateProgress(workoutId, totalExercises, totalExercises, true);
      
      // Update database assignment status (only for regular workouts, not monthly plans)
      if (user?.id && !workoutId.startsWith('daily-')) {
        try {
          await api.athleteWorkouts.updateAssignmentStatus(user.id, workoutId, 'completed');
          console.log(`Workout ${workoutId} marked as completed in database`);
        } catch (error) {
          console.error('Error updating workout completion status:', error);
        }
      }
    } else {
      console.warn(`Workout ${workoutId} not fully completed: ${completedCount}/${totalExercises} exercises done`);
      // Mark as in_progress instead (only for regular workouts, not monthly plans)
      if (user?.id && !workoutId.startsWith('daily-')) {
        try {
          await api.athleteWorkouts.updateAssignmentStatus(user.id, workoutId, 'in_progress');
          console.log(`Workout ${workoutId} marked as in_progress in database`);
        } catch (error) {
          console.error('Error updating workout progress status:', error);
        }
      }
    }
    
    // Close modal
    setExecModal({
      isOpen: false,
      workout: null,
      exerciseIdx: 0,
      timer: 0,
      running: false,
    });
  };

  const handleShowVideo = (exerciseName: string, videoUrl: string) => {
    setVideoModal({
      isOpen: true,
      videoUrl,
      exerciseName
    });
  };

  // Fetch today's and upcoming workouts - MEMOIZED to prevent infinite re-renders
  const todayWorkouts = useMemo(() => {
    if (!workouts) return [];
    const today = dateUtils.localDateString(new Date());
    return workouts.filter((workout) => {
      const workoutDate = formatDateForComparison(workout.date);
      return workoutDate === today;
    });
  }, [workouts]);

  const upcomingWorkouts = useMemo(() => {
    if (!workouts) return [];
    const today = dateUtils.localDateString(new Date());
    return workouts.filter((workout) => {
      const workoutDate = formatDateForComparison(workout.date);
      return workoutDate > today;
    }).slice(0, 3);
  }, [workouts]);

  // Fetch team information for the athlete
  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!user || !profile) return;
      
      setIsLoadingTeam(true);
      try {
        let teamData = null;
        
        if (profile.role === 'athlete') {
          // For athletes, get their team memberships with simplified query and timeout protection
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Team query timeout')), 8000); // 8 second timeout
            });

            const teamQueryPromise = supabase
              .from('team_members')
              .select(`
                team_id,
                teams!inner (
                  id,
                  name,
                  description,
                  team_type
                )
              `)
              .eq('user_id', user.id)
              .eq('role', 'athlete')
              .eq('status', 'active')
              .eq('teams.is_active', true)
              .limit(1);

            const { data: memberships, error: membershipsError } = await Promise.race([
              teamQueryPromise,
              timeoutPromise
            ]) as any;

            if (membershipsError) {
              console.error('Error fetching team memberships:', membershipsError);
            } else if (memberships && memberships.length > 0) {
              const membership = memberships[0] as any;
              const primaryTeam = membership.teams;
              
              // Get member count with timeout protection (optional)
              let memberCount = 0;
              try {
                const countTimeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Count query timeout')), 3000);
                });

                const countQueryPromise = supabase
                  .from('team_members')
                  .select('*', { count: 'exact', head: true })
                  .eq('team_id', primaryTeam.id)
                  .eq('status', 'active');

                const { count } = await Promise.race([
                  countQueryPromise,
                  countTimeoutPromise
                ]) as any;

                memberCount = count || 0;
              } catch (countError) {
                console.warn('Could not fetch member count, using default:', countError);
                memberCount = 0; // Default value if count fails
              }

              teamData = {
                name: primaryTeam.name,
                description: primaryTeam.description,
                teamType: primaryTeam.team_type,
                memberCount,
                recentActivity: 'View team dashboard for updates'
              };
            }
          } catch (teamError) {
            console.warn('Team data fetch failed for athlete, continuing without team info:', teamError);
            // Don't set teamData, let it remain null
          }
        } else if (profile.role === 'coach') {
          // For coaches, get teams they're coaching from team_members system
          const { data: coachMemberships, error: coachError } = await supabase
            .from('team_members')
            .select(`
              teams!inner (
                id,
                name,
                description,
                team_type
              )
            `)
            .eq('user_id', user.id)
            .eq('role', 'coach')
            .eq('status', 'active')
            .eq('teams.is_active', true)
            .limit(1); // Get primary team for dashboard

          if (coachError) {
            console.error('Error fetching coach teams:', coachError);
          } else if (coachMemberships && coachMemberships.length > 0) {
            const coachMembership = coachMemberships[0] as any;
            const primaryTeam = coachMembership.teams;
            
            // Get total member count for this team
            const { count: memberCount } = await supabase
              .from('team_members')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', primaryTeam.id)
              .eq('status', 'active');

            teamData = {
              name: primaryTeam.name,
              description: primaryTeam.description,
              teamType: primaryTeam.team_type,
              memberCount: memberCount || 0,
              recentActivity: 'Manage your team and workouts'
            };
          }
        }
        
        setTeamInfo(teamData);
      } catch (error) {
        console.error('Error fetching team info:', error);
        setTeamInfo(null);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeamInfo();
  }, [user, profile]);

  const workoutStore = useWorkoutStore();

  // Function to get completion count for a workout
  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress ? progress.completedExercises.length : 0;
  };

  // Function to get completion percentage for a workout
  const getCompletionPercentage = (workout: any): number => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) return 0;
    const completed = getCompletionCount(workout.id);
    return Math.round((completed / workout.exercises.length) * 100);
  };

  // Function to handle starting a workout
  const handleStartWorkout = useCallback(async (workout: any) => {
    if (profile?.role === 'coach') {
      // For coaches, navigate to workout details
      navigate(`/coach/workouts/${workout.id}`);
    } else {
      // For athletes, check if this is a monthly plan workout
      if (workout.id && workout.id.startsWith('daily-') && user?.id) {

        
        // Use the already-processed workout object instead of re-fetching
        // This preserves the exercise extraction work done in TodayWorkoutsCard
        const progress = workoutStore.getProgress(workout.id);
        let currentIdx = progress ? progress.currentExerciseIndex : 0;
        const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
        
        // Clear any existing progress for this workout to ensure fresh start
        workoutStore.resetProgress(workout.id);
        
        // Load completion status from database (source of truth)
        try {
          const { getMonthlyPlanCompletionFromDB } = await import('../utils/monthlyPlanWorkoutHelper');
          const completedExercisesFromDB = await getMonthlyPlanCompletionFromDB(user.id);
          
          // Initialize progress tracking in workout store
          workoutStore.updateProgress(workout.id, 0, exercises.length);
          
          // Sync database completion status to local store
          if (completedExercisesFromDB.length > 0) {
            completedExercisesFromDB.forEach(exerciseIdx => {
              workoutStore.markExerciseCompleted(workout.id, exerciseIdx);
            });
            workoutStore.updateProgress(
              workout.id, 
              completedExercisesFromDB.length, 
              exercises.length,
              completedExercisesFromDB.length >= exercises.length
            );
          }
          
          // Find the first uncompleted exercise to start from
          const updatedProgress = workoutStore.getProgress(workout.id);
          const completedExercises = updatedProgress?.completedExercises || [];
          currentIdx = 0;
          
          // Find the first exercise that hasn't been completed
          for (let i = 0; i < exercises.length; i++) {
            if (!completedExercises.includes(i)) {
              currentIdx = i;
              break;
            }
          }
          
          // If all exercises are completed, start from the beginning
          if (completedExercises.length >= exercises.length) {
            currentIdx = 0;
          }
        } catch (error) {
          console.error('Error syncing monthly plan progress:', error);
          currentIdx = 0;
        }
        
        setExecModal({
          isOpen: true,
          workout: workout,
          exerciseIdx: currentIdx >= exercises.length ? 0 : currentIdx,
          timer: 0,
          running: false,
        });
      } else {
        // For regular workouts, use the old method
        const progress = workoutStore.getProgress(workout.id);
        let currentIdx = progress ? progress.currentExerciseIndex : 0;
        const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
        
        setExecModal({
          isOpen: true,
          workout: workout,
          exerciseIdx: currentIdx >= exercises.length ? 0 : currentIdx,
          timer: 0,
          running: true,
        });
      }
    }
  }, [profile?.role, user?.id, navigate]);

  // Function to get workout progress data formatted for WorkoutCard - MEMOIZED
  const getWorkoutProgressData = useCallback((workout: any) => {
    if (!workout || !workout.id) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = getCompletionCount(workout.id);
    const total = workout.exercises?.length || 0;
    
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  }, []);

  // Helper to get state abbreviation
  function getStateAbbr(state?: string) {
    if (!state) return '';
    const key = state.trim().toLowerCase();
    return STATE_ABBR[key] || state.slice(0,2).toUpperCase();
  }

  const handleDataUpdate = () => {
    // This could trigger refetch of sleep/nutrition stats if needed
    // For now, just a placeholder for future data refresh functionality
  };

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardShadow = useColorModeValue('none', 'md')
  const cardShadowLg = useColorModeValue('none', 'lg')
  const cardShadowSm = useColorModeValue('none', 'sm')
  const skeletonStartColor = useColorModeValue('gray.200', 'gray.700')
  const skeletonEndColor = useColorModeValue('gray.300', 'gray.600')
  const dashboardBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtextColor = useColorModeValue('gray.600', 'gray.200')
  const headingColor = useColorModeValue('gray.800', 'gray.100')
  const cardTextColor = useColorModeValue('gray.900', 'gray.100')
  const cardSubtextColor = useColorModeValue('gray.600', 'gray.300')

  // Add timeout for loading states to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profileLoading) {
        console.warn('Profile loading taking too long, this may indicate an issue');
      }
      if (workoutsLoading) {
        console.warn('Workouts loading taking too long, this may indicate an issue');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [profileLoading, workoutsLoading]);

  // Function to handle resetting workout progress - MEMOIZED
  const handleResetProgress = useCallback(async (workoutId: string, workoutName: string) => {
    // Set the workout to reset and open confirmation modal
    setWorkoutToReset({ id: workoutId, name: workoutName });
    onResetOpen();
  }, [onResetOpen]);

  const handleResetConfirm = async () => {
    if (!workoutToReset) return;
    
    try {
      console.log(`Resetting progress for workout ${workoutToReset.id}`);
      
      // Reset progress in the workout store
      workoutStore.resetProgress(workoutToReset.id);
      
      // Also reset in the database if the user has an assignment
      if (user?.id) {
        try {
          // Extract actual workout ID if this is a daily workout ID
          let actualWorkoutId = workoutToReset.id;
          if (workoutToReset.id.startsWith('daily-')) {
            actualWorkoutId = workoutToReset.id.replace('daily-', '');
          }
          
          // Use the proper helper function to reset granular progress data
          const { resetRegularWorkoutProgress } = await import('../utils/regularWorkoutHelper');
          await resetRegularWorkoutProgress(user.id, actualWorkoutId);
          
          console.log(`Workout ${workoutToReset.id} (actual: ${actualWorkoutId}) progress fully reset in database`);
        } catch (error) {
          console.error('Error resetting workout progress in database:', error);
        }
      }
      
      toast({
        title: 'Progress Reset',
        description: `"${workoutToReset.name}" progress has been reset. You can start from the beginning.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error resetting workout progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset workout progress. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      onResetClose();
      setWorkoutToReset(null);
    }
  };

  // Helper function to get the user's first name
  const getFirstName = (): string => {
    // If profile has first_name, use it
    if (profile?.first_name) {
      return profile.first_name;
    }
    
    // Check for actual name in user object
    if (user && (user as any).name) {
      return (user as any).name.split(' ')[0];
    }
    
    // Check user metadata
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0];
    }
    
    // Check identity data
    if (user?.identities?.[0]?.identity_data?.name) {
      return user.identities[0].identity_data.name.split(' ')[0];
    }
    
    // Otherwise try to extract from email, but skip common prefixes
    if (user?.email) {
      const emailUsername = user.email.split('@')[0];
      const skipPrefixes = ['hello', 'contact', 'info', 'admin', 'support', 'team', 'user', 'test'];
      
      if (!skipPrefixes.includes(emailUsername.toLowerCase())) {
        return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).toLowerCase();
      } else {

      }
    }
    
    return 'Athlete';
  };

  // Helper function to determine if it's a first-time user
  const isFirstTimeUser = (): boolean => {
    if (!user?.created_at) return false;
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Consider it first-time if account was created within the last day
    return daysDiff <= 1;
  };

  // Helper function to get the appropriate welcome message
  const getWelcomeMessage = (): string => {
    const firstName = getFirstName();
    return isFirstTimeUser() ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`;
  };

  // Page header with no icon for dashboard
  usePageHeader({
    title: getWelcomeMessage(),
    subtitle: `${profile?.first_name || user?.email || 'Athlete'}, ready to crush your goals today?`
  });

  // Check for email verification success toast
  useEffect(() => {
    const shouldShowToast = localStorage.getItem('show-email-verified-toast')
    if (shouldShowToast === 'true' && user?.email_confirmed_at) {
      // Show success toast
      toast({
        title: '🎉 Email Verified Successfully!',
        description: `Welcome to Track & Field, ${profile?.first_name || user?.email?.split('@')[0] || 'Athlete'}! Your account is now fully activated.`,
        status: 'success',
        duration: 8000,
        isClosable: true,
        position: 'top'
      })
      
      // Clear the flag so it doesn't show again
      localStorage.removeItem('show-email-verified-toast')
    }
  }, [user, profile, toast])

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={dashboardBg} 
      w="100%"
      maxW="100%"
      overflowX="hidden"
      position="relative"
    >
      <Box 
        px={{ base: 4, md: 6 }} 
        py={0} 
        mt={0} 
        w="100%"
        maxW="100%"
        overflowX="hidden"
        mx="auto"
      >
        {/* Desktop Header - Title Only */}
        <Box display={{ base: "none", lg: "block" }} w="100%" mb={8}>
          <Box px={{ base: 4, md: 6 }} pt={6}>
            <VStack spacing={2} align="start" w="100%" mb={4}>
              <Heading 
                size="lg" 
                color={useColorModeValue('gray.800', 'white')}
              >
                {getWelcomeMessage()}
              </Heading>
              <Text 
                color={useColorModeValue('gray.600', 'gray.300')} 
                fontSize="md"
              >
                {`${profile?.first_name || user?.email || 'Athlete'}, ready to crush your goals today?`}
              </Text>
            </VStack>
          </Box>
        </Box>

        {/* Mobile Weather Card */}
        <Box display={{ base: "block", lg: "none" }} w="100%" mb={8}>
            <WeatherCard 
              city={profile?.city || "Greensboro"}
              state={profile?.state ? getStateAbbr(profile.state) : "NC"}
              weather={{
                temp: "71",
                condition: "Clouds",
                description: "scattered clouds"
              }}
              isLoading={profileLoading}
            />
        </Box>

        {/* Desktop 3-Column Layout */}
        <Box display={{ base: "none", lg: "block" }} w="100%" mb={8}>
          <Flex 
            direction="row" 
            gap={6}
            align="flex-start"
            w="100%"
          >
            {/* Left Column - Weather + Sleep + Wellness */}
            <VStack 
              w="350px"
              minW="320px" 
              maxW="380px"
              flexShrink={0}
              spacing={6}
              align="stretch"
            >
              {/* Weather Card */}
              <WeatherCard 
                city={profile?.city || "Greensboro"}
                state={profile?.state ? getStateAbbr(profile.state) : "NC"}
                weather={{
                  temp: "71",
                  condition: "Clouds",
                  description: "scattered clouds"
                }}
                isLoading={profileLoading}
              />
              
              {/* Sleep Quick Log Card */}
              <SleepQuickLogCard onLogComplete={handleDataUpdate} />
              
              {/* Wellness Quick Log Card */}
              <WellnessQuickLogCard onLogComplete={handleDataUpdate} />
            </VStack>

            {/* Center Column - Today's Workout Card */}
            <Box flex="1" minW={0}>
        <TodayWorkoutsCard
          profile={profile}
          profileLoading={profileLoading}
        />
            </Box>

            {/* Right Column - Track Meets + My Teams */}
            <VStack 
              w="350px"
              minW="320px" 
              maxW="380px"
              flexShrink={0}
              spacing={6}
              align="stretch"
            >
              {/* Track Meets Card */}
              <TrackMeetsCard viewAllLink="/athlete/meets" />
              
          {/* My Teams Card */}
          <MyTeamsCard maxTeamsToShow={3} />
            </VStack>
          </Flex>
        </Box>

        {/* Mobile Today's Workouts Card */}
        <Box display={{ base: "block", lg: "none" }} w="100%">
                  <TodayWorkoutsCard
          profile={profile}
          profileLoading={profileLoading}
        />
        </Box>

        {/* Today's Check-in Section - Mobile Only */}
        <Box display={{ base: "block", lg: "none" }} w="100%">
          <TodaysCheckInSection onDataUpdate={handleDataUpdate} />
        </Box>

        {/* Mobile Sleep Card - Before other cards */}
        <Box display={{ base: "block", lg: "none" }} w="100%" mb={8}>
          {profileLoading ? (
            <SkeletonCard
              height="330px"
              cardBg={cardBg}
              borderColor={borderColor}
              cardShadow={cardShadow}
              skeletonStartColor={skeletonStartColor}
              skeletonEndColor={skeletonEndColor}
            />
          ) : (
            <SleepStatsCard />
          )}
        </Box>

        {/* Analytics & Info Cards */}
        <SimpleGrid 
          columns={{ base: 1, md: 2, lg: 3 }} 
          spacing={{ base: 4, md: 8 }} 
          my={{ base: 6, md: 10 }}
          w="100%"
        >
          {/* My Teams Card - Mobile Only */}
          <Box display={{ base: "block", lg: "none" }}>
            <MyTeamsCard maxTeamsToShow={3} />
          </Box>

          {/* Track Meets Card - Mobile Only */}
          <Box display={{ base: "block", lg: "none" }}>
            <TrackMeetsCard viewAllLink="/athlete/meets" />
          </Box>

          {/* RPE Card - Shows on all screen sizes */}
          <Box w="100%">
            <RPEPromptCard onLogComplete={handleDataUpdate} />
          </Box>

          {/* Nutrition Card */}
          {(profileLoading || nutritionLoading) ? (
            <SkeletonCard
              height="330px"
              cardBg={cardBg}
              borderColor={borderColor}
              cardShadow={cardShadow}
              skeletonStartColor={skeletonStartColor}
              skeletonEndColor={skeletonEndColor}
            />
          ) : (
            <NutritionStatsCard
              nutritionStats={nutritionStats}
              isLoading={nutritionLoading}
            />
          )}

          {/* Gamification Card - Development Only */}
        {process.env.NODE_ENV !== 'production' && (
          <Box 
            bg={cardBg}
            borderRadius="xl"
            p={6}
            border="1px solid"
            borderColor={borderColor}
            boxShadow={cardShadowLg}
              w="100%"
          >
            <VStack spacing={5} align="stretch">
              {/* Header */}
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={FaMedal} boxSize={6} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color={cardTextColor}>
                      Gamification Preview
                    </Text>
                    <Text fontSize="sm" color={cardSubtextColor}>
                      Track your progress and achievements
                    </Text>
                  </VStack>
                </HStack>
                <Badge 
                  colorScheme="purple" 
                  variant="solid" 
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  Preview
                </Badge>
              </HStack>

              {/* Content */}
              <Text fontSize="sm" color={cardSubtextColor}>
                View your points, badges, streaks, and leaderboard position
              </Text>

              {/* Action Button */}
              <Button 
                as={RouterLink} 
                to="/gamification" 
                colorScheme="purple"
                variant="outline"
                size="sm"
                leftIcon={<Icon as={FaMedal} />}
                rightIcon={<Icon as={MdKeyboardArrowRight} />}
              >
                View Gamification
              </Button>
            </VStack>
          </Box>
        )}
        </SimpleGrid>

        {/* Exercise Execution Modal - Using shared component */}
        <WorkoutExecutionRouter
          isOpen={execModal.isOpen}
          onClose={() => setExecModal({ ...execModal, isOpen: false })}
          workout={execModal.workout}
          exerciseIdx={execModal.exerciseIdx}
          timer={execModal.timer}
          running={execModal.running}
          onUpdateTimer={handleUpdateTimer}
          onUpdateRunning={handleUpdateRunning}
          onNextExercise={handleNextExercise}
          onPreviousExercise={handlePreviousExercise}
          onFinishWorkout={handleFinishWorkout}
          onShowVideo={handleShowVideo}
        />

        {/* Video Modal */}
        <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>How to: {videoModal.exerciseName}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box position="relative" paddingTop="56.25%">
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  src={videoModal.videoUrl}
                  title="Exercise Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Desktop AI Modal - Mobile handled by MobileHeader */}
        <Box display={{ base: "none", lg: "block" }}>
          <AIModal 
            isOpen={isAIModalOpen} 
            onClose={() => setIsAIModalOpen(false)} 
          />
        </Box>

        {/* Reset Confirmation Modal */}
        <AlertDialog
          isOpen={isResetOpen}
          leastDestructiveRef={cancelRef}
          onClose={onResetClose}
          size="lg"
        >
          <AlertDialogOverlay>
            <AlertDialogContent minHeight="220px">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Reset Workout Progress
              </AlertDialogHeader>

              <AlertDialogBody>
                <VStack spacing={4} minHeight="100px">
                  <Text>
                    Are you sure you want to reset your progress on <strong>{workoutToReset?.name}</strong>? 
                    This will clear all completed exercises and you'll start from the beginning.
                    This action cannot be undone.
                  </Text>
                </VStack>
                {/* Action buttons styled as a footer */}
                <HStack width="100%" justifyContent="flex-end" pt={4} spacing={4}>
                  <Button 
                    ref={cancelRef} 
                    onClick={onResetClose}
                    variant="ghost"
                    colorScheme="gray"
                  >
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="orange" 
                    onClick={handleResetConfirm} 
                    variant="solid"
                  >
                    Reset Progress
                  </Button>
                </HStack>
              </AlertDialogBody>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

      </Box>
    </Box>
  )
} 