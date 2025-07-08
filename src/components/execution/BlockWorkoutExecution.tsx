import React, { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  SimpleGrid,
  Icon,
  Badge,
  useColorModeValue,
  Circle,
  Flex,
  ModalFooter,
} from '@chakra-ui/react';
import { FaChevronLeft, FaCheckCircle, FaRunning } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SharedWorkoutUI, 
  useWorkoutExecutionState, 
  useWorkoutExecutionEffects,
  parsePositiveInt,
  getVideoUrl,
  type BaseWorkoutExecutionProps 
} from './BaseWorkoutExecution';
import { supabase } from '../../lib/supabase';
import { saveTrainingLoadEntry } from '../../services/analytics/injuryRiskService';

// Interfaces for block-based workouts
interface Exercise {
  id: string;
  name: string;
  sets: string | number;
  reps: string | number;
  weight?: string | number;
  rest?: string | number;
  distance?: string | number;
  notes?: string;
  instanceId?: string;
}

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

interface BlockWorkout {
  id: string;
  name: string;
  exercises: Exercise[]; // Fallback for non-block data
  is_block_based: boolean;
  blocks: ExerciseBlock[];
}

interface BlockWorkoutExecutionProps extends BaseWorkoutExecutionProps {
  workout: BlockWorkout;
  exerciseIdx: number;
  onNextExercise: () => void;
  onPreviousExercise: () => void;
}

