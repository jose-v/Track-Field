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
  useBreakpoint,
  useToast,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent
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
  Users,
  Copy,
  X
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { MobileWorkoutDetails } from './MobileWorkoutDetails';
import { WorkoutDetailsDrawer } from './WorkoutDetailsDrawer';
import { PlanDetailView } from './PlanDetailView';
import DuplicateWorkoutModal from './DuplicateWorkoutModal';
import { useUnifiedAssignmentActions } from '../hooks/useUnifiedAssignments';
import type { WorkoutAssignment } from '../services/assignmentService';
import type { Workout } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';
import { supabase } from '../lib/supabase';
import { AssignmentService } from '../services/assignmentService';
import { formatDateDisplay } from '../utils/dateUtils';

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
  workout?: Workout;
  monthlyPlan?: TrainingPlan;
  assignedTo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onViewDetails?: () => void;
  isCoach?: boolean;
  currentUserId?: string;
  showActions?: boolean;
  // Monthly plan specific props
  completionStats?: {
    totalAssigned: number;
    completed: number;
    inProgress: number;
    percentage: number;
  };
  statsLoading?: boolean;
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
  // State for progress tracking
  const [progressData, setProgressData] = useState<{
    metrics: any;
    percentage: number;
  } | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  // State for mobile/desktop workout details
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // State for duplicate modal
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  
  // State for workout with loaded exercises (for details drawer)
  const [workoutWithExercises, setWorkoutWithExercises] = useState<any>(null);

  // Responsive design
  const isMobile = useBreakpointValue({ base: true, lg: false });
  
  // Initialize workout state
  useEffect(() => {
    setWorkoutWithExercises(convertAssignmentToWorkout());
  }, [assignment]);
  
  // Toast for notifications
  const toast = useToast();
  
  // Query client for data invalidation
  const queryClient = useQueryClient();

  // Handle duplicate assignment
  const handleDuplicateAssignment = () => {
    setIsDuplicateModalOpen(true);
  };

  // Handle duplicate success
  const handleDuplicateSuccess = async () => {
    // Invalidate relevant queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['workouts'] });
    await queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
    await queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
  };
  
  const handleViewDetails = () => {
    if (isMobile) {
      setIsMobileDetailsOpen(true);
    } else {
      setIsDetailsDrawerOpen(true);
    }
  };

  const handleExecute = () => {
    if (onExecute) {
      onExecute(assignment.id);
    }
  };

  const convertAssignmentToWorkout = () => {
    if (!assignment) return null;
    
    // Base workout structure
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
    
    // For weekly assignments, ensure blocks are properly structured for WorkoutDetailsDrawer
    if (assignment.assignment_type === 'weekly') {
      const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
      
      // Check if we have daily_workouts data
      if (Object.keys(dailyWorkouts).length > 0) {
        // Convert daily_workouts to blocks format for WorkoutDetailsDrawer
        const dayBlocks: any = {};
        
        // Map daily workouts to blocks structure
        Object.entries(dailyWorkouts).forEach(([dayName, dayData]: [string, any]) => {
          if (dayData && Array.isArray(dayData)) {
            // New blocks format - array of blocks
            dayBlocks[dayName] = dayData;
          } else if (dayData && dayData.exercises) {
            // Legacy format - single day with exercises
            dayBlocks[dayName] = [{
              name: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} Workout`,
              exercises: dayData.exercises,
              is_rest_day: dayData.is_rest_day || false
            }];
          }
        });
        
        // Set the blocks to the converted structure if we have valid data
        if (Object.keys(dayBlocks).length > 0) {
          workout.blocks = dayBlocks;
          console.log('🔧 Weekly assignment converted blocks for details drawer:', dayBlocks);
        }
      }
      
      // If we have blocks data already, use that
      else if (assignment.exercise_block?.blocks) {
        let blocks = assignment.exercise_block.blocks;
        
        // Parse blocks if it's a string
        if (typeof blocks === 'string') {
          try {
            blocks = JSON.parse(blocks);
          } catch (e) {
            console.error('Error parsing assignment blocks:', e);
          }
        }
        
        workout.blocks = blocks;
      }
    }
    
    // For monthly assignments, convert today's workout to exercises format for WorkoutDetailsDrawer
    else if (assignment.assignment_type === 'monthly') {
      // This will be populated by getCorrectExerciseData when the component loads
      // We'll update the workout structure with today's exercises async
      workout.exercises = []; // Start with empty, will be populated
      workout.description = `Monthly training plan - Today's workout from Week ${Math.floor(((new Date().getTime() - new Date(assignment.start_date).getTime()) / (1000 * 60 * 60 * 24)) / 7) + 1}`;
    }
    
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
      // For monthly plans, extract today's exercises directly from weekly structure
      const weeklyStructure = assignment.exercise_block?.weekly_structure || [];
      
      let todaysExercises: any[] = [];
      
      if (weeklyStructure.length > 0) {
        // Calculate current week based on assignment start date
        const startDate = new Date(assignment.start_date);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(daysDiff / 7) + 1;
        
        // Find current week in structure
        const currentWeekInfo = weeklyStructure.find((week: any) => week.week_number === currentWeek);
        
        if (currentWeekInfo && !currentWeekInfo.is_rest_week && currentWeekInfo.workout_id) {
          // Fetch the weekly workout for this week
          try {
            const { data: weeklyWorkout, error } = await supabase
              .from('workouts')
              .select('*')
              .eq('id', currentWeekInfo.workout_id)
              .single();
            
            if (!error && weeklyWorkout) {
              // Check if this weekly workout has daily_workouts structure
              const dailyWorkouts = weeklyWorkout.daily_workouts || {};
              
              if (Object.keys(dailyWorkouts).length > 0) {
                // Has daily workout structure - extract today's exercises
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const currentDayName = dayNames[today.getDay()];
                const todaysWorkout = dailyWorkouts[currentDayName];
                
                if (todaysWorkout) {
                  if (Array.isArray(todaysWorkout)) {
                    // New blocks format
                    todaysExercises = todaysWorkout.flatMap((block: any) => block?.exercises || []);
                  } else if (todaysWorkout.exercises) {
                    // Legacy format
                    todaysExercises = todaysWorkout.exercises;
                  }
                }
              } else {
                // No daily_workouts structure - extract directly from blocks or exercises
                if (weeklyWorkout.blocks) {
                  // Extract from blocks structure
                  let blocks = weeklyWorkout.blocks;
                  if (typeof blocks === 'string') {
                    try {
                      blocks = JSON.parse(blocks);
                    } catch (e) {
                      console.error('Error parsing blocks JSON:', e);
                      blocks = [];
                    }
                  }
                  
                  if (Array.isArray(blocks)) {
                    // Blocks is an array - use existing logic
                    todaysExercises = blocks.flatMap((block: any) => {
                      return block?.exercises || [];
                    });
                  } else if (blocks && typeof blocks === 'object') {
                    // Blocks is an object with day keys - extract today's exercises directly
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const currentDayName = dayNames[today.getDay()];
                    const dayKey = currentDayName + 's'; // monday -> mondays
                    const todaysDayExercises = blocks[dayKey] || blocks[currentDayName];
                    
                    if (Array.isArray(todaysDayExercises)) {
                      // Extract exercises from today's day blocks
                      todaysExercises = todaysDayExercises.flatMap((dayBlock: any) => {
                        if (dayBlock?.exercises) {
                          return dayBlock.exercises;
                        } else if (dayBlock && dayBlock.name) {
                          // Direct exercise object
                          return [dayBlock];
                        }
                        return [];
                      });
                    } else if (!todaysDayExercises) {
                      // Fallback: use first available day
                      const firstAvailableDay = Object.keys(blocks).find(key => Array.isArray(blocks[key]));
                      if (firstAvailableDay) {
                        const firstDayExercises = blocks[firstAvailableDay];
                        todaysExercises = firstDayExercises.flatMap((dayBlock: any) => {
                          return dayBlock?.exercises || (dayBlock && dayBlock.name ? [dayBlock] : []);
                        });
                      }
                    }
                  }
                } else if (weeklyWorkout.exercises) {
                  // Extract directly from exercises
                  todaysExercises = weeklyWorkout.exercises;
                }
              }
            }
          } catch (fetchError) {
            console.error('Error fetching weekly workout for monthly plan:', fetchError);
          }
        }
      }
      
      return todaysExercises;
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
        // For exercises: if someone is on exercise index 2, they've completed 2 exercises (0 and 1)
        // But if they haven't started yet (currentSet = 1, currentRep = 1), they haven't completed the current exercise
        let actualCompletedExercises = currentExerciseIndex;
        
        // If we're at the beginning of the current exercise (set 1, rep 1), 
        // then we haven't actually completed any work on the current exercise yet
        if (currentSet === 1 && currentRep === 1 && currentExerciseIndex > 0) {
          // We're at the start of a new exercise, so completed exercises = current index
          actualCompletedExercises = currentExerciseIndex;
        } else if (currentSet > 1 || currentRep > 1) {
          // We've made progress in the current exercise, so count it as in progress
          actualCompletedExercises = currentExerciseIndex;
        }
        
        metrics = {
          exercises: { current: actualCompletedExercises, total: exercises.length },
          sets: { current: completedSets, total: totalSets },
          reps: { current: completedReps, total: totalReps }
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
        // For monthly plans, extract today's exercises directly from weekly structure
        // Don't use getCorrectExerciseData() - it returns empty array for monthly plans
        
        const weeklyStructure = assignment.exercise_block?.weekly_structure || [];
        

        
        let todaysExercises: any[] = [];
        
        if (weeklyStructure.length > 0) {
          // Calculate current week based on assignment start date
          const startDate = new Date(assignment.start_date);
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const currentWeek = Math.floor(daysDiff / 7) + 1;
          
          // Find current week in structure
          const currentWeekInfo = weeklyStructure.find((week: any) => week.week_number === currentWeek);
          
          
          
          if (currentWeekInfo && !currentWeekInfo.is_rest_week && currentWeekInfo.workout_id) {
            // Fetch the weekly workout for this week
            try {
              const { data: weeklyWorkout, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('id', currentWeekInfo.workout_id)
                .single();
              
              if (error) {
                console.error('Error fetching weekly workout:', error);
                             } else if (weeklyWorkout) {

                 
                 // Extract today's exercises from the weekly workout
                 const dailyWorkouts = weeklyWorkout.daily_workouts || {};
                 const today = new Date();
                 const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                 const currentDayName = dayNames[today.getDay()];
                 
                 const todaysWorkout = dailyWorkouts[currentDayName];
                 
                 // Check if this weekly workout has daily_workouts structure
                 if (Object.keys(dailyWorkouts).length > 0) {
                   // Has daily workout structure - extract today's exercises
                   const todaysWorkout = dailyWorkouts[currentDayName];
                   
                   console.log('🏃‍♂️ Extracting from daily_workouts structure:', {
                     current_day: currentDayName,
                     todays_workout: todaysWorkout,
                     daily_workouts_keys: Object.keys(dailyWorkouts)
                   });
                   
                   if (todaysWorkout) {
                     if (Array.isArray(todaysWorkout)) {
                       // New blocks format - each item in array is a block
                       console.log('📦 Processing blocks format:', todaysWorkout);
                       todaysExercises = todaysWorkout.flatMap((block: any) => {
                         console.log('🔍 Block data:', block);
                         return block?.exercises || [];
                       });
                     } else if (todaysWorkout.exercises) {
                       // Legacy format
                       console.log('📝 Processing legacy format:', todaysWorkout.exercises);
                       todaysExercises = todaysWorkout.exercises;
                     }
                   }
                 } else {
                   // No daily_workouts structure - extract directly from blocks or exercises

                   
                   if (weeklyWorkout.blocks) {
                     // Extract from blocks structure
                     let blocks = weeklyWorkout.blocks;
                     if (typeof blocks === 'string') {
                       try {
                         blocks = JSON.parse(blocks);
                       } catch (e) {
                         console.error('Error parsing blocks JSON:', e);
                         blocks = [];
                       }
                     }
                     

                     
                     if (Array.isArray(blocks)) {
                                                // Blocks is an array - use existing logic
                         todaysExercises = blocks.flatMap((block: any) => {
                           return block?.exercises || [];
                         });
                     } else if (blocks && typeof blocks === 'object') {
                                                // Blocks is an object with day keys - extract today's exercises directly
                         const dayKey = currentDayName + 's'; // monday -> mondays
                         const todaysDayExercises = blocks[dayKey] || blocks[currentDayName];
                       
                       if (Array.isArray(todaysDayExercises)) {
                                                    // Extract exercises from today's day blocks
                           todaysExercises = todaysDayExercises.flatMap((dayBlock: any) => {
                             if (dayBlock?.exercises) {
                               return dayBlock.exercises;
                             } else if (dayBlock && dayBlock.name) {
                               // Direct exercise object
                               return [dayBlock];
                             }
                             return [];
                           });
                                                } else if (!todaysDayExercises) {
                           // Fallback: use first available day
                           const firstAvailableDay = Object.keys(blocks).find(key => Array.isArray(blocks[key]));
                           if (firstAvailableDay) {
                             const firstDayExercises = blocks[firstAvailableDay];
                             todaysExercises = firstDayExercises.flatMap((dayBlock: any) => {
                               return dayBlock?.exercises || (dayBlock && dayBlock.name ? [dayBlock] : []);
                             });
                           }
                         }
                     }
                                        } else if (weeklyWorkout.exercises) {
                       // Extract directly from exercises
                       todaysExercises = weeklyWorkout.exercises;
                     }
                 }
               }
            } catch (fetchError) {
              console.error('Error fetching weekly workout for monthly plan:', fetchError);
            }
          }
        }
        
        
        
        if (todaysExercises.length > 0) {
          // Calculate today's workout metrics
          let totalSets = 0;
          let totalReps = 0;
          let completedSets = 0;
          let completedReps = 0;
          
          todaysExercises.forEach((exercise: any, index: number) => {
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
          

          
          metrics = {
            exercises: { current: currentExerciseIndex, total: todaysExercises.length },
            sets: { current: completedSets, total: totalSets },
            reps: { current: completedReps, total: totalReps }
          };
          
          // Update workout state with loaded exercises for details drawer
          if (todaysExercises.length > 0) {
            setWorkoutWithExercises(prev => ({
              ...prev,
              exercises: todaysExercises
            }));
          }
        } else {
          // Rest day or no workout today
          metrics = {
            exercises: { current: 0, total: 0 },
            sets: { current: 0, total: 0 },
            reps: { current: 0, total: 0 }
          };
        }
      } else {
        // Fallback for unknown types
        metrics = {
          exercises: { current: 0, total: details.exercises },
          sets: { current: 0, total: 0 },
          reps: { current: 0, total: 0 }
        };
      }

      // Calculate daily workout progress for single and weekly assignment types
      // Focus on: "How much of TODAY'S workout is complete?"
      // Note: Monthly plans are handled above with early return
      let calculatedPercentage = 0;
      
      console.log('🔍 DETAILED DEBUG for', assignment.id.slice(-4), ':', {
        assignment_type: assignment.assignment_type,
        status: assignment.status,
        progress_from_db: {
          current_exercise_index: progress.current_exercise_index,
          current_set: progress.current_set,
          current_rep: progress.current_rep,
          completion_percentage: progress.completion_percentage
        },
        calculated_metrics: metrics,
        raw_assignment_progress: assignment.progress
      });
      
      // For ALL workout types, use the same daily progress calculation
      if (metrics.exercises.total > 0 && metrics.reps.total > 0) {
        // Use reps as the most granular indicator of daily progress
        const calculation = (metrics.reps.current / metrics.reps.total) * 100;
        calculatedPercentage = Math.round(calculation);
        
        console.log('📅 REPS-BASED calculation for', assignment.id.slice(-4), ':', {
          type: assignment.assignment_type,
          reps_current: metrics.reps.current,
          reps_total: metrics.reps.total,
          raw_calculation: calculation,
          rounded_percentage: calculatedPercentage,
          exercises_for_context: `${metrics.exercises.current}/${metrics.exercises.total}`
        });
      } else if (metrics.exercises.total > 0) {
        // Fallback to exercise-based calculation if no reps data
        const calculation = (metrics.exercises.current / metrics.exercises.total) * 100;
        calculatedPercentage = Math.round(calculation);
        
        console.log('📅 EXERCISE-BASED calculation for', assignment.id.slice(-4), ':', {
          type: assignment.assignment_type,
          exercises_current: metrics.exercises.current,
          exercises_total: metrics.exercises.total,
          raw_calculation: calculation,
          rounded_percentage: calculatedPercentage
        });
      } else {
        // No exercise data available - show 0% (monthly plans handled above with early return)
        calculatedPercentage = 0;
        
        console.log('❌ FALLBACK calculation for', assignment.id.slice(-4), ':', {
          type: assignment.assignment_type,
          fallback_percentage: calculatedPercentage,
          reason: 'No exercise or reps data available'
        });
      }
      
      // Use the calculated percentage based on actual progress
      const finalPercentage = calculatedPercentage;

      console.log('🎯 Setting progress data with percentage:', finalPercentage);
      
      setProgressData({
        metrics,
        percentage: finalPercentage
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
  
  console.log('📱 Card will display percentage:', progress_pct, 'from progressData');
  
  // Use the calculated percentage from progressData instead of just the stored value
  const finalProgressPct = progress_pct;
  
  // Check if assignment is actually completed based on progress AND status
  const isCompleted = assignment.status === 'completed' && finalProgressPct >= 100;
  const isInProgress = assignment.status === 'in_progress' || (assignment.status === 'completed' && finalProgressPct < 100);

  // Format dates - using timezone-safe utility to prevent day offset issues
  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString);
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

  // Animated circular progress component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const radius = 78; // 20% bigger than 65
    const strokeWidth = 10; // Thicker stroke
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    
    // Animate the progress from 0 to target percentage
    useEffect(() => {
      const duration = 1500; // 1.5 seconds animation
      const startTime = Date.now();
      const startValue = 0;
      const endValue = percentage;
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOut;
        
        setAnimatedPercentage(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      // Start animation with a small delay for better visual effect
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(animate);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }, [percentage]);
    
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
    const currentColor = animatedPercentage >= 100 ? '#10B981' : animatedPercentage >= 50 ? '#F59E0B' : '#EF4444';

    return (
      <Box position="relative" display="inline-block">
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            stroke={useColorModeValue('#E5E7EB', '#374151')}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
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
            style={{
              transition: 'stroke 0.3s ease-in-out',
            }}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
        >
          <Text
            fontSize="lg" 
            fontWeight="bold"
            color={currentColor}
            style={{
              transition: 'color 0.3s ease-in-out',
            }}
          >
            {Math.round(animatedPercentage)}%
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
                  <MenuItem 
                        icon={<Copy />} 
                    onClick={handleDuplicateAssignment}
                  >
                    Duplicate Workout
                  </MenuItem>
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

      {/* Mobile Workout Details Drawer */}
        <MobileWorkoutDetails
          isOpen={isMobileDetailsOpen}
        onClose={() => setIsMobileDetailsOpen(false)}
          assignment={assignment}
          userRole="athlete"
          onExecute={onExecute}
          workout={null}
        />

      {/* Desktop Workout Details Drawer */}
      <WorkoutDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        workout={workoutWithExercises || convertAssignmentToWorkout()}
      />

      {/* Duplicate Workout Modal */}
      <DuplicateWorkoutModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        assignment={assignment}
        onSuccess={handleDuplicateSuccess}
        currentUserId={currentUserId}
      />
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
  monthlyPlan,
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onAssign,
  onViewDetails,
  isCoach = true,
  currentUserId,
  showActions = true,
  completionStats,
  statsLoading = false
}: CoachWorkoutCardProps) {
  
  // State for workout details drawer
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  
  // State for monthly plan details drawer
  const [selectedPlanForView, setSelectedPlanForView] = useState<TrainingPlan | null>(null);
  const [showPlanDetailView, setShowPlanDetailView] = useState(false);
  
  // State for duplicate modal
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  
  // Toast for notifications
  const toast = useToast();
  
  // Query client for data invalidation
  const queryClient = useQueryClient();

  // Handle duplicate workout
  const handleDuplicateWorkout = () => {
    setIsDuplicateModalOpen(true);
  };

  // Handle duplicate success
  const handleDuplicateSuccess = async () => {
    // Invalidate relevant queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['workouts'] });
    await queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
    await queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
  };
  
  // Handle view details
  const handleViewDetails = () => {
    if (isMonthlyPlan && monthlyPlan) {
      setSelectedPlanForView(monthlyPlan);
      setShowPlanDetailView(true);
    } else {
    setIsDetailsDrawerOpen(true);
    }
  };

  // Handle monthly plan assign
  const handleAssignPlan = (plan: TrainingPlan) => {
    setShowPlanDetailView(false);
    if (onAssign) {
      onAssign();
    }
  };

  // Handle monthly plan edit
  const handleEditPlan = (plan: TrainingPlan) => {
    setShowPlanDetailView(false);
    if (onEdit) {
      onEdit();
    }
  };
  


  // Theme colors - responsive light/dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const separatorColor = useColorModeValue('gray.300', 'gray.500');

  // Responsive design - use mobile drawer on mobile
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Determine if this is a monthly plan or workout
  const isMonthlyPlan = !!monthlyPlan;
  const dataItem = isMonthlyPlan ? monthlyPlan : workout;

  // Helper functions for monthly plans
  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const getActiveWeekCount = (weeks: any[]): number => {
    if (!Array.isArray(weeks)) return 0;
    return weeks.filter(week => !week.is_rest_week).length;
  };

  const getRestWeekCount = (weeks: any[]): number => {
    if (!Array.isArray(weeks)) return 0;
    return weeks.filter(week => week.is_rest_week).length;
  };

  // Check if current user can delete
  const canDelete = currentUserId && (
    isMonthlyPlan 
      ? monthlyPlan.coach_id === currentUserId || isCoach
      : workout?.user_id === currentUserId || isCoach
  );

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
    
    // First, try to get exercises from blocks if the workout is block-based
    if (blocks && (Array.isArray(blocks) || (typeof blocks === 'object' && Object.keys(blocks).length > 0))) {
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
        }
      } else {
        // For single/monthly block-based workouts, count exercises from blocks
        if (Array.isArray(blocks)) {
          (blocks as any[]).forEach((block: any) => {
            if (block.exercises && Array.isArray(block.exercises)) {
              totalExercises += block.exercises.length;
            }
          });
          console.log('🔧 Single/Monthly block-based workout total exercises:', totalExercises);
        } else if (typeof blocks === 'object') {
          // Handle object-based blocks for single workouts
          Object.values(blocks).forEach((block: any) => {
            if (block && block.exercises && Array.isArray(block.exercises)) {
              totalExercises += block.exercises.length;
            }
          });
          console.log('🔧 Single/Monthly object-based blocks total exercises:', totalExercises);
        }
      }
    }
    
    // If no exercises found in blocks, fallback to exercises array
    if (totalExercises === 0) {
        totalExercises = exercises.length;
        console.log('🔧 Fallback to exercises array:', totalExercises);
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

  // Format dates - using timezone-safe utility to prevent day offset issues
  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString);
  };

  // Calculate athlete count from assignedTo
  const athleteCount = assignedTo && 
    assignedTo !== 'Unassigned' && 
    assignedTo !== 'Not assigned' && 
    assignedTo !== 'Loading assignments...' &&
    !assignedTo.includes('Loading') ? 
    assignedTo.split(',').length : 0;

  // Render monthly plan or workout
  if (isMonthlyPlan && monthlyPlan) {
    // Monthly Plan Rendering
    const startDate = new Date(monthlyPlan.start_date);
    const monthName = getMonthName(startDate.getMonth() + 1);
    const year = startDate.getFullYear();
    const activeWeeks = getActiveWeekCount(monthlyPlan.weeks);
    const totalWeeks = monthlyPlan.weeks.length;

    return (
      <>
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
          bg={useColorModeValue('purple.50', 'purple.700')}
          borderRadius="0 0 0 100px"
          opacity="0.5"
        />

        <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
          {/* Header with Monthly Plan Type and Menu */}
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
                bg={useColorModeValue("purple.100", "purple.600")} 
                color={useColorModeValue("purple.700", "white")} 
                _hover={{ bg: useColorModeValue("purple.200", "purple.500") }}
                border="1px solid"
                borderColor={separatorColor}
              >
                MONTHLY PLAN
              </Button>
            </ButtonGroup>

            {showActions && isCoach && (
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical />}
                  variant="ghost"
                  size="sm"
                  aria-label="Monthly plan actions"
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
                        Edit Plan
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
            )}
          </HStack>

          {/* Monthly Plan Title and Description */}
          <VStack spacing={2} align="start">
            <Text fontSize="xl" fontWeight="bold" color={textColor} noOfLines={2}>
              {monthlyPlan.name}
            </Text>
            {monthlyPlan.description && (
              <Text fontSize="sm" color={secondaryTextColor} noOfLines={2}>
                {monthlyPlan.description}
              </Text>
            )}
          </VStack>

          {/* Monthly Plan Stats */}
          <HStack justify="space-between" align="center" spacing={4}>
            <VStack spacing={1} flex={1}>
              <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
                WEEKS
              </Text>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {totalWeeks}
              </Text>
            </VStack>
            
            <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
            
            <VStack spacing={1} flex={1}>
              <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
                ASSIGNED
              </Text>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {statsLoading ? '...' : completionStats?.totalAssigned || 0}
              </Text>
            </VStack>
            
            <Box w="1px" h="40px" bg={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.2)")} />
            
            <VStack spacing={1} flex={1}>
              <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold">
                PROGRESS
              </Text>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {statsLoading ? '...' : `${Math.round(completionStats?.percentage || 0)}%`}
              </Text>
            </VStack>
          </HStack>

          {/* Monthly Plan Period */}
          <Box>
            <Text fontSize="xs" color={secondaryTextColor} fontWeight="bold" mb={1}>
              PERIOD
            </Text>
            <Text fontSize="sm" color={textColor}>
              {monthName} {year}
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* Monthly Plan Detail View Drawer */}
      <Drawer
        isOpen={showPlanDetailView}
        placement="right"
        onClose={() => setShowPlanDetailView(false)}
        size="xl"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0}>
            {selectedPlanForView && (
              <PlanDetailView
                monthlyPlan={selectedPlanForView}
                onBack={() => setShowPlanDetailView(false)}
                onAssign={() => handleAssignPlan(selectedPlanForView)}
                onEdit={() => handleEditPlan(selectedPlanForView)}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      </>
    );
  }

  // Original Workout Rendering
  if (!workout) return null;

  const details = getWorkoutDetails();

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
                    {onAssign && !workout.is_template && (
                      <MenuItem 
                        icon={<UserPlus />} 
                        onClick={onAssign}
                      >
                        Assign Athletes
                      </MenuItem>
                    )}
                    <MenuItem 
                      icon={<Copy />} 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleDuplicateWorkout(); 
                      }}
                    >
                      {workout.is_template ? 'Duplicate Template' : 'Duplicate Workout'}
                    </MenuItem>
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

      {/* Monthly Plan Detail View Drawer */}
      <Drawer
        isOpen={showPlanDetailView}
        placement="right"
        onClose={() => setShowPlanDetailView(false)}
        size="xl"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0}>
            {selectedPlanForView && (
              <PlanDetailView
                monthlyPlan={selectedPlanForView}
                onBack={() => setShowPlanDetailView(false)}
                onAssign={() => handleAssignPlan(selectedPlanForView)}
                onEdit={() => handleEditPlan(selectedPlanForView)}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Duplicate Workout Modal */}
      <DuplicateWorkoutModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        workout={workout}
        onSuccess={handleDuplicateSuccess}
        currentUserId={currentUserId}
      />
    </Box>
  );
} 

// Coach-specific workout list item for list view
export function CoachWorkoutListItem({ 
  workout, 
  monthlyPlan,
  assignedTo = 'Unassigned',
  onEdit,
  onDelete,
  onAssign,
  onViewDetails,
  isCoach = true,
  currentUserId,
  showActions = true,
  completionStats,
  statsLoading = false
}: CoachWorkoutCardProps) {
  
  // State for workout details drawer
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // State for monthly plan details drawer
  const [selectedPlanForViewList, setSelectedPlanForViewList] = useState<TrainingPlan | null>(null);
  const [showPlanDetailDrawerList, setShowPlanDetailDrawerList] = useState(false);


  // State for duplicate modal
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Toast for notifications
  const toast = useToast();
  
  // Query client for data invalidation
  const queryClient = useQueryClient();

  // Handle duplicate workout
  const handleDuplicateWorkout = () => {
    setIsDuplicateModalOpen(true);
  };

  // Handle duplicate success
  const handleDuplicateSuccess = async () => {
    // Invalidate relevant queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['workouts'] });
    await queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
    await queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
  };
  
  // Handle view details
  const handleViewDetails = () => {
    const isMonthlyPlan = !!monthlyPlan;
    
    if (isMonthlyPlan && monthlyPlan) {
      setSelectedPlanForViewList(monthlyPlan);
      setShowPlanDetailDrawerList(true);
    } else {
    setIsDetailsDrawerOpen(true);
    }
  };

  // Handle monthly plan assign
  const handleAssignPlanList = (plan: TrainingPlan) => {
    setShowPlanDetailDrawerList(false);
    if (onAssign) {
      onAssign();
    }
  };

  // Handle monthly plan edit
  const handleEditPlanList = (plan: TrainingPlan) => {
    setShowPlanDetailDrawerList(false);
    if (onEdit) {
      onEdit();
    }
  };
  


  // Theme colors - responsive light/dark mode
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Responsive design - use mobile drawer on mobile
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Determine if this is a monthly plan or workout
  const isMonthlyPlan = !!monthlyPlan;
  const dataItem = isMonthlyPlan ? monthlyPlan : workout;

  // Helper functions for monthly plans
  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const getActiveWeekCount = (weeks: any[]): number => {
    if (!Array.isArray(weeks)) return 0;
    return weeks.filter(week => !week.is_rest_week).length;
  };

  const getRestWeekCount = (weeks: any[]): number => {
    if (!Array.isArray(weeks)) return 0;
    return weeks.filter(week => week.is_rest_week).length;
  };

  // Check if current user can delete
  const canDelete = currentUserId && (
    isMonthlyPlan 
      ? monthlyPlan.coach_id === currentUserId || isCoach
      : workout?.user_id === currentUserId || isCoach
  );

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
      }
    } else {
      // For single/monthly block-based workouts, count exercises from blocks
      if (Array.isArray(blocks)) {
        (blocks as any[]).forEach((block: any) => {
          if (block.exercises && Array.isArray(block.exercises)) {
            totalExercises += block.exercises.length;
          }
        });
        console.log('🔧 LIST - Single/Monthly block-based workout total exercises:', totalExercises);
      } else if (typeof blocks === 'object') {
        // Handle object-based blocks for single workouts
        Object.values(blocks).forEach((block: any) => {
          if (block && block.exercises && Array.isArray(block.exercises)) {
            totalExercises += block.exercises.length;
          }
        });
        console.log('🔧 LIST - Single/Monthly object-based blocks total exercises:', totalExercises);
      }
    }
    
    // If no exercises found in blocks, fallback to exercises array
    if (totalExercises === 0) {
      totalExercises = exercises.length;
      console.log('🔧 LIST - Fallback to exercises array:', totalExercises);
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

  // Format dates - using timezone-safe utility to prevent day offset issues
  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString);
  };

  // Render monthly plan or workout
  if (isMonthlyPlan && monthlyPlan) {
    // Monthly Plan List Item Rendering
    const startDate = new Date(monthlyPlan.start_date);
    const monthName = getMonthName(startDate.getMonth() + 1);
    const year = startDate.getFullYear();
    const totalWeeks = monthlyPlan.weeks.length;

    return (
      <>
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
          {/* Row 1: Title and actions */}
          <HStack justify="space-between" align="start">
            <VStack spacing={1} align="start" flex={1}>
              <Text fontSize="lg" fontWeight="bold" color={textColor} noOfLines={1}>
                {monthlyPlan.name}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="purple" size="sm">MONTHLY PLAN</Badge>
              </HStack>
            </VStack>


            {showActions && isCoach && (
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical />}
                  variant="ghost"
                  size="sm"
                  aria-label="Monthly plan actions"
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
                        Edit Plan
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
            )}
          </HStack>

          {/* Row 2: Plan info */}
          <HStack spacing={4} fontSize="sm" color={secondaryTextColor} wrap="wrap">
            <Text>{totalWeeks} weeks</Text>
            <Text>{monthName} {year}</Text>
            <Text>{statsLoading ? '...' : completionStats?.totalAssigned || 0} assigned</Text>
          </HStack>

          {/* Row 3: Description (if exists) */}
          {monthlyPlan.description && (
            <Text fontSize="sm" color={secondaryTextColor} noOfLines={2}>
              {monthlyPlan.description}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Monthly Plan Detail View Drawer */}
      <Drawer
        isOpen={showPlanDetailDrawerList}
        placement="right"
        onClose={() => setShowPlanDetailDrawerList(false)}
        size="xl"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody p={0}>
            {selectedPlanForViewList && (
              <PlanDetailView
                monthlyPlan={selectedPlanForViewList}
                onBack={() => setShowPlanDetailDrawerList(false)}
                onAssign={() => handleAssignPlanList(selectedPlanForViewList)}
                onEdit={() => handleEditPlanList(selectedPlanForViewList)}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      </>
    );
  }

  // Original Workout List Item Rendering
  if (!workout) return null;

  const details = getWorkoutDetails();

  // Calculate athlete count from assignedTo
  const athleteCount = assignedTo && 
    assignedTo !== 'Unassigned' && 
    assignedTo !== 'Not assigned' && 
    assignedTo !== 'Loading assignments...' &&
    !assignedTo.includes('Loading') ? 
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
                    {onAssign && !workout.is_template && (
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
                    <MenuItem 
                      icon={<Copy />} 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleDuplicateWorkout(); 
                      }}
                    >
                      {workout.is_template ? 'Duplicate Template' : 'Duplicate Workout'}
                    </MenuItem>
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



      {/* Duplicate Workout Modal */}
      <DuplicateWorkoutModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        workout={workout}
        onSuccess={handleDuplicateSuccess}
        currentUserId={currentUserId}
      />
    </Box>
  );
} 