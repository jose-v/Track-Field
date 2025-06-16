import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  useColorModeValue,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Flex,
  Select,
  Tooltip,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter, 
  ChevronDown,
  BookOpen,
  Dumbbell
} from 'lucide-react';
import { ExerciseModal } from './ExerciseModal';

export interface Exercise {
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
  created_by_name?: string; // For attribution
  sharing_info?: string; // For filtering (Private, Team, Public, System)
}

interface ExerciseLibraryProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onUpdateExercise: (id: string, exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
  isLoading?: boolean;
  showAddButton?: boolean;
  title?: string;
  subtitle?: string;
  onExerciseSelect?: (exercise: Exercise) => void;
  selectionMode?: boolean;
  selectedExercises?: string[];
  currentUserId?: string; // For filtering "mine" exercises
  userTeams?: Array<{ id: string; name: string }>; // For filtering team exercises
  onAddButtonClick?: (openModal: () => void) => void; // Expose the add button click function
}

const PREDEFINED_CATEGORIES = [
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

const SOURCE_COLORS = {
  'system': 'blue',
  'public': 'green', 
  'mine': 'purple',
  'team': 'orange'
};

const DIFFICULTY_COLORS = {
  'Beginner': 'green',
  'Intermediate': 'yellow',
  'Advanced': 'red'
};

export interface ExerciseLibraryRef {
  openAddModal: () => void;
}

export const ExerciseLibrary = forwardRef<ExerciseLibraryRef, ExerciseLibraryProps>(({
  exercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  isLoading = false,
  showAddButton = true,
  title = "Exercise Library",
  subtitle = "Manage your custom exercises",
  onExerciseSelect,
  selectionMode = false,
  selectedExercises = [],
  currentUserId,
  userTeams,
  onAddButtonClick,
}, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const searchIconColor = useColorModeValue('gray.400', 'gray.500');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.600');
  const exerciseCardHoverBg = useColorModeValue('gray.100', 'gray.500');
  const emptyStateColor = useColorModeValue('gray.500', 'gray.400');

  // Get unique categories from exercises
  const availableCategories = ['All', ...Array.from(new Set(exercises.map(ex => ex.category)))];

  // Filter and sort exercises
  const filteredExercises = exercises
    .filter(exercise => {
              // Exercise filtering logic
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        matchesSource = exercise.is_system_exercise === false && exercise.user_id === currentUserId;
      } else if (selectedSource === 'team') {
        // Team exercises: exercises shared with user's teams (including ones created by the user)
        const userTeamIds = userTeams?.map(team => team.id) || [];
        matchesSource = exercise.is_system_exercise === false && 
                       exercise.is_public === false && 
                       exercise.organization_id && 
                       userTeamIds.includes(exercise.organization_id);
      }
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesSource;
    })
    .sort((a, b) => {
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

  const handleAddExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    try {
      await onAddExercise(exerciseData);
      onAddClose();
      toast({
        title: 'Exercise added',
        description: `${exerciseData.name} has been added to your library.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error adding exercise',
        description: 'There was an error adding the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    onEditOpen();
  };

  const handleUpdateExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    if (!editingExercise) return;
    
    try {
      await onUpdateExercise(editingExercise.id, exerciseData);
      onEditClose();
      setEditingExercise(null);
      toast({
        title: 'Exercise updated',
        description: `${exerciseData.name} has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating exercise',
        description: 'There was an error updating the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setDeletingExercise(exercise);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deletingExercise) return;
    
    try {
      await onDeleteExercise(deletingExercise.id);
      onDeleteClose();
      setDeletingExercise(null);
      toast({
        title: 'Exercise deleted',
        description: `${deletingExercise.name} has been removed from your library.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting exercise',
        description: 'There was an error deleting the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    if (selectionMode && onExerciseSelect) {
      onExerciseSelect(exercise);
    }
  };

  const isExerciseSelected = (exerciseId: string) => {
    return selectedExercises.includes(exerciseId);
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={textColor}>Loading exercises...</Text>
        </VStack>
      </Center>
    );
  }

  useImperativeHandle(ref, () => ({
    openAddModal: onAddOpen,
  }));

  return (
    <Box w="100%" h="100%" display="flex" flexDirection="column" minH="0">
      {/* Fixed Header */}
      <Box p={6} pb={4} flexShrink={0}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color={textColor}>{title}</Heading>
              <Text color={subtitleColor} fontSize="md">{subtitle}</Text>
            </VStack>
            
            {showAddButton && (
              <Button
                leftIcon={<Plus size={20} />}
                colorScheme="blue"
                onClick={onAddOpen}
                size="lg"
              >
                Add Exercise
              </Button>
            )}
          </HStack>

          {/* Search and Filters */}
          <VStack spacing={4} align="stretch">
            {/* Search Bar */}
            <HStack spacing={2}>
              <InputGroup size="lg" flex="1">
                <InputLeftElement pointerEvents="none">
                  <Search size={20} color={searchIconColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search exercises by name, description, or muscle group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={cardBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                />
              </InputGroup>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                minW="48px"
                w="48px"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </HStack>

            {/* Filters */}
            <HStack spacing={2} wrap="nowrap" w="555px">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="sm"
                w="137px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="All">All Categories</option>
                {availableCategories.filter(cat => cat !== 'All').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>

              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                size="sm"
                w="126px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>

              <Select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                size="sm"
                w="126px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="all">All Sources</option>
                <option value="system">System</option>
                <option value="public">Public</option>
                {userTeams && userTeams.length > 0 && (
                  <option value="team">Team</option>
                )}
                <option value="mine">Mine</option>
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'created_at')}
                size="sm"
                w="122px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="created_at">Date Added</option>
              </Select>
            </HStack>
          </VStack>

          {/* Results Count */}
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color={subtitleColor}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Scrollable Content Area */}
      <Box flex="1" overflow="auto" px={6} pb={6} minH="0">
        {filteredExercises.length === 0 ? (
          <Center py={16}>
            <VStack spacing={4}>
              <BookOpen size={64} color={emptyStateColor} />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold" color={emptyStateColor}>
                  {searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All' 
                    ? 'No exercises match your filters' 
                    : 'No exercises in your library yet'
                  }
                </Text>
                <Text fontSize="md" color={emptyStateColor} textAlign="center" maxW="400px">
                  {searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All'
                    ? 'Try adjusting your search terms or filters to find exercises.'
                    : 'Start building your exercise library by adding your first custom exercise.'
                  }
                </Text>
              </VStack>
              {showAddButton && !searchTerm && selectedCategory === 'All' && selectedDifficulty === 'All' && (
                <Button
                  leftIcon={<Plus size={20} />}
                  colorScheme="blue"
                  onClick={onAddOpen}
                  mt={4}
                >
                  Add Your First Exercise
                </Button>
              )}
            </VStack>
          </Center>
        ) : selectionMode ? (
          // Selection mode: Full-width list layout for workout creator
          <VStack spacing={2} align="stretch">
            {filteredExercises.map((exercise) => {
              const isAlreadySelected = isExerciseSelected(exercise.id);
              
              // Dark mode aware selected colors
              const selectedBg = useColorModeValue('blue.50', 'blue.900');
              const selectedHoverBg = useColorModeValue('blue.100', 'blue.800');
              const selectedBorderColor = useColorModeValue('blue.400', 'blue.300');
              const selectedTextColor = useColorModeValue('blue.800', 'blue.100');
              
              return (
                <Card
                  key={exercise.id}
                  variant="outline"
                  bg={isAlreadySelected ? selectedBg : exerciseCardBg}
                  borderColor={isAlreadySelected ? selectedBorderColor : borderColor}
                  borderWidth={isAlreadySelected ? '2px' : '1px'}
                  _hover={{ 
                    bg: isAlreadySelected ? selectedHoverBg : exerciseCardHoverBg, 
                    borderColor: selectedBorderColor,
                    cursor: 'pointer'
                  }}
                  transition="all 0.2s"
                  onClick={() => handleExerciseClick(exercise)}
                  opacity={1}
                >
                  <CardBody p={3}>
                    <HStack justify="space-between" align="center" spacing={4}>
                      <VStack align="start" spacing={1} flex="1">
                        <HStack spacing={2} align="center">
                          <Text fontWeight="bold" fontSize="sm" color={isAlreadySelected ? selectedTextColor : textColor}>
                            {exercise.name}
                          </Text>
                          <Tag size="sm" colorScheme="blue" variant="subtle">
                            {exercise.category}
                          </Tag>
                          {exercise.difficulty && (
                            <Badge 
                              size="sm" 
                              colorScheme={DIFFICULTY_COLORS[exercise.difficulty]}
                              variant="subtle"
                            >
                              {exercise.difficulty}
                            </Badge>
                          )}
                          {/* Source Badge */}
                          {exercise.is_system_exercise ? (
                            <Badge size="sm" colorScheme="blue" variant="solid">
                              System
                            </Badge>
                          ) : exercise.is_public ? (
                            <Badge size="sm" colorScheme="green" variant="solid">
                              Public
                            </Badge>
                          ) : exercise.organization_id ? (
                            <Badge size="sm" colorScheme="orange" variant="solid">
                              Team
                            </Badge>
                          ) : (
                            <Badge size="sm" colorScheme="purple" variant="solid">
                              Mine
                            </Badge>
                          )}
                          {isAlreadySelected && (
                            <Badge size="sm" colorScheme="green" variant="solid">
                              ✓ Added
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="xs" color={isAlreadySelected ? selectedTextColor : subtitleColor} noOfLines={1}>
                          {exercise.description}
                        </Text>
                      </VStack>
                      
                      {!isAlreadySelected && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExerciseClick(exercise);
                          }}
                          leftIcon={<Plus size={14} />}
                        >
                          Add
                        </Button>
                      )}
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
          </VStack>
        ) : (
          // Regular mode: Grid layout for exercise library management
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                variant="outline"
                bg={exerciseCardBg}
                borderColor={borderColor}
                borderWidth="1px"
                _hover={{ 
                  bg: exerciseCardHoverBg, 
                  borderColor: 'blue.300'
                }}
                transition="all 0.2s"
                onClick={() => handleExerciseClick(exercise)}
              >
                <CardBody p={4}>
                  <VStack spacing={3} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontWeight="bold" fontSize="md" color={textColor} noOfLines={1}>
                          {exercise.name}
                        </Text>
                        <HStack spacing={2}>
                          <Tag size="sm" colorScheme="blue" variant="subtle">
                            {exercise.category}
                          </Tag>
                          {exercise.difficulty && (
                            <Badge 
                              size="sm" 
                              colorScheme={DIFFICULTY_COLORS[exercise.difficulty]}
                              variant="subtle"
                            >
                              {exercise.difficulty}
                            </Badge>
                          )}
                          {/* Source Badge */}
                          {exercise.is_system_exercise ? (
                            <Badge size="sm" colorScheme="blue" variant="solid">
                              System
                            </Badge>
                          ) : exercise.is_public ? (
                            <Badge size="sm" colorScheme="green" variant="solid">
                              Public
                            </Badge>
                          ) : exercise.organization_id ? (
                            <Badge size="sm" colorScheme="orange" variant="solid">
                              Team
                            </Badge>
                          ) : (
                            <Badge size="sm" colorScheme="purple" variant="solid">
                              Mine
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                      
                      {!exercise.is_system_exercise && exercise.user_id === currentUserId && (
                        <HStack spacing={1}>
                          <Tooltip label="Edit exercise">
                            <IconButton
                              icon={<Edit3 size={16} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              aria-label="Edit exercise"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditExercise(exercise);
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Delete exercise">
                            <IconButton
                              icon={<Trash2 size={16} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              aria-label="Delete exercise"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(exercise);
                              }}
                            />
                          </Tooltip>
                        </HStack>
                      )}
                    </HStack>

                    {/* Description */}
                    <Text fontSize="sm" color={subtitleColor} noOfLines={3}>
                      {exercise.description}
                    </Text>

                    {/* Muscle Groups */}
                    {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                      <HStack spacing={1} wrap="wrap">
                        {exercise.muscle_groups.slice(0, 3).map((muscle, index) => (
                          <Tag key={index} size="xs" variant="outline" colorScheme="gray">
                            {muscle}
                          </Tag>
                        ))}
                        {exercise.muscle_groups.length > 3 && (
                          <Text fontSize="xs" color={subtitleColor}>
                            +{exercise.muscle_groups.length - 3} more
                          </Text>
                        )}
                      </HStack>
                    )}

                    {/* Equipment */}
                    {exercise.equipment && exercise.equipment.length > 0 && (
                      <HStack spacing={1}>
                        <Dumbbell size={14} color={subtitleColor} />
                        <Text fontSize="xs" color={subtitleColor}>
                          {exercise.equipment.slice(0, 2).join(', ')}
                          {exercise.equipment.length > 2 && ` +${exercise.equipment.length - 2} more`}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Add Exercise Modal */}
      <ExerciseModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onSave={handleAddExercise}
        title="Add New Exercise"
        categories={PREDEFINED_CATEGORIES}
      />

      {/* Edit Exercise Modal */}
      <ExerciseModal
        isOpen={isEditOpen}
        onClose={() => {
          onEditClose();
          setEditingExercise(null);
        }}
        onSave={handleUpdateExercise}
        title="Edit Exercise"
        categories={PREDEFINED_CATEGORIES}
        initialData={editingExercise || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Exercise
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{deletingExercise?.name}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}); 