export const BlockWorkoutExecution: React.FC<BlockWorkoutExecutionProps> = ({
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
  const { user } = useAuth();
  const state = useWorkoutExecutionState();
  const { startCountdownTimer, startRestTimer, skipRest } = useWorkoutExecutionEffects({
    isOpen,
    timer,
    running,
    onUpdateTimer,
    onUpdateRunning,
    state
  });

  // Helper function to safely get blocks array from workout
  const getBlocksFromWorkout = useCallback((workout: any): ExerciseBlock[] => {
    if (!workout?.blocks) return [];
    
    // If blocks is already an array, return it
    if (Array.isArray(workout.blocks)) {
      return workout.blocks as ExerciseBlock[];
    }
    
    // If blocks is a string (JSON), try to parse it
    if (typeof workout.blocks === 'string') {
      try {
        const parsed = JSON.parse(workout.blocks);
        
        // Handle weekly blocks format (object with day keys)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Flatten all daily blocks into a single array
          const allBlocks: ExerciseBlock[] = [];
          Object.values(parsed).forEach((dayBlocks: any) => {
            if (Array.isArray(dayBlocks)) {
              allBlocks.push(...(dayBlocks as ExerciseBlock[]));
            }
          });
          return allBlocks;
        }
        
        // Handle regular blocks array
        if (Array.isArray(parsed)) {
          return parsed as ExerciseBlock[];
        }
      } catch (error) {
        console.error('Error parsing workout blocks:', error);
      }
    }
    
    return [];
  }, []);

  // Get the actual blocks array
  const workoutBlocks = getBlocksFromWorkout(workout);

  // Block-specific state
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentExerciseIndexInBlock, setCurrentExerciseIndexInBlock] = useState(0);

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

  // Theme colors
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  const progressBg = useColorModeValue('gray.200', 'gray.600');
  const completedColor = useColorModeValue('green.500', 'green.400');
  const currentColor = useColorModeValue('blue.500', 'blue.400');
  const pendingColor = useColorModeValue('gray.300', 'gray.500');

  // Block navigation functions
  const getCurrentBlock = useCallback((): ExerciseBlock | null => {
    if (!workoutBlocks || workoutBlocks.length === 0) return null;
    return workoutBlocks[currentBlockIndex] || null;
  }, [workoutBlocks, currentBlockIndex]);

  const getAllExercises = useCallback((): Exercise[] => {
    if (workoutBlocks && workoutBlocks.length > 0) {
      return workoutBlocks.flatMap(block => block.exercises);
    }
    return workout?.exercises || [];
  }, [workoutBlocks, workout?.exercises]);

  const getCurrentExercise = useCallback((): Exercise | null => {
    const allExercises = getAllExercises();
    return allExercises[exerciseIdx] || null;
  }, [getAllExercises, exerciseIdx]);

  const getBlockProgress = useCallback((): { current: number; total: number } => {
    return {
      current: currentBlockIndex + 1,
      total: workoutBlocks?.length || 0
    };
  }, [currentBlockIndex, workoutBlocks?.length]);

  const getExerciseProgress = useCallback((): { current: number; total: number } => {
    const allExercises = getAllExercises();
    return {
      current: exerciseIdx + 1,
      total: allExercises.length
    };
  }, [getAllExercises, exerciseIdx]);

  // Map global exercise index to block info
  const getExerciseBlockInfo = useCallback((globalIndex: number): { blockIndex: number; localIndex: number; block: ExerciseBlock } | null => {
    if (!workoutBlocks) return null;

    let accumulatedIndex = 0;
    for (let blockIndex = 0; blockIndex < workoutBlocks.length; blockIndex++) {
      const block = workoutBlocks[blockIndex];
      const blockExerciseCount = block.exercises.length;
      
      if (globalIndex < accumulatedIndex + blockExerciseCount) {
        return {
          blockIndex,
          localIndex: globalIndex - accumulatedIndex,
          block
        };
      }
      accumulatedIndex += blockExerciseCount;
    }
    return null;
  }, [workoutBlocks]);

  // Update block tracking when exercise changes
  useEffect(() => {
    const blockInfo = getExerciseBlockInfo(exerciseIdx);
    if (blockInfo) {
      setCurrentBlockIndex(blockInfo.blockIndex);
      setCurrentExerciseIndexInBlock(blockInfo.localIndex);
    }
    
    // Reset exercise state
    state.setCurrentSet(1);
    state.setCurrentRep(1);
    state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
  }, [exerciseIdx, getExerciseBlockInfo, state.setCurrentSet, state.setCurrentRep, state.setRunTime]);

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

    const maxSets = parsePositiveInt(currentExercise.sets, 1);
    const maxReps = parsePositiveInt(currentExercise.reps, 1);
    const restTime = getRestTime();

    if (state.currentRep < maxReps) {
      // Next rep - check for rest between reps
      state.setCurrentRep(prev => prev + 1);
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
      state.setCurrentSet(prev => prev + 1);
      state.setCurrentRep(1);
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
      // Exercise complete - check if it's the last exercise
      const exerciseProgress = getExerciseProgress();
      if (exerciseProgress.current >= exerciseProgress.total) {
        state.setShowRPEScreen(true);
      } else {
        // Move to next exercise - check for rest between exercises
        state.setCurrentSet(1);
        state.setCurrentRep(1);
        state.setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
        onNextExercise();
        onUpdateTimer(0);
        onUpdateRunning(false);
        
        // Get rest time for the NEW exercise/block after moving
        const nextRestTime = getRestTimeForExercise(exerciseIdx + 1);
        
        if (nextRestTime > 0) {
          startRestTimer(nextRestTime);
        } else {
          state.setCountdownType('progression');
          startCountdownTimer();
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

  // Get rest time for current context
  const getRestTime = useCallback((): number => {
    const exercise = getCurrentExercise();
    const block = getCurrentBlock();
    
    // Exercise-specific rest takes priority
    if (exercise?.rest) {
      return parsePositiveInt(exercise.rest, 0);
    }
    
    // Use block's default rest between exercises
    if (block?.restBetweenExercises) {
      return parsePositiveInt(block.restBetweenExercises, 0);
    }
    
    return 0; // No rest
  }, [getCurrentExercise, getCurrentBlock]);

  // Get rest time for a specific exercise index
  const getRestTimeForExercise = useCallback((targetExerciseIdx: number): number => {
    const allExercises = getAllExercises();
    const targetExercise = allExercises[targetExerciseIdx];
    
    if (!targetExercise) return 0;
    
    // Exercise-specific rest takes priority
    if (targetExercise.rest) {
      return parsePositiveInt(targetExercise.rest, 0);
    }
    
    // Get the block for this target exercise
    const blockInfo = getExerciseBlockInfo(targetExerciseIdx);
    if (blockInfo?.block?.restBetweenExercises) {
      return parsePositiveInt(blockInfo.block.restBetweenExercises, 0);
    }
    
    return 0; // No rest
  }, [getAllExercises, getExerciseBlockInfo]);

  const handlePrevious = () => {
    if (exerciseIdx > 0) {
      onPreviousExercise();
    }
  };

  // Get current exercise info
  const currentExercise = getCurrentExercise();
  const currentBlock = getCurrentBlock();
  const exerciseName = currentExercise?.name || 'Exercise';
  const blockProgress = getBlockProgress();
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
  const allExercises = getAllExercises();
  let totalRepsInWorkout = 0;
  let completedRepsInWorkout = 0;
  
  allExercises.forEach((exercise, exIndex) => {
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
  
  const completionProgress = {
    completed: completedRepsInWorkout,
    total: totalRepsInWorkout,
    percentage: totalRepsInWorkout > 0 ? (completedRepsInWorkout / totalRepsInWorkout) * 100 : 0,
    setInfo: `Set ${state.currentSet} of ${currentExerciseSets}, Rep ${state.currentRep} of ${currentExerciseReps}`
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
      <Text 
        textAlign="center" 
        fontSize="xs" 
        color="blue.500" 
        fontWeight="medium" 
        textTransform="uppercase"
        noOfLines={1}
        w="full"
      >
        {`${currentBlock?.name || `Block ${blockProgress.current}`} (${blockProgress.current}/${blockProgress.total})`}
      </Text>
      <Text 
        textAlign="center" 
        fontSize="lg" 
        fontWeight="medium"
        noOfLines={2}
        wordBreak="break-word"
        w="full"
      >
        {exerciseName}
      </Text>
      <Text 
        textAlign="center" 
        fontSize="sm" 
        color={modalTextColor}
        noOfLines={1}
        w="full"
      >
        {(() => {
          if (exerciseProgress.current >= exerciseProgress.total) {
            return 'Finish Workout';
          } else {
            const nextExercise = allExercises[exerciseIdx + 1];
            const nextBlockInfo = getExerciseBlockInfo(exerciseIdx + 1);
            
            if (nextBlockInfo && nextBlockInfo.blockIndex !== currentBlockIndex) {
              return `Next Block: ${nextBlockInfo.block.name || `Block ${nextBlockInfo.blockIndex + 1}`}`;
            } else {
              return `Next: ${nextExercise?.name || `Exercise ${exerciseIdx + 2}`}`;
            }
          }
        })()}
      </Text>
    </VStack>
  ) : (
    <Text textAlign="center" fontSize="lg" fontWeight="medium" w="full">Rate Your Effort</Text>
  );

  if (!workout || !workoutBlocks || workoutBlocks.length === 0) {
    return null;
  }

  const footerContent = state.showRPEScreen ? (
    <ModalFooter p={6}>
      <VStack spacing={6} w="full">
        <SimpleGrid columns={2} spacing={3} w="full">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleSkipRPE}
            isDisabled={state.isLoggingRPE}
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
          >
            Submit RPE
          </Button>
        </SimpleGrid>
      </VStack>
    </ModalFooter>
  ) : undefined;

  return (
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
      footerContent={footerContent}
    >
      {!state.showRPEScreen ? (
        <>
          {/* Block-specific Stats */}
          <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
            <SimpleGrid columns={4} spacing={2}>
              {/* Current Set */}
              <VStack spacing={2} align="center">
                <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                  Current Set
                </Text>
                <Text fontSize="lg" fontWeight="bold" textAlign="center" color={currentColor}>
                  {state.currentSet}
                </Text>
                <SetProgressIndicator />
              </VStack>
              
              {/* Current Rep */}
              <VStack spacing={2} align="center">
                <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                  Current Rep
                </Text>
                <Text fontSize="lg" fontWeight="bold" textAlign="center" color={currentColor}>
                  {state.currentRep}
                </Text>
                <RepProgressIndicator />
              </VStack>
              
              {/* Block Progress */}
              <VStack spacing={1} align="center">
                <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textTransform="uppercase" textAlign="center">
                  Block
                </Text>
                <Text fontSize="lg" fontWeight="normal" textAlign="center">
                  {`${blockProgress.current}/${blockProgress.total}`}
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
            </SimpleGrid>
          </Box>

          {/* Block Information */}
          {currentBlock && (
            <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
              <SimpleGrid columns={3} spacing={2}>
                <VStack spacing={1} align="center">
                  <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                    Flow Type
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} textTransform="capitalize" textAlign="center">
                    {currentBlock.flow || 'sequential'}
                  </Text>
                </VStack>
                <VStack spacing={1} align="center">
                  <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                    Category
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} textTransform="capitalize" textAlign="center">
                    {currentBlock.category || '-'}
                  </Text>
                </VStack>
                <VStack spacing={1} align="center">
                  <Text fontSize="xs" color={modalTextColor} fontWeight="medium" textAlign="center">
                    Rest Between
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} textAlign="center">
                    {(() => {
                      const actualRestTime = getRestTime();
                      return actualRestTime > 0 ? `${actualRestTime}s` : 'None';
                    })()}
                  </Text>
                </VStack>
              </SimpleGrid>
              {currentBlock.notes && (
                <Box mt={3}>
                  <Text fontSize="xs" color={modalTextColor} fontWeight="medium" mb={1}>
                    Block Notes
                  </Text>
                  <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                    {currentBlock.notes}
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Exercise Notes */}
          {currentExercise?.notes && (
            <Box w="full" bg={sectionBg} borderRadius="xl" p={4}>
              <Text fontSize="xs" color={modalTextColor} fontWeight="bold" textTransform="uppercase" mb={2}>
                Exercise Notes
              </Text>
              <Text fontSize="sm" color={modalTextColor} lineHeight="1.5">
                {currentExercise.notes}
              </Text>
            </Box>
          )}

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
        </VStack>
      )}
    </SharedWorkoutUI>
  );
}; 