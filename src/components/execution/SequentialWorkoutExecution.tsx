import React, { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Circle,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaChevronLeft, FaCheckCircle, FaRunning, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutStore } from '../../lib/workoutStore';
import { 
  SharedWorkoutUI, 
  useWorkoutExecutionState, 
  useWorkoutExecutionEffects,
  parsePositiveInt,
  getVideoUrl,
  isRunExercise,
  type BaseWorkoutExecutionProps 
} from './BaseWorkoutExecution';
import { WorkoutInfoDrawer } from './WorkoutInfoDrawer';
import { supabase } from '../../lib/supabase';
import { saveTrainingLoadEntry } from '../../services/analytics/injuryRiskService';
import { api } from '../../services/api';
import { validateTime } from '../../utils/exerciseUtils';

interface Exercise {
  id?: string;
  name: string;
  sets: string | number;
  reps: string | number;
  weight?: string | number;
  rest?: string | number;
  distance?: string | number;
  notes?: string;
  contacts?: string | number;
  intensity?: string;
  direction?: string;
  movement_notes?: string;
}

interface SequentialWorkout {
  id: string;
  name: string;
  exercises: Exercise[];
  flow_type?: 'sequential' | 'circuit';
  circuit_rounds?: number;
  // Block-based workout support
  is_block_based?: boolean;
  blocks?: Array<{
    id: string;
    name?: string;
    exercises: Exercise[];
    restBetweenExercises?: number;
    category?: string;
    flow?: string;
  }>;
}

interface SequentialWorkoutExecutionProps extends BaseWorkoutExecutionProps {
  workout: SequentialWorkout;
  exerciseIdx: number;
  onNextExercise: () => void;
  onPreviousExercise: () => void;
}

