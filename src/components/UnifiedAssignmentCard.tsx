import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  useColorModeValue,
  Circle,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useBreakpointValue,
  useBreakpoint
} from '@chakra-ui/react';
import { 
  MoreVertical, 
  Play, 
  Edit, 
  Trash2, 
  UserPlus, 
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { MobileWorkoutDetails } from './MobileWorkoutDetails';
import { WorkoutDetailsDrawer } from './WorkoutDetailsDrawer';
import { useUnifiedAssignmentActions } from '../hooks/useUnifiedAssignments';
import type { WorkoutAssignment } from '../services/assignmentService';
import type { Workout } from '../services/api';
import { supabase } from '../lib/supabase';

interface UnifiedAssignmentCardProps {
  assignment: WorkoutAssignment;
  onExecute?: (assignmentId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  onDelete?: () => void;
  onAssign?: () => void;
  isCoach?: boolean;
  currentUserId?: string;
}

interface CoachWorkoutCardProps {
  workout: Workout;
  assignedTo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onViewDetails?: () => void;
  isCoach?: boolean;
  currentUserId?: string;
  showActions?: boolean;
}

export function UnifiedAssignmentCard({ 
  assignment, 
  onExecute, 
  showActions = true,
  compact = false,
  onDelete,
  onAssign,
  isCoach = false,
  currentUserId
}: UnifiedAssignmentCardProps) {
  const [progressData, setProgressData] = useState<{
    metrics: any;
    percentage: number;
  } | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen: isMobileDetailsOpen, onOpen: onMobileDetailsOpen, onClose: onMobileDetailsClose } = useDisclosure();

  const handleViewDetails = () => {
    if (isMobile) {
      onMobileDetailsOpen();
    } else {
      // Handle desktop view details
      console.log('Desktop view details');
    }
  };

  const handleExecute = () => {
    if (onExecute) {
      onExecute(assignment.id);
    }
  };

  const convertAssignmentToWorkout = () => {
    if (!assignment) return null;
    
    const workout = {
      id: assignment.id,
      name: assignment.exercise_block?.workout_name || assignment.exercise_block?.plan_name || 'Assignment Workout',
      description: assignment.exercise_block?.description || '',
      type: assignment.assignment_type,
      date: assignment.start_date,
      duration: assignment.exercise_block?.estimated_duration || '',
      notes: assignment.exercise_block?.notes || '',
      created_at: assignment.created_at,
      exercises: assignment.exercise_block?.exercises || [],
      blocks: assignment.exercise_block?.blocks || [],
      is_block_based: assignment.exercise_block?.is_block_based || false,
      template_type: assignment.assignment_type as 'single' | 'weekly' | 'monthly',
      daily_workouts: assignment.exercise_block?.daily_workouts || undefined,
    };
    
    return workout;
  };

  // Get assignment details with proper data source
  const getAssignmentDetails = () => {
    const { assignment_type, exercise_block, progress, meta } = assignment;
    
    // Debug: Log the raw assignment data
    console.log('🔍 RAW ASSIGNMENT DATA FOR WORKOUT:', assignment.id);
    console.log('Assignment Type:', assignment_type);
    console.log('Exercise Block:', exercise_block);
    console.log('Full Assignment:', assignment);
    
    // Alert for weekly workouts to make sure we see it
    if (assignment_type === 'weekly') {
      console.log('🚨 WEEKLY WORKOUT DETECTED - W7676 type data:');
      console.log('exercise_block.blocks:', exercise_block.blocks);
      console.log('exercise_block.daily_workouts:', exercise_block.daily_workouts);
      console.log('exercise_block.exercises:', exercise_block.exercises);
      
      // Force an alert for debugging - REMOVED
    }
    
    switch (assignment_type) {
      case 'single':
        return {
          title: exercise_block.workout_name || 'Single Workout',
          subtitle: assignment_type.toUpperCase(),
          duration: exercise_block.estimated_duration,
          exercises: exercise_block.exercises?.length || 0,
          workoutType: 'SINGLE'
        };
        
      case 'weekly':
        // For weekly plans, count total exercises across all days
        const dailyWorkouts = exercise_block.daily_workouts || {};
        let totalWeeklyExercises = 0;
        
        // Debug logging
        console.log('Weekly workout data structure:', {
          dailyWorkouts,
          exerciseBlock: exercise_block,
          blocks: exercise_block.blocks
        });
        
        // Check if it's a block-based weekly workout (stored in blocks field)
        if (exercise_block.blocks) {
          let blocks = exercise_block.blocks;
          
          // Parse blocks if it's a string
          if (typeof blocks === 'string') {
            try {
              blocks = JSON.parse(blocks);
            } catch (e) {
              console.error('Error parsing blocks:', e);
            }
          }
          
          // Check if blocks is organized by days (monday, tuesday, etc.)
          if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            dayNames.forEach(dayName => {
              const dayBlocks = blocks[dayName];
              if (Array.isArray(dayBlocks)) {
                dayBlocks.forEach((block: any) => {
                  if (block.exercises && Array.isArray(block.exercises)) {
                    totalWeeklyExercises += block.exercises.length;
                  }
                });
              }
            });
          } else if (Array.isArray(blocks)) {
            // Single day blocks
            blocks.forEach((block: any) => {
              if (block.exercises && Array.isArray(block.exercises)) {
                totalWeeklyExercises += block.exercises.length;
              }
            });
          }
        }
        
        // If no exercises found in blocks, try daily_workouts
        if (totalWeeklyExercises === 0) {
          Object.values(dailyWorkouts).forEach((dayWorkout: any) => {
            if (Array.isArray(dayWorkout)) {
              // New blocks format: array of blocks, each with exercises
              dayWorkout.forEach((block: any) => {
                if (block.exercises && Array.isArray(block.exercises)) {
                  totalWeeklyExercises += block.exercises.length;
                }
              });
            } else if (dayWorkout && dayWorkout.exercises && Array.isArray(dayWorkout.exercises)) {
              // Legacy format: { exercises: [], is_rest_day: boolean }
              totalWeeklyExercises += dayWorkout.exercises.length;
            }
          });
        }
        
        // Fallback: try to extract from exercise_block.exercises if everything else is empty
        if (totalWeeklyExercises === 0 && exercise_block.exercises) {
          const exercises = exercise_block.exercises;
          if (Array.isArray(exercises) && exercises.length > 0) {
            // Check if it's weekly plan structure (array of day objects)
            if (typeof exercises[0] === 'object' && 'day' in exercises[0] && 'exercises' in exercises[0]) {
              exercises.forEach((dayPlan: any) => {
                if (dayPlan.exercises && Array.isArray(dayPlan.exercises) && !dayPlan.isRestDay) {
                  totalWeeklyExercises += dayPlan.exercises.length;
                }
              });
            } else {
              // Regular exercise array - count all
              totalWeeklyExercises = exercises.length;
            }
          }
        }
        
        console.log('Total weekly exercises calculated:', totalWeeklyExercises);
        
        return {
          title: exercise_block.workout_name || exercise_block.plan_name || 'Weekly Plan',
          subtitle: 'WEEKLY',
          duration: `${exercise_block.total_days || 7} days`,
          exercises: totalWeeklyExercises,
          workoutType: 'WEEKLY'
        };
        
      case 'monthly':
        return {
          title: exercise_block.plan_name || 'Monthly Plan',
          subtitle: 'MONTHLY',
          duration: `${exercise_block.duration_weeks || 4} weeks`,
          exercises: assignment.progress?.total_exercises || 0,
          workoutType: 'MONTHLY'
        };
        
      default:
        return {
          title: 'Unknown Assignment',
          subtitle: 'UNKNOWN',
          duration: '',
          exercises: 0,
          workoutType: 'UNKNOWN'
        };
    }
  };

  const details = getAssignmentDetails();

  // Get the correct exercise data - handle different assignment types
  const getCorrectExerciseData = async () => {
    // Handle different assignment types
    if (assignment.assignment_type === 'weekly') {
      // For weekly workouts, get today's exercises (same logic as execution modal)
      const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[today.getDay()];
      
      const todaysWorkout = dailyWorkouts[currentDayName];
      let exerciseList: any[] = [];
      
      if (todaysWorkout) {
        if (Array.isArray(todaysWorkout)) {
          // New blocks format
          exerciseList = todaysWorkout.flatMap((block: any) => block.exercises || []);
        } else if (todaysWorkout.exercises) {
          // Legacy format
          exerciseList = todaysWorkout.exercises;
        }
      }
      
      return exerciseList;
    }
    
    if (assignment.assignment_type === 'monthly') {
      // For monthly workouts, return empty array for now (monthly plans are complex)
      // Monthly plans should show overall progress, not daily exercise details
      return [];
    }
    
    // For single workouts
    const exercises = assignment.exercise_block?.exercises || [];
    
    // If we have an original workout ID, try to fetch the actual workout data
    const originalWorkoutId = assignment.meta?.original_workout_id;
    
    if (originalWorkoutId && exercises.length > 0) {
      try {
        // Fetch the actual workout data to get correct exercise information
        const { data: actualWorkout, error } = await supabase
          .from('workouts')
          .select('exercises, blocks, is_block_based')
          .eq('id', originalWorkoutId)
          .single();
        
        if (!error && actualWorkout) {
          console.log('Found actual workout data:', actualWorkout);
          console.log('Assignment exercise data:', exercises);
          
          // Use the actual workout data if available
          if (actualWorkout.exercises && actualWorkout.exercises.length > 0) {
            return actualWorkout.exercises;
          }
          
          // For block-based workouts, extract exercises from blocks
          if (actualWorkout.is_block_based && actualWorkout.blocks) {
            let blockExercises: any[] = [];
            
            if (Array.isArray(actualWorkout.blocks)) {
              blockExercises = actualWorkout.blocks.flatMap((block: any) => block.exercises || []);
            } else if (typeof actualWorkout.blocks === 'string') {
              try {
                const parsedBlocks = JSON.parse(actualWorkout.blocks);
                if (Array.isArray(parsedBlocks)) {
                  blockExercises = parsedBlocks.flatMap((block: any) => block.exercises || []);
                }
              } catch (e) {
                console.error('Error parsing blocks:', e);
              }
            }
            
            if (blockExercises.length > 0) {
              return blockExercises;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching actual workout data:', error);
      }
    }
    
    // Fallback to assignment data
    return exercises;
  };

  // Calculate detailed progress metrics and percentage
  const calculateProgress = async () => {
    const progress = assignment.progress;
    
    if (!progress) {
      return {
        metrics: {
          exercises: { current: 0, total: details.exercises },
          sets: { current: 0, total: 0 },
          reps: { current: 0, total: 0 }
        },
        percentage: 0
      };
    }

    let metrics;
    // For different assignment types, calculate progress differently
    switch (assignment.assignment_type) {
      case 'single':
        // Get exercises from the correct data source
        const exercises = await getCorrectExerciseData();
        const currentExerciseIndex = progress.current_exercise_index || 0;
        const currentSet = progress.current_set || 1;
        const currentRep = progress.current_rep || 1;
        
        // Calculate total sets and reps based on actual exercise data
        let totalSets = 0;
        let totalReps = 0;
        let completedSets = 0;
        let completedReps = 0;
        
        exercises.forEach((exercise: any, index: number) => {
          // Use the actual exercise data from the workout
          const exerciseSets = parseInt(String(exercise.sets)) || 1;
          const exerciseReps = parseInt(String(exercise.reps)) || 1;
          const exerciseTotalReps = exerciseSets * exerciseReps;
          
          totalSets += exerciseSets;
          totalReps += exerciseTotalReps;
          
          if (index < currentExerciseIndex) {
            // Completed exercises
            completedSets += exerciseSets;
            completedReps += exerciseTotalReps;
          } else if (index === currentExerciseIndex) {
            // Current exercise - calculate based on actual progress
            // For sets: count completed sets (currentSet - 1)
            completedSets += currentSet - 1;
            // For reps: count completed reps in current exercise
            const completedRepsInCurrentExercise = (currentSet - 1) * exerciseReps + (currentRep - 1);
            completedReps += completedRepsInCurrentExercise;
          }
        });
        
        // Calculate actual progress based on current position, not just status
        let actualCompletedExerciseIndex = currentExerciseIndex;
        let actualCompletedSets = completedSets;
        let actualCompletedReps = completedReps;
        
        // Use actual progress values
        
        metrics = {
          exercises: { current: actualCompletedExerciseIndex, total: exercises.length },
          sets: { current: actualCompletedSets, total: totalSets },
          reps: { current: actualCompletedReps, total: totalReps }
        };
        break;
        
      case 'weekly':
        metrics = {
          exercises: { current: progress.current_exercise_index || 0, total: progress.total_exercises || 0 },
          sets: { current: progress.current_set || 0, total: (progress.current_set || 0) + 3 }, // Estimate
          reps: { current: progress.current_rep || 0, total: (progress.current_rep || 0) + 15 } // Estimate
        };
        break;
        
      case 'monthly':
        metrics = {
          exercises: { current: progress.current_exercise_index || 0, total: progress.total_exercises || 0 },
          sets: { current: progress.current_set || 0, total: (progress.current_set || 0) + 5 }, // Estimate
          reps: { current: progress.current_rep || 0, total: (progress.current_rep || 0) + 20 } // Estimate
        };
        break;
        
      default:
        metrics = {
          exercises: { current: 0, total: details.exercises },
          sets: { current: 0, total: 0 },
          reps: { current: 0, total: 0 }
        };
    }

    // Calculate percentage from metrics - use reps as primary indicator for single workouts
    let percentage;
    
    // For single workouts, use reps as the primary progress indicator
    if (assignment.assignment_type === 'single') {
      // For single workouts, use reps as the primary progress indicator
      const repsProgress = metrics.reps.total > 0 ? metrics.reps.current / metrics.reps.total : 0;
      percentage = Math.round(repsProgress * 100);
    } else {
      // For weekly/monthly workouts, use weighted progress
      const exerciseProgress = metrics.exercises.current / metrics.exercises.total;
      const setsProgress = metrics.sets.total > 0 ? metrics.sets.current / metrics.sets.total : 0;
      const repsProgress = metrics.reps.total > 0 ? metrics.reps.current / metrics.reps.total : 0;
      
      // Weight the progress: exercises (50%), sets (30%), reps (20%)
      const overallProgress = (exerciseProgress * 0.5) + (setsProgress * 0.3) + (repsProgress * 0.2);
      percentage = Math.round(overallProgress * 100);
    }

    return { metrics, percentage };
  };

  // Calculate accurate progress metrics based on actual exercise data
  useEffect(() => {
    const calculateAccurateMetrics = async () => {
      const progress = assignment.progress;
      
      if (!progress) {
        setProgressData({
          metrics: {
            exercises: { current: 0, total: details.exercises },
            sets: { current: 0, total: 0 },
            reps: { current: 0, total: 0 }
          },
          percentage: 0
        });
        setIsLoadingProgress(false);
        return;
      }

      const currentExerciseIndex = progress.current_exercise_index || 0;
      const currentSet = progress.current_set || 1;
      const currentRep = progress.current_rep || 1;
      
      let metrics;
      
      if (assignment.assignment_type === 'single') {
        // Get actual exercise data (with correct data source)
        const exercises = await getCorrectExerciseData();
        
        // Calculate actual totals from exercise data
        let totalSets = 0;
        let totalReps = 0;
        let completedSets = 0;
        let completedReps = 0;
        
        exercises.forEach((exercise: any, index: number) => {
          const exerciseSets = parseInt(String(exercise.sets)) || 1;
          const exerciseReps = parseInt(String(exercise.reps)) || 1;
          const exerciseTotalReps = exerciseSets * exerciseReps;
          
          totalSets += exerciseSets;
          totalReps += exerciseTotalReps;
          
          if (index < currentExerciseIndex) {
            // Completed exercises
            completedSets += exerciseSets;
            completedReps += exerciseTotalReps;
          } else if (index === currentExerciseIndex) {
            // Current exercise - calculate based on actual progress
            completedSets += Math.max(0, currentSet - 1);
            
            // For reps: count completed reps in previous sets + current set
            const completedRepsInPreviousSets = Math.max(0, currentSet - 1) * exerciseReps;
            const completedRepsInCurrentSet = Math.max(0, currentRep - 1);
            completedReps += completedRepsInPreviousSets + completedRepsInCurrentSet;
          }
        });
        
        // For completed workouts, show full completion
        const isWorkoutCompleted = assignment.status === 'completed' && progress.completion_percentage >= 100;
        
        metrics = {
          exercises: { 
            current: isWorkoutCompleted ? exercises.length : currentExerciseIndex, 
            total: exercises.length 
          },
          sets: { 
            current: isWorkoutCompleted ? totalSets : completedSets,
            total: totalSets 
          },
          reps: { 
            current: isWorkoutCompleted ? totalReps : completedReps,
            total: totalReps 
          }
        };
      } else if (assignment.assignment_type === 'weekly') {
        // For weekly workouts, get today's exercise data
        const todaysExercises = await getCorrectExerciseData();
        
        if (todaysExercises.length > 0) {
          // Calculate today's workout metrics
          let totalSets = 0;
          let totalReps = 0;
          
          todaysExercises.forEach((exercise: any) => {
            const exerciseSets = parseInt(String(exercise.sets)) || 1;
            const exerciseReps = parseInt(String(exercise.reps)) || 1;
            totalSets += exerciseSets;
            totalReps += exerciseSets * exerciseReps;
          });
          
          metrics = {
            exercises: { current: currentExerciseIndex, total: todaysExercises.length },
            sets: { current: Math.max(0, currentSet - 1), total: totalSets },
            reps: { current: Math.max(0, currentRep - 1), total: totalReps }
          };
        } else {
          // Rest day or no workout today
          metrics = {
            exercises: { current: 0, total: 0 },
            sets: { current: 0, total: 0 },
            reps: { current: 0, total: 0 }
          };
        }
      } else if (assignment.assignment_type === 'monthly') {
        // For monthly workouts, show overall progress
        metrics = {
          exercises: { current: progress.current_exercise_index || 0, total: progress.total_exercises || 0 },
          sets: { current: progress.current_set || 0, total: (progress.current_set || 0) + 5 },
          reps: { current: progress.current_rep || 0, total: (progress.current_rep || 0) + 20 }
        };
      } else {
        // Fallback for unknown types
        metrics = {
          exercises: { current: 0, total: details.exercises },
          sets: { current: 0, total: 0 },
          reps: { current: 0, total: 0 }
        };
      }

      setProgressData({
        metrics,
        percentage: progress.completion_percentage || 0
      });
      setIsLoadingProgress(false);
    };

    calculateAccurateMetrics();
  }, [assignment, details.exercises]);

  const { metrics: progressMetrics, percentage: progress_pct } = progressData || {
    metrics: {
      exercises: { current: 0, total: details.exercises },
      sets: { current: 0, total: 0 },
      reps: { current: 0, total: 0 }
    },
    percentage: 0
  };
  
  // Use the stored completion percentage from the database
  const finalProgressPct = assignment.progress?.completion_percentage || 0;
  
  // Check if assignment is actually completed based on progress AND status
  const isCompleted = assignment.status === 'completed' && finalProgressPct >= 100;
  const isInProgress = assignment.status === 'in_progress' || (assignment.status === 'completed' && finalProgressPct < 100);

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  // Status formatting
  const getStatusText = () => {
    // If marked as completed but progress is less than 100%, show as in progress
    if (assignment.status === 'completed' && finalProgressPct < 100) {
      return 'IN PROGRESS';
    }
    
    switch (assignment.status) {
      case 'in_progress': return 'IN PROGRESS';
      case 'completed': return 'COMPLETED';
      case 'assigned': return 'ASSIGNED';
      default: return assignment.status?.toUpperCase() || 'UNKNOWN';
    }
  };

  // Get the actual workout name from assignment data
  const workoutName = assignment.exercise_block?.workout_name || 
                     assignment.exercise_block?.plan_name || 
                     assignment.exercise_block?.name ||
                     `Workout ${assignment.id.slice(-4).toUpperCase()}`;

  // Circular progress component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 78; // 20% bigger than 65
    const strokeWidth = 10; // Thicker stroke
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const currentColor = percentage >= 100 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444';

    return (
      <Box position="relative" display="inline-block">
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            stroke={useColorModeValue('#E5E7EB', '#374151')}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={currentColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
        >
          <Text fontSize="lg" fontWeight="bold" color={currentColor}>
            {Math.round(percentage)}%
          </Text>
        </Box>
      </Box>
    );
  };

  // Reset progress mutation
  const { resetProgress } = useUnifiedAssignmentActions();

  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      boxShadow="lg"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="100px"
        height="100px"
        bg={useColorModeValue('gray.50', 'gray.700')}
        borderRadius="0 0 0 100px"
        opacity="0.5"
      />

      <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
        {/* Header with Assignment Type and Menu */}
        <HStack justify="space-between" align="center">
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button 
              bg={useColorModeValue("gray.200", "gray.600")} 
              color={useColorModeValue("gray.700", "white")} 
              _hover={{ bg: useColorModeValue("gray.300", "gray.500") }}
              border="1px solid"
              borderColor={useColorModeValue("gray.300", "gray.500")}
            >
              {assignment.assigned_by ? 'COACH' : 'ATHLETE'}
            </Button>
            <Button 
              bg={useColorModeValue("gray.200", "gray.600")} 
              color={useColorModeValue("gray.700", "white")} 
              _hover={{ bg: useColorModeValue("gray.300", "gray.500") }}
              border="1px solid"
              borderColor={useColorModeValue("gray.300", "gray.500")}
            >
              {assignment.assignment_type.toUpperCase()}
            </Button>
          </ButtonGroup>
                      {isCoach ? (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<MoreVertical />}
                    variant="ghost"
                    aria-label="Options"
                    size="sm"
                    color={useColorModeValue("gray.500", "gray.300")}
                  />
                  <Portal>
                    <MenuList>
                      <MenuItem 
                        icon={<Play />} 
                        onClick={handleViewDetails}
                      >
                        View Details
                      </MenuItem>
                      {onAssign && (
                        <MenuItem 
                          icon={<UserPlus />} 
                          onClick={onAssign}
                        >
                          Assign Athletes
                        </MenuItem>
                      )}
                      {onDelete && (
                        <MenuItem 
                          icon={<Trash2 />} 
                          onClick={onDelete}
                          color="red.500"
                        >
                          Delete Workout
                        </MenuItem>
                      )}
                    </MenuList>
                  </Portal>
                </Menu>
              ) : (
                <IconButton
                  icon={<MoreVertical />}
                  variant="ghost"
                  aria-label="View Details"
                  size="sm"
                  color={useColorModeValue("gray.500", "gray.300")}
                  onClick={handleViewDetails}
                />
              )}
        </HStack>

        {/* Workout ID, Status and Date Information - Two Columns */}
        <HStack align="start" justify="space-between" w="100%">
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue("gray.800", "white")}>
              {workoutName}
            </Text>
            <Badge
              colorScheme={isInProgress ? "orange" : isCompleted ? "green" : "gray"}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="md"
            >
              {getStatusText()}
            </Badge>
          </VStack>
          
          <VStack align="end" spacing={1}>
            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.300")}>
              ASSIGNED: {formatDate(assignment.assigned_at || assignment.start_date)}
            </Text>
            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.300")}>
              START DATE: {formatDate(assignment.start_date)}
            </Text>
            {assignment.progress?.started_at && (
              <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.300")}>
                STARTED: {formatDate(assignment.progress.started_at)}
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Progress Metrics Grid with Separators */}
        <HStack spacing={0} textAlign="center" w="100%" mt="25px">
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.300")} fontWeight="bold">
              EXERCISES
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("gray.700", "white")}>
              {progressMetrics.exercises.current}/{progressMetrics.exercises.total}
            </Text>
          </VStack>
          
          <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
          
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.300")} fontWeight="bold">
              SETS
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("gray.700", "white")}>
              {progressMetrics.sets.current}/{progressMetrics.sets.total}
            </Text>
          </VStack>
          
          <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
          
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.300")} fontWeight="bold">
              REPS
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("gray.700", "white")}>
              {progressMetrics.reps.current}/{progressMetrics.reps.total}
            </Text>
          </VStack>
        </HStack>

        {/* Circular Progress */}
        <Flex justify="center" mt={4} mb={-2}>
          <CircularProgress percentage={finalProgressPct} />
        </Flex>

        {/* Action Buttons */}
        {showActions && (
          <Flex justify="space-between" w="100%" mt={2}>
            <Button
              size="lg"
              bg="#FBBF24" // Yellow color
              color="white"
              borderRadius="full"
              w="80px"
              h="80px"
              fontSize="xs"
              fontWeight="bold"
              _hover={{ bg: "#F59E42" }}
              _active={{ bg: "#B45309" }}
              onClick={() => resetProgress.mutate(assignment.id)}
            >
              RESET
            </Button>
            <Button
              size="lg"
              bg="#10B981" // Green color
              color="white"
              borderRadius="full"
              w="80px"
              h="80px"
              fontSize="xs"
              fontWeight="bold"
              _hover={{ bg: "#059669" }}
              _active={{ bg: "#047857" }}
              onClick={handleExecute}
            >
              START
            </Button>
          </Flex>
        )}
      </VStack>

      {/* Responsive Workout Details Drawer */}
      {isMobile ? (
        <MobileWorkoutDetails
          isOpen={isMobileDetailsOpen}
          onClose={onMobileDetailsClose}
          assignment={assignment}
          userRole="athlete"
          onExecute={onExecute}
          workout={null}
        />
      ) : (
        <WorkoutDetailsDrawer
          isOpen={isMobileDetailsOpen}
          onClose={onMobileDetailsClose}
          workout={convertAssignmentToWorkout()}
        />
      )}
    </Box>
  );
}

