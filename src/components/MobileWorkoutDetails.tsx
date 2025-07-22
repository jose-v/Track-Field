import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Flex,
  IconButton,
  useColorModeValue,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Button,
  SimpleGrid,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Collapse,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { 
  FaRunning, 
  FaDumbbell, 
  FaLeaf, 
  FaClock, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaTimes,
  FaUsers,
  FaEdit,
  FaTrash,
  FaPlay,
  FaRedo,
  FaEye,
  FaUser,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEllipsisV,
  FaCopy,
} from 'react-icons/fa';
import { format } from 'date-fns';
import type { Workout } from '../services/api';
import { getExercisesFromWorkout, getBlocksFromWorkout } from '../utils/workoutUtils';
import { AssignmentService } from '../services/assignmentService';
import { useQueryClient } from '@tanstack/react-query';

interface MobileWorkoutDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  userRole: 'athlete' | 'coach';
  // Athlete-specific props
  progress?: {
    completed: number;
    total: number;
    percentage: number;
    hasProgress?: boolean;
  };
  onStart?: () => void;
  onReset?: () => void;
  // Coach-specific props
  assignedTo?: string;
  athleteCount?: number;
  completionRate?: number;
  onAssign?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewProgress?: () => void;
  // Assignment-specific props (for unified assignments)
  assignment?: any;
  onExecute?: (assignmentId: string) => void;
}

function getTypeIcon(type: string | undefined) {
  switch (type?.toLowerCase()) {
    case 'strength':
      return { type: FaDumbbell, color: 'orange.500' };
    case 'cardio':
      return { type: FaRunning, color: 'red.500' };
    case 'flexibility':
      return { type: FaLeaf, color: 'green.500' };
    default:
      return { type: FaRunning, color: 'blue.500' };
  }
}

