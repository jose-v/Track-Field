import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Icon,
  Progress,
  useColorModeValue,
  useBreakpointValue,
  Circle,
  SimpleGrid,
  Badge
} from '@chakra-ui/react';
import { FaRegClock, FaRunning, FaDumbbell, FaCheckCircle, FaPlay, FaPause, FaRedo, FaChevronLeft, FaChevronRight, FaVideo } from 'react-icons/fa';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { RunTimeInput } from './RunTimeInput';
import { ExerciseMediaDisplay } from './ExerciseMediaDisplay';
import { isRunExercise, validateTime } from '../utils/exerciseUtils';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { saveTrainingLoadEntry } from '../services/analytics/injuryRiskService';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  distance?: number;
  notes?: string;
}

// Block interface for the new system
interface ExerciseBlock {
  id: string;
  name?: string;
  exercises: Exercise[];
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  rounds?: number;
  restBetweenExercises?: number;
  restBetweenRounds?: number;
  restAfterBlock?: number;
  category?: 'warmup' | 'main' | 'accessory' | 'cooldown' | 'conditioning';
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  flow_type?: 'sequential' | 'circuit';
  circuit_rounds?: number;
  // New block system fields
  blocks?: ExerciseBlock[];
  is_block_based?: boolean;
}

interface ExerciseExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  exerciseIdx: number;
  timer: number;
  running: boolean;
  onUpdateTimer: (timer: number) => void;
  onUpdateRunning: (running: boolean) => void;
  onNextExercise: () => void;
  onPreviousExercise: () => void;
  onFinishWorkout: () => void;
  onShowVideo: (exerciseName: string, videoUrl: string) => void;
}

function getVideoUrl(exerciseName: string): string {
  const exercise = exerciseName.toLowerCase();
  if (exercise.includes('sprint') || exercise.includes('dash')) return 'https://www.youtube.com/embed/6kNvYDTT-NU';
  if (exercise.includes('hurdle')) return 'https://www.youtube.com/embed/6Wk65Jf_qSc';
  if (exercise.includes('jump') || exercise.includes('leap')) return 'https://www.youtube.com/embed/7O454Z8efs0';
  if (exercise.includes('shot put') || exercise.includes('throw')) return 'https://www.youtube.com/embed/axc0FXuTdI8';
  if (exercise.includes('javelin')) return 'https://www.youtube.com/embed/ZG3_Rfo6_VE';
  if (exercise.includes('squat')) return 'https://www.youtube.com/embed/aclHkVaku9U';
  if (exercise.includes('push') || exercise.includes('pushup')) return 'https://www.youtube.com/embed/_l3ySVKYVJ8';
  if (exercise.includes('lunge')) return 'https://www.youtube.com/embed/QOVaHwm-Q6U';
  if (exercise.includes('plank')) return 'https://www.youtube.com/embed/pSHjTRCQxIw';
  if (exercise.includes('deadlift')) return 'https://www.youtube.com/embed/r4MzxtBKyNE';
  if (exercise.includes('bench press')) return 'https://www.youtube.com/embed/SCVCLChPQFY';
  if (exercise.includes('stretch') || exercise.includes('dynamic')) return 'https://www.youtube.com/embed/nPHfEnZD1Wk';
  if (exercise.includes('warm up') || exercise.includes('warmup')) return 'https://www.youtube.com/embed/R0mMyV5OtcM';
  return 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Default
}

