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
  Library, 
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
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
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
}

const PREDEFINED_CATEGORIES = [
  'Lift',
  'Bodyweight', 
  'Run Interval',
  'Core',
  'Plyometric',
  'Warm-up',
  'Cool-down',
  'Drill',
  'Cardio',
  'Flexibility',
  'Strength',
  'Power',
  'Endurance',
  'Recovery',
  'Custom'
];

const DIFFICULTY_COLORS = {
  'Beginner': 'green',
  'Intermediate': 'yellow',
  'Advanced': 'red'
};

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
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
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (exercise.muscle_groups?.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
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

  return (
    <Box w="100%" bg={bgColor} borderRadius="lg" p={6}>
      {/* Header */}
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <HStack spacing={3} align="center">
              <Library size={28} color="var(--chakra-colors-blue-500)" />
              <Heading size="lg" color={textColor}>{title}</Heading>
            </HStack>
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
          <InputGroup size="lg">
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

          {/* Filters */}
          <HStack spacing={4} wrap="wrap">
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color={subtitleColor}>Category:</Text>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="sm"
                w="150px"
                bg={cardBg}
                borderColor={borderColor}
              >
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </HStack>

            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color={subtitleColor}>Difficulty:</Text>
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                size="sm"
                w="130px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="All">All</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>
            </HStack>

            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color={subtitleColor}>Sort by:</Text>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'created_at')}
                size="sm"
                w="120px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="created_at">Date Added</option>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </HStack>
          </HStack>
        </VStack>

        {/* Results Count */}
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color={subtitleColor}>
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </Text>
        </HStack>

        {/* Exercise Grid */}
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
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                variant="outline"
                bg={exerciseCardBg}
                borderColor={isExerciseSelected(exercise.id) ? 'blue.400' : borderColor}
                borderWidth={isExerciseSelected(exercise.id) ? '2px' : '1px'}
                _hover={{ 
                  bg: exerciseCardHoverBg, 
                  borderColor: 'blue.300',
                  cursor: selectionMode ? 'pointer' : 'default'
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
                        </HStack>
                      </VStack>
                      
                      {!selectionMode && (
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
      </VStack>

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
}; 