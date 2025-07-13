import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Box,
  Text,
  IconButton,
  Button,
  SimpleGrid,
  Icon,
  useColorModeValue,
  useBreakpointValue,
  Badge
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaPlay, FaPause, FaRedo, FaVideo, FaChevronLeft, FaCheckCircle, FaRunning, FaForward, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { ExerciseMediaDisplay } from '../ExerciseMediaDisplay';
import { RunTimeInput } from '../RunTimeInput';

// Utility function to safely parse positive integers for sets/reps
function parsePositiveInt(value: any, fallback: number = 1): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
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

function isRunExercise(exerciseName: string): boolean {
  const name = exerciseName.toLowerCase();
  return name.includes('run') || name.includes('sprint') || name.includes('jog') || name.includes('dash') || name.includes('meter');
}

export interface BaseWorkoutExecutionProps {
  isOpen: boolean;
  onClose: () => void;
  timer: number;
  running: boolean;
  currentSet?: number;
  currentRep?: number;
  onUpdateTimer: (timer: number) => void;
  onUpdateRunning: (running: boolean) => void;
  onFinishWorkout: () => void;
  onShowVideo: (exerciseName: string, videoUrl: string) => void;
}

export const useWorkoutExecutionState = (
  workoutId?: string, 
  exerciseIdx?: number,
  initialCurrentSet?: number,
  initialCurrentRep?: number
) => {
  // Create a unique key for localStorage based on workout and exercise
  const storageKey = workoutId && exerciseIdx !== undefined 
    ? `workout-execution-state-${workoutId}-${exerciseIdx}` 
    : null;

  // Helper function to load state from localStorage
  const loadPersistedState = useCallback(() => {
    if (!storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if the session is recent (within 6 hours)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 6 * 60 * 60 * 1000) {
          // Debug logging removed to prevent console flooding
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading execution state:', error);
    }
    return null;
  }, [storageKey]);

  // Helper function to save state to localStorage
  const saveStateToStorage = useCallback((stateToSave: any) => {
    if (!storageKey) return;
    
    try {
      const stateWithTimestamp = {
        ...stateToSave,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Error saving execution state:', error);
    }
  }, [storageKey]);

  // Helper function to save granular progress to database
  const saveProgressToDatabase = useCallback(async (
    userId: string,
    actualWorkoutId: string,
    currentExerciseIdx: number,
    currentSet: number,
    currentRep: number,
    workoutStore: any
  ) => {
    if (!userId || !actualWorkoutId) return;
    
    try {
      if (actualWorkoutId.startsWith('daily-')) {
        // Monthly plan workout
        const { saveCurrentMonthlyPlanProgressToDB } = await import('../../utils/monthlyPlanWorkoutHelper');
        await saveCurrentMonthlyPlanProgressToDB(
          userId,
          currentExerciseIdx,
          currentSet,
          currentRep,
          workoutStore,
          actualWorkoutId
        );
      } else {
        // Regular workout
        const { saveCurrentProgressToDB } = await import('../../utils/regularWorkoutHelper');
        await saveCurrentProgressToDB(
          userId,
          actualWorkoutId,
          currentExerciseIdx,
          currentSet,
          currentRep,
          workoutStore
        );
      }
    } catch (error) {
      console.error('Error saving progress to database:', error);
    }
  }, []);

  // Initialize state with persistence
  const persistedState = loadPersistedState();

  // Timer and countdown state
  const [countdown, setCountdown] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [countdownType, setCountdownType] = useState<'initial' | 'progression' | null>(null);
  const [hasStartedInitialCountdown, setHasStartedInitialCountdown] = useState(false);
  
  // Rest timer state
  const [restCountdown, setRestCountdown] = useState(0);
  const [isResting, setIsResting] = useState(false);
  
  // Exercise state - prioritize passed initial values over localStorage
  const [currentSet, setCurrentSet] = useState(
    initialCurrentSet || persistedState?.currentSet || 1
  );
  const [currentRep, setCurrentRep] = useState(
    initialCurrentRep || persistedState?.currentRep || 1
  );
  const [runTime, setRunTime] = useState(persistedState?.runTime || { minutes: 0, seconds: 0, hundredths: 0 });
  
  // Removed hasLoadedGranularProgress state - no longer needed
  
  // RPE state
  const [showRPEScreen, setShowRPEScreen] = useState(false);
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null);
  const [isLoggingRPE, setIsLoggingRPE] = useState(false);
  
  // Refs to store latest values to avoid stale closures
  const currentStateRef = useRef({ currentSet, currentRep, runTime });
  
  // Update ref whenever state changes
  useEffect(() => {
    currentStateRef.current = { currentSet, currentRep, runTime };
  }, [currentSet, currentRep, runTime]);
  
  // TEMPORARILY DISABLED: Load granular progress from database 
  // This was interfering with normal workout progression
  // Granular progress restoration should happen at the higher level (AthleteWorkouts.tsx)
  // when the modal is opened, not inside the execution components
  
  // useEffect(() => {
  //   const loadGranularProgressFromDB = async () => {
  //     // ... granular progress loading logic
  //   };
  //   loadGranularProgressFromDB();
  // }, [workoutId, userId]);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create enhanced setters that persist on user action
  const setCurrentSetWithPersistence = useCallback((
    value: number | ((prev: number) => number),
    userId?: string,
    actualWorkoutId?: string,
    exerciseIdx?: number,
    workoutStore?: any
  ) => {
    setCurrentSet(prevSet => {
      const newSet = typeof value === 'function' ? value(prevSet) : value;
      // Only persist when user explicitly changes the set
      if (storageKey && newSet !== prevSet) {
        const state = currentStateRef.current;
        saveStateToStorage({ currentSet: newSet, currentRep: state.currentRep, runTime: state.runTime });
        
        // Also save to database if we have the required data
        if (userId && actualWorkoutId && exerciseIdx !== undefined && workoutStore) {
          saveProgressToDatabase(userId, actualWorkoutId, exerciseIdx, newSet, state.currentRep, workoutStore);
        }
      }
      return newSet;
    });
  }, [storageKey, saveStateToStorage, saveProgressToDatabase]);

  const setCurrentRepWithPersistence = useCallback((
    value: number | ((prev: number) => number),
    userId?: string,
    actualWorkoutId?: string,
    exerciseIdx?: number,
    workoutStore?: any
  ) => {
    setCurrentRep(prevRep => {
      const newRep = typeof value === 'function' ? value(prevRep) : value;
      
      // Debug logging removed to prevent console flooding
      
      // Only persist when user explicitly changes the rep
      if (storageKey && newRep !== prevRep) {
        const state = currentStateRef.current;
        saveStateToStorage({ currentSet: state.currentSet, currentRep: newRep, runTime: state.runTime });
        
        // Also save to database if we have the required data
        if (userId && actualWorkoutId && exerciseIdx !== undefined && workoutStore) {
          saveProgressToDatabase(userId, actualWorkoutId, exerciseIdx, state.currentSet, newRep, workoutStore);
        }
      }
      return newRep;
    });
  }, [storageKey, saveStateToStorage, saveProgressToDatabase]);

  const setRunTimeWithPersistence = useCallback((value: { minutes: number; seconds: number; hundredths: number }) => {
    const state = currentStateRef.current;
    // Only persist if the time actually changed
    if (storageKey && (value.minutes !== state.runTime.minutes || value.seconds !== state.runTime.seconds || value.hundredths !== state.runTime.hundredths)) {
      saveStateToStorage({ currentSet: state.currentSet, currentRep: state.currentRep, runTime: value });
    }
    setRunTime(value);
  }, [storageKey, saveStateToStorage]);

  // Clear persisted state when exercise is completed or modal closes
  const clearPersistedState = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    // Timer state
    countdown,
    setCountdown,
    isPaused,
    setIsPaused,
    countdownType,
    setCountdownType,
    hasStartedInitialCountdown,
    setHasStartedInitialCountdown,
    timerRef,
    countdownRef,
    
    // Rest timer state
    restCountdown,
    setRestCountdown,
    isResting,
    setIsResting,
    restTimerRef,
    
    // Exercise state with persistence
    currentSet,
    setCurrentSet: setCurrentSetWithPersistence,
    currentRep,
    setCurrentRep: setCurrentRepWithPersistence,
    runTime,
    setRunTime: setRunTimeWithPersistence,
    
    // RPE state
    showRPEScreen,
    setShowRPEScreen,
    selectedRPE,
    setSelectedRPE,
    isLoggingRPE,
    setIsLoggingRPE,
    
    // Persistence control
    clearPersistedState,
    saveProgressToDatabase
  };
};

