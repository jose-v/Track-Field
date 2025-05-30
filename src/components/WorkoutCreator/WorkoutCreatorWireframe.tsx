import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  Progress,
  IconButton,
  Badge,
  Checkbox,
  Select,
  useColorModeValue,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { api, type EnhancedWorkoutData } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Lazy load step components to improve initial load time
const Step1WorkoutDetails = lazy(() => import('./Step1WorkoutDetails').then(module => ({ default: module.default })));
const Step2ExercisePlanning = lazy(() => import('./Step2ExercisePlanning').then(module => ({ default: module.default })));
const Step3AthleteAssignment = lazy(() => import('./Step3AthleteAssignment').then(module => ({ default: module.default })));
const Step4ReviewSave = lazy(() => import('./Step4ReviewSave').then(module => ({ default: module.default })));

// Mock data
const MOCK_EXERCISES = [
  { id: 'ex1', name: 'Barbell Squats', category: 'Lift', description: 'Compound lower body exercise targeting quads, glutes, and hamstrings.' },
  { id: 'ex2', name: 'Push-ups', category: 'Bodyweight', description: 'Upper body exercise targeting chest, shoulders, and triceps.' },
  { id: 'ex3', name: 'Running Sprints (100m)', category: 'Run Interval', description: 'High-intensity short distance running.' },
  { id: 'ex4', name: 'Plank', category: 'Core', description: 'Isometric core strength exercise.' },
  { id: 'ex5', name: 'Box Jumps', category: 'Plyometric', description: 'Explosive jump onto a raised platform.' },
];

const MOCK_ATHLETES = [
  { id: 'ath1', name: 'Sarah Johnson', event: 'Sprint', avatar: 'https://bit.ly/sage-adebayo' },
  { id: 'ath2', name: 'Mike Chen', event: 'Distance', avatar: 'https://bit.ly/kent-c-dodds' },
  { id: 'ath3', name: 'Emma Davis', event: 'Hurdles', avatar: 'https://bit.ly/ryan-florence' },
  { id: 'ath4', name: 'James Wilson', event: 'Jumps', avatar: 'https://bit.ly/prosper-baba' },
  { id: 'ath5', name: 'Lisa Brown', event: 'Throws', avatar: 'https://bit.ly/code-beast' },
];

