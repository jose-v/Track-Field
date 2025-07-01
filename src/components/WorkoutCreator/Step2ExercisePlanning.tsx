import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Tag,
  Badge,
  IconButton,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Textarea,
  useColorModeValue,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  ButtonGroup,
} from '@chakra-ui/react';
import { Search, PlusCircle, X, Library, FileText, Moon, Plus, Copy, ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { ExerciseLibrary } from '../ExerciseLibrary/ExerciseLibrary';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  video_url?: string;
  default_instructions?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  muscle_groups?: string[];
  equipment?: string[];
  user_id?: string;
  is_system_exercise?: boolean;
  is_public?: boolean;
  organization_id?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
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

interface Step2ExercisePlanningProps {
  exercises: Exercise[];
  selectedExercises: SelectedExercise[];
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (instanceId: string) => void;
  onUpdateExercise: (instanceId: string, field: string, value: string) => void;
  onReorderExercises: (exercises: SelectedExercise[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  currentDay: string;
  setCurrentDay: (day: string) => void;
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
  allSelectedExercises: Record<string, SelectedExercise[]>;
  onDaySelection?: (day: string) => void;
  templateType: 'single' | 'weekly';
  isRestDay: boolean;
  onToggleRestDay?: (day: string, isRest: boolean) => void;
  onCopyExercises?: (fromDay: string, toDay: string) => void;
  onClearDay?: () => void;
  onClearAllExercises?: () => void;
  customExercises: Exercise[];
  onAddCustomExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onUpdateCustomExercise: (id: string, exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onDeleteCustomExercise: (id: string) => Promise<void>;
  isLoadingExercises?: boolean;
  currentUserId?: string;
  userTeams?: Array<{ id: string; name: string }>;
}

const EXERCISE_CATEGORIES = ['All', 'Lift', 'Bodyweight', 'Run Interval', 'Core', 'Plyometric', 'Warm-up', 'Cool-down', 'Drill', 'Custom'];

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
  onRemoveExercise: (instanceId: string) => void;
  onUpdateExercise: (instanceId: string, field: string, value: string) => void;
  cardBg: string;
  borderColor: string;
  textColor: string;
  exerciseCardBg: string;
  exerciseCardBorderColor: string;
  exerciseCardHoverBorderColor: string;
  exerciseNameColor: string;
  exerciseDescColor: string;
  formLabelColor: string;
  removeButtonHoverBg: string;
}

const DraggableExercise: React.FC<DraggableExerciseProps> = ({ 
  exercise, 
  index, 
  onRemoveExercise,
  onUpdateExercise,
  cardBg,
  borderColor,
  textColor,
  exerciseCardBg,
  exerciseCardBorderColor,
  exerciseCardHoverBorderColor,
  exerciseNameColor,
  exerciseDescColor,
  formLabelColor,
  removeButtonHoverBg,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: exercise.instanceId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleBg = useColorModeValue('gray.200', 'gray.600');
  const dragHandleHoverBg = useColorModeValue('gray.300', 'gray.500');
  const dragHandleActiveBg = useColorModeValue('gray.400', 'gray.400');

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      variant="outline"
      shadow="none"
      bg={exerciseCardBg}
      borderWidth="1px"
      borderColor={isDragging ? "blue.400" : exerciseCardBorderColor}
      _hover={{ borderColor: exerciseCardHoverBorderColor }}
      transition="all 0.2s"
      size="sm"
    >
      <CardBody px={4} pt={4} pb={2}>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" align="start">
            <HStack spacing={2} flex="1">
              {/* Drag Handle */}
              <Box
                {...attributes}
                {...listeners}
                cursor="grab"
                p={1}
                borderRadius="md"
                bg={dragHandleBg}
                _hover={{ bg: dragHandleHoverBg }}
                _active={{ cursor: 'grabbing', bg: dragHandleActiveBg }}
                minW="24px"
                h="24px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <GripVertical size={16} color="var(--chakra-colors-gray-500)" />
              </Box>
              
              <VStack align="start" spacing={1} flex="1">
                <HStack>
                  <Text fontWeight="bold" fontSize="md" color={exerciseNameColor}>
                    {index + 1}. {exercise.name}
                  </Text>
                  <Tag size="sm" colorScheme="teal" variant="subtle">
                    {exercise.category}
                  </Tag>
                </HStack>
                <Text fontSize="sm" color={exerciseDescColor} lineHeight="short">
                  {exercise.description}
                </Text>
              </VStack>
            </HStack>
            <IconButton
              icon={<X size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              aria-label="Remove exercise"
              onClick={() => onRemoveExercise(exercise.instanceId)}
              _hover={{ bg: removeButtonHoverBg }}
            />
          </HStack>
          
          <HStack spacing={3}>
            <FormControl flex="1">
              <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>Sets</FormLabel>
              <Input 
                size="sm" 
                value={exercise.sets || ''} 
                onChange={(e) => onUpdateExercise(exercise.instanceId, 'sets', e.target.value)}
                placeholder="e.g., 3"
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
            <FormControl flex="1">
              <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>Reps</FormLabel>
              <Input 
                size="sm" 
                value={exercise.reps || ''}
                onChange={(e) => onUpdateExercise(exercise.instanceId, 'reps', e.target.value)}
                placeholder="e.g., 10"
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
          </HStack>
          
          <HStack spacing={3}>
            <FormControl flex="1">
              <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>Weight (kg)</FormLabel>
              <Input 
                size="sm" 
                type="number"
                value={exercise.weight || ''} 
                onChange={(e) => onUpdateExercise(exercise.instanceId, 'weight', e.target.value)}
                placeholder="e.g., 70"
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
            <FormControl flex="1">
              <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>Distance (m)</FormLabel>
              <Input 
                size="sm" 
                type="number"
                value={exercise.distance || ''}
                onChange={(e) => onUpdateExercise(exercise.instanceId, 'distance', e.target.value)}
                placeholder="e.g., 100"
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
          </HStack>
          
          <HStack spacing={3}>
            <FormControl flex="1">
              <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>Rest (sec)</FormLabel>
              <Input 
                size="sm" 
                type="number"
                value={exercise.rest || ''} 
                onChange={(e) => onUpdateExercise(exercise.instanceId, 'rest', e.target.value)}
                placeholder="e.g., 60"
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
            <FormControl flex="1">
              <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>RPE (1-10)</FormLabel>
              <Input 
                size="sm" 
                type="number"
                min="1"
                max="10"
                value={exercise.rpe || ''}
                onChange={(e) => onUpdateExercise(exercise.instanceId, 'rpe', e.target.value)}
                placeholder="e.g., 8"
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
          </HStack>
          
          <FormControl>
            <FormLabel fontSize="xs" fontWeight="bold" color={formLabelColor}>Notes (optional)</FormLabel>
            <Input 
              size="sm" 
              value={exercise.notes || ''}
              onChange={(e) => onUpdateExercise(exercise.instanceId, 'notes', e.target.value)}
              placeholder="e.g., Focus on form, RPE 8, rest 60s"
              bg={cardBg}
              borderColor={borderColor}
              color={textColor}
            />
          </FormControl>
        </VStack>
      </CardBody>
    </Card>
  );
};

const Step2ExercisePlanning: React.FC<Step2ExercisePlanningProps> = ({
  exercises,
  selectedExercises,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onReorderExercises,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  currentDay,
  setCurrentDay,
  selectedDays,
  setSelectedDays,
  allSelectedExercises,
  onDaySelection,
  templateType,
  isRestDay,
  onToggleRestDay,
  onCopyExercises,
  onClearDay,
  onClearAllExercises,
  customExercises,
  onAddCustomExercise,
  onUpdateCustomExercise,
  onDeleteCustomExercise,
  isLoadingExercises = false,
  currentUserId,
  userTeams,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isClearAllOpen, onOpen: onClearAllOpen, onClose: onClearAllClose } = useDisclosure();
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedExercises.findIndex(ex => ex.instanceId === active.id);
      const newIndex = selectedExercises.findIndex(ex => ex.instanceId === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedExercises = arrayMove(selectedExercises, oldIndex, newIndex);
        onReorderExercises(reorderedExercises);
      }
    }
  };

  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const exerciseCardBg = useColorModeValue('white', 'gray.600');
  const exerciseCardBorderColor = useColorModeValue('gray.200', 'gray.500');
  const exerciseCardHoverBorderColor = useColorModeValue('blue.300', 'blue.400');
  const exerciseNameColor = useColorModeValue('gray.800', 'gray.100');
  const exerciseDescColor = useColorModeValue('gray.600', 'gray.200');
  const formLabelColor = useColorModeValue('gray.600', 'gray.200');
  const removeButtonHoverBg = useColorModeValue('red.100', 'red.800');
  const restDayBg = useColorModeValue('orange.25', 'orange.900');
  const restDayBorderColor = useColorModeValue('orange.200', 'orange.600');
  const emptyStateBg = useColorModeValue('blue.25', 'blue.900');
  const emptyStateBorderColor = useColorModeValue('blue.200', 'blue.600');
  const libraryExerciseCardBg = useColorModeValue('white', 'gray.600');
  const libraryExerciseCardBorderColor = useColorModeValue('gray.200', 'gray.500');
  const libraryExerciseAddedBg = useColorModeValue('green.50', 'green.900');
  const libraryExerciseAddedBorderColor = useColorModeValue('green.300', 'green.600');
  const libraryExerciseNameColor = useColorModeValue('gray.800', 'gray.100');
  const libraryExerciseDescColor = useColorModeValue('gray.600', 'gray.200');
  const libraryHeadingColor = useColorModeValue('gray.700', 'gray.100');
  const searchIconColor = useColorModeValue('gray.400', 'gray.500');
  const noExercisesTextColor = useColorModeValue('gray.500', 'gray.300');
  const noExercisesSubtextColor = useColorModeValue('gray.400', 'gray.400');

  const filteredExercises = (() => {
    let exerciseList = exercises;
    
    // If Custom category is selected, use only custom exercises
    if (selectedCategory === 'Custom') {
      exerciseList = customExercises;
    } else if (selectedCategory === 'All') {
      // For "All", combine regular exercises with custom exercises
      exerciseList = [...exercises, ...customExercises];
    }
    
    return exerciseList.filter(exercise => {
      const matchesCategory = selectedCategory === 'All' || selectedCategory === 'Custom' || exercise.category === selectedCategory;
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  })();

  const handleAddCustomExercise = () => {
    if (newExerciseName.trim() && newExerciseDescription.trim()) {
      onAddCustomExercise({
        name: newExerciseName.trim(),
        category: 'Custom',
        description: newExerciseDescription.trim(),
      });
      setNewExerciseName('');
      setNewExerciseDescription('');
      onClose();
      // Switch to Custom category to show the newly added exercise
      setSelectedCategory('Custom');
    }
  };

  // Handle day selection with multi-select support
  const handleDaySelection = (dayValue: string, event: React.MouseEvent) => {
    const isMultiSelect = event.metaKey || event.ctrlKey; // Cmd on Mac, Ctrl on Windows
    
    if (!isMultiSelect) {
      // Single selection - use custom handler if available, otherwise use default
      if (onDaySelection) {
        onDaySelection(dayValue);
      } else {
        setSelectedDays([dayValue]);
        setCurrentDay(dayValue);
      }
      return;
    }
    
    // Multi-select logic
    const currentlySelected = selectedDays.includes(dayValue);
    
    if (currentlySelected) {
      // Remove from selection
      const newSelection = selectedDays.filter(day => day !== dayValue);
      
      if (newSelection.length === 0) {
        // If no days left selected, reset to single-day mode with the clicked day
        setSelectedDays([dayValue]);
        setCurrentDay(dayValue);
      } else {
        // Update selection and current day
        setSelectedDays(newSelection);
        // If we deselected the current day, switch to first remaining selected day
        if (currentDay === dayValue) {
          setCurrentDay(newSelection[0]);
        }
      }
    } else {
      // Add to selection - but only if all selected days (including this one) have no exercises
      const allDaysToCheck = [...selectedDays, dayValue];
      const hasExercises = allDaysToCheck.some(day => 
        allSelectedExercises[day] && allSelectedExercises[day].length > 0
      );
      
      if (hasExercises) {
        // Don't allow multi-select if any day has exercises
        setSelectedDays([dayValue]);
        setCurrentDay(dayValue);
        return;
      }
      
      // Add to selection
      const newSelection = [...selectedDays, dayValue];
      setSelectedDays(newSelection);
      setCurrentDay(dayValue);
    }
  };

  // Check if a day can be multi-selected (has no exercises)
  const canMultiSelect = (dayValue: string) => {
    return !allSelectedExercises[dayValue] || allSelectedExercises[dayValue].length === 0;
  };

  // Get the display state for multi-selection
  const getMultiSelectDisplay = () => {
    if (selectedDays.length <= 1) return null;
    
    const dayLabels = selectedDays
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
      .filter(Boolean)
      .join(', ');
    
    return `Planning for: ${dayLabels}`;
  };

  // Get current day name for heading
  const currentDayName = DAYS_OF_WEEK.find(d => d.value === currentDay)?.label || 'Day';
  const workoutHeading = templateType === 'weekly' ? `${currentDayName} Exercises` : 'Workout Exercises';

  return (
    <Box w="100%" mb={0}>
      <HStack spacing={4} align="start" w="100%" height="calc(100vh - 380px)">
        {/* Left Panel: Exercise Library */}
        <Card flex="1" height="100%" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
          <CardBody p={0} height="100%">
            <ExerciseLibrary
              exercises={customExercises}
              onAddExercise={onAddCustomExercise}
              onUpdateExercise={onUpdateCustomExercise}
              onDeleteExercise={onDeleteCustomExercise}
              isLoading={isLoadingExercises}
              currentUserId={currentUserId}
              userTeams={userTeams}
              onExerciseSelect={onAddExercise}
              selectionMode={true}
              selectedExercises={selectedExercises.map(ex => ex.id)}
              title="Exercise Library"
              subtitle="Select exercises to add to your workout"
              showAddButton={true}
            />
          </CardBody>
        </Card>

        {/* Right Panel: Workout Exercises */}
        <Card flex="1" height="100%" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
          <CardHeader pb={3}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <HStack spacing={3} align="baseline">
                  <Box display="flex" alignItems="center">
                    <FileText size={29} color="var(--chakra-colors-green-500)" />
                  </Box>
                  <Heading size="lg" color={headingColor}>
                    {workoutHeading}
                  </Heading>
                </HStack>
                <Badge colorScheme={isRestDay ? "orange" : "blue"} variant="solid" fontSize="md" px={3} py={1}>
                  {isRestDay ? "REST DAY" : `${selectedExercises.length} EXERCISES`}
                </Badge>
              </HStack>

              {/* Day Selector and Controls - Only show for weekly templates */}
              {templateType === 'weekly' && (
                <VStack spacing={3} align="stretch">
                  {/* Day Selector Buttons */}
                  <VStack spacing={2} align="stretch">
                    <VStack spacing={1} align="stretch">
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      Select Day to Plan:
                    </Text>
                      <Text fontSize="xs" color={subtitleColor}>
                        Hold Cmd/Ctrl to select multiple empty days
                      </Text>

                    </VStack>
                    <ButtonGroup size="sm" isAttached variant="outline" spacing={0}>
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = selectedDays.includes(day.value);
                        const isCurrent = currentDay === day.value;
                        const hasExercises = allSelectedExercises[day.value] && allSelectedExercises[day.value].length > 0;
                        
                        return (
                        <Button
                          key={day.value}
                            onClick={(e) => handleDaySelection(day.value, e)}
                            variant={isSelected ? "solid" : "outline"}
                            colorScheme={isCurrent ? "blue" : isSelected ? "green" : "gray"}
                          size="sm"
                          flex="1"
                            fontWeight={isSelected ? "bold" : "normal"}
                          fontSize="xs"
                            opacity={hasExercises && selectedDays.length > 1 && !isSelected ? 0.5 : 1}
                            title={
                              hasExercises && selectedDays.length > 1 && !isSelected 
                                ? "Cannot multi-select days with exercises"
                                : selectedDays.length > 1 
                                  ? "Hold Cmd/Ctrl to modify selection"
                                  : "Click to select, Cmd/Ctrl+click for multi-select"
                            }
                        >
                          {day.label.slice(0, 3)}
                            {hasExercises && (
                              <Box
                                as="span"
                                ml={1}
                                width="4px"
                                height="4px"
                                borderRadius="full"
                                bg="orange.400"
                                display="inline-block"
                              />
                            )}
                        </Button>
                        );
                      })}
                    </ButtonGroup>
                  </VStack>

                  {/* Rest Day Toggle and Copy Options */}
                  <HStack spacing={4} justify="space-between">
                    {/* Rest Day Toggle */}
                    <Checkbox
                      isChecked={isRestDay}
                      onChange={(e) => onToggleRestDay?.(currentDay, e.target.checked)}
                      colorScheme="orange"
                    >
                      <Text fontSize="sm" color={textColor}>Rest Day</Text>
                    </Checkbox>

                    {/* Action Buttons */}
                    <HStack spacing={2}>
                    {/* Copy Options */}
                      <Menu>
                        <MenuButton 
                          as={Button} 
                          size="sm" 
                          variant="outline" 
                          borderWidth="0.25px"
                          borderColor="white"
                          color="white"
                          fontWeight="normal"
                          _hover={{ bg: "gray.100", color: "gray.800", borderColor: "gray.300" }}
                          leftIcon={<Copy size={14} />} 
                          rightIcon={<ChevronDown size={14} />}
                          isDisabled={selectedExercises.length === 0 || isRestDay}
                        >
                          Copy to...
                        </MenuButton>
                        <MenuList>
                          {DAYS_OF_WEEK.filter(day => day.value !== currentDay).map((day) => (
                            <MenuItem 
                              key={day.value}
                              onClick={() => onCopyExercises?.(currentDay, day.value)}
                              fontSize="sm"
                            >
                              Copy to {day.label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>

                      {/* Clear Day Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        borderWidth="0.25px"
                        borderColor="white"
                        color="white"
                        fontWeight="normal"
                        _hover={{ bg: "gray.100", color: "gray.800", borderColor: "gray.300" }}
                        leftIcon={<X size={14} />}
                        onClick={onClearDay}
                        isDisabled={!selectedDays.some(day => allSelectedExercises[day] && allSelectedExercises[day].length > 0)}
                      >
                        Clear {selectedDays.length > 1 ? 'Days' : 'Day'}
                      </Button>

                      {/* Clear All Exercises Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        borderWidth="0.25px"
                        borderColor="white"
                        color="white"
                        fontWeight="normal"
                        _hover={{ bg: "gray.100", color: "gray.800", borderColor: "gray.300" }}
                        leftIcon={<Trash2 size={14} />}
                        onClick={onClearAllOpen}
                        isDisabled={!Object.values(allSelectedExercises).some(dayExercises => dayExercises.length > 0)}
                      >
                        Clear All
                      </Button>
                    </HStack>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </CardHeader>
          
          <CardBody pt={0} flex="1" overflow="hidden" display="flex" flexDirection="column">
            <Box flex="1" overflow="auto" pr={2}>
              {isRestDay ? (
                <VStack 
                  flex="1"
                  justify="center"
                  spacing={4}
                  p={8}
                  textAlign="center"
                  borderWidth="2px" 
                  borderStyle="dashed" 
                  borderColor={restDayBorderColor}
                  borderRadius="lg"
                  bg={restDayBg}
                  height="100%"
                >
                  <div style={{ fontSize: '64px', opacity: 0.6, color: 'var(--chakra-colors-orange-400)' }}>
                    <Moon size={64} />
                  </div>
                  <VStack spacing={2}>
                    <Text color="orange.600" fontSize="lg" fontWeight="bold">
                      Rest Day
                    </Text>
                    <Text color="orange.500" fontSize="md">
                      This day is marked as a rest day - no exercises planned
                    </Text>
                    <Text color="orange.400" fontSize="sm">
                      Uncheck "Rest Day" above to add exercises
                    </Text>
                  </VStack>
                </VStack>
              ) : selectedExercises.length === 0 ? (
                <VStack 
                  flex="1"
                  justify="center"
                  spacing={4}
                  p={8}
                  textAlign="center"
                  borderWidth="2px" 
                  borderStyle="dashed" 
                  borderColor={emptyStateBorderColor}
                  borderRadius="lg"
                  bg={emptyStateBg}
                  height="100%"
                >
                  <div style={{ fontSize: '64px', opacity: 0.6 }}>🎯</div>
                  <VStack spacing={2}>
                    <Text color="blue.600" fontSize="lg" fontWeight="bold">
                      Ready to build your workout!
                    </Text>
                    <Text color="blue.500" fontSize="md">
                      Select exercises from the library to add them here
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={selectedExercises.map(ex => ex.instanceId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <VStack spacing={2} align="stretch">
                      {selectedExercises.map((exercise, index) => (
                        <DraggableExercise
                          key={exercise.instanceId}
                          exercise={exercise}
                          index={index}
                          onRemoveExercise={onRemoveExercise}
                          onUpdateExercise={onUpdateExercise}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          textColor={textColor}
                          exerciseCardBg={exerciseCardBg}
                          exerciseCardBorderColor={exerciseCardBorderColor}
                          exerciseCardHoverBorderColor={exerciseCardHoverBorderColor}
                          exerciseNameColor={exerciseNameColor}
                          exerciseDescColor={exerciseDescColor}
                          formLabelColor={formLabelColor}
                          removeButtonHoverBg={removeButtonHoverBg}
                        />
                      ))}
                    </VStack>
                  </SortableContext>
                </DndContext>
              )}
            </Box>
          </CardBody>
        </Card>
      </HStack>

      {/* Clear All Confirmation Modal */}
      <AlertDialog
        isOpen={isClearAllOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClearAllClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Clear All Exercises
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  This will delete all exercises from every day in this workout plan. Are you sure you want to continue?
                </Text>
                
                <HStack spacing={3} justify="flex-end">
                  <Button ref={cancelRef} onClick={onClearAllClose}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="red" 
                    onClick={() => {
                      onClearAllExercises?.();
                      onClearAllClose();
                    }}
                  >
                    Clear All
                  </Button>
                </HStack>
              </VStack>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Add Custom Exercise Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Custom Exercise</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Exercise Name</FormLabel>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Enter exercise name..."
                  autoFocus
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newExerciseDescription}
                  onChange={(e) => setNewExerciseDescription(e.target.value)}
                  placeholder="Describe the exercise, technique, target muscles..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddCustomExercise}
              isDisabled={!newExerciseName.trim() || !newExerciseDescription.trim()}
            >
              Add Exercise
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Step2ExercisePlanning; 