export const ExerciseExecutionModal: React.FC<ExerciseExecutionModalProps> = ({
  isOpen,
  onClose,
  workout,
  exerciseIdx,
  timer,
  running,
  onUpdateTimer,
  onUpdateRunning,
  onNextExercise,
  onPreviousExercise,
  onFinishWorkout,
  onShowVideo
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user } = useAuth();
  
  // Simple state only
  const [runTime, setRunTime] = useState({ minutes: 0, seconds: 0, hundredths: 0 });
  const [showRPEScreen, setShowRPEScreen] = useState(false);
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [isLoggingRPE, setIsLoggingRPE] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Add state for tracking sets and reps within current exercise
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);

  // Add state for tracking circuit rounds
  const [currentRound, setCurrentRound] = useState(1);

  // Add state for pause functionality
  const [isPaused, setIsPaused] = useState(false);

  // Block-aware state
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentBlockRound, setCurrentBlockRound] = useState(1);

  // Refs for intervals
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [countdownType, setCountdownType] = useState<'initial' | 'progression' | null>(null);
    
  // Theme colors - MUST be called before any conditional returns
  const cardBg = useColorModeValue('white', 'gray.800');
  const modalHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  
  // Responsive modal settings
  const modalSize = useBreakpointValue({ base: 'full', md: 'md' }) as 'full' | 'md';
  const isCentered = useBreakpointValue({ base: false, md: true }) as boolean;
  const motionPreset = useBreakpointValue({ base: 'slideInBottom', md: 'scale' }) as 'slideInBottom' | 'scale';

  // Block-aware helper functions
  const isBlockBasedWorkout = workout?.is_block_based && workout?.blocks && workout.blocks.length > 0;
  
  const getCurrentBlock = (): ExerciseBlock | null => {
    if (!isBlockBasedWorkout || !workout?.blocks) return null;
    return workout.blocks[currentBlockIndex] || null;
  };

  const getAllExercises = (): Exercise[] => {
    if (isBlockBasedWorkout && workout?.blocks) {
      // Flatten exercises from all blocks
      return workout.blocks.flatMap(block => block.exercises);
    }
    return workout?.exercises || [];
  };

  const getCurrentExercise = (): Exercise | null => {
    const allExercises = getAllExercises();
    return allExercises[exerciseIdx] || null;
  };

  const getExerciseBlockInfo = (globalExerciseIndex: number): { blockIndex: number; localExerciseIndex: number; block: ExerciseBlock } | null => {
    if (!isBlockBasedWorkout || !workout?.blocks) return null;

    let accumulatedIndex = 0;
    for (let blockIndex = 0; blockIndex < workout.blocks.length; blockIndex++) {
      const block = workout.blocks[blockIndex];
      const blockExerciseCount = block.exercises.length;
      
      if (globalExerciseIndex < accumulatedIndex + blockExerciseCount) {
        return {
          blockIndex,
          localExerciseIndex: globalExerciseIndex - accumulatedIndex,
          block
        };
      }
      accumulatedIndex += blockExerciseCount;
    }
    return null;
  };

  const getBlockProgress = (): { current: number; total: number } => {
    if (!isBlockBasedWorkout) return { current: 0, total: 0 };
    return {
      current: currentBlockIndex + 1,
      total: workout?.blocks?.length || 0
    };
  };

  const getExerciseProgress = (): { current: number; total: number } => {
    const allExercises = getAllExercises();
    return {
      current: exerciseIdx + 1,
      total: allExercises.length
    };
  };

  // Enhanced timer effect with pause functionality and countdown
  useEffect(() => {
    if (running && !isPaused && countdown === 0) {
      timerRef.current = setInterval(() => {
        onUpdateTimer(timer + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
      clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, isPaused, countdown, timer, onUpdateTimer]);

  // Function to start countdown
  const startCountdownTimer = useCallback(() => {
    // Don't start if countdown is already running
    if (countdownRef.current || countdown > 0) {
      return;
    }
    
    // Set initial countdown value
    setCountdown(3);
    
    // Start new countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
            countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [countdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  // Initial countdown when modal opens
  useEffect(() => {
    if (isOpen && countdownType === null) {
      onUpdateRunning(false);
      setCountdownType('initial');
      startCountdownTimer();
    }
  }, [isOpen]); // Only depend on isOpen
  
  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCountdownType(null);
    }
  }, [isOpen]);
  


  // Handle countdown completion
  useEffect(() => {
    if (countdown === 0 && isOpen && countdownType) {
      // Use setTimeout to prevent immediate re-renders from interfering
      const timer = setTimeout(() => {
        if (countdownType === 'initial') {
          // Initial countdown completed - start the timer
          setCountdownType(null);
          onUpdateRunning(true);
        } else if (countdownType === 'progression') {
          // Progression countdown completed - start the timer
          setCountdownType(null);
          onUpdateRunning(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [countdown, isOpen, countdownType, onUpdateRunning]);

  // ALL useCallback hooks MUST be here before any conditional returns
  const handleTimeChange = useCallback((minutes: number, seconds: number, hundredths: number) => {
    setRunTime({ minutes, seconds, hundredths });
  }, []);

  // Reset set/rep counters when exercise changes and track block changes
  useEffect(() => {
    setCurrentSet(1);
    setCurrentRep(1);
    setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
    
    // Update block tracking for block-based workouts
    if (isBlockBasedWorkout) {
      const blockInfo = getExerciseBlockInfo(exerciseIdx);
      if (blockInfo && blockInfo.blockIndex !== currentBlockIndex) {
        setCurrentBlockIndex(blockInfo.blockIndex);
        setCurrentBlockRound(1); // Reset block round when entering new block
      }
    }
    
    // Don't reset round counter when exercise changes in circuit flow
  }, [exerciseIdx]);

  // Debug logging only when modal opens
  useEffect(() => {
    if (isOpen && workout) {
      console.log('=== EXERCISE EXECUTION DEBUG ===');
      console.log('Workout:', workout);
      console.log('Workout exercises:', workout.exercises);
      console.log('Exercise count:', workout.exercises?.length || 0);
      console.log('Current exercise index:', exerciseIdx);
      console.log('Current exercise:', workout.exercises?.[exerciseIdx]);
      
      // Check if it's a weekly template
      const isWeekly = workout.exercises.length > 0 && 
                      typeof workout.exercises[0] === 'object' && 
                      'day' in workout.exercises[0] && 
                      'exercises' in workout.exercises[0];
      
      if (isWeekly) {
        console.log('🗓️ WEEKLY TEMPLATE DETECTED');
        const currentDayPlan = workout.exercises[0] as any;
        console.log('Current day plan:', currentDayPlan);
        console.log('Actual exercises for today:', currentDayPlan.exercises);
        console.log('Actual exercise count:', currentDayPlan.exercises?.length || 0);
      }
      console.log('================================');
    }
  }, [isOpen, workout?.id]); // Only run when modal opens or workout changes
    
  // Simple validation - AFTER all hooks are called
  if (!isOpen || !workout || !workout.exercises || workout.exercises.length === 0) {
    return null;
  }

  // Handle weekly workout template structure
  const isWeeklyTemplate = workout.exercises.length > 0 && 
                          typeof workout.exercises[0] === 'object' && 
                          'day' in workout.exercises[0] && 
                          'exercises' in workout.exercises[0];

  let actualExercises: any[] = [];
  let currentExercise: any;
  let exerciseName: string;

  if (isWeeklyTemplate) {
    // Extract exercises from the current day's plan
    const currentDayPlan = workout.exercises[0] as any; // Assuming we're always on the first day for now
    actualExercises = currentDayPlan.exercises || [];
    currentExercise = actualExercises[exerciseIdx] || { name: 'Exercise', sets: 1, reps: 10 };
    
    // Extract exercise name from the actual exercise object
    exerciseName = currentExercise.name || 
                  currentExercise.exercise_name || 
                  currentExercise.description || 
                  currentExercise.type || 
                  `Exercise ${exerciseIdx + 1}`;
  } else {
    // Regular workout structure
    actualExercises = workout.exercises;
    currentExercise = workout.exercises[exerciseIdx] || { name: 'Exercise', sets: 1, reps: 10 };
    
    // More robust exercise name extraction
    exerciseName = currentExercise.name || 
                  (currentExercise as any).exercise_name || 
                  (currentExercise as any).description || 
                  (currentExercise as any).type || 
                  `Exercise ${exerciseIdx + 1}`;
  }

  const handleDone = async () => {
    // Save exercise result for this rep/set completion
    if (user?.id) {
      try {
        // Strip "daily-" prefix from workout ID for database storage
        let actualWorkoutId = workout.id;
        if (workout.id.startsWith('daily-')) {
          actualWorkoutId = workout.id.replace('daily-', '');
        }

        if (isRunExercise(exerciseName)) {
          const timeValidation = validateTime(runTime.minutes, runTime.seconds, runTime.hundredths);
          if (timeValidation.isValid && (runTime.minutes > 0 || runTime.seconds > 0 || runTime.hundredths > 0)) {
            await api.exerciseResults.save({
              athleteId: user.id,
              workoutId: actualWorkoutId,
              exerciseIndex: exerciseIdx,
              exerciseName: exerciseName,
              timeMinutes: runTime.minutes,
              timeSeconds: runTime.seconds,
              timeHundredths: runTime.hundredths,
              notes: `Set ${currentSet}, Rep ${currentRep} - Timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
            });
          }
        } else {
          await api.exerciseResults.save({
            athleteId: user.id,
            workoutId: actualWorkoutId,
            exerciseIndex: exerciseIdx,
            exerciseName: exerciseName,
            repsCompleted: 1, // This completion
            setsCompleted: currentSet,
            weightUsed: currentExercise.weight,
            notes: `Set ${currentSet}, Rep ${currentRep} - Timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
          });
        }
      } catch (error) {
        console.error('Error saving exercise result:', error);
      }
    }

    // Handle progression based on flow type
    if (isCircuitFlow) {
      // Circuit Flow: Move to next exercise after completing one set, track rounds
      if (exerciseIdx + 1 >= actualExercises.length) {
        // Completed all exercises in this round
        if (currentRound < circuitRounds) {
          // More rounds to go - update UI immediately, then countdown before starting timer
          setCurrentRound(prev => prev + 1);
          setCurrentSet(1);
          setCurrentRep(1);
          setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
          onUpdateTimer(0); // Reset timer
          onUpdateRunning(false); // Pause timer during countdown
          
          // Reset to first exercise (will be handled by parent)
          if (exerciseIdx > 0) {
            // We need to reset to exercise 0, but the parent component handles this
            // For now, just show RPE screen to finish the workout
            setShowRPEScreen(true);
            return; // Don't start countdown if finishing workout
          }
          
          setCountdownType('progression');
          startCountdownTimer();
        } else {
          // All rounds complete - finish workout
          setShowRPEScreen(true);
        }
      } else {
        // Move to next exercise in current round - update UI immediately, then countdown
        setCurrentSet(1);
        setCurrentRep(1);
        setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
        onNextExercise(); // Update UI to show next exercise
        onUpdateTimer(0); // Reset timer
        onUpdateRunning(false); // Pause timer during countdown
        
        setCountdownType('progression');
        startCountdownTimer();
      }
    } else {
      // Sequential Flow: Complete all sets/reps before moving to next exercise (original behavior)
      const maxSets = currentExercise.sets || 1;
      const maxReps = currentExercise.reps || 1;
      
      if (currentRep < maxReps) {
        // More reps in current set - update UI immediately, then countdown before starting timer
        setCurrentRep(prev => prev + 1);
        setRunTime({ minutes: 0, seconds: 0, hundredths: 0 }); // Reset time for next rep
        onUpdateTimer(0); // Reset timer
        onUpdateRunning(false); // Pause timer during countdown
        
        setCountdownType('progression');
        startCountdownTimer();
      } else if (currentSet < maxSets) {
        // Next set - update UI immediately, then countdown before starting timer
        setCurrentSet(prev => prev + 1);
        setCurrentRep(1);
        setRunTime({ minutes: 0, seconds: 0, hundredths: 0 }); // Reset time for next set
        onUpdateTimer(0); // Reset timer
        onUpdateRunning(false); // Pause timer during countdown
        
        setCountdownType('progression');
        startCountdownTimer();
      } else {
        // Exercise complete - move to next exercise or finish workout
        if (exerciseIdx + 1 >= actualExercises.length) {
      setShowRPEScreen(true);
    } else {
          // Move to next exercise - update UI immediately, then countdown before starting timer
          setCurrentSet(1);
          setCurrentRep(1);
          setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
          onNextExercise(); // Update UI to show next exercise
          onUpdateTimer(0); // Reset timer
          onUpdateRunning(false); // Pause timer during countdown
          
          setCountdownType('progression');
          startCountdownTimer();
        }
      }
    }
  };

  const handleRPESubmit = async () => {
    if (!selectedRPE || !workout || !user?.id) return;

    setIsLoggingRPE(true);
    try {
      const durationMinutes = Math.max(1, Math.round(timer / 60));
      let actualWorkoutId = workout.id;
      
      if (workout.id.startsWith('daily-')) {
        actualWorkoutId = workout.id.replace('daily-', '');
      }
      
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('id, name')
        .eq('id', actualWorkoutId)
        .single();
      
      if (workoutError || !workoutData) {
        throw new Error(`Workout not found: ${actualWorkoutId}`);
      }
      
      await saveTrainingLoadEntry(
        user.id,
        actualWorkoutId,
        selectedRPE,
        durationMinutes,
        (workout as any).type || 'general'
      );

      onFinishWorkout();
      setShowRPEScreen(false);
      setSelectedRPE(null);
      
    } catch (error) {
      console.error('Error logging RPE:', error);
      onFinishWorkout();
      setShowRPEScreen(false);
      setSelectedRPE(null);
    } finally {
      setIsLoggingRPE(false);
    }
  };

  const handleSkipRPE = () => {
    onFinishWorkout();
    setShowRPEScreen(false);
    setSelectedRPE(null);
  };

  const handleVideoClick = () => {
    const videoUrl = getVideoUrl(exerciseName);
    onShowVideo(exerciseName, videoUrl);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleResetTimer = () => {
    onUpdateTimer(0);
    setIsPaused(false);
  };

  const handlePrevious = () => {
    if (exerciseIdx > 0) {
      onPreviousExercise();
    }
  };

  const getRPELabel = (rating: number) => {
    if (rating <= 3) return 'Easy';
    if (rating <= 5) return 'Moderate';
    if (rating <= 7) return 'Hard';
    if (rating <= 9) return 'Very Hard';
    return 'Max Effort';
  };

  // Determine flow type and calculate progress accordingly
  const flowType = workout.flow_type || 'sequential';
  const isCircuitFlow = flowType === 'circuit';
  const circuitRounds = workout.circuit_rounds || 3;
  
  const currentExerciseSets = currentExercise.sets || 1;
  const currentExerciseReps = currentExercise.reps || 1;
  
  let completionProgress;
  
  if (isCircuitFlow) {
    // Circuit Flow: Track progress across all exercises for multiple rounds
    const totalExercises = workout.exercises.length;
    const totalCompletions = totalExercises * circuitRounds;
    const currentCompletion = ((currentRound - 1) * totalExercises) + exerciseIdx;
    
    completionProgress = {
      completed: currentCompletion,
      total: totalCompletions,
      percentage: totalCompletions > 0 ? (currentCompletion / totalCompletions) * 100 : 0,
      setInfo: `Round ${currentRound} of ${circuitRounds} - Exercise ${exerciseIdx + 1} of ${totalExercises}`
    };
  } else {
    // Sequential Flow: Calculate overall workout progress across all exercises
    let totalRepsInWorkout = 0;
    let completedRepsInWorkout = 0;
    
    actualExercises.forEach((exercise, exIndex) => {
      const exerciseSets = exercise.sets || 1;
      const exerciseReps = exercise.reps || 1;
      const totalRepsForThisExercise = exerciseSets * exerciseReps;
      
      totalRepsInWorkout += totalRepsForThisExercise;
      
      if (exIndex < exerciseIdx) {
        // Completely finished exercises
        completedRepsInWorkout += totalRepsForThisExercise;
      } else if (exIndex === exerciseIdx) {
        // Current exercise - add completed reps only
        const completedRepsInCurrentExercise = ((currentSet - 1) * exerciseReps) + (currentRep - 1);
        completedRepsInWorkout += completedRepsInCurrentExercise;
      }
      // Future exercises contribute 0 completed reps
    });
    
    completionProgress = {
      completed: completedRepsInWorkout,
      total: totalRepsInWorkout,
      percentage: totalRepsInWorkout > 0 ? (completedRepsInWorkout / totalRepsInWorkout) * 100 : 0,
      setInfo: `Set ${currentSet} of ${currentExerciseSets}, Rep ${currentRep} of ${currentExerciseReps}`
    };
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered={isCentered}
      size={modalSize}
      motionPreset={motionPreset}
    >
      <ModalOverlay />
      <ModalContent 
        bg={cardBg}
        h={{ base: "100vh", md: "auto" }}
        maxH={{ base: "100vh", md: "90vh" }}
        borderRadius={{ base: 0, md: "md" }}
        m={{ base: 0, md: 4 }}
        overflow="hidden"
        position="relative"
      >
        {/* Floating Navigation Arrows - Mobile Only */}
        {!showRPEScreen && (
          <>
            {/* Previous Arrow */}
            <IconButton
              aria-label="Previous"
              icon={
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="0.50" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              onClick={handlePrevious}
              isDisabled={countdown > 0 || exerciseIdx === 0}
              position="absolute"
              left="5px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              w={24}
              h={24}
              variant="ghost"
              display={{ base: "flex", md: "none" }}
              opacity={countdown > 0 || exerciseIdx === 0 ? 0.3 : 0.8}
              _hover={{ opacity: 1 }}
              _active={{ opacity: 0.7 }}
            />
            
            {/* Next Arrow */}
            <IconButton
              aria-label="Next"
              icon={
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="0.50" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              onClick={handleDone}
              isDisabled={countdown > 0}
              position="absolute"
              right="5px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              w={24}
              h={24}
              variant="ghost"
              display={{ base: "flex", md: "none" }}
              opacity={countdown > 0 ? 0.3 : 0.8}
              _hover={{ opacity: 1 }}
              _active={{ opacity: 0.7 }}
            />
          </>
        )}
        
        {/* Overall Progress Bar - Flush to top */}
        {!showRPEScreen && (
          <Box w="full" h="3px" bg="gray.200" position="relative">
            <Box
              h="full"
              bg="blue.400"
              borderRadius="0"
              width={`${completionProgress.percentage}%`}
              transition="width 0.3s ease"
          />
          </Box>
        )}
        
        <ModalHeader>
          <HStack>
          <IconButton
              aria-label="Back"
              icon={<ChevronLeftIcon />}
            variant="ghost"
            onClick={onClose}
            />
            <HStack flex={1} justify="space-between" align="center">
              <Box /> {/* Spacer for left side */}
              
              <VStack spacing={0} textAlign="center">
            {showRPEScreen ? (
                  <Text textAlign="center">Rate Your Effort</Text>
            ) : (
              <>
                    {/* Block Information (if block-based workout) */}
                    {isBlockBasedWorkout && (
                      <Text textAlign="center" fontSize="xs" color="blue.500" fontWeight="medium" textTransform="uppercase">
                        {(() => {
                          const currentBlock = getCurrentBlock();
                          const blockProgress = getBlockProgress();
                          return `${currentBlock?.name || `Block ${blockProgress.current}`} (${blockProgress.current}/${blockProgress.total})`;
                        })()}
                      </Text>
                    )}

                    <Text textAlign="center" fontSize="lg" fontWeight="medium">
                      {exerciseName}
                    </Text>
                    
                    <Text textAlign="center" fontSize="sm" color={modalTextColor}>
                      {(() => {
                        let nextText = '';
                        
                        if (isBlockBasedWorkout) {
                          // Block-aware next exercise logic
                          const exerciseProgress = getExerciseProgress();
                          if (exerciseProgress.current >= exerciseProgress.total) {
                            nextText = 'Finish Workout';
                          } else {
                            const nextExercise = getAllExercises()[exerciseIdx + 1];
                            const nextBlockInfo = getExerciseBlockInfo(exerciseIdx + 1);
                            
                            if (nextBlockInfo && nextBlockInfo.blockIndex !== currentBlockIndex) {
                              // Moving to new block
                              nextText = `Next Block: ${nextBlockInfo.block.name || `Block ${nextBlockInfo.blockIndex + 1}`}`;
                            } else {
                              // Same block
                              nextText = nextExercise?.name || `Exercise ${exerciseIdx + 2}`;
                            }
                          }
                        } else if (isCircuitFlow) {
                          if (exerciseIdx + 1 >= actualExercises.length) {
                            if (currentRound < circuitRounds) {
                              nextText = `Round ${currentRound + 1}`;
                            } else {
                              nextText = 'Finish';
                            }
                          } else {
                            const nextExercise = actualExercises[exerciseIdx + 1];
                            nextText = nextExercise?.name || 
                                      nextExercise?.exercise_name || 
                                      nextExercise?.description || 
                                      nextExercise?.type || 
                                      `Exercise ${exerciseIdx + 2}`;
                          }
                        } else {
                          if (exerciseIdx + 1 >= actualExercises.length) {
                            nextText = 'Finish';
                          } else {
                            const nextExercise = actualExercises[exerciseIdx + 1];
                            nextText = nextExercise?.name || 
                                      nextExercise?.exercise_name || 
                                      nextExercise?.description || 
                                      nextExercise?.type || 
                                      `Exercise ${exerciseIdx + 2}`;
                          }
                        }
                        
                        // Don't add "Next: " prefix if the text already starts with "Next"
                        return nextText.startsWith('Next') ? nextText : `Next: ${nextText}`;
                      })()}
                </Text>
              </>
            )}
          </VStack>
          
              {!showRPEScreen && (
                <Badge 
                  colorScheme={
                    isBlockBasedWorkout 
                      ? "green" 
                      : isCircuitFlow 
                        ? "purple" 
                        : "blue"
                  } 
                  size="sm"
                  borderRadius="full"
                >
                  {isBlockBasedWorkout 
                    ? "Blocks" 
                    : isCircuitFlow 
                      ? "Circuit" 
                      : "Sequential"
                  }
                </Badge>
              )}
            </HStack>
          </HStack>
        </ModalHeader>

        {/* Current Exercise Rep Progress Bars */}
        {!showRPEScreen && (
          <Box px={6} pb={2}>
            <HStack spacing={1} w="full" justify="center">
            {(() => {
                const currentExerciseReps = currentExercise.reps || 1;
                const bars = [];
                
                // Show only the current exercise's reps
                for (let rep = 1; rep <= currentExerciseReps; rep++) {
                  let barColor = 'gray.300'; // Not done yet
                  
                  if (rep < currentRep) {
                    barColor = 'green.400'; // Completed rep
                  } else if (rep === currentRep) {
                    barColor = 'blue.400'; // Current rep
                  }
                  
                  bars.push(
                      <Box
                      key={`current-rep-${rep}`}
                      flex={1}
                      h="4px"
                      bg={barColor}
                        borderRadius="full"
                      />
                    );
                }
                
                return bars;
            })()}
          </HStack>
        </Box>
        )}

        <ModalBody px={{ base: 4, md: 6 }} py={{ base: 2, md: 3 }} overflowY="auto" flex="1">
          {showRPEScreen ? (
            <VStack spacing={6}>
              <Text textAlign="center" color={modalTextColor}>
                How hard was your workout? (1 = Very Easy, 10 = Maximum Effort)
                </Text>
              <SimpleGrid columns={5} spacing={3} w="full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <Button
                      key={rating}
                    size="lg"
                    variant={selectedRPE === rating ? 'solid' : 'outline'}
                    colorScheme={selectedRPE === rating ? 'blue' : 'gray'}
                      onClick={() => setSelectedRPE(rating)}
                    >
                      {rating}
                  </Button>
                  ))}
                </SimpleGrid>
                {selectedRPE && (
                <Badge colorScheme="blue" fontSize="md" p={2}>
                      {getRPELabel(selectedRPE)}
                    </Badge>
                )}
            </VStack>
          ) : (
                                    <VStack spacing={{ base: 4, md: 6 }}>
              {/* Always show the same layout */}
                <VStack spacing={{ base: 4, md: 6 }} w="full">
                  {/* Detailed Progress Section */}
                <Box 
                    w="full" 
                    bg={sectionBg} 
                    borderRadius="xl" 
                    p={{ base: 3, md: 4 }}
                  >
                    <SimpleGrid columns={4} spacing={2} w="full">
                      {/* Sets Stats */}
                      <VStack spacing={1} align="center">
                        <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                          Sets
                        </Text>
                        <Text fontSize="lg" fontWeight="normal" textAlign="center">
                          {isCircuitFlow 
                            ? `${currentRound - 1}/${circuitRounds}`
                            : `${currentSet - 1}/${currentExerciseSets}`
                          }
                        </Text>
                      </VStack>
                      
                      {/* Target Reps */}
                      <VStack spacing={1} align="center">
                        <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                          Target Reps
                        </Text>
                        <Text fontSize="lg" fontWeight="normal" textAlign="center">
                          {currentExerciseReps}
                        </Text>
                      </VStack>
                      
                      {/* Exercise Progress */}
                      <VStack spacing={1} align="center">
                        <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                          {isBlockBasedWorkout ? "Block" : "Exercise"}
                        </Text>
                        <Text fontSize="lg" fontWeight="normal" textAlign="center">
                          {isBlockBasedWorkout 
                            ? (() => {
                                const blockProgress = getBlockProgress();
                                return `${blockProgress.current}/${blockProgress.total}`;
                              })()
                            : `${exerciseIdx + 1}/${actualExercises.length}`
                          }
                        </Text>
                      </VStack>
                      
                      {/* Completed */}
                      <VStack spacing={1} align="center">
                        <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                          Completed
                        </Text>
                        <Text fontSize="lg" fontWeight="normal" textAlign="center">
                          {isCircuitFlow 
                            ? `${completionProgress.completed}/${completionProgress.total}`
                            : `${exerciseIdx}/${actualExercises.length}`
                          }
                        </Text>
                      </VStack>
                    </SimpleGrid>
                      </Box>
                      
                      {/* Block Information Section (for block-based workouts) */}
                      {isBlockBasedWorkout && (
                        <Box 
                          w="full" 
                          bg={sectionBg} 
                          borderRadius="xl" 
                          p={{ base: 3, md: 4 }}
                        >
                          <SimpleGrid columns={3} spacing={2}>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={modalTextColor} fontWeight="medium">
                                Flow Type
                              </Text>
                              <Text fontSize="sm" color={modalTextColor} textTransform="capitalize">
                                {getCurrentBlock()?.flow || 'sequential'}
                              </Text>
                            </VStack>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={modalTextColor} fontWeight="medium">
                                Category
                              </Text>
                              <Text fontSize="sm" color={modalTextColor} textTransform="capitalize">
                                {getCurrentBlock()?.category || '-'}
                              </Text>
                            </VStack>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={modalTextColor} fontWeight="medium">
                                Rest Between
                              </Text>
                              <Text fontSize="sm" color={modalTextColor}>
                                {getCurrentBlock()?.restBetweenExercises || 60}s
                              </Text>
                            </VStack>
                          </SimpleGrid>
                          {getCurrentBlock()?.notes && (
                            <Box mt={3}>
                              <Text fontSize="xs" color={modalTextColor} fontWeight="medium" mb={1}>
                                Block Notes
                              </Text>
                              <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                                {getCurrentBlock()?.notes}
                              </Text>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Exercise Notes Section */}
                      {currentExercise.notes && (
                        <Box 
                          w="full" 
                          bg={sectionBg} 
                          borderRadius="xl" 
                          p={4}
                        >
                          <Text fontSize="xs" color={modalTextColor} fontWeight="bold" textTransform="uppercase" mb={2}>
                            Exercise Notes
                          </Text>
                          <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                             {currentExercise.notes}
                           </Text>
                        </Box>
                      )}
                      
                                    {/* Timer Section */}
                  <Box 
                    w="full" 
                    bg={sectionBg} 
                    borderRadius="xl" 
                    p={{ base: 6, md: 8 }}
                    textAlign="center"
                  >
                    <Text fontSize="xs" color={modalTextColor} fontWeight="bold" textTransform="uppercase" mb={2}>
                      {countdown > 0 
                        ? (exerciseIdx === 0 && currentSet === 1 && currentRep === 1 
                            ? "Get Ready!" 
                            : isCircuitFlow
                              ? (exerciseIdx + 1 >= workout.exercises.length 
                                  ? `Next Round ${currentRound + 1}/${circuitRounds}`
                                  : "Next Exercise")
                              : (currentRep < (currentExercise.reps || 1)
                                  ? "Next Rep"
                                  : currentSet < (currentExercise.sets || 1)
                                    ? "Next Set" 
                                    : "Next Exercise"))
                        : "Timer"
                      }
                          </Text>
                          <Text 
                      fontSize={{ base: "5xl", md: "6xl" }} 
                            fontWeight="bold" 
                      color={countdown > 0 ? "red.500" : (isPaused ? "gray.400" : "blue.500")} 
                      lineHeight="1"
                      fontFamily="mono"
                      letterSpacing={countdown > 0 ? "0.2em" : "normal"}
                      textAlign="center"
                      minW={countdown > 0 ? "120px" : "auto"}
                    >
                      {countdown > 0 
                        ? countdown.toString().padStart(2, '0')
                        : `${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`
                      }
                          </Text>
                      
                    {/* Timer Controls - always visible but disabled during countdown */}
                    <HStack justify="center" spacing={4} mt={4}>
                      <IconButton
                        aria-label={isPaused ? "Resume timer" : "Pause timer"}
                        icon={<Icon as={isPaused ? FaPlay : FaPause} />}
                        onClick={handlePauseResume}
                          variant="outline"
                        size="md"
                        borderRadius="full"
                        isDisabled={countdown > 0}
                        opacity={countdown > 0 ? 0.4 : 1}
                      />
                      <IconButton
                        aria-label="Reset timer"
                        icon={<Icon as={FaRedo} />}
                        onClick={handleResetTimer}
                          variant="outline"
                        size="md"
                        borderRadius="full"
                        isDisabled={countdown > 0}
                        opacity={countdown > 0 ? 0.4 : 1}
                      />
                      {/* Tutorial button - show on mobile, hide on desktop where it's in action buttons */}
                      <IconButton
                        aria-label="Tutorial"
                        icon={<Icon as={FaVideo} />}
                        onClick={handleVideoClick}
                        variant="outline"
                        size="md"
                        borderRadius="full"
                        display={{ base: "flex", md: "none" }}
                        isDisabled={countdown > 0}
                        opacity={countdown > 0 ? 0.4 : 1}
                      />
                      </HStack>
                </Box>

                  {/* Exercise Media Display */}
                  <Box w="full">
                    <ExerciseMediaDisplay
                      exerciseName={exerciseName}
                      onVideoClick={handleVideoClick}
                      size="md"
                      showControls={true}
                    />
                  </Box>

                  {/* Time Input for Running Exercises */}
                  {isRunExercise(exerciseName) && (
                    <Box w="full">
                <RunTimeInput
                        onTimeChange={handleTimeChange}
                  initialMinutes={runTime.minutes}
                  initialSeconds={runTime.seconds}
                  initialHundredths={runTime.hundredths}
                        placeholder="Enter your run time"
                />
                    </Box>
              )}

              {/* Action Buttons - Desktop Only */}
              <Box display={{ base: "none", md: "block" }} w="full">
                <SimpleGrid columns={3} spacing={3} w="full">
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={handlePrevious}
                    isDisabled={countdown > 0 || exerciseIdx === 0}
                    leftIcon={<Icon as={FaChevronLeft} />}
                  >
                    Previous
                  </Button>

                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={handleVideoClick}
                    leftIcon={<Icon as={FaRunning} />}
                  >
                    Tutorial
                  </Button>
                
                <Button 
                    size="lg"
                    colorScheme="blue"
                  onClick={handleDone}
                    isDisabled={countdown > 0}
                    leftIcon={<Icon as={FaCheckCircle} />}
                  >
                    {(() => {
                      if (isCircuitFlow) {
                        if (exerciseIdx + 1 >= actualExercises.length) {
                          if (currentRound < circuitRounds) {
                            return 'Next Round';
                          } else {
                            return 'Finish';
                          }
                        } else {
                          return 'Next';
                        }
                      } else {
                        const maxSets = currentExercise.sets || 1;
                        const maxReps = currentExercise.reps || 1;
                        
                        if (currentRep < maxReps) {
                          return 'Next Rep';
                        } else if (currentSet < maxSets) {
                          return 'Next Set';
                        } else if (exerciseIdx + 1 >= actualExercises.length) {
                          return 'Finish';
                        } else {
                          return 'Next';
                        }
                      }
                    })()}
              </Button>
                </SimpleGrid>
              </Box>


              </VStack>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {showRPEScreen && (
            <HStack spacing={3} w="full">
              <Button variant="outline" onClick={handleSkipRPE} flex={1}>
                Skip
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleRPESubmit} 
                isDisabled={!selectedRPE}
                isLoading={isLoggingRPE}
                flex={1}
              >
                Submit
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 