const WORKOUT_CREATION_STEPS = [
  { 
    id: 1, 
    title: 'Workout Details', 
    shortTitle: 'Details',
    description: 'Name, type, and template settings'
  },
  { 
    id: 2, 
    title: 'Exercise Planning', 
    shortTitle: 'Exercises',
    description: 'Select exercises and plan workouts'
  },
  { 
    id: 3, 
    title: 'Athlete Assignment', 
    shortTitle: 'Athletes',
    description: 'Assign workout to team members'
  },
  { 
    id: 4, 
    title: 'Review & Save', 
    shortTitle: 'Review',
    description: 'Review and finalize workout'
  }
];

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface SelectedExercise extends Exercise {
  instanceId: string;
  sets?: string;
  reps?: string;
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
  notes?: string;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

const WorkoutCreatorWireframe: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  // Theme-aware colors - moved to useMemo for performance
  const themeColors = React.useMemo(() => ({
    bgColor: useColorModeValue('white', 'gray.800'),
    cardBg: useColorModeValue('white', 'gray.700'),
    borderColor: useColorModeValue('gray.200', 'gray.600'),
    textColor: useColorModeValue('gray.700', 'gray.100'),
    subtitleColor: useColorModeValue('gray.600', 'gray.300'),
    statsBg: useColorModeValue('gray.50', 'gray.700'),
    progressBg: useColorModeValue('white', 'gray.800'),
    stepHeaderTitleColor: useColorModeValue('blue.700', 'blue.300'),
    stepHeaderDescColor: useColorModeValue('blue.600', 'blue.400'),
    dayButtonHoverBg: useColorModeValue('blue.50', 'blue.900'),
    progressStepCurrentColor: useColorModeValue('blue.600', 'blue.300'),
    progressStepCompletedColor: useColorModeValue('green.600', 'green.300'),
    progressStepInactiveColor: useColorModeValue('gray.500', 'gray.300'),
    progressStepArrowColor: useColorModeValue('gray.400', 'gray.400'),
  }), []);

  const {
    bgColor, cardBg, borderColor, textColor, subtitleColor, statsBg, progressBg,
    stepHeaderTitleColor, stepHeaderDescColor, dayButtonHoverBg,
    progressStepCurrentColor, progressStepCompletedColor, progressStepInactiveColor,
    progressStepArrowColor
  } = themeColors;

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Always check localStorage first for the saved state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  
  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.width);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 state - aligned with database schema
  const [workoutName, setWorkoutName] = useState('');
  const [templateType, setTemplateType] = useState<'single' | 'weekly'>('weekly');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [date, setDate] = useState(''); // Use single date field as per schema
  const [time, setTime] = useState(''); // Use single time field as per schema  
  const [duration, setDuration] = useState(''); // Add duration field
  const [location, setLocation] = useState('');
  
  // Lazy initialize complex state objects
  const [selectedExercises, setSelectedExercises] = useState<Record<string, SelectedExercise[]>>(() => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  }));
  
  // Step 2 state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentDay, setCurrentDay] = useState('monday');
  
  const [restDays, setRestDays] = useState<Record<string, boolean>>(() => ({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  }));
  
  const [copyFromDay, setCopyFromDay] = useState('');
  const [copyToDay, setCopyToDay] = useState('');
  
  // Step 3 state
  const [selectedAthletes, setSelectedAthletes] = useState<Record<string, Athlete>>({});
  const [athleteSearchTerm, setAthleteSearchTerm] = useState('');
  
  // Custom exercises state
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  
  // Navigation functions
  const goToStep = (step: number) => {
    if (step >= 1 && step <= WORKOUT_CREATION_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const goToNextStep = () => {
    if (currentStep < WORKOUT_CREATION_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Exercise functions
  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      ...exercise,
      instanceId: `${exercise.id}-${Date.now()}-${Math.random()}`,
      sets: '3',
      reps: '10',
      weight: '',
      distance: '',
      rest: '',
      rpe: '',
      notes: '',
    };
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: [...(prev[currentDay] || []), newExercise]
    }));
  };

  const handleRemoveExercise = (instanceId: string) => {
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: prev[currentDay].filter(ex => ex.instanceId !== instanceId)
    }));
  };

  const handleUpdateExercise = (instanceId: string, field: string, value: string) => {
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: prev[currentDay].map(ex => 
        ex.instanceId === instanceId ? { ...ex, [field]: value } : ex
      )
    }));
  };

  // Handle weekly plan updates for drag and drop
  const handleUpdateWeeklyPlan = (newWeeklyPlan: Array<{day: string, exercises: SelectedExercise[], isRestDay: boolean}>) => {
    const updatedExercises: Record<string, SelectedExercise[]> = {};
    
    newWeeklyPlan.forEach(dayData => {
      updatedExercises[dayData.day] = dayData.exercises;
    });
    
    setSelectedExercises(prev => ({
      ...prev,
      ...updatedExercises
    }));
  };

  // Handle rest day toggle
  const handleToggleRestDay = (day: string, isRest: boolean) => {
    setRestDays(prev => ({
      ...prev,
      [day]: isRest
    }));
  };

  // Handle copy exercises from one day to another
  const handleCopyExercises = (fromDay: string, toDay: string) => {
    const exercisesToCopy = selectedExercises[fromDay] || [];
    if (exercisesToCopy.length === 0) return;

    // Create copies with new instance IDs
    const copiedExercises = exercisesToCopy.map(exercise => ({
      ...exercise,
      instanceId: `${exercise.id}-${Date.now()}-${Math.random()}`
    }));

    setSelectedExercises(prev => ({
      ...prev,
      [toDay]: [...(prev[toDay] || []), ...copiedExercises]
    }));
  };

  // Athlete functions
  const handleAthleteSelection = (athlete: Athlete) => {
    setSelectedAthletes(prev => {
      const newSelected = { ...prev };
      if (newSelected[athlete.id]) {
        delete newSelected[athlete.id];
      } else {
        newSelected[athlete.id] = athlete;
      }
      return newSelected;
    });
  };

  const handleClearAllAthletes = () => {
    setSelectedAthletes({});
  };

  // Custom exercise functions
  const handleAddCustomExercise = (exerciseData: Omit<Exercise, 'id'>) => {
    const newExercise: Exercise = {
      ...exerciseData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setCustomExercises(prev => [...prev, newExercise]);
  };

  // Get warnings for review step
  const getWarnings = () => {
    const warnings: string[] = [];
    
    if (Object.values(selectedExercises).flat().length === 0) {
      warnings.push('No exercises added to workout');
    }
    
    if (Object.keys(selectedAthletes).length === 0) {
      warnings.push('No athletes assigned to this workout');
    }
    
    return warnings;
  };

  const currentStepInfo = WORKOUT_CREATION_STEPS[currentStep - 1];
  const progressPercentage = (currentStep / WORKOUT_CREATION_STEPS.length) * 100;

  // Handle saving workout to database
  const handleSaveWorkout = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save workouts.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!workoutName.trim()) {
      toast({
        title: 'Workout Name Required',
        description: 'Please enter a name for your workout.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Date Required',
        description: 'Please select a date for your workout.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const workoutData: EnhancedWorkoutData = {
        name: workoutName,
        type: workoutType,
        template_type: templateType,
        date: date,
        time: time,
        duration: duration,
        location: location,
        description: `${templateType === 'weekly' ? 'Weekly training plan' : 'Single day workout'} created with Workout Creator`,
        exercises: templateType === 'single' ? (selectedExercises.monday || []) : [],
        weekly_plan: templateType === 'weekly' ? Object.keys(selectedExercises).map(day => ({
          day,
          exercises: selectedExercises[day] || [],
          isRestDay: restDays[day] || false
        })) : undefined
      };

      console.log('Saving workout:', workoutData);
      
      const savedWorkout = await api.workouts.createEnhanced(workoutData);
      
      // Assign to selected athletes if any
      const athleteIds = Object.keys(selectedAthletes);
      if (athleteIds.length > 0 && savedWorkout.id) {
        await api.athleteWorkouts.assign(savedWorkout.id, athleteIds);
      }

      toast({
        title: 'Workout Saved Successfully!',
        description: `"${workoutName}" has been created and ${athleteIds.length > 0 ? `assigned to ${athleteIds.length} athlete(s)` : 'is ready to be assigned'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form for new workout
      setWorkoutName('');
      setDate('');
      setTime('');
      setDuration('');
      setLocation('');
      setSelectedExercises({
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      });
      setSelectedAthletes({});
      setRestDays({
        monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false
      });
      setCurrentStep(1);

    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save workout. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderStepHeader = () => (
    <VStack spacing={0} align="stretch" mb={3}>
      {/* Progress Bar - Fixed under top navigation */}
      <Box 
        position="fixed"
        top="65px"
        left={`${sidebarWidth}px`}
        right="0"
        zIndex="998"
        bg={progressBg}
        borderBottom="1px solid"
        borderBottomColor={borderColor}
        data-testid="workout-creator-progress"
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Progress 
          value={progressPercentage} 
          colorScheme="blue" 
          size="md" 
          borderRadius="0"
          height="8px"
        />
        
        {/* Step Labels */}
        <Box px={8} py={2}>
          <HStack justify="space-between" spacing={2}>
            {WORKOUT_CREATION_STEPS.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isAccessible = step.id <= currentStep;
              
              return (
                <Button
                  key={step.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => isAccessible && goToStep(step.id)}
                  isDisabled={!isAccessible}
                  color={isCurrent ? progressStepCurrentColor : isCompleted ? progressStepCompletedColor : progressStepInactiveColor}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  _hover={isAccessible ? { bg: useColorModeValue('gray.100', 'gray.600') } : {}}
                  cursor={isAccessible ? 'pointer' : 'default'}
                  flex="1"
                  minW="0"
                >
                  <HStack spacing={1} minW="0">
                    <Text fontSize="xs">{step.id}</Text>
                    <Text fontSize="xs" isTruncated>{step.shortTitle}</Text>
                    {isCompleted && <Text fontSize="xs" color={progressStepCompletedColor}>✓</Text>}
                    {index < WORKOUT_CREATION_STEPS.length - 1 && (
                      <Text fontSize="xs" color={progressStepArrowColor}>→</Text>
                    )}
                  </HStack>
                </Button>
              );
            })}
          </HStack>
        </Box>
      </Box>

      {/* Step Header Card - with top margin to account for fixed progress bar */}
      <Card variant="outline" shadow="none" mb={2} mt="80px" mx={6} bg={cardBg} borderColor={borderColor}>
        <CardBody p={4}>
          <VStack spacing={4} align="stretch" w="100%">
            <HStack justify="space-between" align="center" w="100%">
              <HStack spacing={4}>
                <IconButton
                  icon={<ArrowLeft size={18} />}
                  variant="ghost"
                  aria-label="Back to list"
                  onClick={() => alert('Go back to workout list')}
                  color={textColor}
                  _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                />
                <VStack align="start" spacing={1}>
                  <Heading size="md" color={stepHeaderTitleColor}>
                    {currentStepInfo.title}
                  </Heading>
                  <Text fontSize="sm" color={stepHeaderDescColor}>
                    {currentStepInfo.description}
                  </Text>
                </VStack>
              </HStack>
              
              {/* Center spacer to maintain layout consistency */}
              <Box flex="1" />
              
              {/* Workout Stats */}
              <HStack spacing={8} justify="center" p={4} bg={statsBg} borderRadius="md">
                <VStack spacing={0} align="center">
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {Object.values(selectedExercises).flat().length}
                  </Text>
                  <Text fontSize="xs" color={subtitleColor}>
                    Total Exercises
                  </Text>
                </VStack>
                <VStack spacing={0} align="center">
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {Object.values(selectedExercises).flat().reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)}
                  </Text>
                  <Text fontSize="xs" color={subtitleColor}>
                    Total Sets
                  </Text>
                </VStack>
                <VStack spacing={0} align="center">
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    ~{Object.values(selectedExercises).flat().length * 3}
                  </Text>
                  <Text fontSize="xs" color={subtitleColor}>
                    Minutes
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderStepNavigation = () => (
    <Box 
      position="fixed" 
      bottom="0" 
      left={`${sidebarWidth}px`}
      right="0"
      bg={bgColor} 
      borderTop="2px solid" 
      borderTopColor={borderColor} 
      p={6} 
      px={6}
      zIndex="999"
      transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <HStack justify="space-between" align="center" maxW="100%" mx="auto">
        <Button
          leftIcon={<ChevronLeft size={20} />}
          variant="outline"
          size="lg"
          onClick={goToPreviousStep}
          isDisabled={currentStep === 1}
          borderWidth="2px"
          borderColor={borderColor}
          color={textColor}
          _hover={{ bg: useColorModeValue("gray.50", "gray.700"), borderColor: useColorModeValue("gray.400", "gray.500") }}
        >
          Previous
        </Button>
        
        {/* Progress Dots */}
        <HStack spacing={4}>
          {WORKOUT_CREATION_STEPS.map((step) => (
            <VStack key={step.id} spacing={1} align="center">
              <Box
                w={6}
                h={6}
                borderRadius="full"
                bg={step.id === currentStep ? 'blue.500' : step.id < currentStep ? 'green.500' : useColorModeValue('gray.300', 'gray.600')}
                cursor="pointer"
                onClick={() => step.id <= currentStep && goToStep(step.id)}
                transition="all 0.3s"
                _hover={{ transform: step.id <= currentStep ? 'scale(1.2)' : 'none' }}
                border="2px solid"
                borderColor={useColorModeValue('white', 'gray.800')}
                position="relative"
              >
                {step.id < currentStep && (
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    ✓
                  </Text>
                )}
                {step.id === currentStep && (
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {step.id}
                  </Text>
                )}
              </Box>
              <Text 
                fontSize="xs" 
                color={step.id === currentStep ? 'blue.600' : step.id < currentStep ? 'green.600' : subtitleColor}
                fontWeight={step.id === currentStep ? 'bold' : 'medium'}
                textAlign="center"
                maxW="60px"
                lineHeight="tight"
              >
                {step.shortTitle}
              </Text>
            </VStack>
          ))}
        </HStack>

        {currentStep < WORKOUT_CREATION_STEPS.length ? (
          <Button
            rightIcon={<ChevronRight size={20} />}
            colorScheme="blue"
            size="lg"
            onClick={goToNextStep}
            borderWidth="2px"
            _hover={{ 
              transform: "scale(1.05)"
            }}
            transition="all 0.2s"
            fontWeight="bold"
            px={8}
          >
            Continue
          </Button>
        ) : (
          <Button
            rightIcon={<Save size={20} />}
            colorScheme="green"
            size="lg"
            onClick={handleSaveWorkout}
            borderWidth="2px"
            _hover={{ 
              transform: "scale(1.05)"
            }}
            transition="all 0.2s"
            fontWeight="bold"
            px={8}
          >
            Save Workout
          </Button>
        )}
      </HStack>
    </Box>
  );

  const renderCurrentStep = () => {
    const LoadingFallback = () => (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={textColor}>Loading step content...</Text>
        </VStack>
      </Center>
    );

    switch (currentStep) {
      case 1:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step1WorkoutDetails
              workoutName={workoutName}
              setWorkoutName={setWorkoutName}
              templateType={templateType}
              setTemplateType={setTemplateType}
              workoutType={workoutType}
              setWorkoutType={setWorkoutType}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              duration={duration}
              setDuration={setDuration}
              location={location}
              setLocation={setLocation}
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step2ExercisePlanning
              exercises={MOCK_EXERCISES}
              selectedExercises={selectedExercises[currentDay] || []}
              onAddExercise={handleAddExercise}
              onRemoveExercise={handleRemoveExercise}
              onUpdateExercise={handleUpdateExercise}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              currentDay={currentDay}
              setCurrentDay={setCurrentDay}
              templateType={templateType}
              isRestDay={restDays[currentDay]}
              customExercises={customExercises}
              onAddCustomExercise={handleAddCustomExercise}
              onToggleRestDay={handleToggleRestDay}
              onCopyExercises={handleCopyExercises}
            />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step3AthleteAssignment
              athletes={MOCK_ATHLETES}
              selectedAthletes={selectedAthletes}
              onAthleteSelection={handleAthleteSelection}
              onClearAllAthletes={handleClearAllAthletes}
              searchTerm={athleteSearchTerm}
              setSearchTerm={setAthleteSearchTerm}
            />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step4ReviewSave
              workoutName={workoutName}
              templateType={templateType}
              workoutType={workoutType}
              selectedExercises={selectedExercises}
              selectedAthletes={selectedAthletes}
              customExercises={customExercises}
              restDays={restDays}
              warnings={getWarnings()}
              onGoToStep={(step: number) => goToStep(step)}
              location={location}
            />
          </Suspense>
        );
      default:
        return <Box>Unknown step</Box>;
    }
  };

  return (
    <Box w="100%" position="relative" bg={bgColor} minH="100vh">
      {renderStepHeader()}
      
      {/* Step Content - with bottom padding to account for fixed bottom nav */}
      <Box position="relative" w="100%" pb="220px" px={6} bg={bgColor} overflow="auto">
        {renderCurrentStep()}
      </Box>

      {renderStepNavigation()}
    </Box>
  );
};

export default WorkoutCreatorWireframe; 