// Export a specialized version for different contexts
export function TodaysWorkoutCard({ assignment, onExecute }: { assignment: WorkoutAssignment; onExecute?: (id: string) => void }) {
  return (
    <UnifiedAssignmentCard 
      assignment={assignment} 
      onExecute={onExecute}
      showActions={true}
      compact={false}
    />
  );
}

export function CompactAssignmentCard({ assignment, onExecute }: { assignment: WorkoutAssignment; onExecute?: (id: string) => void }) {
  return (
    <UnifiedAssignmentCard 
      assignment={assignment} 
      onExecute={onExecute}
      showActions={true}
      compact={true}
    />
  );
}

// Coach-specific workout card that shows workout information without execution buttons
export function CoachWorkoutCard({ 
  workout, 
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onAssign,
  onViewDetails,
  isCoach = true,
  currentUserId,
  showActions = true
}: CoachWorkoutCardProps) {
  
  // State for workout details drawer
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  
  // Handle view details
  const handleViewDetails = () => {
    setIsDetailsDrawerOpen(true);
  };
  
  // Check if current user can delete
  const canDelete = currentUserId && (
    workout.user_id === currentUserId || isCoach
  );

  // Theme colors - responsive light/dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const separatorColor = useColorModeValue('gray.300', 'gray.500');

  // Responsive design - use mobile drawer on mobile
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Get workout details
  const getWorkoutDetails = () => {
    const exercises = workout.exercises || [];
    const blocks = workout.blocks || [];
    
    // Debug logging for coach workout cards
    console.log('🔧 COACH WORKOUT CARD - Workout Details Debug:', {
      workoutId: workout.id,
      workoutName: workout.name,
      templateType: workout.template_type,
      exercises: exercises,
      blocks: blocks,
      blocksType: typeof blocks,
      blocksKeys: blocks && typeof blocks === 'object' ? Object.keys(blocks) : 'n/a'
    });
    
    let totalExercises = 0;
    
    if (workout.template_type === 'weekly') {
      // For weekly workouts, count exercises from blocks organized by days
      if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
        // Blocks organized by days (monday, tuesday, etc.)
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        dayNames.forEach(dayName => {
          const dayBlocks = (blocks as any)[dayName];
          if (Array.isArray(dayBlocks)) {
            dayBlocks.forEach((block: any) => {
              if (block.exercises && Array.isArray(block.exercises)) {
                totalExercises += block.exercises.length;
              }
            });
          }
        });
        console.log('🔧 Weekly workout total exercises from blocks:', totalExercises);
      } else if (Array.isArray(blocks)) {
        // Single day blocks
        (blocks as any[]).forEach((block: any) => {
          if (block.exercises && Array.isArray(block.exercises)) {
            totalExercises += block.exercises.length;
          }
        });
        console.log('🔧 Single day blocks total exercises:', totalExercises);
      } else {
        // Fallback to exercises array
        totalExercises = exercises.length;
        console.log('🔧 Fallback to exercises array:', totalExercises);
      }
    } else {
      // For single/monthly workouts
      totalExercises = exercises.length;
    }
    
    return {
      title: workout.name,
      subtitle: workout.template_type === 'weekly' ? 'WEEKLY' : 
                workout.template_type === 'monthly' ? 'MONTHLY' : 'SINGLE',
      duration: workout.duration || '',
      exercises: totalExercises,
      blocks: Array.isArray(blocks) ? blocks.length : (blocks && typeof blocks === 'object' ? Object.keys(blocks).length : 0),
      workoutType: workout.template_type?.toUpperCase() || 'SINGLE'
    };
  };

  const details = getWorkoutDetails();

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  // Calculate athlete count from assignedTo
  const athleteCount = assignedTo && assignedTo !== 'Unassigned' ? 
    assignedTo.split(',').length : 0;

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="100px"
        height="100px"
        bg={useColorModeValue('gray.50', 'gray.700')}
        borderRadius="0 0 0 100px"
        opacity="0.5"
      />

      <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
        {/* Header with Workout Type and Menu */}
        <HStack justify="space-between" align="center">
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button 
              bg={useColorModeValue("gray.200", "gray.600")} 
              color={useColorModeValue("gray.700", "white")} 
              _hover={{ bg: useColorModeValue("gray.300", "gray.500") }}
              border="1px solid"
              borderColor={separatorColor}
            >
              {isCoach ? 'COACH' : 'ATHLETE'}
            </Button>
            <Button 
              bg={useColorModeValue("blue.100", "blue.600")} 
              color={useColorModeValue("blue.700", "white")} 
              _hover={{ bg: useColorModeValue("blue.200", "blue.500") }}
              border="1px solid"
              borderColor={separatorColor}
            >
              {details.workoutType}
            </Button>
          </ButtonGroup>

          {showActions && (
            isCoach ? (
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical />}
                  variant="ghost"
                  size="sm"
                  aria-label="Workout actions"
                />
                <Portal>
                  <MenuList zIndex={1000}>
                    <MenuItem 
                      icon={<Play />} 
                      onClick={handleViewDetails}
                    >
                      View Details
                    </MenuItem>
                    {onAssign && (
                      <MenuItem 
                        icon={<UserPlus />} 
                        onClick={onAssign}
                      >
                        Assign Athletes
                      </MenuItem>
                    )}
                    {onEdit && (
                      <MenuItem 
                        icon={<Edit />} 
                        onClick={onEdit}
                      >
                        Edit Workout
                      </MenuItem>
                    )}
                    {onDelete && canDelete && (
                      <MenuItem 
                        icon={<Trash2 />} 
                        onClick={onDelete}
                        color="red.500"
                      >
                        Delete
                      </MenuItem>
                    )}
                  </MenuList>
                </Portal>
              </Menu>
            ) : (
              <IconButton
                icon={<MoreVertical />}
                variant="ghost"
                size="sm"
                aria-label="View Details"
                onClick={handleViewDetails}
              />
            )
          )}
        </HStack>

        {/* Workout Title and Description */}
        <VStack spacing={2} align="start">
          <Text fontSize="xl" fontWeight="bold" color={textColor} noOfLines={2}>
            {details.title}
          </Text>
          {workout.description && (
            <Text fontSize="sm" color={secondaryTextColor} noOfLines={2}>
              {workout.description}
            </Text>
          )}
        </VStack>

        {/* Workout Stats */}
        <HStack justify="space-between" align="center" spacing={4}>
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
              EXERCISES
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {details.exercises}
            </Text>
          </VStack>
          
          <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
          
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
              BLOCKS
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {details.blocks}
            </Text>
          </VStack>
          
          <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
          
          <VStack spacing={1} flex={1}>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
              ASSIGNED
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {athleteCount}
            </Text>
          </VStack>
        </HStack>

        {/* Assignment Info */}
        {assignedTo && assignedTo !== 'Unassigned' && (
          <Box>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold" mb={1}>
              ASSIGNED TO
            </Text>
            <Text fontSize="sm" color={textColor} noOfLines={1}>
              {assignedTo}
            </Text>
          </Box>
        )}

        {/* Date Info */}
        {workout.date && (
          <Box>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold" mb={1}>
              DATE
            </Text>
            <Text fontSize="sm" color={textColor}>
              {formatDate(workout.date)}
            </Text>
          </Box>
        )}
      </VStack>

      {/* Responsive Workout Details Drawer */}
      {isMobile ? (
        <MobileWorkoutDetails
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          workout={workout}
          userRole="coach"
          assignedTo={assignedTo}
          athleteCount={athleteCount}
          onAssign={onAssign}
          onEdit={onEdit}
          onDelete={onDelete}
          assignment={null}
        />
      ) : (
        <WorkoutDetailsDrawer
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          workout={workout}
        />
      )}
    </Box>
  );
} 