export const SequentialWorkoutExecution: React.FC<SequentialWorkoutExecutionProps> = ({
  isOpen,
  onClose,
  workout,
  exerciseIdx,
  timer,
  running,
  currentSet,
  currentRep,
  onUpdateTimer,
  onUpdateRunning,
  onNextExercise,
  onPreviousExercise,
  onFinishWorkout,
  onShowVideo
}) => {
  const { user } = useAuth();
  const workoutStore = useWorkoutStore();
  const state = useWorkoutExecutionState(workout?.id, exerciseIdx, currentSet, currentRep);
  const { startCountdownTimer, startRestTimer, skipRest } = useWorkoutExecutionEffects({
    isOpen,
    timer,
    running,
    onUpdateTimer,
    onUpdateRunning,
    state
  });

  // Theme colors
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  
  // Progress dot colors
  const completedColor = useColorModeValue('green.400', 'green.400');
  const currentColor = useColorModeValue('blue.400', 'blue.400');
  const pendingColor = useColorModeValue('gray.300', 'gray.600');

  // Sequential workout specific state
  const [currentRound, setCurrentRound] = useState(1);
  const { isOpen: isInfoDrawerOpen, onOpen: onInfoDrawerOpen, onClose: onInfoDrawerClose } = useDisclosure();

  // Get current exercise
  const getCurrentExercise = useCallback((): Exercise | null => {
    return workout?.exercises?.[exerciseIdx] || null;
  }, [workout?.exercises, exerciseIdx]);

  const getExerciseProgress = useCallback((): { current: number; total: number } => {
    return {
      current: exerciseIdx + 1,
      total: workout?.exercises?.length || 0
    };
  }, [exerciseIdx, workout?.exercises?.length]);

  // TEMPORARILY DISABLED: Reset exercise state when changing exercises
  // This was causing the modal to reset during normal rep progression
  // useEffect(() => {
  //   state.setCurrentSet(1, user?.id, workout.id, exerciseIdx, workoutStore);
  //   state.setCurrentRep(1, user?.id, workout.id, exerciseIdx, workoutStore);
  //   state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
  // }, [exerciseIdx, state.setCurrentSet, state.setCurrentRep, state.setRunTime, user?.id, workout.id, workoutStore]);

  // Clear persisted state when modal closes
  useEffect(() => {
    if (!isOpen && state.clearPersistedState) {
      state.clearPersistedState();
    }
  }, [isOpen, state.clearPersistedState]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle exercise completion and progression
  const handleDone = async () => {
    const currentExercise = getCurrentExercise();
    if (!currentExercise) return;

    // Save exercise result for this rep/set completion
    if (user?.id) {
      try {
        // Strip "daily-" prefix from workout ID for database storage
        let actualWorkoutId = workout.id;
        if (workout.id.startsWith('daily-')) {
          actualWorkoutId = workout.id.replace('daily-', '');
        }

        // Save current progress to database immediately
        if (state.saveProgressToDatabase) {
          await state.saveProgressToDatabase(
            user.id,
            workout.id, // Use original workout ID for progress tracking
            exerciseIdx,
            state.currentSet,
            state.currentRep,
            workoutStore
          );
        }

        if (isRunExercise(currentExercise.name)) {
          const timeValidation = validateTime(state.runTime.minutes, state.runTime.seconds, state.runTime.hundredths);
          if (timeValidation.isValid && (state.runTime.minutes > 0 || state.runTime.seconds > 0 || state.runTime.hundredths > 0)) {
            await api.exerciseResults.save({
              athleteId: user.id,
              workoutId: actualWorkoutId,
              exerciseIndex: exerciseIdx,
              exerciseName: currentExercise.name,
              timeMinutes: state.runTime.minutes,
              timeSeconds: state.runTime.seconds,
              timeHundredths: state.runTime.hundredths,
              notes: `Set ${state.currentSet}, Rep ${state.currentRep} - Timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
            });
          }
        } else {
          await api.exerciseResults.save({
            athleteId: user.id,
            workoutId: actualWorkoutId,
            exerciseIndex: exerciseIdx,
            exerciseName: currentExercise.name,
            repsCompleted: 1, // This completion
            setsCompleted: state.currentSet,
            weightUsed: currentExercise.weight ? parseFloat(String(currentExercise.weight)) : undefined,
            notes: `Set ${state.currentSet}, Rep ${state.currentRep} - Timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
          });
        }
      } catch (error) {
        console.error('Error saving exercise result:', error);
      }
    }

    const maxSets = parsePositiveInt(currentExercise.sets, 1);
    const maxReps = parsePositiveInt(currentExercise.reps, 1);

    if (workout.flow_type === 'circuit') {
      // Circuit logic: complete all exercises, then move to next round
      const exerciseProgress = getExerciseProgress();
      const maxRounds = workout.circuit_rounds || 1;
      
      if (exerciseProgress.current >= exerciseProgress.total) {
        // Completed all exercises in this round
        if (currentRound < maxRounds) {
          // Move to next round, reset to first exercise
          setCurrentRound(prev => prev + 1);
          // Would need to reset exerciseIdx to 0 - this requires parent component logic
          state.setCurrentSet(1, user?.id, workout.id, 0, workoutStore);
          state.setCurrentRep(1, user?.id, workout.id, 0, workoutStore);
          state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
          onUpdateTimer(0);
          onUpdateRunning(false);
          state.setCountdownType('progression');
          startCountdownTimer();
        } else {
          // Completed all rounds - finish workout
          state.setShowRPEScreen(true);
        }
      } else {
        // Move to next exercise in current round
        state.setCurrentSet(1, user?.id, workout.id, exerciseIdx + 1, workoutStore);
        state.setCurrentRep(1, user?.id, workout.id, exerciseIdx + 1, workoutStore);
        state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
        onNextExercise();
        onUpdateTimer(0);
        onUpdateRunning(false);
        state.setCountdownType('progression');
        startCountdownTimer();
      }
    } else {
      // Sequential logic: complete sets/reps for current exercise
      const restTime = getRestTime();
      
      if (state.currentRep < maxReps) {
        // Next rep - check for rest between reps
        state.setCurrentRep(prev => prev + 1, user?.id, workout.id, exerciseIdx, workoutStore);
        state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
        onUpdateTimer(0);
        onUpdateRunning(false);
        
        if (restTime > 0) {
          startRestTimer(restTime);
        } else {
          state.setCountdownType('progression');
          startCountdownTimer();
        }
      } else if (state.currentSet < maxSets) {
        // Next set - check for rest between sets
        state.setCurrentSet(prev => prev + 1, user?.id, workout.id, exerciseIdx, workoutStore);
        state.setCurrentRep(1, user?.id, workout.id, exerciseIdx, workoutStore);
        state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
        onUpdateTimer(0);
        onUpdateRunning(false);
        
        if (restTime > 0) {
          startRestTimer(restTime);
        } else {
          state.setCountdownType('progression');
          startCountdownTimer();
        }
      } else {
        // Exercise complete
        const exerciseProgress = getExerciseProgress();
        if (exerciseProgress.current >= exerciseProgress.total) {
          state.setShowRPEScreen(true);
        } else {
          // Clear persisted state for current exercise before moving to next
          state.clearPersistedState();
          
          // Move to next exercise - check for rest between exercises
          state.setCurrentSet(1, user?.id, workout.id, exerciseIdx + 1, workoutStore);
          state.setCurrentRep(1, user?.id, workout.id, exerciseIdx + 1, workoutStore);
          state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
          onNextExercise();
          onUpdateTimer(0);
          onUpdateRunning(false);
          
          if (restTime > 0) {
            startRestTimer(restTime);
          } else {
            state.setCountdownType('progression');
            startCountdownTimer();
          }
        }
      }
    }
  };

  const handleRPESubmit = async () => {
    if (!state.selectedRPE || !workout || !user?.id) return;

    state.setIsLoggingRPE(true);
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
        state.selectedRPE,
        durationMinutes,
        'general'
      );

      // Close modal immediately after successful submission
      onClose();
      onFinishWorkout();
      
    } catch (error) {
      console.error('Error logging RPE:', error);
      // Close modal even on error
      onClose();
      onFinishWorkout();
    } finally {
      // Reset state
      state.setIsLoggingRPE(false);
      state.setShowRPEScreen(false);
      state.setSelectedRPE(null);
    }
  };

  const handleSkipRPE = () => {
    // Close modal immediately when skipping RPE
    onClose();
    onFinishWorkout();
    
    // Reset state
    state.setShowRPEScreen(false);
    state.setSelectedRPE(null);
  };

  const handleVideoClick = () => {
    const currentExercise = getCurrentExercise();
    if (currentExercise) {
      const videoUrl = getVideoUrl(currentExercise.name);
      onShowVideo(currentExercise.name, videoUrl);
    }
  };

  const handlePauseResume = () => {
    state.setIsPaused(!state.isPaused);
  };

  const handleResetTimer = () => {
    onUpdateTimer(0);
    state.setIsPaused(false);
  };

  // Get rest time for current exercise
  const getRestTime = useCallback((): number => {
    const exercise = getCurrentExercise();
    
    // Exercise-specific rest takes priority
    if (exercise?.rest) {
      return parsePositiveInt(exercise.rest, 0);
    }
    
    // For block-based workouts, use block's default rest between exercises
    if (workout.is_block_based && workout.blocks) {
      // Find which block contains this exercise
      let accumulatedIndex = 0;
      for (const block of workout.blocks) {
        const blockExerciseCount = block.exercises.length;
        
        if (exerciseIdx < accumulatedIndex + blockExerciseCount) {
          // This exercise is in this block
          if (block.restBetweenExercises) {
            return parsePositiveInt(block.restBetweenExercises, 0);
          }
          break;
        }
        accumulatedIndex += blockExerciseCount;
      }
    }
    return 0; // No rest
  }, [getCurrentExercise, workout, exerciseIdx]);

  const handlePrevious = () => {
    if (exerciseIdx > 0) {
      onPreviousExercise();
    }
  };

  // RPE Label function
  const getRPELabel = (rating: number) => {
    const rpeLabels: Record<number, string> = {
      1: "Very Easy",
      2: "Easy", 
      3: "Moderate",
      4: "Somewhat Hard",
      5: "Hard",
      6: "Harder",
      7: "Very Hard",
      8: "Very Very Hard", 
      9: "Extremely Hard",
      10: "Maximum Effort"
    };
    return rpeLabels[rating] || "";
  };

  // Get current exercise info
  const currentExercise = getCurrentExercise();
  const exerciseName = currentExercise?.name || 'Exercise';
  const exerciseProgress = getExerciseProgress();

  // Calculate sets and reps
  const currentExerciseSets = parsePositiveInt(currentExercise?.sets, 1);
  const currentExerciseReps = parsePositiveInt(currentExercise?.reps, 1);

  // Visual Progress Component for Reps
  const RepProgressIndicator = () => {
    const reps = [];
    for (let i = 1; i <= currentExerciseReps; i++) {
      let color = pendingColor;
      if (i < state.currentRep) {
        color = completedColor; // Completed reps
      } else if (i === state.currentRep) {
        color = currentColor; // Current rep
      }
      
      reps.push(
        <Circle
          key={i}
          size="8px"
          bg={color}
          border="1px solid"
          borderColor={color}
          transition="all 0.2s"
        />
      );
    }
    return (
      <HStack spacing={1} justify="center">
        {reps}
      </HStack>
    );
  };

  // Visual Progress Component for Sets
  const SetProgressIndicator = () => {
    const sets = [];
    for (let i = 1; i <= currentExerciseSets; i++) {
      let color = pendingColor;
      if (i < state.currentSet) {
        color = completedColor; // Completed sets
      } else if (i === state.currentSet) {
        color = currentColor; // Current set
      }
      
      sets.push(
        <Circle
          key={i}
          size="8px"
          bg={color}
          border="1px solid"
          borderColor={color}
          transition="all 0.2s"
        />
      );
    }
    return (
      <HStack spacing={1} justify="center">
        {sets}
      </HStack>
    );
  };

  // Progress calculation
  let totalRepsInWorkout = 0;
  let completedRepsInWorkout = 0;
  
  if (workout.flow_type === 'circuit') {
    const exercisesPerRound = workout.exercises.length;
    const totalRounds = workout.circuit_rounds || 1;
    totalRepsInWorkout = exercisesPerRound * totalRounds;
    
    const completedRounds = currentRound - 1;
    const completedInCurrentRound = exerciseIdx;
    completedRepsInWorkout = (completedRounds * exercisesPerRound) + completedInCurrentRound;
  } else {
    workout.exercises.forEach((exercise, exIndex) => {
      const exerciseSets = parsePositiveInt(exercise.sets, 1);
      const exerciseReps = parsePositiveInt(exercise.reps, 1);
      const totalRepsForThisExercise = exerciseSets * exerciseReps;
      
      totalRepsInWorkout += totalRepsForThisExercise;
      
      if (exIndex < exerciseIdx) {
        completedRepsInWorkout += totalRepsForThisExercise;
      } else if (exIndex === exerciseIdx) {
        // Calculate completed reps in current exercise
        // Count fully completed sets plus current rep being worked on
        const completedSets = state.currentSet - 1;
        const completedRepsInCurrentExercise = (completedSets * exerciseReps) + state.currentRep;
        completedRepsInWorkout += completedRepsInCurrentExercise;
      }
    });
  }
  
  const completionProgress = {
    completed: completedRepsInWorkout,
    total: totalRepsInWorkout,
    percentage: totalRepsInWorkout > 0 ? (completedRepsInWorkout / totalRepsInWorkout) * 100 : 0,
    setInfo: workout.flow_type === 'circuit' 
      ? `Round ${currentRound} of ${workout.circuit_rounds || 1}`
      : `Set ${state.currentSet} of ${currentExerciseSets}, Rep ${state.currentRep} of ${currentExerciseReps}`
  };

  const progressBar = !state.showRPEScreen ? (
    <Box w="full" h="3px" bg="gray.200" position="relative">
      <Box
        h="full"
        bg="blue.400"
        borderRadius="0"
        width={`${completionProgress.percentage}%`}
        transition="width 0.3s ease"
      />
    </Box>
  ) : undefined;

  const headerContent = !state.showRPEScreen ? (
    <VStack spacing={1} w="full">
      <Text textAlign="center" fontSize="xs" color="blue.500" fontWeight="medium" textTransform="uppercase" w="full">
        {workout.flow_type === 'circuit' ? 'Circuit Training' : 'Sequential Workout'}
      </Text>
      <Text textAlign="center" fontSize="lg" fontWeight="medium" w="full">
        {exerciseName}
      </Text>
      <Text textAlign="center" fontSize="sm" color={modalTextColor} w="full">
        {(() => {
          if (exerciseProgress.current >= exerciseProgress.total) {
            if (workout.flow_type === 'circuit' && currentRound < (workout.circuit_rounds || 1)) {
              return `Next Round: ${currentRound + 1}`;
            }
            return 'Finish Workout';
          } else {
            const nextExercise = workout.exercises[exerciseIdx + 1];
            return `Next: ${nextExercise?.name || `Exercise ${exerciseIdx + 2}`}`;
          }
        })()}
      </Text>
    </VStack>
  ) : (
    <Text textAlign="center" fontSize="lg" fontWeight="medium" w="full">Rate Your Effort</Text>
  );

  if (!workout) {
    return null;
  }

  return (
    <>
            <SharedWorkoutUI
        isOpen={isOpen}
        onClose={onClose}
        exerciseName={exerciseName}
        state={state}
        timer={timer}
        headerContent={headerContent}
        progressBar={progressBar}
        onVideoClick={handleVideoClick}
        onPauseResume={handlePauseResume}
        onResetTimer={handleResetTimer}
        onSkipRest={skipRest}
        onPrevious={handlePrevious}
        onNext={handleDone}
        canGoPrevious={exerciseIdx > 0}
        canGoNext={true}
        onInfoDrawerOpen={onInfoDrawerOpen}
    >
      {!state.showRPEScreen ? (
        <>
          {/* Sequential-specific Stats */}
          <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
            <SimpleGrid columns={workout.flow_type === 'circuit' ? 3 : 4} spacing={2}>
              {workout.flow_type === 'circuit' ? (
                <>
                  {/* Round Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Round
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${currentRound}/${workout.circuit_rounds || 1}`}
                    </Text>
                  </VStack>
                  
                  {/* Exercise Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Exercise
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${exerciseProgress.current}/${exerciseProgress.total}`}
                    </Text>
                  </VStack>
                  
                  {/* Completion Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Progress
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${Math.round(completionProgress.percentage)}%`}
                    </Text>
                  </VStack>
                </>
              ) : (
                <>
                  {/* Sets Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Sets
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${state.currentSet}/${currentExerciseSets}`}
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
                      Exercise
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${exerciseProgress.current}/${exerciseProgress.total}`}
                    </Text>
                  </VStack>
                  
                  {/* Completion Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Progress
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${Math.round(completionProgress.percentage)}%`}
                    </Text>
                  </VStack>
                </>
              )}
            </SimpleGrid>
          </Box>



          {/* Exercise Details - Hidden on mobile */}
          {currentExercise && (currentExercise.weight || currentExercise.distance || currentExercise.rest || currentExercise.contacts || currentExercise.intensity || currentExercise.direction || currentExercise.notes || currentExercise.movement_notes) && (
            <Box w="full" bg={sectionBg} borderRadius="xl" p={4} display={{ base: "none", md: "block" }}>
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2} mb={currentExercise.notes || currentExercise.movement_notes ? 3 : 0}>
                {currentExercise.weight && (
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                      Weight
                    </Text>
                    <Text fontSize="sm" color={modalTextColor} textAlign="center">
                      {currentExercise.weight} lbs
                    </Text>
                  </VStack>
                )}
                {currentExercise.distance && (
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                      Distance
                    </Text>
                    <Text fontSize="sm" color={modalTextColor} textAlign="center">
                      {currentExercise.distance} m
                    </Text>
                  </VStack>
                )}
                {currentExercise.rest && (
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                      Rest
                    </Text>
                    <Text fontSize="sm" color={modalTextColor} textAlign="center">
                      {currentExercise.rest}s
                    </Text>
                  </VStack>
                )}
                {currentExercise.contacts && (
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                      Contacts
                    </Text>
                    <Text fontSize="sm" color={modalTextColor} textAlign="center">
                      {currentExercise.contacts}
                    </Text>
                  </VStack>
                )}
                {currentExercise.intensity && (
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                      Intensity
                    </Text>
                    <Text fontSize="sm" color={modalTextColor} textAlign="center">
                      {currentExercise.intensity}
                    </Text>
                  </VStack>
                )}
                {currentExercise.direction && (
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                      Direction
                    </Text>
                    <Text fontSize="sm" color={modalTextColor} textAlign="center">
                      {currentExercise.direction}
                    </Text>
                  </VStack>
                )}
              </SimpleGrid>
              {(currentExercise.notes || currentExercise.movement_notes) && (
                <VStack spacing={3} align="stretch">
                  {currentExercise.notes && (
                    <Box>
                      <Text fontSize="xs" color={modalTextColor} fontWeight="medium" mb={1}>
                        Exercise Notes
                      </Text>
                      <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                        {currentExercise.notes}
                      </Text>
                    </Box>
                  )}
                  {currentExercise.movement_notes && (
                    <Box>
                      <Text fontSize="xs" color={modalTextColor} fontWeight="medium" mb={1}>
                        Movement Instructions
                      </Text>
                      <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                        {currentExercise.movement_notes}
                      </Text>
                    </Box>
                  )}
                </VStack>
              )}
            </Box>
          )}

          {/* Progress Indicators */}
          <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
            <SimpleGrid columns={workout.flow_type === 'circuit' ? 3 : 4} spacing={2}>
              {workout.flow_type === 'circuit' ? (
                <>
                  {/* Round Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Round Progress
                    </Text>
                    <SetProgressIndicator />
                  </VStack>
                  
                  {/* Exercise Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Exercise Progress
                    </Text>
                    <RepProgressIndicator />
                  </VStack>
                  
                  {/* Overall Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Overall
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${Math.round(completionProgress.percentage)}%`}
                    </Text>
                  </VStack>
                </>
              ) : (
                <>
                  {/* Sets Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Sets Progress
                    </Text>
                    <SetProgressIndicator />
                  </VStack>
                  
                  {/* Reps Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Reps Progress
                    </Text>
                    <RepProgressIndicator />
                  </VStack>
                  
                  {/* Exercise Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Exercise
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${exerciseProgress.current}/${exerciseProgress.total}`}
                    </Text>
                  </VStack>
                  
                  {/* Overall Progress */}
                  <VStack spacing={1} align="center">
                    <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                      Overall
                    </Text>
                    <Text fontSize="lg" fontWeight="normal" textAlign="center">
                      {`${Math.round(completionProgress.percentage)}%`}
                    </Text>
                  </VStack>
                </>
              )}
            </SimpleGrid>
          </Box>

        </>
      ) : (
        /* RPE Rating Screen */
        <VStack spacing={6} align="stretch">
          {/* RPE Instructions */}
          <Box w="full" bg={sectionBg} borderRadius="xl" p={6} textAlign="center">
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Rate Your Effort
            </Text>
            <Text fontSize="sm" color={modalTextColor} lineHeight="1.6">
              On a scale of 1-10, how hard did this workout feel?
            </Text>
          </Box>

          {/* RPE Scale Grid */}
          <Box w="full" bg={sectionBg} borderRadius="xl" p={6}>
            <SimpleGrid columns={2} spacing={3} w="full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <Button
                  key={rating}
                  size="lg"
                  variant={state.selectedRPE === rating ? "solid" : "outline"}
                  colorScheme={state.selectedRPE === rating ? "blue" : "gray"}
                  onClick={() => state.setSelectedRPE(rating)}
                  h="60px"
                  borderRadius="xl"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  isDisabled={state.isLoggingRPE}
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "lg"
                  }}
                  transition="all 0.2s"
                >
                  <Text fontSize="2xl" fontWeight="bold">
                    {rating}
                  </Text>
                  <Text fontSize="xs" opacity={0.8}>
                    {getRPELabel(rating)}
                  </Text>
                </Button>
              ))}
            </SimpleGrid>
          </Box>

          {/* RPE Description */}
          {state.selectedRPE && (
            <Box w="full" bg={sectionBg} borderRadius="xl" p={4} textAlign="center">
              <Text fontSize="sm" color={modalTextColor}>
                <Text as="span" fontWeight="bold" color={currentColor}>
                  {state.selectedRPE}/10
                </Text>
                {" - "}
                {getRPELabel(state.selectedRPE)}
              </Text>
            </Box>
          )}

          {/* Action Buttons */}
          <HStack spacing={4} w="full">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleSkipRPE}
              isDisabled={state.isLoggingRPE}
              flex={1}
            >
              Skip RPE
            </Button>
            <Button 
              size="lg" 
              colorScheme="blue" 
              onClick={handleRPESubmit}
              isDisabled={!state.selectedRPE || state.isLoggingRPE}
              isLoading={state.isLoggingRPE}
              loadingText="Saving..."
              flex={1}
            >
              Submit RPE
            </Button>
          </HStack>
        </VStack>
      )}
    </SharedWorkoutUI>

    {/* Workout Info Drawer - Mobile Only */}
    <WorkoutInfoDrawer
      isOpen={isInfoDrawerOpen}
      onClose={onInfoDrawerClose}
      flowType={workout.flow_type}
      category="Main"
      restBetween={(() => {
        const currentExercise = getCurrentExercise();
        return currentExercise?.rest ? `${currentExercise.rest}s` : 'None';
      })()}
      contacts={getCurrentExercise()?.contacts}
      direction={getCurrentExercise()?.direction}
      movementInstructions={getCurrentExercise()?.movement_notes}
    />
    </>
  );
}; 