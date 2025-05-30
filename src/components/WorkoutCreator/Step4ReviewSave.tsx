import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  AvatarGroup,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  ButtonGroup,
  Tooltip,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Eye, MapPin, Calendar, Copy, Move, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface DayWorkout {
  day: string;
  exercises: SelectedExercise[];
  isRestDay: boolean;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

interface Step4ReviewSaveProps {
  workoutName: string;
  workoutType: string;
  templateType: 'single' | 'weekly';
  selectedExercises?: SelectedExercise[];
  weeklyPlan?: DayWorkout[];
  selectedAthletes: Record<string, Athlete>;
  warnings: string[];
  onGoToStep: (step: number) => void;
  onUpdateWeeklyPlan?: (weeklyPlan: DayWorkout[]) => void;
  startDate?: string;
  endDate?: string;
  location?: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

// Draggable Exercise Component
interface DraggableExerciseProps {
  exercise: SelectedExercise;
  index: number;
  day: string;
  onCopy: (exercise: SelectedExercise, fromDay: string) => void;
  onEdit: (exercise: SelectedExercise) => void;
}

const DraggableExercise: React.FC<DraggableExerciseProps> = ({ 
  exercise, 
  index, 
  day, 
  onCopy,
  onEdit 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `${day}-${exercise.instanceId}`,
    data: {
      type: 'exercise',
      exercise,
      day,
      index
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.600');
  const noExercisesColor = useColorModeValue('gray.500', 'gray.300');

  const sets = parseInt(exercise.sets || '0') || 0;
  const reps = parseInt(exercise.reps || '0') || 0;
  const weight = parseFloat(exercise.weight || '0') || 0;
  const distance = parseFloat(exercise.distance || '0') || 0;
  const rest = parseInt(exercise.rest || '0') || 0;
  const rpe = parseInt(exercise.rpe || '0') || 0;
  
  const volume = sets * reps;
  const totalLoad = weight > 0 ? volume * weight : 0;
  const restMinutes = Math.floor(rest / 60);
  const restSeconds = rest % 60;
  const restFormatted = rest > 0 ? (restMinutes > 0 ? `${restMinutes}:${restSeconds.toString().padStart(2, '0')}` : `${rest}s`) : '';
  
  const completedFields = [
    exercise.sets,
    exercise.reps,
    exercise.weight,
    exercise.distance,
    exercise.rest,
    exercise.rpe
  ].filter(field => field && field.trim() !== '').length;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      p={4}
      bg={exerciseCardBg}
      borderRadius="md"
      borderLeft="4px solid"
      borderLeftColor="blue.400"
      border={isDragging ? "2px dashed" : "1px solid"}
      borderColor={isDragging ? "blue.400" : borderColor}
      position="relative"
      _hover={{
        boxShadow: 'md',
        borderColor: 'blue.300'
      }}
    >
      <VStack spacing={3} align="stretch">
        {/* Exercise Header with Drag Handle */}
        <HStack justify="space-between" align="start">
          <HStack spacing={2} flex={1}>
            <Box
              {...attributes}
              {...listeners}
              cursor="grab"
              p={2}
              borderRadius="md"
              bg={useColorModeValue('gray.200', 'gray.600')}
              _hover={{ bg: useColorModeValue('gray.300', 'gray.500') }}
              _active={{ cursor: 'grabbing', bg: useColorModeValue('gray.400', 'gray.400') }}
            >
              <GripVertical size={20} color="white" />
            </Box>
            <VStack align="start" spacing={1} flex={1}>
              <HStack spacing={3}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  {index + 1}. {exercise.name}
                </Text>
                <Badge colorScheme="blue" variant="subtle" size="sm">{exercise.category}</Badge>
              </HStack>
              <Text fontSize="xs" color={subtitleColor} noOfLines={1}>
                {exercise.description}
              </Text>
            </VStack>
          </HStack>
          
          {/* Completion Indicator */}
          <VStack align="end" spacing={1}>
            <HStack spacing={1}>
              {[1,2,3,4,5,6].map(i => (
                <Box
                  key={i}
                  w={1.5}
                  h={1.5}
                  borderRadius="full"
                  bg={i <= completedFields ? "green.400" : "gray.300"}
                />
              ))}
            </HStack>
            <Text fontSize="xs" color={subtitleColor}>
              {completedFields}/6
            </Text>
          </VStack>
        </HStack>
        
        {/* Exercise Parameters */}
        <SimpleGrid columns={{ base: 3, md: 6 }} spacing={3}>
          <VStack align="start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Sets</Text>
            <Text fontSize="sm" fontWeight="medium" color={exercise.sets ? textColor : noExercisesColor}>
              {exercise.sets || '-'}
            </Text>
          </VStack>
          <VStack align="start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Reps</Text>
            <Text fontSize="sm" fontWeight="medium" color={exercise.reps ? textColor : noExercisesColor}>
              {exercise.reps || '-'}
            </Text>
          </VStack>
          <VStack align="start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Weight</Text>
            <Text fontSize="sm" fontWeight="medium" color={exercise.weight ? textColor : noExercisesColor}>
              {exercise.weight ? `${exercise.weight}kg` : '-'}
            </Text>
          </VStack>
          <VStack align="start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Distance</Text>
            <Text fontSize="sm" fontWeight="medium" color={exercise.distance ? textColor : noExercisesColor}>
              {exercise.distance ? `${exercise.distance}m` : '-'}
            </Text>
          </VStack>
          <VStack align="start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Rest</Text>
            <Text fontSize="sm" fontWeight="medium" color={exercise.rest ? textColor : noExercisesColor}>
              {restFormatted || '-'}
            </Text>
          </VStack>
          <VStack align="start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>RPE</Text>
            <Text fontSize="sm" fontWeight="medium" color={exercise.rpe ? textColor : noExercisesColor}>
              {exercise.rpe || '-'}
            </Text>
          </VStack>
        </SimpleGrid>
        
        {/* Calculated Metrics */}
        {(volume > 0 || totalLoad > 0) && (
          <HStack spacing={4} pt={1} fontSize="xs" color={subtitleColor}>
            {volume > 0 && <Text>Volume: {volume} reps</Text>}
            {totalLoad > 0 && <Text>Load: {totalLoad.toLocaleString()} kg</Text>}
          </HStack>
        )}
        
        {/* Coach Notes */}
        {exercise.notes && (
          <Box pt={1}>
            <Text fontSize="xs" color={textColor} fontStyle="italic">
              "{exercise.notes}"
            </Text>
          </Box>
        )}
      </VStack>

      {/* Copy Button - Bottom Right Corner */}
      <IconButton
        position="absolute"
        bottom={2}
        right={2}
        aria-label="Copy exercise"
        icon={<Copy size={16} />}
        size="sm"
        variant="solid"
        colorScheme="blue"
        color="white"
        onClick={() => onCopy(exercise, day)}
        _hover={{ transform: 'scale(1.1)' }}
      />
    </Box>
  );
};

// Copy Exercise Modal Component
interface CopyExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: SelectedExercise | null;
  fromDay: string;
  weeklyPlan: DayWorkout[];
  onCopyExercise: (exercise: SelectedExercise, fromDay: string, toDay: string) => void;
}

const CopyExerciseModal: React.FC<CopyExerciseModalProps> = ({
  isOpen,
  onClose,
  exercise,
  fromDay,
  weeklyPlan,
  onCopyExercise
}) => {
  const textColor = "white";
  const subtitleColor = "whiteAlpha.700";

  const availableDays = weeklyPlan.filter(day => 
    day.day !== fromDay && !day.isRestDay
  );

  const handleCopy = (toDay: string) => {
    if (exercise) {
      onCopyExercise(exercise, fromDay, toDay);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg={useColorModeValue('gray.800', 'gray.800')}>
        <ModalHeader color={textColor}>Copy Exercise</ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody pb={6}>
          {exercise && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color={subtitleColor} mb={2}>
                  Copy "{exercise.name}" to which day?
                </Text>
              </Box>
              
              <VStack spacing={2} align="stretch">
                {availableDays.map(day => {
                  const dayLabel = DAYS_OF_WEEK.find(d => d.value === day.day)?.label || day.day;
                  return (
                    <Button
                      key={day.day}
                      variant="outline"
                      size="lg"
                      onClick={() => handleCopy(day.day)}
                      justifyContent="flex-start"
                      color={textColor}
                      borderColor="whiteAlpha.300"
                      _hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.500" }}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" color={textColor}>{dayLabel}</Text>
                        <Text fontSize="xs" color={subtitleColor}>
                          {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                        </Text>
                      </VStack>
                    </Button>
                  );
                })}
              </VStack>
              
              {availableDays.length === 0 && (
                <Text fontSize="sm" color={subtitleColor} textAlign="center" py={4}>
                  No other training days available to copy to.
                </Text>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Droppable Day Zone Component for empty days
interface DroppableDayZoneProps {
  day: string;
  dayLabel: string;
  isEmpty: boolean;
  isRestDay: boolean;
}

const DroppableDayZone: React.FC<DroppableDayZoneProps> = ({ day, dayLabel, isEmpty, isRestDay }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: day,
    data: {
      type: 'day',
      day: day
    }
  });

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const noExercisesColor = useColorModeValue('gray.500', 'gray.300');
  const dropZoneBg = useColorModeValue('blue.50', 'blue.800');
  const dropZoneBorder = useColorModeValue('blue.300', 'blue.500');

  if (isRestDay) {
    return (
      <Card variant="outline" bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold" color={textColor}>{dayLabel}</Text>
            <Badge colorScheme="gray" variant="solid" size="lg">Rest Day</Badge>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card 
      ref={setNodeRef}
      variant="outline" 
      bg={isOver ? dropZoneBg : cardBg} 
      borderColor={isOver ? dropZoneBorder : borderColor}
      borderWidth={isOver ? "2px" : "1px"}
      borderStyle={isOver ? "dashed" : "solid"}
      transition="all 0.2s"
    >
      <CardBody minH="80px" display="flex" alignItems="center">
        <HStack justify="space-between" align="center" w="100%">
          <Text fontSize="lg" fontWeight="bold" color={textColor}>{dayLabel}</Text>
          {isEmpty ? (
            <Text color={noExercisesColor} fontStyle="italic">
              {isOver ? "Drop exercise here" : "No exercises planned"}
            </Text>
          ) : null}
        </HStack>
      </CardBody>
    </Card>
  );
};

const Step4ReviewSave: React.FC<Step4ReviewSaveProps> = ({
  workoutName,
  workoutType,
  templateType,
  selectedExercises = [],
  weeklyPlan = [],
  selectedAthletes,
  warnings,
  onGoToStep,
  onUpdateWeeklyPlan,
  startDate,
  endDate,
  location,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copyExercise, setCopyExercise] = useState<{exercise: SelectedExercise, fromDay: string} | null>(null);
  const { isOpen: isCopyModalOpen, onOpen: onCopyModalOpen, onClose: onCopyModalClose } = useDisclosure();
  const toast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('blue.100', 'blue.800');
  const statsBg = useColorModeValue('gray.50', 'gray.700');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.600');
  const exerciseMoreBg = useColorModeValue('gray.100', 'gray.500');
  const dayCardBg = useColorModeValue('gray.50', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const noExercisesColor = useColorModeValue('gray.500', 'gray.300');
  const exerciseTextColor = useColorModeValue('gray.600', 'gray.200');
  const estimatedTimeSubtextColor = useColorModeValue('gray.500', 'gray.300');
  const athleteTextColor = useColorModeValue('gray.600', 'gray.200');
  const warningTitleColor = useColorModeValue('orange.800', 'orange.200');
  const warningTextColor = useColorModeValue('orange.700', 'orange.300');
  const warningBg = useColorModeValue('orange.50', 'orange.900');

  const getWorkoutStats = () => {
    if (templateType === 'single') {
      const totalExercises = selectedExercises.length;
      const estimatedTime = totalExercises * 3;
      const totalSets = selectedExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0);
      return { totalExercises, estimatedTime, totalSets };
    } else {
      const trainingDays = weeklyPlan.filter(d => !d.isRestDay).length;
      const totalExercises = weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0);
      const estimatedTime = totalExercises * 3;
      return { trainingDays, totalExercises, estimatedTime };
    }
  };

  const stats = getWorkoutStats();

  // Helper function to format dates with ordinals
  const formatDateWithOrdinal = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      // Get ordinal suffix
      const getOrdinalSuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      
      return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
    } catch {
      return dateString;
    }
  };

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const formattedStart = formatDateWithOrdinal(startDate);
    const formattedEnd = formatDateWithOrdinal(endDate);
    
    if (!startDate) return '';
    if (!endDate || endDate === startDate) return formattedStart;
    
    return `From ${formattedStart} to ${formattedEnd}`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = event.active.id as string;
    setActiveId(draggedId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onUpdateWeeklyPlan) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'exercise') return;

    // Parse IDs to get day and exercise info
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const [activeDay, activeExerciseId] = activeId.split('-');
    
    // Determine target day
    let targetDay: string;
    let targetIndex: number;

    if (overData && overData.type === 'exercise') {
      // Dropping on another exercise
      const [overDay] = overId.split('-');
      targetDay = overDay;
      targetIndex = overData.index;
    } else if (overData && overData.type === 'day') {
      // Dropping on a day container
      targetDay = overData.day;
      const targetDayData = weeklyPlan.find(d => d.day === targetDay);
      targetIndex = targetDayData ? targetDayData.exercises.length : 0;
    } else {
      return;
    }

    // Don't move if dropping on the same position
    if (activeDay === targetDay && activeData.index === targetIndex) {
      return;
    }

    // Create new weekly plan with moved exercise
    const newWeeklyPlan = weeklyPlan.map(day => ({ ...day, exercises: [...day.exercises] }));
    
    // Find source day and exercise
    const sourceDayIndex = newWeeklyPlan.findIndex(d => d.day === activeDay);
    const sourceExercise = newWeeklyPlan[sourceDayIndex].exercises[activeData.index];
    
    // Remove from source
    newWeeklyPlan[sourceDayIndex].exercises.splice(activeData.index, 1);
    
    // Add to target
    const targetDayIndex = newWeeklyPlan.findIndex(d => d.day === targetDay);
    newWeeklyPlan[targetDayIndex].exercises.splice(targetIndex, 0, {
      ...sourceExercise,
      instanceId: `${sourceExercise.instanceId}-${Date.now()}` // Generate new instance ID for move
    });

    onUpdateWeeklyPlan(newWeeklyPlan);
    
    // Show success toast
    const sourceDayLabel = DAYS_OF_WEEK.find(d => d.value === activeDay)?.label || activeDay;
    const targetDayLabel = DAYS_OF_WEEK.find(d => d.value === targetDay)?.label || targetDay;
    
    toast({
      title: "Exercise moved",
      description: `"${sourceExercise.name}" moved from ${sourceDayLabel} to ${targetDayLabel}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCopyExercise = (exercise: SelectedExercise, fromDay: string) => {
    setCopyExercise({ exercise, fromDay });
    onCopyModalOpen();
  };

  const handleCopyToDay = (exercise: SelectedExercise, fromDay: string, toDay: string) => {
    if (!onUpdateWeeklyPlan) return;

    const newWeeklyPlan = weeklyPlan.map(day => ({ ...day, exercises: [...day.exercises] }));
    const targetDayIndex = newWeeklyPlan.findIndex(d => d.day === toDay);
    
    // Create a copy with new instance ID
    const exerciseCopy = {
      ...exercise,
      instanceId: `${exercise.instanceId}-copy-${Date.now()}`
    };
    
    newWeeklyPlan[targetDayIndex].exercises.push(exerciseCopy);
    onUpdateWeeklyPlan(newWeeklyPlan);

    // Show success toast
    const fromDayLabel = DAYS_OF_WEEK.find(d => d.value === fromDay)?.label || fromDay;
    const toDayLabel = DAYS_OF_WEEK.find(d => d.value === toDay)?.label || toDay;
    
    toast({
      title: "Exercise copied",
      description: `"${exercise.name}" copied from ${fromDayLabel} to ${toDayLabel}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleEditExercise = (exercise: SelectedExercise) => {
    // Navigate back to exercise planning step
    onGoToStep(2);
    
    toast({
      title: "Edit mode",
      description: "Switched to exercise planning to edit details",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <VStack spacing={6} align="stretch" w="100%" bg={cardBg} p={6} borderRadius="md">
        {/* Warnings Section */}
        {warnings.length > 0 && (
          <Alert status="warning" borderRadius="md" bg={warningBg}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="md" color={warningTitleColor}>⚠️ Items that need attention:</AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={1} mt={2}>
                  {warnings.map((warning, index) => (
                    <Text key={index} fontSize="sm" color={warningTextColor}>• {warning}</Text>
                  ))}
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Workout Summary - Analytics Card Style */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          p={6}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
        >
          <VStack spacing={5} align="stretch">
            {/* Header Section */}
            <HStack justify="space-between" align="center">
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Workout Summary
              </Text>
              <Badge 
                colorScheme={templateType === 'single' ? 'blue' : 'purple'} 
                variant="solid" 
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="md"
              >
                {templateType === 'single' ? 'Single Day' : 'Weekly Plan'}
              </Badge>
            </HStack>

            {/* Workout Name */}
            <Box>
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                {workoutName}
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {workoutType} Training
              </Text>
            </Box>

            {/* Athletes and Stats Section */}
            {Object.keys(selectedAthletes).length > 0 && (
              <HStack spacing={8} align="start">
                {/* Athletes Section */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                    Assigned Athletes ({Object.keys(selectedAthletes).length})
                  </Text>
                  <SimpleGrid columns={3} spacing={4} maxW="300px">
                    {Object.values(selectedAthletes).slice(0, 5).map((athlete) => (
                      <VStack key={athlete.id} spacing={2} align="center">
                        <Avatar
                          name={athlete.name}
                          src={athlete.avatar}
                          size="md"
                          bg="gray.300"
                        />
                        <Text fontSize="xs" color={textColor} textAlign="center">
                          {athlete.name.split(' ')[0]}
                        </Text>
                      </VStack>
                    ))}
                    {Object.values(selectedAthletes).length > 5 && (
                      <VStack spacing={2} align="center">
                        <Box
                          w="48px"
                          h="48px"
                          borderRadius="full"
                          bg={useColorModeValue('gray.100', 'gray.600')}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          _hover={{ bg: useColorModeValue('gray.200', 'gray.500') }}
                        >
                          <Text fontSize="xs" color={textColor} fontWeight="medium">
                            View All
                          </Text>
                        </Box>
                        <Text fontSize="xs" color={textColor}>
                          +{Object.values(selectedAthletes).length - 5}
                        </Text>
                      </VStack>
                    )}
                  </SimpleGrid>
                </Box>

                {/* Key Metrics Row */}
                <HStack spacing={8} flex={1} justify="space-around">
                  <VStack spacing={1} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                      {templateType === 'single' ? stats.totalExercises : stats.trainingDays}
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      {templateType === 'single' ? 'Exercises' : 'Training Days'}
                    </Text>
                  </VStack>

                  <VStack spacing={1} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                      {templateType === 'single' ? stats.totalSets : stats.totalExercises}
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      {templateType === 'single' ? 'Sets' : 'Exercises'}
                    </Text>
                  </VStack>

                  <VStack spacing={1} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                      ~{stats.estimatedTime} min
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Duration
                    </Text>
                  </VStack>

                  <VStack spacing={1} align="center">
                    <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                      {Object.keys(selectedAthletes).length}
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Athletes
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            )}

            {/* Metadata */}
            {(location || startDate || endDate) && (
              <HStack spacing={0} pt={4} borderTop="1px solid" borderColor={borderColor} align="start" justify="start">
                {location && (
                  <HStack spacing={2}>
                    <MapPin size={18} color={subtitleColor} />
                    <Text fontSize="lg" color={textColor} fontWeight="medium">{location}</Text>
                  </HStack>
                )}
                {location && (startDate || endDate) && (
                  <Text fontSize="lg" color={subtitleColor} fontWeight="bold" mx={4}>•</Text>
                )}
                {(startDate || endDate) && (
                  <HStack spacing={2}>
                    <Calendar size={18} color={subtitleColor} />
                    <Text fontSize="lg" color={textColor} fontWeight="medium">
                      {formatDateRange(startDate, endDate)}
                    </Text>
                  </HStack>
                )}
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Exercise/Day Details */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="lg" color={headingColor}>
              {templateType === 'single' ? 'Exercise Details' : 'Weekly Training Plan'}
            </Heading>
          </HStack>

          {templateType === 'single' ? (
            // Single Day Workout Display
            <VStack spacing={4} align="stretch">
              {selectedExercises.map((exercise, index) => {
                const sets = parseInt(exercise.sets || '0') || 0;
                const reps = parseInt(exercise.reps || '0') || 0;
                const weight = parseFloat(exercise.weight || '0') || 0;
                const distance = parseFloat(exercise.distance || '0') || 0;
                const rest = parseInt(exercise.rest || '0') || 0;
                const rpe = parseInt(exercise.rpe || '0') || 0;
                
                const volume = sets * reps;
                const totalLoad = weight > 0 ? volume * weight : 0;
                const restMinutes = Math.floor(rest / 60);
                const restSeconds = rest % 60;
                const restFormatted = rest > 0 ? (restMinutes > 0 ? `${restMinutes}:${restSeconds.toString().padStart(2, '0')}` : `${rest}s`) : '';
                
                const completedFields = [
                  exercise.sets,
                  exercise.reps,
                  exercise.weight,
                  exercise.distance,
                  exercise.rest,
                  exercise.rpe
                ].filter(field => field && field.trim() !== '').length;
                
                return (
                  <Card key={exercise.instanceId} variant="outline" bg={exerciseCardBg} borderColor={borderColor}>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* Exercise Header */}
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack spacing={3}>
                              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                {index + 1}. {exercise.name}
                              </Text>
                              <Badge colorScheme="blue" variant="subtle">{exercise.category}</Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtitleColor} noOfLines={2}>
                              {exercise.description}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <HStack spacing={1}>
                              {[1,2,3,4,5,6].map(i => (
                                <Box
                                  key={i}
                                  w={2}
                                  h={2}
                                  borderRadius="full"
                                  bg={i <= completedFields ? "green.400" : "gray.300"}
                                />
                              ))}
                            </HStack>
                            <Text fontSize="xs" color={subtitleColor}>
                              {completedFields}/6 fields
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {/* Exercise Parameters */}
                        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Sets</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.sets ? textColor : noExercisesColor}>
                              {exercise.sets || '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Reps</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.reps ? textColor : noExercisesColor}>
                              {exercise.reps || '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Weight (kg)</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.weight ? textColor : noExercisesColor}>
                              {exercise.weight ? `${exercise.weight} kg` : '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Distance (m)</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.distance ? textColor : noExercisesColor}>
                              {exercise.distance ? `${exercise.distance} m` : '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Rest</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.rest ? textColor : noExercisesColor}>
                              {restFormatted || '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">RPE (1-10)</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.rpe ? textColor : noExercisesColor}>
                              {exercise.rpe || '-'}
                            </Text>
                          </VStack>
                        </SimpleGrid>
                        
                        {/* Calculated Metrics */}
                        <HStack spacing={6} pt={2} borderTop="1px solid" borderColor={borderColor}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Est. Volume</Text>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              {volume > 0 ? `${volume} reps` : '-'}
                            </Text>
                          </VStack>
                          {totalLoad > 0 && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Total Load</Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {totalLoad.toLocaleString()} kg
                              </Text>
                            </VStack>
                          )}
                          {rest > 0 && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Rest Time</Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {restFormatted}
                              </Text>
                            </VStack>
                          )}
                        </HStack>
                        
                        {/* Coach Notes */}
                        {exercise.notes && (
                          <Box pt={2} borderTop="1px solid" borderColor={borderColor}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase" mb={1}>Coach Notes</Text>
                            <Text fontSize="sm" color={textColor} fontStyle="italic">
                              "{exercise.notes}"
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </VStack>
          ) : (
            // Weekly Plan Display with Drag and Drop
            <VStack spacing={6} align="stretch">
              {weeklyPlan.map((dayWorkout) => {
                const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayWorkout.day)?.label || dayWorkout.day;
                
                // Use DroppableDayZone for rest days and empty days
                if (dayWorkout.isRestDay || dayWorkout.exercises.length === 0) {
                  return (
                    <DroppableDayZone
                      key={dayWorkout.day}
                      day={dayWorkout.day}
                      dayLabel={dayLabel}
                      isEmpty={dayWorkout.exercises.length === 0}
                      isRestDay={dayWorkout.isRestDay}
                    />
                  );
                }
                
                const dayStats = {
                  totalSets: dayWorkout.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0),
                  estimatedTime: dayWorkout.exercises.length * 3
                };
                
                const exerciseIds = dayWorkout.exercises.map(ex => `${dayWorkout.day}-${ex.instanceId}`);
                
                // Make the day card droppable
                const DroppableDayCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
                  const { isOver, setNodeRef } = useDroppable({
                    id: dayWorkout.day,
                    data: {
                      type: 'day',
                      day: dayWorkout.day
                    }
                  });

                  const dropZoneBg = useColorModeValue('blue.50', 'blue.800');
                  const dropZoneBorder = useColorModeValue('blue.300', 'blue.500');

                  return (
                    <Card 
                      ref={setNodeRef}
                      variant="outline" 
                      bg={isOver ? dropZoneBg : cardBg} 
                      borderColor={isOver ? dropZoneBorder : borderColor}
                      borderWidth={isOver ? "2px" : "1px"}
                      borderStyle={isOver ? "dashed" : "solid"}
                      transition="all 0.2s"
                    >
                      {children}
                    </Card>
                  );
                };
                
                return (
                  <DroppableDayCard key={dayWorkout.day}>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* Day Header */}
                        <HStack justify="space-between" align="center" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor}>{dayLabel}</Text>
                            <Text fontSize="sm" color={subtitleColor}>
                              {dayWorkout.exercises.length} exercise{dayWorkout.exercises.length !== 1 ? 's' : ''} • ~{dayStats.estimatedTime} min
                            </Text>
                          </VStack>
                          <Badge colorScheme="blue" variant="subtle" size="lg">
                            {dayStats.totalSets} sets
                          </Badge>
                        </HStack>
                        
                        {/* Day Exercises with Drag and Drop */}
                        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
                          <VStack spacing={4} align="stretch">
                            {dayWorkout.exercises.map((exercise, index) => (
                              <DraggableExercise
                                key={exercise.instanceId}
                                exercise={exercise}
                                index={index}
                                day={dayWorkout.day}
                                onCopy={handleCopyExercise}
                                onEdit={handleEditExercise}
                              />
                            ))}
                          </VStack>
                        </SortableContext>
                      </VStack>
                    </CardBody>
                  </DroppableDayCard>
                );
              })}
            </VStack>
          )}
        </VStack>
      </VStack>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && (() => {
          // Extract exercise data from activeId
          const [day, exerciseId] = activeId.split('-');
          
          // Find the target day
          const targetDay = weeklyPlan.find(d => d.day === day);
          
          if (!targetDay) {
            return (
              <Box p={4} bg="orange.500" color="white" borderRadius="md" boxShadow="xl">
                Moving Exercise...
              </Box>
            );
          }
          
          // Find the exercise by instance ID - using the more flexible matching that was working
          const exercise = targetDay.exercises.find(ex => 
            ex.instanceId === exerciseId || ex.instanceId.includes(exerciseId)
          );
          
          if (!exercise) {
            return (
              <Box p={4} bg="blue.500" color="white" borderRadius="md" boxShadow="xl">
                Moving Exercise...
              </Box>
            );
          }
          
          return (
            <Box
              p={4}
              bg={useColorModeValue('white', 'gray.700')}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="blue.400"
              border="2px solid"
              borderColor="blue.400"
              boxShadow="2xl"
              transform="rotate(2deg) scale(1.03)"
              maxW="320px"
              opacity={0.85}
            >
              <VStack spacing={3} align="stretch">
                {/* Exercise Header with Drag Handle */}
                <HStack spacing={2}>
                  <Box
                    p={2}
                    borderRadius="md"
                    bg={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <GripVertical size={18} color="white" />
                  </Box>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontSize="md" fontWeight="bold" color={useColorModeValue('gray.800', 'gray.100')}>
                      {exercise.name}
                    </Text>
                    <Badge colorScheme="blue" variant="subtle" size="sm">{exercise.category}</Badge>
                  </VStack>
                </HStack>
                
                {/* Key Parameters */}
                <HStack spacing={4} justify="space-around">
                  {exercise.sets && (
                    <VStack spacing={0}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>Sets</Text>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.700', 'gray.100')}>
                        {exercise.sets}
                      </Text>
                    </VStack>
                  )}
                  {exercise.reps && (
                    <VStack spacing={0}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>Reps</Text>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.700', 'gray.100')}>
                        {exercise.reps}
                      </Text>
                    </VStack>
                  )}
                  {exercise.weight && (
                    <VStack spacing={0}>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>Weight</Text>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.700', 'gray.100')}>
                        {exercise.weight}kg
                      </Text>
                    </VStack>
                  )}
                </HStack>
              </VStack>
            </Box>
          );
        })()}
      </DragOverlay>

      {/* Copy Exercise Modal */}
      <CopyExerciseModal
        isOpen={isCopyModalOpen}
        onClose={onCopyModalClose}
        exercise={copyExercise?.exercise || null}
        fromDay={copyExercise?.fromDay || ''}
        weeklyPlan={weeklyPlan}
        onCopyExercise={handleCopyToDay}
      />
    </DndContext>
  );
};

export default Step4ReviewSave; 