// Coach-specific workout list item for list view
export function CoachWorkoutListItem({ 
  workout, 
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onAssign,
  onViewDetails,
  isCoach = true,
  currentUserId,
  showActions = true
}: CoachWorkoutCardProps) {
  
  // State for workout details drawer
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  
  // Handle view details
  const handleViewDetails = () => {
    setIsDetailsDrawerOpen(true);
  };
  
  // Check if current user can delete
  const canDelete = currentUserId && (
    workout.user_id === currentUserId || isCoach
  );

  // Theme colors - responsive light/dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Responsive design - use mobile drawer on mobile
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Get workout details
  const getWorkoutDetails = () => {
    const exercises = workout.exercises || [];
    const blocks = workout.blocks || [];
    
    // Debug logging for coach workout list items
    console.log('🔧 COACH WORKOUT LIST - Workout Details Debug:', {
      workoutId: workout.id,
      workoutName: workout.name,
      templateType: workout.template_type,
      exercises: exercises,
      blocks: blocks,
      blocksType: typeof blocks,
      blocksKeys: blocks && typeof blocks === 'object' ? Object.keys(blocks) : 'n/a'
    });
    
    let totalExercises = 0;
    
    if (workout.template_type === 'weekly') {
      // For weekly workouts, count exercises from blocks organized by days
      if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
        // Blocks organized by days (monday, tuesday, etc.)
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        dayNames.forEach(dayName => {
          const dayBlocks = (blocks as any)[dayName];
          if (Array.isArray(dayBlocks)) {
            dayBlocks.forEach((block: any) => {
              if (block.exercises && Array.isArray(block.exercises)) {
                totalExercises += block.exercises.length;
              }
            });
          }
        });
        console.log('🔧 Weekly workout list total exercises from blocks:', totalExercises);
      } else if (Array.isArray(blocks)) {
        // Single day blocks
        (blocks as any[]).forEach((block: any) => {
          if (block.exercises && Array.isArray(block.exercises)) {
            totalExercises += block.exercises.length;
          }
        });
        console.log('🔧 Single day blocks total exercises:', totalExercises);
      } else {
        // Fallback to exercises array
        totalExercises = exercises.length;
        console.log('🔧 Fallback to exercises array:', totalExercises);
      }
    } else {
      // For single/monthly workouts
      totalExercises = exercises.length;
    }
    
    return {
      title: workout.name,
      subtitle: workout.template_type === 'weekly' ? 'WEEKLY' : 
                workout.template_type === 'monthly' ? 'MONTHLY' : 'SINGLE',
      duration: workout.duration || '',
      exercises: totalExercises,
      blocks: Array.isArray(blocks) ? blocks.length : (blocks && typeof blocks === 'object' ? Object.keys(blocks).length : 0),
      workoutType: workout.template_type?.toUpperCase() || 'SINGLE'
    };
  };

  const details = getWorkoutDetails();

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  // Calculate athlete count from assignedTo
  const athleteCount = assignedTo && assignedTo !== 'Unassigned' ? 
    assignedTo.split(',').length : 0;

  return (
    <Box
      bg={cardBg}
      borderRadius="md"
      p={3}
      border="1px solid"
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ bg: hoverBg }}
      position="relative"
      cursor="pointer"
      onClick={handleViewDetails}
    >
      <VStack spacing={2} align="stretch">
        {/* Row 1: Workout name and actions */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3} align="center" flex="1" minW="0">
            <Badge 
              colorScheme="blue" 
              fontSize="xs" 
              px={2} 
              py={1}
              borderRadius="md"
              flexShrink={0}
            >
              {details.workoutType}
            </Badge>
            <Text fontSize="md" fontWeight="semibold" color={textColor} noOfLines={1} flex="1">
              {details.title}
            </Text>
          </HStack>
          
          {showActions && (
            isCoach ? (
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical />}
                  variant="ghost"
                  size="sm"
                  aria-label="Workout actions"
                  onClick={(e) => e.stopPropagation()}
                  flexShrink={0}
                />
                <Portal>
                  <MenuList zIndex={1000}>
                    <MenuItem 
                      icon={<Play />} 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleViewDetails(); 
                      }}
                    >
                      View Details
                    </MenuItem>
                    {onAssign && (
                      <MenuItem 
                        icon={<UserPlus />} 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          onAssign(); 
                        }}
                      >
                        Assign Athletes
                      </MenuItem>
                    )}
                    {onEdit && (
                      <MenuItem 
                        icon={<Edit />} 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          onEdit(); 
                        }}
                      >
                        Edit Workout
                      </MenuItem>
                    )}
                    {onDelete && canDelete && (
                      <MenuItem 
                        icon={<Trash2 />} 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          onDelete(); 
                        }}
                        color="red.500"
                      >
                        Delete
                      </MenuItem>
                    )}
                  </MenuList>
                </Portal>
              </Menu>
            ) : (
              <IconButton
                icon={<MoreVertical />}
                variant="ghost"
                size="sm"
                aria-label="View Details"
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  handleViewDetails(); 
                }}
                flexShrink={0}
              />
            )
          )}
        </HStack>

        {/* Row 2: Exercise and block info */}
        <HStack spacing={4} fontSize="sm" color={secondaryTextColor} wrap="wrap">
          <Text>{details.exercises} exercises</Text>
          {details.blocks > 0 && <Text>{details.blocks} blocks</Text>}
          {workout.date && <Text>{formatDate(workout.date)}</Text>}
        </HStack>

        {/* Row 3: Assignment info (if assigned) */}
        {assignedTo && assignedTo !== 'Unassigned' && (
          <Text fontSize="sm" color={secondaryTextColor} noOfLines={1}>
            Assigned: {assignedTo}
          </Text>
        )}
      </VStack>

      {/* Responsive Workout Details Drawer */}
      {isMobile ? (
        <MobileWorkoutDetails
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          workout={workout}
          userRole="coach"
          assignedTo={assignedTo}
          athleteCount={athleteCount}
          onAssign={onAssign}
          onEdit={onEdit}
          onDelete={onDelete}
          assignment={null}
        />
      ) : (
        <WorkoutDetailsDrawer
          isOpen={isDetailsDrawerOpen}
          onClose={() => setIsDetailsDrawerOpen(false)}
          workout={workout}
        />
      )}
    </Box>
  );
} 