// Convert assignment to workout format (like UnifiedAssignmentCard does)
const convertAssignmentToWorkout = (assignment: any) => {
  if (!assignment || typeof assignment !== 'object') {
    console.warn('Invalid assignment data provided to convertAssignmentToWorkout');
    return null;
  }
  
  // Ensure required fields exist
  if (!assignment.exercise_block || typeof assignment.exercise_block !== 'object') {
    console.warn('Assignment missing exercise_block');
    return null;
  }
  
  try {
    // Base workout structure with safe defaults
  const workout = {
      id: assignment.id || `temp-${Date.now()}`,
    name: assignment.exercise_block?.workout_name || assignment.exercise_block?.plan_name || 'Assignment Workout',
    description: assignment.exercise_block?.description || '',
      type: assignment.assignment_type || 'single',
      date: assignment.start_date || new Date().toISOString(),
    duration: assignment.exercise_block?.estimated_duration || '',
    notes: assignment.exercise_block?.notes || '',
      created_at: assignment.created_at || new Date().toISOString(),
      exercises: Array.isArray(assignment.exercise_block?.exercises) ? assignment.exercise_block.exercises : [],
    blocks: assignment.exercise_block?.blocks || [],
    is_block_based: assignment.exercise_block?.is_block_based || false,
      template_type: (assignment.assignment_type as 'single' | 'weekly' | 'monthly') || 'single',
    daily_workouts: assignment.exercise_block?.daily_workouts || undefined,
  };
    
    // For weekly assignments, ensure blocks are properly structured for WorkoutDetailsDrawer
    if (assignment.assignment_type === 'weekly' && assignment.exercise_block?.daily_workouts) {
      try {
        const dailyWorkouts = assignment.exercise_block.daily_workouts;
        
        // Check if we have daily_workouts data
        if (typeof dailyWorkouts === 'object' && dailyWorkouts !== null && Object.keys(dailyWorkouts).length > 0) {
          // Convert daily_workouts to blocks format for WorkoutDetailsDrawer
          const dayBlocks: any = {};
          
          // Map daily workouts to blocks structure
          Object.entries(dailyWorkouts).forEach(([dayName, dayData]: [string, any]) => {
            if (dayData && Array.isArray(dayData)) {
              // New blocks format - array of blocks
              dayBlocks[dayName] = dayData;
            } else if (dayData && typeof dayData === 'object' && dayData.exercises) {
              // Legacy format - single day with exercises
              dayBlocks[dayName] = [{
                name: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} Workout`,
                exercises: Array.isArray(dayData.exercises) ? dayData.exercises : [],
                is_rest_day: dayData.is_rest_day || false
              }];
            }
          });
          
          // Set the blocks to the converted structure if we have valid data
          if (Object.keys(dayBlocks).length > 0) {
            workout.blocks = dayBlocks;
          }
        }
      } catch (weeklyError) {
        console.error('Error processing weekly workout data:', weeklyError);
        // Continue with basic workout structure
      }
      
      // If we have blocks data already, use that
      if (!workout.blocks && assignment.exercise_block?.blocks) {
        try {
          let blocks = assignment.exercise_block.blocks;
          
          // Parse blocks if it's a string
          if (typeof blocks === 'string') {
            blocks = JSON.parse(blocks);
          }
          
          if (blocks && typeof blocks === 'object') {
            workout.blocks = blocks;
          }
        } catch (parseError) {
          console.error('Error parsing assignment blocks:', parseError);
        }
      }
    }
  
  return workout;
  } catch (error) {
    console.error('Error in convertAssignmentToWorkout:', error);
    return null;
  }
};

// Get assignment details (like UnifiedAssignmentCard does)
const getAssignmentDetails = (assignment: any) => {
  if (!assignment || typeof assignment !== 'object') {
    console.warn('Invalid assignment data provided to getAssignmentDetails');
    return null;
  }
  
  // Ensure required fields exist
  if (!assignment.assignment_type || !assignment.exercise_block) {
    console.warn('Assignment missing required fields for details');
    return null;
  }
  
  try {
  const { assignment_type, exercise_block, progress, meta } = assignment;
  
  switch (assignment_type) {
    case 'single':
      return {
          title: exercise_block?.workout_name || 'Single Workout',
          subtitle: 'SINGLE',
          duration: exercise_block?.estimated_duration || '',
          exercises: Array.isArray(exercise_block?.exercises) ? exercise_block.exercises.length : 0,
        workoutType: 'SINGLE'
      };
      
    case 'weekly':
      // For weekly plans, count total exercises across all days
      let totalWeeklyExercises = 0;
      
        try {
          const dailyWorkouts = exercise_block?.daily_workouts || {};
          
          if (typeof dailyWorkouts === 'object' && dailyWorkouts !== null) {
      Object.values(dailyWorkouts).forEach((dayWorkout: any) => {
        if (Array.isArray(dayWorkout)) {
          // New blocks format: array of blocks, each with exercises
          dayWorkout.forEach((block: any) => {
                  if (block && Array.isArray(block.exercises)) {
              totalWeeklyExercises += block.exercises.length;
            }
          });
              } else if (dayWorkout && typeof dayWorkout === 'object' && Array.isArray(dayWorkout.exercises)) {
          // Legacy format: { exercises: [], is_rest_day: boolean }
          totalWeeklyExercises += dayWorkout.exercises.length;
        }
      });
          }
        } catch (weeklyError) {
          console.error('Error counting weekly exercises:', weeklyError);
          totalWeeklyExercises = 0;
      }
      
      return {
          title: exercise_block?.workout_name || exercise_block?.plan_name || 'Weekly Plan',
        subtitle: 'WEEKLY',
          duration: `${exercise_block?.total_days || 7} days`,
        exercises: totalWeeklyExercises,
        workoutType: 'WEEKLY'
      };
      
    case 'monthly':
        const totalExercises = (progress && typeof progress === 'object' && typeof progress.total_exercises === 'number') 
          ? progress.total_exercises 
          : 0;
          
      return {
          title: exercise_block?.plan_name || 'Monthly Plan',
        subtitle: 'MONTHLY',
          duration: `${exercise_block?.duration_weeks || 4} weeks`,
          exercises: totalExercises,
        workoutType: 'MONTHLY'
      };
      
    default:
        console.warn('Unknown assignment type:', assignment_type);
      return {
        title: 'Unknown Assignment',
        subtitle: 'UNKNOWN',
        duration: '',
        exercises: 0,
        workoutType: 'UNKNOWN'
      };
    }
  } catch (error) {
    console.error('Error in getAssignmentDetails:', error);
    return null;
  }
};

// Get the correct exercise data - handle different assignment types (like UnifiedAssignmentCard does)
const getCorrectExerciseData = async (assignment: any): Promise<any[]> => {
  try {
    if (!assignment || !assignment.assignment_type) {
      return [];
    }

    // Handle different assignment types
    if (assignment.assignment_type === 'weekly') {
      // For weekly workouts, get today's exercises
      const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[today.getDay()];
      
      const todaysWorkout = dailyWorkouts[currentDayName];
      let exerciseList: any[] = [];
      
      if (todaysWorkout) {
        if (Array.isArray(todaysWorkout)) {
          // New blocks format
          exerciseList = todaysWorkout.flatMap((block: any) => block?.exercises || []);
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
    let exercises = assignment.exercise_block?.exercises || [];
    
    // If we have an original workout ID, try to fetch the actual workout data
    const originalWorkoutId = assignment.meta?.original_workout_id;
    if (originalWorkoutId) {
      try {
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });
        
        const queryPromise = supabase
          .from('workouts')
          .select('exercises, blocks, is_block_based')
          .eq('id', originalWorkoutId)
          .single();
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data: actualWorkout, error } = result as any;
        
        if (error) {
          console.warn('Could not fetch original workout data, using assignment exercises:', error);
          return exercises;
        }
        
        if (actualWorkout) {
          // Use original workout exercises if available and more detailed
          if (actualWorkout.exercises && actualWorkout.exercises.length > 0) {
            exercises = actualWorkout.exercises;
          }
          
          // Handle block-based workouts
          if (actualWorkout.is_block_based && actualWorkout.blocks) {
            try {
              let blocks = actualWorkout.blocks;
              if (typeof blocks === 'string') {
                blocks = JSON.parse(blocks);
              }
              
              if (Array.isArray(blocks)) {
                exercises = blocks.flatMap((block: any) => block.exercises || []);
              }
            } catch (parseError) {
              console.error('Error parsing workout blocks:', parseError);
            }
          }
        }
      } catch (fetchError) {
        // Silently fall back to assignment exercises
        console.warn('Failed to fetch original workout, using assignment exercises:', fetchError);
      }
    }
    
    return exercises;
  } catch (error) {
    console.error('Error in getCorrectExerciseData:', error);
    return [];
  }
};



export const MobileWorkoutDetails: React.FC<MobileWorkoutDetailsProps> = ({
  isOpen,
  onClose,
  workout,
  userRole,
  progress,
  onStart,
  onReset,
  assignedTo,
  athleteCount,
  completionRate,
  onAssign,
  onEdit,
  onDelete,
  onViewProgress,
  assignment,
  onExecute,
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONALS OR EARLY RETURNS
  // Essential mounting and stability state
  const [isMounted, setIsMounted] = useState(false);
  const [isStable, setIsStable] = useState(false);
  
  // Progress state
  const [detailedProgress, setDetailedProgress] = useState<any>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Duplicate workflow state  
  const [showDuplicateSection, setShowDuplicateSection] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Data conversion state
  const [displayWorkout, setDisplayWorkout] = useState<any>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  const [conversionError, setConversionError] = useState<string>('');

  // Dynamic exercises state (for monthly plans)
  const [dynamicExercises, setDynamicExercises] = useState<any[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // Toast for notifications
  const toast = useToast();
  
  // Query client for data invalidation
  const queryClient = useQueryClient();

  // Theme colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const sectionTitleColor = useColorModeValue('gray.500', 'gray.400');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  // ALL HOOKS DECLARED - NOW WE CAN DO CONDITIONAL LOGIC
  
  // Determine if we're dealing with an assignment or a workout
  const isAssignment = !!assignment;

  // Mount and stability management
  useEffect(() => {
    setIsMounted(true);
    
    // Add delay to ensure React is fully stable before allowing operations
    const stabilityTimeout = setTimeout(() => {
      setIsStable(true);
    }, 100);

    return () => {
      setIsMounted(false);
      setIsStable(false);
      clearTimeout(stabilityTimeout);
    };
  }, []);

  // Handle data conversion safely
  useEffect(() => {
    if (!isOpen || !isStable) {
      setDisplayWorkout(null);
      setAssignmentDetails(null);
      setConversionError('');
      return;
    }

    try {
      const converted = isAssignment ? convertAssignmentToWorkout(assignment) : workout;
      const details = isAssignment ? getAssignmentDetails(assignment) : null;
      
      setDisplayWorkout(converted);
      setAssignmentDetails(details);
      setConversionError('');
    } catch (error) {
      console.error('Error processing workout data:', error);
      setConversionError('Error loading workout details');
      setDisplayWorkout(null);
      setAssignmentDetails(null);
    }
  }, [isOpen, isStable, isAssignment, assignment, workout]);

  // Initialize duplicate name when section opens
  useEffect(() => {
    if (showDuplicateSection) {
      const originalName = isAssignment 
        ? assignment?.exercise_block?.workout_name || 'Unnamed Assignment'
        : workout?.name || 'Unnamed Workout';
      setDuplicateName(`${originalName} (Copy)`);
    }
  }, [showDuplicateSection, isAssignment, assignment, workout]);

  // Progress loading effect - simplified and moved here
  useEffect(() => {
    let isMounted = true;
    let controller = new AbortController();
    
    // Early return if not ready to load
    if (!isOpen || !isAssignment || !assignment || !isStable) {
      if (isMounted) {
        setDetailedProgress(null);
        setIsLoadingProgress(false);
      }
      return;
    }

    // Additional safety checks for assignment data integrity
    if (!assignment.id || !assignment.assignment_type || !assignment.exercise_block) {
      console.warn('Assignment data incomplete, skipping progress load:', assignment);
      if (isMounted) {
        setDetailedProgress(null);
        setIsLoadingProgress(false);
      }
      return;
    }
    
    const loadProgress = async () => {
      try {
        if (isMounted && !controller.signal.aborted) {
          setIsLoadingProgress(true);
        }

        // Add a longer delay on first load to allow React to stabilize
        const isFirstLoad = !detailedProgress;
        const delay = isFirstLoad ? 150 : 10;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (!isMounted || controller.signal.aborted) return;
        
        // Get the correct exercise data first (this fetches original workout data)
        const exercises = await getCorrectExerciseData(assignment);
        
        if (!isMounted || controller.signal.aborted) return;
  
        const progress = assignment.progress;
        
        if (!progress) {
          if (isMounted && !controller.signal.aborted) {
            setDetailedProgress({
              exercises: { current: 0, total: exercises.length },
              sets: { current: 0, total: 0 },
              reps: { current: 0, total: 0 }
            });
            setIsLoadingProgress(false);
          }
          return;
        }

        // Calculate progress based on correct exercise data
        if (assignment.assignment_type === 'single') {
          const currentExerciseIndex = progress.current_exercise_index || 0;
          const currentSet = progress.current_set || 1;
          const currentRep = progress.current_rep || 1;
          
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
              completedSets += exerciseSets;
              completedReps += exerciseTotalReps;
            } else if (index === currentExerciseIndex) {
              completedSets += currentSet - 1;
              const completedRepsInCurrentExercise = (currentSet - 1) * exerciseReps + (currentRep - 1);
              completedReps += completedRepsInCurrentExercise;
            }
          });
          
          // Check if workout is actually completed (like UnifiedAssignmentCard does)
          const isWorkoutCompleted = assignment.status === 'completed' && progress.completion_percentage >= 100;
          
          if (isMounted && !controller.signal.aborted) {
            setDetailedProgress({
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
            });
            setIsLoadingProgress(false);
          }
        } else if (assignment.assignment_type === 'weekly') {
          // For weekly workouts, get today's exercise data
          const todaysExercises = await getCorrectExerciseData(assignment);
          
          const currentExerciseIndex = progress.current_exercise_index || 0;
          const currentSet = progress.current_set || 1;
          const currentRep = progress.current_rep || 1;
          
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
            
            if (isMounted && !controller.signal.aborted) {
              setDetailedProgress({
                exercises: { current: currentExerciseIndex, total: todaysExercises.length },
                sets: { current: completedSets, total: totalSets },
                reps: { current: completedReps, total: totalReps }
              });
              setIsLoadingProgress(false);
            }
          } else {
            // Rest day or no workout today
            if (isMounted && !controller.signal.aborted) {
              setDetailedProgress({
                exercises: { current: 0, total: 0 },
                sets: { current: 0, total: 0 },
                reps: { current: 0, total: 0 }
              });
              setIsLoadingProgress(false);
            }
          }
        } else if (assignment.assignment_type === 'monthly') {
          // For monthly plans, extract today's exercises directly from weekly structure
          const weeklyStructure = assignment.exercise_block?.weekly_structure || [];
          
          const currentExerciseIndex = progress.current_exercise_index || 0;
          const currentSet = progress.current_set || 1;
          const currentRep = progress.current_rep || 1;
          
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
            
            if (isMounted && !controller.signal.aborted) {
              setDetailedProgress({
                exercises: { current: currentExerciseIndex, total: todaysExercises.length },
                sets: { current: completedSets, total: totalSets },
                reps: { current: completedReps, total: totalReps }
              });
              setIsLoadingProgress(false);
            }
          } else {
            // Rest day or no workout today
            if (isMounted && !controller.signal.aborted) {
              setDetailedProgress({
                exercises: { current: 0, total: 0 },
                sets: { current: 0, total: 0 },
                reps: { current: 0, total: 0 }
              });
              setIsLoadingProgress(false);
            }
          }
        } else {
          // Fallback for unknown types
          if (isMounted && !controller.signal.aborted) {
            setDetailedProgress({
              exercises: { current: 0, total: 0 },
              sets: { current: 0, total: 0 },
              reps: { current: 0, total: 0 }
            });
            setIsLoadingProgress(false);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error loading progress:', error);
        }
        if (isMounted && !controller.signal.aborted) {
          setDetailedProgress(null);
          setIsLoadingProgress(false);
        }
      }
    };
    
    // Use longer timeout on first load to prevent race conditions
    const isFirstLoad = !detailedProgress;
    const timeoutDelay = isFirstLoad ? 200 : 50;
    
    const timeoutId = setTimeout(() => {
      if (isMounted && !controller.signal.aborted) {
        loadProgress();
      }
    }, timeoutDelay);
    
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
      if (isMounted) {
        setIsLoadingProgress(false);
      }
    };
  }, [isAssignment, assignment?.id, assignment?.assignment_type, isOpen, isStable]);

  // Load exercises for monthly plans
  useEffect(() => {
    let isMounted = true;
    
    if (!isOpen || !assignment || assignment.assignment_type !== 'monthly') {
      if (isMounted) {
        setDynamicExercises([]);
        setIsLoadingExercises(false);
      }
      return;
    }

    const loadMonthlyExercises = async () => {
      try {
        if (isMounted) {
          setIsLoadingExercises(true);
        }

        const exercises = await getCorrectExerciseData(assignment);

        if (isMounted) {
          setDynamicExercises(exercises);
          setIsLoadingExercises(false);
        }
      } catch (error) {
        console.error('Error loading monthly exercises for mobile drawer:', error);
        if (isMounted) {
          setDynamicExercises([]);
          setIsLoadingExercises(false);
        }
      }
    };

    loadMonthlyExercises();

    return () => {
      isMounted = false;
    };
  }, [isOpen, assignment]);

  // Handle duplicate workout/assignment
  const handleDuplicateWorkout = async () => {
    try {
      const assignmentService = new AssignmentService();
      
      if (isAssignment && assignment) {
        // Duplicate the existing assignment
        const newStartDate = new Date().toISOString().split('T')[0];
        await assignmentService.duplicateAssignment(
          assignment.id,
          assignment.athlete_id, // Keep same athlete
          newStartDate
        );
        
        toast({
          title: "Assignment duplicated",
          description: "The workout assignment has been duplicated with today's date.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (workout) {
        // Duplicate the workout as a new assignment (would need athlete selection)
        // For now, we'll show a message that this feature needs athlete selection
        toast({
          title: "Feature coming soon",
          description: "Workout duplication with athlete selection will be available soon.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
      
    } catch (error) {
      console.error("Error duplicating workout:", error);
      toast({
        title: "Failed to duplicate workout",
        description: error instanceof Error ? error.message : "An error occurred while duplicating the workout.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle mobile duplicate
  const handleMobileDuplicate = async () => {
    if (!duplicateName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the duplicated workout',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsDuplicating(true);
    
    try {
      const assignmentService = new AssignmentService();
      
      // Create unassigned workout instead of assignment
      await assignmentService.duplicateAsWorkout(assignment.id, duplicateName.trim());
      
      toast({
        title: 'Workout Duplicated',
        description: `"${duplicateName.trim()}" has been created as an unassigned workout`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Invalidate relevant queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['workouts'] });
      await queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
      await queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });

      // Reset form
      setShowDuplicateSection(false);
      setDuplicateName('');
      
    } catch (error) {
      console.error('Error duplicating workout:', error);
      toast({
        title: 'Duplication Failed',
        description: 'There was an error duplicating the workout. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  // Calculate athlete count from assignedTo if not provided
  const calculatedAthleteCount = athleteCount || (assignedTo ? assignedTo.length : 0);

  // Calculate overall progress percentage from detailed progress
  const calculateOverallProgress = () => {
    if (detailedProgress) {
      try {
        const exerciseProgress = detailedProgress.exercises.total > 0 ? detailedProgress.exercises.current / detailedProgress.exercises.total : 0;
      const setsProgress = detailedProgress.sets.total > 0 ? detailedProgress.sets.current / detailedProgress.sets.total : 0;
      const repsProgress = detailedProgress.reps.total > 0 ? detailedProgress.reps.current / detailedProgress.reps.total : 0;
      
      // Weight the progress: exercises (50%), sets (30%), reps (20%)
      const overallProgress = (exerciseProgress * 0.5) + (setsProgress * 0.3) + (repsProgress * 0.2);
      return Math.round(overallProgress * 100);
      } catch (error) {
        console.error('Error calculating progress:', error);
        return progress?.percentage || 0;
      }
    }
    return progress?.percentage || 0;
  };

  const overallProgressPercentage = calculateOverallProgress();

  // Early returns must happen AFTER all hooks have been called
  if (!isOpen || !isMounted || !isStable) {
    return null;
  }

  // Handle conversion errors
  if (conversionError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="red.100" m={0}>
          <ModalBody>
            <VStack spacing={4} p={6}>
              <Text color="red.600">{conversionError}</Text>
              <Button onClick={onClose}>Close</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // Handle missing workout data
  if (!displayWorkout) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="gray.100" m={0}>
          <ModalBody>
            <VStack spacing={4} p={6}>
              <Text>No workout data available</Text>
              <Button onClick={onClose}>Close</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // Get workout data - use dynamic exercises for monthly plans
  const allExercises = isAssignment && assignment?.assignment_type === 'monthly' 
    ? dynamicExercises 
    : getExercisesFromWorkout(displayWorkout);
  const workoutBlocks = getBlocksFromWorkout(displayWorkout);
  const isBlockBased = (displayWorkout as any).is_block_based;

  // Format date
  const formattedDate = displayWorkout.date 
    ? format(new Date(displayWorkout.date), 'MMM d, yyyy')
    : 'No date set';

  // Get assignment status
  const getAssignmentStatus = () => {
    if (!assignment) return null;
    
    switch (assignment.status) {
      case 'in_progress': return { text: 'IN PROGRESS', color: 'orange' };
      case 'completed': return { text: 'COMPLETED', color: 'green' };
      case 'assigned': return { text: 'ASSIGNED', color: 'blue' };
      default: return { text: assignment.status?.toUpperCase() || 'UNKNOWN', color: 'gray' };
    }
  };

  const assignmentStatus = getAssignmentStatus();

  const WorkoutContent = () => (
    <VStack spacing={6} align="stretch" p={6}>
      {/* Workout Header */}
      <VStack spacing={4} align="stretch">
        <HStack spacing={3} align="center">
          <Box 
            bg="blue.500" 
            borderRadius="full" 
            p={3} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Icon 
              as={displayWorkout.type ? getTypeIcon(displayWorkout.type).type : FaRunning} 
              color="white" 
              boxSize={6} 
            />
          </Box>
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="xl" fontWeight="bold" color={drawerText}>
              {displayWorkout.name}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue" fontSize="sm">
                {isAssignment && assignmentDetails ? assignmentDetails.subtitle : displayWorkout.type || 'Running'}
              </Badge>
              {displayWorkout.is_template && (
                <Badge colorScheme="purple" fontSize="sm">
                  Template
                </Badge>
              )}
              {isBlockBased && (
                <Badge colorScheme="green" fontSize="sm">
                  Block Mode
                </Badge>
              )}
              {assignmentStatus && (
                <Badge colorScheme={assignmentStatus.color} fontSize="sm">
                  {assignmentStatus.text}
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Assignment-specific details */}
        {isAssignment && assignmentDetails && (
          <Box bg={exerciseCardBg} p={4} borderRadius="lg">
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                Assignment Details
              </Text>
              <SimpleGrid columns={2} spacing={4}>
                <Stat>
                  <StatLabel color={sectionTitleColor}>Workout Type</StatLabel>
                  <StatNumber color={drawerText}>{assignmentDetails.workoutType}</StatNumber>
                  {assignmentDetails.duration && (
                  <StatHelpText color={sectionTitleColor}>
                      Duration: {assignmentDetails.duration}
                  </StatHelpText>
                  )}
                </Stat>
                <Stat>
                    <StatLabel color={sectionTitleColor}>Total Exercises</StatLabel>
                  <StatNumber color={drawerText}>{assignmentDetails.exercises}</StatNumber>
                </Stat>
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {/* Role-specific Stats Section */}
        {userRole === 'athlete' && (progress || detailedProgress || isLoadingProgress) && (
          <Box bg={exerciseCardBg} p={4} borderRadius="lg">
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                Your Progress
              </Text>
              {isLoadingProgress ? (
                <VStack spacing={3} align="center" py={4}>
                  <Spinner size="md" color="blue.500" />
                  <Text fontSize="sm" color={sectionTitleColor}>
                    Calculating progress...
                  </Text>
                </VStack>
              ) : detailedProgress ? (
                <VStack spacing={4} align="stretch">
                  {/* Exercise Progress */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" color={sectionTitleColor}>Exercises</Text>
                      <Text fontSize="sm" fontWeight="bold" color="blue.500">
                        {detailedProgress.exercises?.current || 0}/{detailedProgress.exercises?.total || 0}
                      </Text>
                    </HStack>
                    <Progress 
                      value={detailedProgress.exercises?.total > 0 ? (detailedProgress.exercises.current / detailedProgress.exercises.total) * 100 : 0} 
                      colorScheme="blue" 
                      size="sm" 
                      borderRadius="full"
                    />
                  </Box>
                  
                  {/* Sets Progress */}
                  {detailedProgress.sets?.total > 0 && (
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" color={sectionTitleColor}>Sets</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.500">
                          {detailedProgress.sets.current}/{detailedProgress.sets.total}
                        </Text>
                      </HStack>
                      <Progress 
                        value={(detailedProgress.sets.current / detailedProgress.sets.total) * 100} 
                        colorScheme="green" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  )}
                  
                  {/* Reps Progress */}
                  {detailedProgress.reps?.total > 0 && (
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" color={sectionTitleColor}>Reps</Text>
                        <Text fontSize="sm" fontWeight="bold" color="orange.500">
                          {detailedProgress.reps.current}/{detailedProgress.reps.total}
                        </Text>
                      </HStack>
                      <Progress 
                        value={(detailedProgress.reps.current / detailedProgress.reps.total) * 100} 
                        colorScheme="orange" 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  )}
                </VStack>
              ) : (
                <>
                  <Progress 
                    value={overallProgressPercentage} 
                    colorScheme="blue" 
                    size="lg" 
                    borderRadius="full"
                  />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={sectionTitleColor}>
                      {progress?.completed || 0} of {progress?.total || 0} completed
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.500">
                      {overallProgressPercentage}%
                    </Text>
                  </HStack>
                </>
              )}
            </VStack>
          </Box>
        )}

        {userRole === 'coach' && (
          <Box bg={exerciseCardBg} p={4} borderRadius="lg">
            <VStack spacing={3} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                Assignment Stats
              </Text>
              <SimpleGrid columns={1} spacing={4}>
                <Stat>
                  <StatLabel color={sectionTitleColor}>Assigned To</StatLabel>
                  <StatNumber color={drawerText} fontSize="sm">{assignedTo || 'Unassigned'}</StatNumber>
                  <StatHelpText color={sectionTitleColor} fontSize="sm">
                    {calculatedAthleteCount || 0} athletes
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {/* Workout Details */}
        <VStack spacing={3} align="stretch">
          {displayWorkout.description && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={sectionTitleColor} mb={2}>
                Description
              </Text>
              <Text fontSize="sm" color={drawerText}>
                {displayWorkout.description}
              </Text>
            </Box>
          )}

          <HStack spacing={6}>
            {displayWorkout.date && (
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{formattedDate}</Text>
              </HStack>
            )}
            {(displayWorkout as any).estimated_duration && (
              <HStack spacing={2}>
                <Icon as={FaClock} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{(displayWorkout as any).estimated_duration}</Text>
              </HStack>
            )}
            {(displayWorkout as any).location && (
              <HStack spacing={2}>
                <Icon as={FaMapMarkerAlt} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{(displayWorkout as any).location}</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </VStack>

      <Divider />

      {/* Exercises/Blocks Content */}
      {(isAssignment && assignment?.assignment_type === 'weekly') || (displayWorkout?.template_type === 'weekly' && displayWorkout.blocks && typeof displayWorkout.blocks === 'object' && !Array.isArray(displayWorkout.blocks)) ? (
        // Special handling for weekly workouts - break down by days
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Weekly Training Plan
          </Text>
          <Accordion allowMultiple>
            {(() => {
              const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              const dayDisplayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              
              let weeklyData: any = {};
              
              // Handle assignment-based weekly workouts
              if (isAssignment && assignment) {
                // Extract daily workouts from assignment
                const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
                
                // First, check if it's a block-based weekly workout (stored in blocks field)
                if (assignment.exercise_block?.blocks) {
                  let blocks = assignment.exercise_block.blocks;
                  
                  // Parse blocks if it's a string
                  if (typeof blocks === 'string') {
                    try {
                      blocks = JSON.parse(blocks);
                    } catch (e) {
                      console.error('Error parsing blocks in details drawer:', e);
                    }
                  }
                  
                  // Check if blocks is organized by days (monday, tuesday, etc.)
                  if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
                    dayNames.forEach(dayName => {
                      const dayBlocks = blocks[dayName];
                      if (Array.isArray(dayBlocks)) {
                        // Convert blocks to exercises format for display
                        const dayExercises = dayBlocks.flatMap((block: any) => block.exercises || []);
                        weeklyData[dayName] = {
                          exercises: dayExercises,
                          is_rest_day: dayExercises.length === 0,
                          blocks: dayBlocks // Keep original blocks for reference
                        };
                      }
                    });
                  }
                }
                
                // If no block-based data found, try daily_workouts
                if (Object.keys(weeklyData).length === 0) {
                  if (Object.keys(dailyWorkouts).length > 0) {
                    weeklyData = dailyWorkouts;
                  } else if (assignment.exercise_block?.exercises) {
                    // Try to extract from exercises array
                    const exercises = assignment.exercise_block.exercises;
                    if (Array.isArray(exercises) && exercises.length > 0 && 
                        typeof exercises[0] === 'object' && 'day' in exercises[0]) {
                      // Convert exercise array format to daily_workouts format
                      exercises.forEach((dayPlan: any) => {
                        if (dayPlan.day) {
                          weeklyData[dayPlan.day.toLowerCase()] = {
                            exercises: dayPlan.exercises || [],
                            is_rest_day: dayPlan.isRestDay || false
                          };
                        }
                      });
                    } else {
                      // Single workout repeated for all days
                      dayNames.forEach(day => {
                        weeklyData[day] = {
                          exercises: exercises,
                          is_rest_day: false
                        };
                      });
                    }
                  }
                }
              } 
              // Handle workout-based weekly workouts (for coaches)
              else if (displayWorkout?.template_type === 'weekly' && displayWorkout.blocks) {
                let blocks = displayWorkout.blocks;
                
                // Parse blocks if it's a string
                if (typeof blocks === 'string') {
                  try {
                    blocks = JSON.parse(blocks);
                  } catch (e) {
                    console.error('Error parsing workout blocks in mobile details:', e);
                  }
                }
                
                // Check if blocks is organized by days (monday, tuesday, etc.)
                if (blocks && typeof blocks === 'object' && !Array.isArray(blocks)) {
                  dayNames.forEach(dayName => {
                    const dayBlocks = blocks[dayName];
                    if (Array.isArray(dayBlocks)) {
                      // Convert blocks to exercises format for display
                      const dayExercises = dayBlocks.flatMap((block: any) => block.exercises || []);
                      weeklyData[dayName] = {
                        exercises: dayExercises,
                        is_rest_day: dayExercises.length === 0,
                        blocks: dayBlocks // Keep original blocks for reference
                      };
                    }
                  });
                }
              }
              
              return dayNames.map((dayName, index) => {
                const dayDisplayName = dayDisplayNames[index];
                const dayWorkout = weeklyData[dayName];
                
                let dayExercises: any[] = [];
                let isRestDay = false;
                
                if (dayWorkout) {
                  if (Array.isArray(dayWorkout)) {
                    // New blocks format
                    dayExercises = dayWorkout.flatMap((block: any) => block.exercises || []);
                  } else if (dayWorkout.exercises && Array.isArray(dayWorkout.exercises)) {
                    // Legacy format
                    dayExercises = dayWorkout.exercises;
                    isRestDay = dayWorkout.is_rest_day || false;
                  }
                }
                
                return (
                  <AccordionItem key={dayName} border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                    <AccordionButton bg={exerciseCardBg} borderRadius="md">
                      <Box flex="1" textAlign="left">
                        <HStack justify="space-between" align="center">
                          <Text fontWeight="medium" color={drawerText}>
                            {dayDisplayName}
                          </Text>
                          {isRestDay ? (
                            <Badge colorScheme="orange" fontSize="xs">
                              Rest Day
                            </Badge>
                          ) : (
                            <Badge colorScheme="blue" fontSize="xs">
                              {dayExercises.length} exercises
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      {isRestDay ? (
                        <Box p={3} bg={exerciseCardBg} borderRadius="md" textAlign="center">
                          <Text color={sectionTitleColor} fontSize="sm">
                            Rest day - Focus on recovery and preparation for tomorrow's training
                          </Text>
                        </Box>
                      ) : dayWorkout.blocks && Array.isArray(dayWorkout.blocks) ? (
                        // Show blocks structure for block-based workouts
                        <VStack spacing={4} align="stretch">
                          {dayWorkout.blocks.map((block: any, blockIndex: number) => (
                            <Box key={blockIndex} p={3} bg={exerciseCardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                              <VStack spacing={3} align="stretch">
                                <Text fontSize="md" fontWeight="bold" color={drawerText}>
                                  {block.name || `Block ${blockIndex + 1}`}
                                </Text>
                                {block.exercises && Array.isArray(block.exercises) && block.exercises.length > 0 ? (
                                  <VStack spacing={2} align="stretch">
                                    {block.exercises.map((exercise: any, exerciseIndex: number) => (
                                      <Box key={exerciseIndex} p={2} bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md">
                                        <VStack spacing={1} align="stretch">
                                          <HStack align="center" spacing={3}>
                                            <Text fontWeight="medium" color={drawerText} fontSize="sm">
                                              {exercise.name}
                                            </Text>
                                            {exercise.sets && exercise.reps && (
                                              <Text fontSize="xs" color={sectionTitleColor}>
                                                {exercise.sets} sets × {exercise.reps} reps
                                              </Text>
                                            )}
                                          </HStack>
                                          {exercise.rest && (
                                            <Text fontSize="xs" color={sectionTitleColor}>
                                              Rest: {exercise.rest}
                                            </Text>
                                          )}
                                          {exercise.distance && (
                                            <Text fontSize="xs" color={sectionTitleColor}>
                                              Distance: {exercise.distance}
                                            </Text>
                                          )}
                                          {exercise.notes && (
                                            <Text fontSize="xs" color={drawerText}>
                                              {exercise.notes}
                                            </Text>
                                          )}
                                        </VStack>
                                      </Box>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color={sectionTitleColor} fontStyle="italic">
                                    No exercises in this block
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      ) : dayExercises.length > 0 ? (
                        // Show flat exercise list for non-block workouts
                        <VStack spacing={3} align="stretch">
                          {dayExercises.map((exercise, exerciseIndex) => (
                            <Box key={exerciseIndex} p={3} bg={exerciseCardBg} borderRadius="md">
                              <VStack spacing={2} align="stretch">
                                <HStack align="center" spacing={3}>
                                  <Text fontWeight="medium" color={drawerText}>
                                    {exercise.name}
                                  </Text>
                                  {exercise.sets && exercise.reps && (
                                    <Text fontSize="sm" color={sectionTitleColor}>
                                      {exercise.sets} sets × {exercise.reps} reps
                                    </Text>
                                  )}
                                </HStack>
                                {exercise.rest && (
                                  <Text fontSize="sm" color={sectionTitleColor}>
                                    Rest: {exercise.rest}
                                  </Text>
                                )}
                                {exercise.distance && (
                                  <Text fontSize="sm" color={sectionTitleColor}>
                                    Distance: {exercise.distance}
                                  </Text>
                                )}
                                {exercise.notes && (
                                  <Text fontSize="sm" color={drawerText}>
                                    {exercise.notes}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      ) : (
                        <Box p={3} bg={exerciseCardBg} borderRadius="md" textAlign="center">
                          <Text color={sectionTitleColor} fontSize="sm">
                            No exercises scheduled for this day
                          </Text>
                        </Box>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                );
              });
            })()}
          </Accordion>
        </VStack>
      ) : workoutBlocks.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Workout Blocks ({workoutBlocks.length})
          </Text>
          <Accordion allowMultiple>
            {workoutBlocks.map((block, blockIndex) => (
              <AccordionItem key={blockIndex} border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                <AccordionButton bg={exerciseCardBg} borderRadius="md">
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium" color={drawerText}>
                      Block {blockIndex + 1}: {block.name || `Block ${blockIndex + 1}`}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={3} align="stretch">
                    {block.exercises?.map((exercise, exerciseIndex) => (
                      <Box key={exerciseIndex} p={3} bg={exerciseCardBg} borderRadius="md">
                        <VStack spacing={2} align="stretch">
                          <HStack align="center" spacing={3}>
                            <Text fontWeight="medium" color={drawerText}>
                              {exercise.name}
                            </Text>
                            {exercise.sets && exercise.reps && (
                              <Text fontSize="sm" color={sectionTitleColor}>
                                {exercise.sets} sets × {exercise.reps} reps
                              </Text>
                            )}
                          </HStack>
                          {exercise.rest && (
                            <Text fontSize="sm" color={sectionTitleColor}>
                              Rest: {exercise.rest}
                            </Text>
                          )}
                          {exercise.distance && (
                            <Text fontSize="sm" color={sectionTitleColor}>
                              Distance: {exercise.distance}
                            </Text>
                          )}
                          {exercise.notes && (
                            <Text fontSize="sm" color={drawerText}>
                              {exercise.notes}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </VStack>
      ) : (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Exercises ({isLoadingExercises ? '...' : allExercises.length})
          </Text>
          <VStack spacing={3} align="stretch">
            {isLoadingExercises ? (
              <Box p={4} bg={exerciseCardBg} borderRadius="md" textAlign="center">
                <Spinner size="sm" />
                <Text fontSize="sm" color={drawerText} mt={2}>
                  Loading exercises...
                </Text>
              </Box>
            ) : (
              allExercises.map((exercise, index) => (
              <Box key={index} p={4} bg={exerciseCardBg} borderRadius="md">
                <VStack spacing={2} align="stretch">
                  <HStack align="center" spacing={3}>
                    <Text fontWeight="medium" color={drawerText}>
                      {exercise.name}
                    </Text>
                    {exercise.sets && exercise.reps && (
                      <Text fontSize="sm" color={sectionTitleColor}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    )}
                  </HStack>
                  {exercise.rest && (
                    <Text fontSize="sm" color={sectionTitleColor}>
                      Rest: {exercise.rest}
                    </Text>
                  )}
                  {exercise.distance && (
                    <Text fontSize="sm" color={sectionTitleColor}>
                      Distance: {exercise.distance}
                    </Text>
                  )}
                  {exercise.notes && (
                    <Text fontSize="sm" color={drawerText}>
                      {exercise.notes}
                    </Text>
                  )}
                </VStack>
              </Box>
              ))
            )}
          </VStack>
        </VStack>
      )}

      {/* Additional Notes */}
      {displayWorkout.notes && (
        <>
          <Divider />
          <VStack spacing={2} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color={drawerText}>
              Notes
            </Text>
            <Text fontSize="sm" color={drawerText}>
              {displayWorkout.notes}
            </Text>
          </VStack>
        </>
      )}

      {/* Role-specific Action Buttons */}
      {userRole === 'athlete' && (
        <VStack spacing={3} align="stretch" pt={4}>
          {onStart && (
            <Button 
              size="lg" 
              colorScheme="blue" 
              leftIcon={<FaPlay />}
              onClick={onStart}
              w="full"
            >
              {progress && progress.completed > 0 ? 'Continue Workout' : 'Start Workout'}
            </Button>
          )}
          {onReset && (progress?.completed || 0) > 0 && (
            <Button 
              size="md" 
              variant="outline" 
              colorScheme="orange"
              leftIcon={<FaRedo />}
              onClick={onReset}
              w="full"
            >
              Reset Progress
            </Button>
          )}
        </VStack>
      )}

      {userRole === 'coach' && (
        <VStack spacing={3} align="stretch" pt={4}>
          <SimpleGrid columns={2} spacing={3}>
            {onAssign && (
              <Button 
                size="md" 
                colorScheme="blue" 
                leftIcon={<FaUsers />}
                onClick={onAssign}
                w="full"
              >
                Assign
              </Button>
            )}
            <Button 
              size="md" 
              colorScheme="purple" 
              leftIcon={<FaCopy />}
              onClick={() => setShowDuplicateSection(!showDuplicateSection)}
              w="full"
            >
              Duplicate
            </Button>
            {onDelete && (
              <Button 
                size="md" 
                variant="outline" 
                colorScheme="red"
                leftIcon={<FaTrash />}
                onClick={onDelete}
                w="full"
              >
                Delete
              </Button>
            )}
          </SimpleGrid>
          
          {/* Slide-down duplicate section */}
          <Collapse in={showDuplicateSection} animateOpacity>
            <Box bg={exerciseCardBg} p={4} borderRadius="lg" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={drawerText}>
                  {workout?.is_template ? 'Duplicate Template' : 'Duplicate Workout'}
                </Text>
                <FormControl>
                  <FormLabel fontSize="xs" color={sectionTitleColor}>
                    New Workout Name
                  </FormLabel>
                  <Input
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
                    placeholder="Enter name for duplicated workout"
                    size="sm"
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                  />
                </FormControl>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowDuplicateSection(false);
                      setDuplicateName('');
                    }}
                    flex={1}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={handleMobileDuplicate}
                    isLoading={isDuplicating}
                    loadingText="Duplicating..."
                    leftIcon={<FaCopy />}
                    flex={1}
                  >
                    Duplicate
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Collapse>
          
          {onViewProgress && (
            <Button 
              size="md" 
              variant="outline" 
              colorScheme="green"
              leftIcon={<FaChartLine />}
              onClick={onViewProgress}
              w="full"
            >
              View Progress
            </Button>
          )}
        </VStack>
      )}
    </VStack>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      motionPreset="slideInBottom"
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        position="fixed"
        bottom="-12px"
        left="0"
        right="0"
        top="auto"
        height="auto"
        maxHeight="75vh"
        minHeight="300px"
        borderRadius="16px 16px 0 0"
        borderTopRadius="16px"
        bg={drawerBg}
        border={`1px solid ${borderColor}`}
        boxShadow="2xl"
        margin="0"
        maxWidth="100vw"
        width="100vw"
        display="flex"
        flexDirection="column"
        paddingBottom="5px"
      >
        <ModalBody 
          p={0} 
          h="100%" 
          display="flex" 
          flexDirection="column" 
          overflowY="auto"
          borderTopRadius="16px"
        >
          {/* Header */}
          <Flex 
            justify="space-between" 
            align="center" 
            p={6} 
            borderBottom={`1px solid ${borderColor}`}
            flexShrink={0}
            bg={drawerBg}
            position="sticky"
            top={0}
            zIndex={1}
          >
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color={drawerText}>
                {isAssignment ? 'Assignment Details' : 'Workout Details'}
              </Text>
              <HStack spacing={2}>
                <Icon as={userRole === 'athlete' ? FaUser : FaUsers} color={sectionTitleColor} boxSize={4} />
                <Text fontSize="sm" color={sectionTitleColor} textTransform="capitalize">
                  {userRole} View
                </Text>
              </HStack>
            </VStack>
            <IconButton
              aria-label="Close details"
              icon={<FaTimes />}
              size="lg"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={drawerText}
              _hover={{ bg: buttonHoverBg }}
              fontSize="18px"
            />
          </Flex>
          
          {/* Content */}
          <Box flex="1" overflowY="auto">
            <WorkoutContent />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 