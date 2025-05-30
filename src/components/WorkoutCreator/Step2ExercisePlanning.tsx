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
  useDisclosure,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import { Search, PlusCircle, X, Library, FileText, Moon, Plus } from 'lucide-react';

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

interface Step2ExercisePlanningProps {
  exercises: Exercise[];
  selectedExercises: SelectedExercise[];
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (instanceId: string) => void;
  onUpdateExercise: (instanceId: string, field: string, value: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  currentDay: string;
  setCurrentDay: (day: string) => void;
  templateType: 'single' | 'weekly';
  isRestDay: boolean;
  customExercises: Exercise[];
  onAddCustomExercise: (exercise: Omit<Exercise, 'id'>) => void;
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

const Step2ExercisePlanning: React.FC<Step2ExercisePlanningProps> = ({
  exercises,
  selectedExercises,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  currentDay,
  setCurrentDay,
  templateType,
  isRestDay,
  customExercises,
  onAddCustomExercise,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');

  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
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

  // Get current day name for heading
  const currentDayName = DAYS_OF_WEEK.find(d => d.value === currentDay)?.label || 'Day';
  const workoutHeading = templateType === 'weekly' ? `${currentDayName} Exercises` : 'Workout Exercises';

  return (
    <Box w="100%" mb={0} bg={cardBg}>
      <HStack spacing={4} align="start" w="100%" height="calc(100vh - 400px)">
        {/* Left Panel: Exercise Library */}
        <Card flex="1" height="100%" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
          <CardHeader pb={3}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <HStack spacing={3} align="baseline">
                  <Box display="flex" alignItems="center">
                    <Library size={29} color="var(--chakra-colors-blue-500)" />
                  </Box>
                  <Heading size="lg" color={libraryHeadingColor}>Exercise Library</Heading>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<Plus size={16} />}
                  onClick={onOpen}
                >
                  Add Exercise
                </Button>
              </HStack>
              
              {/* Search */}
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <Search size={20} color={searchIconColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search exercises by name, category, or muscle group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderWidth="1px"
                  _focus={{ borderColor: "blue.400", shadow: "sm" }}
                  bg={cardBg}
                  borderColor={borderColor}
                  color={textColor}
                />
              </InputGroup>

              {/* Category Filters */}
              <HStack spacing={2} flexWrap="wrap">
                {EXERCISE_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? 'solid' : 'outline'}
                    colorScheme={selectedCategory === category ? 'blue' : 'gray'}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </CardHeader>
          
          <CardBody pt={0} flex="1" overflow="hidden" display="flex" flexDirection="column">
            <Box flex="1" overflow="auto" pr={2}>
              {filteredExercises.length === 0 ? (
                <VStack spacing={4} py={8} textAlign="center">
                  <div style={{ fontSize: '48px', opacity: 0.5 }}>🔍</div>
                  <Text color={noExercisesTextColor} fontSize="md" fontWeight="medium">
                    No exercises found
                  </Text>
                  <Text color={noExercisesSubtextColor} fontSize="sm">
                    Try adjusting your search or category filter
                  </Text>
                </VStack>
              ) : (
                <VStack spacing={2} align="stretch">
                  {filteredExercises.map((exercise) => {
                    const isAlreadyAdded = selectedExercises.some(ex => ex.id === exercise.id);
                    
                    return (
                      <Card
                        key={exercise.id}
                        variant="outline"
                        shadow="none"
                        bg={isAlreadyAdded ? libraryExerciseAddedBg : libraryExerciseCardBg}
                        borderColor={isAlreadyAdded ? libraryExerciseAddedBorderColor : libraryExerciseCardBorderColor}
                        borderWidth="1px"
                        cursor={isAlreadyAdded ? "not-allowed" : "pointer"}
                        opacity={isAlreadyAdded ? 0.7 : 1}
                        onClick={() => !isAlreadyAdded && onAddExercise(exercise)}
                        _hover={{ 
                          borderColor: isAlreadyAdded ? undefined : "blue.200"
                        }}
                        transition="all 0.2s"
                        size="sm"
                      >
                        <CardBody px={4} pt={4} pb={2}>
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={2} flex="1">
                              <HStack flexWrap="wrap">
                                <Text fontWeight="bold" fontSize="md" color={libraryExerciseNameColor}>
                                  {exercise.name}
                                </Text>
                                <Tag size="sm" colorScheme="teal" variant="subtle">
                                  {exercise.category}
                                </Tag>
                                {isAlreadyAdded && (
                                  <Tag size="sm" colorScheme="green" variant="solid">
                                    ✓ Added
                                  </Tag>
                                )}
                              </HStack>
                              <Text fontSize="sm" color={libraryExerciseDescColor} lineHeight="short">
                                {exercise.description}
                              </Text>
                            </VStack>
                            {!isAlreadyAdded && (
                              <Button
                                size="sm"
                                colorScheme="gray"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddExercise(exercise);
                                }}
                                leftIcon={<PlusCircle size={14} />}
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
              )}
            </Box>
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
                <VStack spacing={2} align="stretch">
                  {selectedExercises.map((exercise, index) => (
                    <Card 
                      key={exercise.instanceId} 
                      variant="outline"
                      shadow="none"
                      bg={exerciseCardBg}
                      borderWidth="1px"
                      borderColor={exerciseCardBorderColor}
                      _hover={{ borderColor: exerciseCardHoverBorderColor }}
                      transition="all 0.2s"
                      size="sm"
                    >
                      <CardBody px={4} pt={4} pb={2}>
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between" align="start">
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
                  ))}
                </VStack>
              )}
            </Box>
          </CardBody>
        </Card>
      </HStack>

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