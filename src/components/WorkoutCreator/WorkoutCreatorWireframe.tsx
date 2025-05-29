import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';

// Import step components
import Step1WorkoutDetails from './Step1WorkoutDetails';
import Step2ExercisePlanning from './Step2ExercisePlanning';
import Step3AthleteAssignment from './Step3AthleteAssignment';
import Step4ReviewSave from './Step4ReviewSave';

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
  notes?: string;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

const WorkoutCreatorWireframe: React.FC = () => {
  // Theme-aware colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const statsBg = useColorModeValue('gray.50', 'gray.700');
  const progressBg = useColorModeValue('white', 'gray.800');
  const stepHeaderTitleColor = useColorModeValue('blue.700', 'blue.300');
  const stepHeaderDescColor = useColorModeValue('blue.600', 'blue.400');
  const dayButtonHoverBg = useColorModeValue('blue.50', 'blue.900');
  const progressStepCurrentColor = useColorModeValue('blue.600', 'blue.300');
  const progressStepCompletedColor = useColorModeValue('green.600', 'green.300');
  const progressStepInactiveColor = useColorModeValue('gray.500', 'gray.300');
  const progressStepArrowColor = useColorModeValue('gray.400', 'gray.400');

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Check if sidebar is currently collapsed by looking at the DOM element
    const sidebarElement = document.querySelector('[style*="width: 70px"]') || 
                           document.querySelector('aside') || 
                           document.querySelector('[role="navigation"]');
    
    if (sidebarElement) {
      const computedStyle = window.getComputedStyle(sidebarElement);
      const currentWidth = parseInt(computedStyle.width);
      return currentWidth <= 70 ? 70 : 200;
    }
    
    // Fallback: check localStorage for sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  
  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.width);
      // Also save to localStorage for persistence
      localStorage.setItem('sidebarCollapsed', event.detail.isCollapsed.toString());
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 state
  const [workoutName, setWorkoutName] = useState('My New Workout');
  const [templateType, setTemplateType] = useState<'single' | 'weekly'>('weekly');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  
  // Step 2 state
  const [selectedExercises, setSelectedExercises] = useState<Record<string, SelectedExercise[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentDay, setCurrentDay] = useState('monday');
  const [restDays, setRestDays] = useState<Record<string, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
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
      <Card variant="outline" shadow="none" mb={2} mt="80px" mx={8} mr={12} bg={cardBg} borderColor={borderColor}>
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
            onClick={() => alert('Workout saved!')}
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
    switch (currentStep) {
      case 1:
        return (
          <Step1WorkoutDetails
            workoutName={workoutName}
            setWorkoutName={setWorkoutName}
            templateType={templateType}
            setTemplateType={setTemplateType}
            workoutType={workoutType}
            setWorkoutType={setWorkoutType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            location={location}
            setLocation={setLocation}
          />
        );
      case 2:
        return (
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
          />
        );
      case 3:
        return (
          <Step3AthleteAssignment
            athletes={MOCK_ATHLETES}
            selectedAthletes={selectedAthletes}
            onAthleteSelection={handleAthleteSelection}
            onClearAllAthletes={handleClearAllAthletes}
            searchTerm={athleteSearchTerm}
            setSearchTerm={setAthleteSearchTerm}
          />
        );
      case 4:
        return (
          <Step4ReviewSave
            workoutName={workoutName}
            workoutType={workoutType}
            templateType={templateType}
            selectedExercises={templateType === 'single' ? selectedExercises['monday'] || [] : undefined}
            weeklyPlan={templateType === 'weekly' ? Object.entries(selectedExercises).map(([day, exercises]) => ({
              day,
              exercises,
              isRestDay: false // TODO: Connect this to actual rest day state per day
            })) : undefined}
            selectedAthletes={selectedAthletes}
            warnings={getWarnings()}
            onGoToStep={goToStep}
            startDate={startDate}
            endDate={endDate}
            location={location}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box w="100%" position="relative" bg={bgColor} minH="100vh">
      {renderStepHeader()}
      
      {/* Step Content - with bottom padding to account for fixed bottom nav */}
      <Box position="relative" w="100%" pb="220px" pl={8} pr={12} bg={bgColor} height={`calc(100vh - 290px)`} overflow="hidden">
        {renderCurrentStep()}
      </Box>

      {renderStepNavigation()}
    </Box>
  );
};

export default WorkoutCreatorWireframe; 