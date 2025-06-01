import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  IconButton,
  Icon,
  Progress,
  Divider,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { FaRegClock, FaRunning, FaPlayCircle } from 'react-icons/fa';
import { CheckIcon } from '@chakra-ui/icons';
import { RunTimeInput } from './RunTimeInput';
import { isRunExercise, validateTime } from '../utils/exerciseUtils';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  distance?: number;
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
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
  onFinishWorkout: () => void;
  onShowVideo: (exerciseName: string, videoUrl: string) => void;
}

// Helper function to get video URL for an exercise
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
  onFinishWorkout,
  onShowVideo
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerValueRef = useRef(timer);

  // State for run time tracking
  const [runTime, setRunTime] = useState({
    minutes: 0,
    seconds: 0,
    hundredths: 0
  });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const modalHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const modalHeaderBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalHeadingColor = useColorModeValue('gray.800', 'white');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const modalSpanColor = useColorModeValue('gray.500', 'gray.400');
  const modalIconBg = useColorModeValue('white', 'gray.800');

  // Update timer ref whenever timer changes
  useEffect(() => {
    timerValueRef.current = timer;
  }, [timer]);

  // Timer effect
  useEffect(() => {
    if (isOpen && running) {
      timerRef.current = setInterval(() => {
        onUpdateTimer(timerValueRef.current + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, running]);

  // Reset run time when exercise changes
  useEffect(() => {
    if (isOpen) {
      setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
    }
  }, [exerciseIdx, isOpen]);

  const handleDone = async () => {
    if (!workout || !workout.exercises[exerciseIdx]) return;
    
    const currentExercise = workout.exercises[exerciseIdx];
    const totalExercises = workout.exercises.length;
    
    // Check if this is a run exercise and validate time if entered
    const isRun = isRunExercise(currentExercise.name);
    let timeValidation: { isValid: boolean; error?: string } = { isValid: true };
    
    if (isRun && (runTime.minutes > 0 || runTime.seconds > 0 || runTime.hundredths > 0)) {
      timeValidation = validateTime(runTime.minutes, runTime.seconds, runTime.hundredths);
      
      if (!timeValidation.isValid) {
        toast({
          title: 'Invalid Time',
          description: timeValidation.error || 'Please enter a valid time',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    
    // Save exercise result if time was recorded for run exercise
    if (isRun && timeValidation.isValid && user?.id && (runTime.minutes > 0 || runTime.seconds > 0 || runTime.hundredths > 0)) {
      try {
        await api.exerciseResults.save({
          athleteId: user.id,
          workoutId: workout.id,
          exerciseIndex: exerciseIdx,
          exerciseName: currentExercise.name,
          timeMinutes: runTime.minutes,
          timeSeconds: runTime.seconds,
          timeHundredths: runTime.hundredths,
          notes: `Workout timer: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
        });
        
        toast({
          title: 'Time Recorded!',
          description: `Your time of ${runTime.minutes.toString().padStart(2, '0')}:${runTime.seconds.toString().padStart(2, '0')}.${runTime.hundredths.toString().padStart(2, '0')} has been saved.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error saving exercise result:', error);
        toast({
          title: 'Error Saving Time',
          description: 'Your time could not be saved, but exercise completion was recorded.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
    
    // Check if there are more exercises
    if (exerciseIdx + 1 < totalExercises) {
      // Reset run time for next exercise
      setRunTime({ minutes: 0, seconds: 0, hundredths: 0 });
      onNextExercise();
      return;
    }
    
    // Workout completed
    onFinishWorkout();
  };

  const handleVideoClick = () => {
    if (workout && workout.exercises[exerciseIdx]) {
      const exerciseName = workout.exercises[exerciseIdx].name;
      const videoUrl = getVideoUrl(exerciseName);
      onShowVideo(exerciseName, videoUrl);
    }
  };

  if (!workout || !workout.exercises[exerciseIdx]) {
    return null;
  }

  const currentExercise = workout.exercises[exerciseIdx];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', md: 'md' }} motionPreset="none">
      <ModalOverlay 
        bg={{ base: 'blackAlpha.700', md: 'blackAlpha.600' }}
        backdropFilter={{ base: 'none', md: 'blur(10px)' }}
      />
      <ModalContent 
        borderRadius={{ base: '0', md: '2xl' }}
        overflow="hidden"
        boxShadow={{ base: 'none', md: '2xl' }}
        bg={cardBg}
        mx={{ base: 0, md: 4 }}
        w={{ base: '100vw', md: undefined }}
        h={{ base: '100vh', md: undefined }}
        maxW={{ base: '100vw', md: undefined }}
        maxH={{ base: '100vh', md: undefined }}
        p={0}
      >
        {/* Hero Header with Gradient */}
        <Box 
          h="120px" 
          bg={running 
            ? "linear-gradient(135deg, #38A169 0%, #68D391 50%, #4FD1C7 100%)" 
            : "linear-gradient(135deg, #4299E1 0%, #90CDF4 50%, #A78BFA 100%)"
          } 
          position="relative"
          overflow="hidden"
        >
          {/* Animated background pattern */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            opacity="0.1"
            bgImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)"
            bgSize="20px 20px"
          />
          
          {/* Exercise Title and Subtitle in Header */}
          <VStack 
            position="absolute" 
            top="50%" 
            left="50%" 
            transform="translate(-50%, -50%)"
            spacing={1}
            zIndex="2"
          >
            <Heading 
              size="lg" 
              textAlign="center"
              color="white"
              lineHeight="shorter"
              fontWeight="bold"
            >
              {currentExercise.name}
            </Heading>
            <Text 
              fontSize="sm" 
              fontWeight="medium" 
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
              opacity="0.9"
            >
              Exercise Execution
            </Text>
          </VStack>
          
          {/* Progress Bar */}
          <Box position="absolute" bottom="0" left="0" right="0">
            <Progress 
              value={((exerciseIdx + 1) / workout.exercises.length) * 100} 
              size="sm" 
              height="8px"
              colorScheme={running ? "green" : "blue"} 
              backgroundColor="rgba(255,255,255,0.2)"
              borderRadius="0"
            />
          </Box>
          
          {/* Close Button */}
          <IconButton
            aria-label="Close"
            icon={<Box as="span" fontSize="24px" color="white">×</Box>}
            position="absolute"
            top={4}
            right={4}
            variant="ghost"
            colorScheme="whiteAlpha"
            size="lg"
            onClick={onClose}
            _hover={{ bg: 'whiteAlpha.200' }}
            zIndex="3"
          />
        </Box>

        {/* Modal Body */}
        <ModalBody p={8}>
          <VStack spacing={6} align="center">
            {/* Exercise Details Card - 3 columns including Exercise progress */}
            <Box 
              bg={modalHeaderBg} 
              borderRadius="xl" 
              p={6} 
              w="100%"
              border="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack spacing={6} justify="center">
                <VStack spacing={1}>
                  <Text 
                    color={modalTextColor} 
                    fontSize="sm"
                    fontWeight="medium"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Sets
                  </Text>
                  <Text 
                    fontWeight="bold" 
                    fontSize="2xl"
                    color={modalHeadingColor}
                  >
                    {currentExercise.sets}
                  </Text>
                </VStack>
                
                <Divider orientation="vertical" h="50px" />
                
                <VStack spacing={1}>
                  <Text 
                    color={modalTextColor} 
                    fontSize="sm"
                    fontWeight="medium"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Reps
                  </Text>
                  <Text 
                    fontWeight="bold" 
                    fontSize="2xl"
                    color={modalHeadingColor}
                  >
                    {currentExercise.reps}
                  </Text>
                </VStack>
                
                <Divider orientation="vertical" h="50px" />
                
                <VStack spacing={1}>
                  <Text 
                    color={modalTextColor} 
                    fontSize="sm"
                    fontWeight="medium"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Exercise
                  </Text>
                  <Text 
                    fontWeight="bold" 
                    fontSize="2xl"
                    color={modalHeadingColor}
                  >
                    {exerciseIdx + 1}/{workout.exercises.length}
                  </Text>
                </VStack>
                
                {currentExercise.weight && (
                  <>
                    <Divider orientation="vertical" h="50px" />
                    <VStack spacing={1}>
                      <Text 
                        color={modalTextColor} 
                        fontSize="sm"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Weight
                      </Text>
                      <Text 
                        fontWeight="bold" 
                        fontSize="2xl"
                        color={modalHeadingColor}
                      >
                        {currentExercise.weight}
                        <Text as="span" fontSize="lg" color={modalSpanColor}>
                          kg
                        </Text>
                      </Text>
                    </VStack>
                  </>
                )}
              </HStack>
            </Box>

            {/* Timer Display */}
            <VStack spacing={1} w="100%">
              <Text 
                color={modalTextColor} 
                fontSize="sm"
                fontWeight="medium"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Timer
              </Text>
              <Box 
                bg={modalHeaderBg} 
                borderRadius="xl" 
                p={6}
                border="1px solid"
                borderColor={modalHeaderBorderColor}
                w="100%"
              >
                <Text 
                  fontSize="4xl" 
                  fontWeight="bold" 
                  color={modalHeadingColor}
                  textAlign="center"
                  fontFamily="mono"
                >
                  {Math.floor(timer / 60).toString().padStart(2, '0')}:
                  {(timer % 60).toString().padStart(2, '0')}
                </Text>
              </Box>
            </VStack>

            {/* Run Time Input - Only show for run exercises */}
            {isRunExercise(currentExercise.name) && (
              <RunTimeInput
                onTimeChange={(minutes, seconds, hundredths) => {
                  setRunTime({ minutes, seconds, hundredths });
                }}
                initialMinutes={runTime.minutes}
                initialSeconds={runTime.seconds}
                initialHundredths={runTime.hundredths}
                placeholder={`${currentExercise.name} - Record Time`}
              />
            )}

            {/* Action Buttons */}
            <VStack spacing={4} width="100%">
              <HStack spacing={3} width="100%" justify="center">
                {running ? (
                  <Button 
                    colorScheme="yellow" 
                    size="lg"
                    leftIcon={<Icon as={FaRegClock} />} 
                    onClick={() => onUpdateRunning(false)}
                    borderRadius="xl"
                    px={8}
                    py={6}
                    fontWeight="semibold"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                  >
                    Pause
                  </Button>
                ) : (
                  <Button 
                    colorScheme="blue" 
                    size="lg"
                    leftIcon={<Icon as={FaRunning} />} 
                    onClick={() => onUpdateRunning(true)}
                    borderRadius="xl"
                    px={8}
                    py={6}
                    fontWeight="semibold"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                  >
                    Start
                  </Button>
                )}
                
                <Button 
                  colorScheme="green" 
                  size="lg"
                  leftIcon={<Icon as={CheckIcon} />} 
                  onClick={handleDone}
                  borderRadius="xl"
                  px={8}
                  py={6}
                  fontWeight="semibold"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                  transition="all 0.2s"
                >
                  {exerciseIdx + 1 < workout.exercises.length ? 'Next' : 'Finish'}
                </Button>
              </HStack>
              
              <Button 
                colorScheme="purple" 
                variant="outline"
                size="md"
                leftIcon={<Icon as={FaPlayCircle} />} 
                onClick={handleVideoClick}
                borderRadius="xl"
                px={6}
                fontWeight="medium"
                _hover={{ bg: 'purple.50', transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Watch Tutorial
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 