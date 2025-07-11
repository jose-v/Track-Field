import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  IconButton,
  Select,
  Input,
  Badge,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Flex,
  Divider,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Tag,
  TagLabel,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Image,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  ButtonGroup,
  Center,
  Switch,
  Textarea,
} from '@chakra-ui/react';
import { 
  Search, 
  Library, 
  Target,
  Clock,
  Trash2,
  Edit,
  Move,
  Filter,
  BookOpen,
  Play,
  X,
  ChevronDown,
  Grid3X3,
  List,
  GripVertical,
  Settings,
  Copy,
  Clipboard,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../contexts/AuthContext';
import { getExercisesWithTeamSharing } from '../../utils/exerciseQueries';
import { createExerciseWithSharing } from '../../utils/exerciseQueries';
import { ExerciseModal } from '../ExerciseLibrary/ExerciseModal';

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

interface BlockExercise extends Exercise {
  instanceId: string;
  sets?: string;
  reps?: string;
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
  notes?: string;
  contacts?: string;
  intensity?: string;
  direction?: string;
  movement_notes?: string;
  timed_duration?: number; // Duration in seconds for timed exercises
}

interface WorkoutBlock {
  id: string;
  name: string;
  category: 'warmup' | 'main' | 'accessory' | 'conditioning' | 'cooldown' | 'custom';
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  exercises: BlockExercise[];
  restBetweenExercises: number;
  rounds?: number;
  timeLimit?: number;
  description?: string;
}

interface Step3ExerciseAssignmentProps {
  blocks: WorkoutBlock[];
  onUpdateBlocks: (blocks: WorkoutBlock[]) => void;
  templateType: 'single' | 'weekly' | 'monthly';
  currentDay?: string;
}

const EXERCISE_CATEGORIES = [
  'All',
  'strength',
  'running', 
  'plyometric',
  'flexibility',
  'warm_up',
  'cool_down',
  'drill',
  'recovery',
  'custom'
];

const EXERCISE_SOURCES = [
  'all',
  'system',
  'public',
  'mine',
  'team'
];

const SOURCE_LABELS = {
  'all': 'All Exercises',
  'system': 'System Exercises',
  'public': 'Public Community',
  'mine': 'My Exercises',
  'team': 'Team Exercises'
};

const DIFFICULTY_LEVELS = [
  'All',
  'Beginner',
  'Intermediate', 
  'Advanced'
];

const BLOCK_CATEGORY_COLORS = {
  warmup: 'orange',
  main: 'blue',
  accessory: 'green',
  conditioning: 'red',
  cooldown: 'purple',
  custom: 'gray',
};

// Sortable Exercise Item Component
interface SortableExerciseItemProps {
  exercise: BlockExercise;
  index: number;
  blockId: string;
  onUpdateExercise: (blockId: string, instanceId: string, field: string, value: string) => void;
  onRemoveExercise: (blockId: string, instanceId: string) => void;
  onOpenSettings: (exercise: BlockExercise, blockId: string) => void;
  onCopyExercise: (exercise: BlockExercise) => void;
  onPasteToExercise: (exercise: BlockExercise, blockId: string) => void;
  hasCopiedData: boolean;
  searchBg: string;
  borderColor: string;
}

const SortableExerciseItem: React.FC<SortableExerciseItemProps> = ({
  exercise,
  index,
  blockId,
  onUpdateExercise,
  onRemoveExercise,
  onOpenSettings,
  onCopyExercise,
  onPasteToExercise,
  hasCopiedData,
  searchBg,
  borderColor,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      key={exercise.instanceId}
      size="sm"
      variant="outline"
      bg="transparent"
      borderColor={isDragging ? "blue.400" : borderColor}
      borderWidth="2px"
      _hover={{ borderColor: "blue.300" }}
      h="110px"
    >
      <CardBody px={2} py={0} h="100%">
        <VStack spacing={1} align="stretch" h="100%" justify="space-between">
          <HStack justify="space-between" align="start">
            <HStack spacing={2} flex="1">
              {/* Drag Handle */}
              <Box
                {...attributes}
                {...listeners}
                cursor="grab"
                p={1}
                borderRadius="md"
                _hover={{ bg: "gray.100" }}
                _active={{ cursor: 'grabbing' }}
                display="flex"
                alignItems="center"
              >
                <Icon as={GripVertical} boxSize={3} color="gray.500" />
              </Box>
              <Text fontWeight="medium" fontSize="sm" noOfLines={1} flex="1">
                {index + 1}. {exercise.name}
              </Text>
            </HStack>
            <HStack spacing={1} position="absolute" top="4px" right="4px">
              <Tooltip label="Copy exercise settings" placement="top">
                <IconButton
                  aria-label="Copy exercise"
                  icon={<Copy size={12} color="white" />}
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  onClick={() => onCopyExercise(exercise)}
                />
              </Tooltip>
              <Tooltip label={hasCopiedData ? "Paste exercise settings" : "No data to paste"} placement="top">
                <IconButton
                  aria-label="Paste exercise settings"
                  icon={<Clipboard size={12} color="white" />}
                  size="xs"
                  variant="ghost"
                  colorScheme="purple"
                  isDisabled={!hasCopiedData}
                  onClick={() => onPasteToExercise(exercise, blockId)}
                />
              </Tooltip>
              <Tooltip label="Exercise settings" placement="top">
                <IconButton
                  aria-label="Exercise settings"
                  icon={<Settings size={12} color="white" />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onOpenSettings(exercise, blockId)}
                />
              </Tooltip>
              <Tooltip label="Remove exercise" placement="top">
                <IconButton
                  aria-label="Remove exercise"
                  icon={<X size={12} color="white" />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onRemoveExercise(blockId, exercise.instanceId)}
                />
              </Tooltip>
            </HStack>
          </HStack>
          
          <HStack spacing={2}>
            <FormControl size="sm">
              <Input
                value={exercise.sets || ''}
                onChange={(e) => onUpdateExercise(blockId, exercise.instanceId, 'sets', e.target.value)}
                placeholder="Sets"
                size="sm"
                bg={searchBg}
                h="28px"
                fontSize="xs"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>
            <FormControl size="sm">
              <Input
                value={exercise.reps || ''}
                onChange={(e) => onUpdateExercise(blockId, exercise.instanceId, 'reps', e.target.value)}
                placeholder="Reps"
                size="sm"
                bg={searchBg}
                h="28px"
                fontSize="xs"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>
            {exercise.weight && (
              <FormControl size="sm">
                <Input
                  value={exercise.weight}
                  onChange={(e) => onUpdateExercise(blockId, exercise.instanceId, 'weight', e.target.value)}
                  placeholder="Weight"
                  size="sm"
                  bg={searchBg}
                  h="28px"
                  fontSize="xs"
                  _placeholder={{ color: 'gray.400' }}
                />
              </FormControl>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

const Step3ExerciseAssignment: React.FC<Step3ExerciseAssignmentProps> = ({
  blocks,
  onUpdateBlocks,
  templateType,
  currentDay,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Exercise library state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // UI state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    blocks.length > 0 ? blocks[0].id : null
  );
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  
  // Exercise detail modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Exercise settings modal
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [selectedSettingsExercise, setSelectedSettingsExercise] = useState<BlockExercise | null>(null);
  const [selectedSettingsBlockId, setSelectedSettingsBlockId] = useState<string>('');

  // Copy/paste functionality
  const [copiedExerciseData, setCopiedExerciseData] = useState<{
    sets?: string;
    reps?: string;
    weight?: string;
    distance?: string;
    rest?: string;
    rpe?: string;
    notes?: string;
    contacts?: string;
    intensity?: string;
    direction?: string;
    movement_notes?: string;
    timed_duration?: number;
  } | null>(null);

  // Add exercise modal
  const { isOpen: isAddExerciseOpen, onOpen: onAddExerciseOpen, onClose: onAddExerciseClose } = useDisclosure();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update selected block when blocks change (e.g., when switching days in weekly workouts)
  useEffect(() => {
    if (blocks.length > 0) {
      // If current selected block doesn't exist in new blocks array, select the first one
      const currentBlockExists = blocks.some(block => block.id === selectedBlockId);
      if (!currentBlockExists) {
        setSelectedBlockId(blocks[0].id);
      }
    } else {
      // No blocks available, clear selection
      setSelectedBlockId(null);
    }
  }, [blocks, selectedBlockId]);

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const searchBg = useColorModeValue('white', 'gray.700');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.700');
  const exerciseCardHoverBg = useColorModeValue('gray.100', 'gray.600');
  const modalBg = useColorModeValue('white', 'gray.800');
  const modalContentBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('white', 'gray.600');

  // Load exercises from database
  useEffect(() => {
    const loadExercises = async () => {
      if (!user?.id) return;
      
      setIsLoadingExercises(true);
      try {
        const exerciseData = await getExercisesWithTeamSharing(user.id);
        setExercises(exerciseData);
      } catch (error) {
        console.error('Error loading exercises:', error);
        toast({
          title: 'Error loading exercises',
          description: 'Could not load exercises. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingExercises(false);
      }
    };

    loadExercises();
  }, [user?.id, toast]);

  // Filter exercises based on search and category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (exercise.muscle_groups?.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty;
    
    // Source filtering
    let matchesSource = true;
    if (selectedSource === 'system') {
      matchesSource = exercise.is_system_exercise === true;
    } else if (selectedSource === 'public') {
      matchesSource = exercise.is_system_exercise === false && exercise.is_public === true;
    } else if (selectedSource === 'mine') {
      matchesSource = exercise.is_system_exercise === false && exercise.user_id === user?.id;
    } else if (selectedSource === 'team') {
      matchesSource = exercise.is_system_exercise === false && 
                     exercise.is_public === false && 
                     exercise.organization_id && 
                     exercise.user_id !== user?.id;
    }
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesSource;
  }).sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at || '').getTime();
        bValue = new Date(b.created_at || '').getTime();
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Get selected block
  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Add exercise to selected block
  const handleAddExerciseToBlock = (exercise: Exercise) => {
    if (!selectedBlockId) {
      toast({
        title: 'No block selected',
        description: 'Please select a block first before adding exercises.',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    const blockExercise: BlockExercise = {
      ...exercise,
      instanceId: `${exercise.id}-${Date.now()}-${Math.random()}`,
      sets: '',
      reps: '',
      weight: '',
      distance: '',
      rest: '',
      rpe: '',
      notes: '',
      contacts: '',
      intensity: '',
      direction: '',
      movement_notes: '',
      timed_duration: 0, // Initialize timed_duration
    };

    const updatedBlocks = blocks.map(block => {
      if (block.id === selectedBlockId) {
        return {
          ...block,
          exercises: [...block.exercises, blockExercise]
        };
      }
      return block;
    });

    onUpdateBlocks(updatedBlocks);
    
    toast({
      title: 'Exercise added',
      description: `${exercise.name} has been added to ${selectedBlock?.name}`,
      status: 'success',
      duration: 2000,
    });
  };

  // Remove exercise from block
  const handleRemoveExercise = (blockId: string, instanceId: string) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          exercises: block.exercises.filter(ex => ex.instanceId !== instanceId)
        };
      }
      return block;
    });

    onUpdateBlocks(updatedBlocks);
  };

  // Update exercise in block
  const handleUpdateExercise = (blockId: string, instanceId: string, field: string, value: string) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          exercises: block.exercises.map(ex => 
            ex.instanceId === instanceId 
              ? { ...ex, [field]: value }
              : ex
          )
        };
      }
      return block;
    });

    onUpdateBlocks(updatedBlocks);
  };

  // Show exercise details
  const handleShowExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    onOpen();
  };

  // Open exercise settings
  const handleOpenExerciseSettings = (exercise: BlockExercise, blockId: string) => {
    setSelectedSettingsExercise(exercise);
    setSelectedSettingsBlockId(blockId);
    onSettingsOpen();
  };

  // Copy exercise data
  const handleCopyExercise = (exercise: BlockExercise) => {
    const dataToCopy = {
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      distance: exercise.distance,
      rest: exercise.rest,
      rpe: exercise.rpe,
      notes: exercise.notes,
      contacts: exercise.contacts,
      intensity: exercise.intensity,
      direction: exercise.direction,
      movement_notes: exercise.movement_notes,
      timed_duration: exercise.timed_duration,
    };
    setCopiedExerciseData(dataToCopy);
    toast({
      title: 'Exercise copied!',
      description: `Settings for "${exercise.name}" copied to clipboard`,
      status: 'success',
      duration: 2000,
    });
  };

  // Paste exercise data
  const handlePasteToExercise = (exercise: BlockExercise, blockId: string) => {
    if (!copiedExerciseData) return;
    
    // Update all fields at once (same approach as settings modal)
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          exercises: block.exercises.map(ex => 
            ex.instanceId === exercise.instanceId 
              ? { 
                  ...ex,
                  // Only update fields that have values in copiedExerciseData
                  ...(copiedExerciseData.sets && { sets: copiedExerciseData.sets }),
                  ...(copiedExerciseData.reps && { reps: copiedExerciseData.reps }),
                  ...(copiedExerciseData.contacts && { contacts: copiedExerciseData.contacts }),
                  ...(copiedExerciseData.intensity && { intensity: copiedExerciseData.intensity }),
                  ...(copiedExerciseData.direction && { direction: copiedExerciseData.direction }),
                  ...(copiedExerciseData.weight && { weight: copiedExerciseData.weight }),
                  ...(copiedExerciseData.distance && { distance: copiedExerciseData.distance }),
                  ...(copiedExerciseData.movement_notes && { movement_notes: copiedExerciseData.movement_notes }),
                  ...(copiedExerciseData.rest && { rest: copiedExerciseData.rest }),
                  ...(copiedExerciseData.rpe && { rpe: copiedExerciseData.rpe }),
                  ...(copiedExerciseData.notes && { notes: copiedExerciseData.notes }),
                  ...(copiedExerciseData.timed_duration && { timed_duration: copiedExerciseData.timed_duration })
                }
              : ex
          )
        };
      }
      return block;
    });
    
    onUpdateBlocks(updatedBlocks);
    
    toast({
      title: 'Exercise settings pasted!',
      description: `Settings applied to "${exercise.name}"`,
      status: 'success',
      duration: 2000,
    });
  };

  // Handle drag end for reordering exercises within a block
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !selectedBlockId) return;

    if (active.id !== over.id) {
      const updatedBlocks = blocks.map(block => {
        if (block.id === selectedBlockId) {
          const oldIndex = block.exercises.findIndex(ex => ex.instanceId === active.id);
          const newIndex = block.exercises.findIndex(ex => ex.instanceId === over.id);
          
          return {
            ...block,
            exercises: arrayMove(block.exercises, oldIndex, newIndex)
          };
        }
        return block;
      });

      onUpdateBlocks(updatedBlocks);
    }
  };

  // Handle adding new custom exercise
  const handleAddExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    if (!user?.id) return;

    try {
      const newExercise = await createExerciseWithSharing(exerciseData, user.id);
      
      // Add to local exercises list
      setExercises(prev => [newExercise, ...prev]);
      
      // Close modal
      onAddExerciseClose();
      
      toast({
        title: 'Exercise added',
        description: `${exerciseData.name} has been added to your library.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({
        title: 'Error adding exercise',
        description: 'There was an error adding the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header */}
      <Box>
        <Heading size="xl" color={textColor} mb={2}>
          Add Exercises to Blocks
        </Heading>
        <Text fontSize="lg" color={subtitleColor}>
          Choose exercises from your library and assign them to training blocks
        </Text>
      </Box>

      {/* Main Content Grid */}
      <Grid templateColumns="1fr 1fr" gap={4} h="calc(100vh - 300px)" maxH="600px" minH="400px">
        {/* Left: Exercise Library */}
        <GridItem>
          <Card bg="transparent" borderColor={borderColor} variant="outline" h="800px" display="flex" flexDirection="column">
            <CardHeader flexShrink={0}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Exercise Library</Heading>
                  <Button
                    leftIcon={<BookOpen size={14} />}
                    colorScheme="blue"
                    size="sm"
                    onClick={onAddExerciseOpen}
                  >
                    Add Exercise
                  </Button>
                </HStack>

                {/* Search Bar with Sort */}
                <HStack spacing={2}>
                  <InputGroup size="md" flex="1">
                    <InputLeftElement pointerEvents="none">
                      <Search size={18} color={subtitleColor} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search exercises by name, description, or muscle group..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg={searchBg}
                      borderColor={borderColor}
                    />
                    {searchTerm && (
                      <InputRightElement>
                        <IconButton
                          aria-label="Clear search"
                          icon={<X size={16} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setSearchTerm('')}
                          color={subtitleColor}
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                  
                  <IconButton
                    aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    size="md"
                    icon={
                      <Text fontSize="lg" fontWeight="bold">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Text>
                    }
                  />
                </HStack>

                {/* Filters */}
                <HStack spacing={2} wrap="wrap">
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    size="sm"
                    maxW="140px"
                    bg={searchBg}
                    borderColor={borderColor}
                  >
                    {EXERCISE_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category === 'All' ? 'All Categories' : category}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    size="sm"
                    maxW="130px"
                    bg={searchBg}
                    borderColor={borderColor}
                  >
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level} value={level}>
                        {level === 'All' ? 'All Levels' : level}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    size="sm"
                    maxW="130px"
                    bg={searchBg}
                    borderColor={borderColor}
                  >
                    {EXERCISE_SOURCES.map(source => (
                      <option key={source} value={source}>
                        {SOURCE_LABELS[source as keyof typeof SOURCE_LABELS]}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'created_at')}
                    size="sm"
                    maxW="120px"
                    bg={searchBg}
                    borderColor={borderColor}
                  >
                    <option value="name">Name</option>
                    <option value="category">Category</option>
                    <option value="created_at">Date Added</option>
                  </Select>
                </HStack>
              </VStack>
            </CardHeader>
            <CardBody pt={0} flex="1" minH="0">
              {/* Exercise List */}
              <Box h="100%" overflowY="auto">
                {isLoadingExercises ? (
                  <Center py={8}>
                    <Spinner size="lg" color="blue.500" />
                  </Center>
                ) : filteredExercises.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    No exercises found. Try adjusting your search or filters.
                  </Alert>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {filteredExercises.map(exercise => (
                      <Card
                        key={exercise.id}
                        size="sm"
                        variant="outline"
                        bg={exerciseCardBg}
                        _hover={{ bg: exerciseCardHoverBg, cursor: 'pointer' }}
                        borderColor={borderColor}
                        h="100px"
                        onClick={() => handleAddExerciseToBlock(exercise)}
                      >
                        <CardBody p={3} h="100%">
                          <Box display="flex" alignItems="center" h="100%">
                            <VStack align="start" spacing={1} flex="1" justify="center">
                              <HStack>
                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                  {exercise.name}
                                </Text>
                                <Tag size="sm" colorScheme="teal">
                                  {exercise.category}
                                </Tag>
                                {exercise.difficulty && (
                                  <Tag size="sm" colorScheme={
                                    exercise.difficulty === 'Beginner' ? 'green' :
                                    exercise.difficulty === 'Intermediate' ? 'yellow' : 'red'
                                  }>
                                    {exercise.difficulty}
                                  </Tag>
                                )}
                              </HStack>
                              <Text fontSize="xs" color={subtitleColor} noOfLines={2}>
                                {exercise.description}
                              </Text>
                            </VStack>
                            
                            <VStack spacing={1}>
                              <Tooltip label="View Details">
                                <IconButton
                                  aria-label="View details"
                                  icon={<BookOpen />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowExerciseDetails(exercise);
                                  }}
                                />
                              </Tooltip>
                            </VStack>
                          </Box>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </Box>
            </CardBody>
          </Card>
        </GridItem>

        {/* Right: Block Configuration */}
        <GridItem>
          <Card bg="transparent" borderColor={borderColor} variant="outline" h="100%" display="flex" flexDirection="column">
            <CardHeader flexShrink={0}>
              <HStack justify="space-between">
                <Heading size="md">Training Blocks</Heading>
              </HStack>
            </CardHeader>
            <CardBody flex="1" minH="0">
              <VStack spacing={4} align="stretch" h="100%">
                {/* Block Selector */}
                {blocks.length === 0 ? (
                  <Alert status="warning">
                    <AlertIcon />
                    No blocks created yet. Go back to Step 2 to create training blocks.
                  </Alert>
                ) : (
                  <>
                    <FormControl flexShrink={0}>
                      <FormLabel fontSize="sm">Select Block to Add Exercises</FormLabel>
                      <Select
                        value={selectedBlockId || ''}
                        onChange={(e) => setSelectedBlockId(e.target.value)}
                        bg={searchBg}
                      >
                        {blocks.map(block => (
                          <option key={block.id} value={block.id}>
                            {block.name} ({block.category})
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Selected Block Details */}
                    {selectedBlock && (
                      <Card variant="outline" bg={exerciseCardBg} flex="1" minH="0" display="flex" flexDirection="column">
                        <CardHeader pb={2} flexShrink={0}>
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Text fontWeight="semibold">{selectedBlock.name}</Text>
                              <Badge colorScheme={BLOCK_CATEGORY_COLORS[selectedBlock.category]}>
                                {selectedBlock.category}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtitleColor}>
                              Flow: {selectedBlock.flow} | Rest: {selectedBlock.restBetweenExercises}s
                            </Text>
                          </VStack>
                        </CardHeader>
                        <CardBody pt={0} flex="1" minH="0">
                          <VStack spacing={3} align="stretch" h="100%">
                            <Text fontSize="sm" fontWeight="semibold" flexShrink={0}>
                              Exercises ({selectedBlock.exercises.length})
                            </Text>
                            
                            {selectedBlock.exercises.length === 0 ? (
                              <Center flex="1">
                                <Text fontSize="sm" color={subtitleColor} textAlign="center">
                                  No exercises added yet. Click exercises from the library to add them.
                                </Text>
                              </Center>
                            ) : (
                              <Box flex="1" overflowY="auto" minH="0">
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleDragEnd}
                                >
                                  <SortableContext
                                    items={selectedBlock.exercises.map(ex => ex.instanceId)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <VStack spacing={2} align="stretch">
                                      {selectedBlock.exercises.map((exercise, index) => (
                                        <SortableExerciseItem
                                          key={exercise.instanceId}
                                          exercise={exercise}
                                          index={index}
                                          blockId={selectedBlock.id}
                                          onUpdateExercise={handleUpdateExercise}
                                          onRemoveExercise={handleRemoveExercise}
                                          onOpenSettings={handleOpenExerciseSettings}
                                          onCopyExercise={handleCopyExercise}
                                          onPasteToExercise={handlePasteToExercise}
                                          hasCopiedData={copiedExerciseData !== null}
                                          searchBg={searchBg}
                                          borderColor={borderColor}
                                        />
                                      ))}
                                    </VStack>
                                  </SortableContext>
                                </DndContext>
                              </Box>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        isOpen={isOpen}
        onClose={onClose}
        exercise={selectedExercise}
      />

      {/* Exercise Settings Modal */}
      <ExerciseSettingsModal
        isOpen={isSettingsOpen}
        onClose={onSettingsClose}
        exercise={selectedSettingsExercise}
        blockId={selectedSettingsBlockId}
        blocks={blocks}
        onUpdateExercise={handleUpdateExercise}
        onUpdateBlocks={onUpdateBlocks}
      />

      {/* Add Exercise Modal */}
      <ExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={onAddExerciseClose}
        onSave={handleAddExercise}
        title="Add New Exercise"
        categories={EXERCISE_CATEGORIES}
      />
    </VStack>
  );
};

// Exercise Settings Modal Component
const ExerciseSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  exercise: BlockExercise | null;
  blockId: string;
  blocks: WorkoutBlock[];
  onUpdateExercise: (blockId: string, instanceId: string, field: string, value: string) => void;
  onUpdateBlocks: (blocks: WorkoutBlock[]) => void;
}> = ({ isOpen, onClose, exercise, blockId, blocks, onUpdateExercise, onUpdateBlocks }) => {
  const modalContentBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.600');
  const toast = useToast();

  const [formData, setFormData] = useState({
    sets: '',
    reps: '',
    contacts: '',
    intensity: '',
    direction: '',
    weight: '',
    distance: '',
    movement_notes: '',
    timed_duration: '' // Add timed_duration to formData
  });

  // Get current exercise data from blocks
  const getCurrentExercise = () => {
    if (!exercise || !blockId) return null;
    const currentBlock = blocks.find(block => block.id === blockId);
    return currentBlock?.exercises.find(ex => ex.instanceId === exercise.instanceId) || null;
  };

  // Update form data when exercise changes or modal opens
  useEffect(() => {
    if (isOpen && exercise) {
      const currentExercise = getCurrentExercise();
      if (currentExercise) {
        setFormData({
          sets: currentExercise.sets || '',
          reps: currentExercise.reps || '',
          contacts: currentExercise.contacts || '',
          intensity: currentExercise.intensity || '',
          direction: currentExercise.direction || '',
          weight: currentExercise.weight || '',
          distance: currentExercise.distance || '',
          movement_notes: currentExercise.movement_notes || '',
          timed_duration: currentExercise.timed_duration && currentExercise.timed_duration > 0 ? currentExercise.timed_duration.toString() : '' // Convert number to string
        });
      }
    }
  }, [exercise, isOpen, blocks, blockId]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!exercise) return;
    
    // Update all fields at once
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          exercises: block.exercises.map(ex => 
            ex.instanceId === exercise.instanceId 
              ? { 
                  ...ex, 
                  sets: formData.sets,
                  reps: formData.reps,
                  contacts: formData.contacts,
                  intensity: formData.intensity,
                  direction: formData.direction,
                  weight: formData.weight,
                  distance: formData.distance,
                  movement_notes: formData.movement_notes,
                  timed_duration: formData.timed_duration && formData.timed_duration !== '' ? parseInt(formData.timed_duration, 10) : undefined // Convert string back to number, undefined if empty
                }
              : ex
          )
        };
      }
      return block;
    });
    
    onUpdateBlocks(updatedBlocks);
    
    // Show success message
    toast({
      title: 'Settings saved!',
      description: `Updated settings for "${exercise.name}"`,
      status: 'success',
      duration: 2000,
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={modalContentBg} borderColor={borderColor}>
        <ModalHeader>Exercise Settings - {exercise?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {exercise && (
            <VStack spacing={4} align="stretch">
              {/* Sets and Reps Row */}
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Sets</FormLabel>
                  <Input
                    value={formData.sets}
                    onChange={(e) => handleFieldChange('sets', e.target.value)}
                    placeholder="e.g. 3"
                    bg={inputBg}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Reps</FormLabel>
                  <Input
                    value={formData.reps}
                    onChange={(e) => handleFieldChange('reps', e.target.value)}
                    placeholder="e.g. 10"
                    bg={inputBg}
                  />
                </FormControl>
              </HStack>

              {/* Contacts and Intensity Row */}
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Contacts</FormLabel>
                  <Input
                    value={formData.contacts}
                    onChange={(e) => handleFieldChange('contacts', e.target.value)}
                    placeholder="e.g. 20"
                    bg={inputBg}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Intensity</FormLabel>
                  <Input
                    value={formData.intensity}
                    onChange={(e) => handleFieldChange('intensity', e.target.value)}
                    placeholder="e.g. 75%"
                    bg={inputBg}
                  />
                </FormControl>
              </HStack>

              {/* Direction and Weight Row */}
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Direction</FormLabel>
                  <Input
                    value={formData.direction}
                    onChange={(e) => handleFieldChange('direction', e.target.value)}
                    placeholder="e.g. Forward"
                    bg={inputBg}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Weight</FormLabel>
                  <Input
                    value={formData.weight}
                    onChange={(e) => handleFieldChange('weight', e.target.value)}
                    placeholder="e.g. 185 lbs"
                    bg={inputBg}
                  />
                </FormControl>
              </HStack>

              {/* Distance */}
              <FormControl>
                <FormLabel fontSize="sm">Distance</FormLabel>
                <Input
                  value={formData.distance}
                  onChange={(e) => handleFieldChange('distance', e.target.value)}
                  placeholder="e.g. 100m"
                  bg={inputBg}
                />
              </FormControl>

              {/* Movement/Notes - Larger text area */}
              <FormControl>
                <FormLabel fontSize="sm">Movement/Notes</FormLabel>
                <Textarea
                  value={formData.movement_notes}
                  onChange={(e) => handleFieldChange('movement_notes', e.target.value)}
                  placeholder="Additional movement notes and instructions..."
                  bg={inputBg}
                  minH="100px"
                  resize="vertical"
                />
              </FormControl>

              {/* Timed Duration */}
              <FormControl>
                <FormLabel fontSize="sm">Timed Duration (seconds)</FormLabel>
                <Input
                  type="number"
                  value={formData.timed_duration}
                  onChange={(e) => handleFieldChange('timed_duration', e.target.value)}
                  placeholder="e.g. 180"
                  min={0}
                  max={3600}
                  bg={inputBg}
                />
              </FormControl>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Exercise Details Modal Component
const ExerciseDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}> = ({ isOpen, onClose, exercise }) => {
  const modalContentBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={modalContentBg} borderColor={borderColor}>
        <ModalHeader>{exercise?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {exercise && (
            <VStack spacing={4} align="stretch">
              <HStack>
                <Tag colorScheme="teal">{exercise.category}</Tag>
                {exercise.difficulty && (
                  <Tag colorScheme="orange">{exercise.difficulty}</Tag>
                )}
              </HStack>
              
              {exercise.description && (
                <Box>
                  <Text fontWeight="semibold" mb={2}>Description</Text>
                  <Text>{exercise.description}</Text>
                </Box>
              )}
              
              {exercise.default_instructions && (
                <Box>
                  <Text fontWeight="semibold" mb={2}>Instructions</Text>
                  <Text>{exercise.default_instructions}</Text>
                </Box>
              )}
              
              {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={2}>Muscle Groups</Text>
                  <HStack wrap="wrap">
                    {exercise.muscle_groups.map(group => (
                      <Tag key={group} size="sm">{group}</Tag>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Step3ExerciseAssignment; 