export interface BaseWorkoutExecutionHookProps {
  isOpen: boolean;
  timer: number;
  running: boolean;
  onUpdateTimer: (timer: number) => void;
  onUpdateRunning: (running: boolean) => void;
  state: ReturnType<typeof useWorkoutExecutionState>;
}

export const useWorkoutExecutionEffects = ({
  isOpen,
  timer,
  running,
  onUpdateTimer,
  onUpdateRunning,
  state
}: BaseWorkoutExecutionHookProps) => {
  const {
    countdown,
    setCountdown,
    isPaused,
    countdownType,
    setCountdownType,
    hasStartedInitialCountdown,
    setHasStartedInitialCountdown,
    timerRef,
    countdownRef,
    restCountdown,
    setRestCountdown,
    isResting,
    setIsResting,
    restTimerRef
  } = state;

  // Enhanced timer effect with pause functionality and countdown
  useEffect(() => {
    if (running && !isPaused && countdown === 0 && !isResting) {
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
  }, [running, isPaused, countdown, timer, onUpdateTimer, isResting]);

  // Function to start countdown
  const startCountdownTimer = useCallback(() => {
    if (countdownRef.current) {
      return;
    }
    
    setCountdown(3);
    
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
  }, [setCountdown, countdownRef]);

  // Rest timer effect
  useEffect(() => {
    if (isResting && restCountdown > 0) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown(prev => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current!);
            restTimerRef.current = null;
            setIsResting(false);
            // Automatically resume the main timer after rest ends
            onUpdateRunning(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restCountdown, setRestCountdown, setIsResting, onUpdateRunning, restTimerRef]);

  // Function to start rest timer
  const startRestTimer = useCallback((restSeconds: number) => {
    if (restSeconds > 0) {
      setRestCountdown(restSeconds);
      setIsResting(true);
      onUpdateRunning(false); // Pause main timer
    }
  }, [setRestCountdown, setIsResting, onUpdateRunning]);

  // Function to skip rest
  const skipRest = useCallback(() => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setRestCountdown(0);
    setIsResting(false);
    // Automatically resume the main timer when rest is skipped
    onUpdateRunning(true);
  }, [setRestCountdown, setIsResting, onUpdateRunning, restTimerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    };
  }, []);

  // Initial countdown when modal opens
  useEffect(() => {
    if (isOpen && countdownType === null && !hasStartedInitialCountdown) {
      onUpdateRunning(false);
      setCountdownType('initial');
      setHasStartedInitialCountdown(true);
      
      // Start countdown directly to avoid circular dependency
      if (!countdownRef.current) {
        setCountdown(3);
        
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
      }
    }
  }, [isOpen, countdownType, hasStartedInitialCountdown, onUpdateRunning, setCountdownType, setHasStartedInitialCountdown, setCountdown, countdownRef]);
  
  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCountdownType(null);
      setHasStartedInitialCountdown(false);
    }
  }, [isOpen, setCountdownType, setHasStartedInitialCountdown]);

  // Handle countdown completion
  useEffect(() => {
    if (countdown === 0 && isOpen && countdownType) {
      const timer = setTimeout(() => {
        if (countdownType === 'initial') {
          setCountdownType(null);
          onUpdateRunning(true);
        } else if (countdownType === 'progression') {
          setCountdownType(null);
          onUpdateRunning(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [countdown, isOpen, countdownType, onUpdateRunning]);

  return { startCountdownTimer, startRestTimer, skipRest };
};

export interface SharedWorkoutUIProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  state: ReturnType<typeof useWorkoutExecutionState>;
  timer: number;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  progressBar?: React.ReactNode;
  footerContent?: React.ReactNode;
  onVideoClick: () => void;
  onPauseResume: () => void;
  onResetTimer: () => void;
  onSkipRest: () => void;
  onPrevious?: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onInfoDrawerOpen?: () => void;
}

export const SharedWorkoutUI: React.FC<SharedWorkoutUIProps> = ({
  isOpen,
  onClose,
  exerciseName,
  state,
  timer,
  children,
  headerContent,
  progressBar,
  footerContent,
  onVideoClick,
  onPauseResume,
  onResetTimer,
  onSkipRest,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  onInfoDrawerOpen
}) => {
  const { countdown, isPaused, showRPEScreen, runTime, restCountdown, isResting } = state;
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  
  // Responsive settings with consistent sizing
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl' }) as 'full' | 'xl';
  const isCentered = useBreakpointValue({ base: false, md: true }) as boolean;
  const motionPreset = useBreakpointValue({ base: 'slideInBottom', md: 'scale' }) as 'slideInBottom' | 'scale';

  const handleTimeChange = useCallback((minutes: number, seconds: number, hundredths: number) => {
    state.setRunTime({ minutes, seconds, hundredths });
  }, [state.setRunTime]);

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered={isCentered}
      size={modalSize}
      motionPreset={motionPreset}
      scrollBehavior="inside"
      closeOnOverlayClick={false}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        bg={cardBg}
        h={{ base: "100vh", md: "auto" }}
        maxH={{ base: "100vh", md: "90vh" }}
        w={{ base: "100vw", md: "600px" }}
        maxW={{ base: "100vw", md: "600px" }}
        minW={{ base: "100vw", md: "600px" }}
        borderRadius={{ base: 0, md: "md" }}
        m={{ base: 0, md: 4 }}
        overflow="hidden"
        position={{ base: "fixed", md: "relative" }}
        top={{ base: 0, md: "auto" }}
        left={{ base: 0, md: "auto" }}
        right={{ base: 0, md: "auto" }}
        bottom={{ base: 0, md: "auto" }}
        display="flex"
        flexDirection="column"
      >
        {/* Progress Bar */}
        {progressBar}
        
        <ModalHeader>
          <HStack w="full" position="relative">
            <IconButton
              aria-label="Back"
              icon={<ChevronLeftIcon />}
              variant="ghost"
              onClick={onClose}
              position="absolute"
              left={0}
              zIndex={2}
            />
            
            <VStack spacing={0} textAlign="center" w="full" align="center">
              {headerContent}
            </VStack>
          </HStack>
        </ModalHeader>

        <ModalBody>
          {!showRPEScreen ? (
            <VStack spacing={6} align="stretch">
              {/* Custom content from specific execution component */}
              {children}
              
              {/* Timer Section */}
              <Box 
                w="full" 
                bg={sectionBg} 
                borderRadius="xl" 
                p={{ base: 6, md: 8 }}
                textAlign="center"
                position="relative"
              >
                <Text fontSize="xs" color={modalTextColor} fontWeight="bold" textTransform="uppercase" mb={2}>
                  {countdown > 0 ? "Get Ready!" : isResting ? "Rest Time" : "Timer"}
                </Text>
                
                {/* Timer with Navigation Arrows */}
                <HStack justify="space-between" align="center" spacing={2} w="full" px={2}>
                  {/* Previous Arrow */}
                  <IconButton
                    aria-label="Previous"
                    icon={<ChevronLeftIcon boxSize="50px" />}
                    onClick={onPrevious}
                    variant="ghost"
                    size="lg"
                    isDisabled={!canGoPrevious || countdown > 0 || isResting}
                    opacity={canGoPrevious && countdown === 0 && !isResting ? 1 : 0.3}
                    color="white"
                    _hover={{ bg: "whiteAlpha.200" }}
                    borderRadius="full"
                    minW="60px"
                    h="60px"
                  />
                  
                  {/* Timer Numbers */}
                  <Text 
                    fontSize={{ base: "5xl", md: "6xl" }} 
                    fontWeight="bold" 
                    color={countdown > 0 ? "red.500" : isResting ? "orange.500" : (isPaused ? "gray.400" : "blue.500")} 
                    lineHeight="1"
                    fontFamily="mono"
                    letterSpacing={countdown > 0 ? "0.2em" : "normal"}
                    textAlign="center"
                    minW={countdown > 0 ? "120px" : "auto"}
                    flex="1"
                  >
                    {countdown > 0 
                      ? countdown.toString().padStart(2, '0')
                      : isResting
                      ? `${Math.floor(restCountdown / 60).toString().padStart(2, '0')}:${(restCountdown % 60).toString().padStart(2, '0')}`
                      : `${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`
                    }
                  </Text>
                  
                  {/* Next Arrow */}
                  <IconButton
                    aria-label="Next"
                    icon={<ChevronRightIcon boxSize="50px" />}
                    onClick={onNext}
                    variant="ghost"
                    size="lg"
                    isDisabled={!canGoNext || countdown > 0 || isResting}
                    opacity={canGoNext && countdown === 0 && !isResting ? 1 : 0.3}
                    color="white"
                    _hover={{ bg: "whiteAlpha.200" }}
                    borderRadius="full"
                    minW="60px"
                    h="60px"
                  />
                </HStack>
                
                                {/* Timer Controls */}
                <HStack justify="center" spacing={4} mt={4}>
                  {/* Exercise Info Button - Mobile Only */}
                  {onInfoDrawerOpen && (
                    <IconButton
                      aria-label="Exercise details"
                      icon={<Icon as={FaInfoCircle} />}
                      onClick={onInfoDrawerOpen}
                      variant="outline"
                      size="md"
                      borderRadius="full"
                      isDisabled={countdown > 0 || isResting}
                      opacity={countdown > 0 || isResting ? 0.4 : 1}
                      display={{ base: "flex", md: "none" }}
                    />
                  )}
                  <IconButton
                    aria-label="Reset timer"
                    icon={<Icon as={FaRedo} />}
                    onClick={onResetTimer}
                    variant="outline"
                    size="md"
                    borderRadius="full"
                    isDisabled={countdown > 0 || isResting}
                    opacity={countdown > 0 || isResting ? 0.4 : 1}
                  />
                  <IconButton
                    aria-label="Tutorial"
                    icon={<Icon as={FaVideo} />}
                    onClick={onVideoClick}
                    variant="outline"
                    size="md"
                    borderRadius="full"
                    isDisabled={countdown > 0 || isResting}
                    opacity={countdown > 0 || isResting ? 0.4 : 1}
                  />
                  <IconButton
                    aria-label={isPaused ? "Resume timer" : "Pause timer"}
                    icon={<Icon as={isPaused ? FaPlay : FaPause} />}
                    onClick={onPauseResume}
                    variant="outline"
                    size="md"
                    borderRadius="full"
                    isDisabled={countdown > 0 || isResting}
                    opacity={countdown > 0 || isResting ? 0.4 : 1}
                  />
                  {/* Skip Rest Button - always visible to prevent layout shifts */}
                  <IconButton
                    aria-label="Skip rest"
                    icon={<Icon as={FaForward} />}
                    onClick={onSkipRest}
                    colorScheme={isResting ? "orange" : "gray"}
                    variant={isResting ? "solid" : "outline"}
                    size="md"
                    borderRadius="full"
                    isDisabled={!isResting}
                    opacity={isResting ? 1 : 0.4}
                  />
                </HStack>
              </Box>

              {/* Exercise Media Display */}
              {!isRunExercise(exerciseName) && (
                <Box 
                  w="full" 
                  flex={{ base: "1", md: "auto" }}
                  minH={{ base: "250px", md: "auto" }}
                  display="flex"
                  flexDirection="column"
                  position="relative"
                >
                  <ExerciseMediaDisplay
                    exerciseName={exerciseName}
                    onVideoClick={onVideoClick}
                    size="lg"
                    showControls={true}
                  />
                </Box>
              )}

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
            </VStack>
          ) : (
            /* RPE Screen - render children content */
            <VStack spacing={6} align="stretch">
              {children}
            </VStack>
          )}
        </ModalBody>
        
        {/* Footer Content */}
        {footerContent}
      </ModalContent>
    </Modal>
  );
};

export { parsePositiveInt, getVideoUrl, isRunExercise }; 