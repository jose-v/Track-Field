import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Heading,
  Text,
  IconButton,
  Checkbox,
  CheckboxGroup,
  Stack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Container,
  Divider,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { supabase } from '../../lib/supabase';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { api } from '../../services/api';
import type { Workout, Exercise } from '../../services/api';
import type { WorkoutExtraction } from '../../services/fileProcessingService';

// Interface for exercises from the database
interface DbExercise {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface Athlete {
  id: string;
  full_name?: string;
  name?: string;
}

const TYPE_OPTIONS = ['Strength', 'Running', 'Flexibility', 'Recovery', 'Custom'];

// This type matches the WorkoutFormData from the modal
export type WorkoutFormData = Partial<Omit<Workout, 'exercises' | 'assignedAthletes'> & { id?: string }> & {
  name: string; // Required
  type: string; // Required
  date: string; // Required
  duration: string; // Required
  notes?: string; // Optional
  exercises: Exercise[]; // Required, with full Exercise structure
  assignedAthletes?: string[];
  location?: string;
  file?: File | null; // Kept for potential file upload feature
};

export function CreateWorkout() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const { athletes: coachAthletes, isLoading: athletesLoading } = useCoachAthletes();
  const [isImported, setIsImported] = useState(false);
  
  // New state for database exercises
  const [dbExercises, setDbExercises] = useState<DbExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  
  // State for form fields
  const [name, setName] = useState<string>('');
  const [assignedAthletes, setAssignedAthletes] = useState<string[]>([]);
  const [type, setType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [locationValue, setLocationValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // State for managing exercises
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [currentExerciseInput, setCurrentExerciseInput] = useState<Omit<Exercise, 'id'>>({
    name: '', sets: 1, reps: 1, weight: undefined, rest: undefined, distance: undefined, notes: ''
  });
  const [searchExercise, setSearchExercise] = useState<string>('');

  // Check if we have imported data from the import page
  useEffect(() => {
    const importedData = location.state?.workoutData as WorkoutExtraction | undefined;
    
    if (importedData) {
      console.log('Imported workout data:', importedData);
      setIsImported(true);
      
      // Fill form with imported data
      setName(importedData.name || '');
      setType(importedData.type || '');
      setDate(importedData.date || '');
      setDuration(importedData.duration || '');
      setTime(importedData.time || '');
      setLocationValue(importedData.location || '');
      setNotes(importedData.notes || '');
      
      // Convert imported exercises to the right format
      if (importedData.exercises && importedData.exercises.length > 0) {
        const convertedExercises = importedData.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets || 1,
          reps: ex.reps || 1,
          weight: ex.weight,
          rest: ex.rest,
          distance: ex.distance,
          notes: ex.notes,
        }));
        
        setCurrentExercises(convertedExercises);
      }
      
      // Clean up the location state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
      
      toast({
        title: 'Workout imported',
        description: 'The workout data has been imported from your file. Please review and make any necessary changes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [location.state, toast]);

  // Fetch exercises when component mounts
  useEffect(() => {
    fetchExercises();
  }, []);

  // Function to fetch exercises from Supabase
  const fetchExercises = async () => {
    setIsLoadingExercises(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, description, category')
        .order('name');
      
      if (error) {
        console.error('Error fetching exercises:', error);
        toast({
          title: 'Error fetching exercises',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setDbExercises(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching exercises:', err);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const handleAddExercise = () => {
    if (!currentExerciseInput.name || currentExerciseInput.sets <= 0 || currentExerciseInput.reps <= 0) {
      toast({ 
        title: 'Invalid exercise data', 
        description: 'Exercise name, sets, and reps are required.', 
        status: 'warning' 
      });
      return;
    }
    
    // Find the selected exercise ID if it exists in our database
    const selectedExercise = dbExercises.find(ex => ex.name === currentExerciseInput.name);
    
    setCurrentExercises([...currentExercises, { 
      ...currentExerciseInput,
      id: selectedExercise?.id // Add the exercise ID if it exists in our database
    } as Exercise]);
    
    setCurrentExerciseInput({ 
      name: '', 
      sets: 1, 
      reps: 1, 
      weight: undefined, 
      rest: undefined, 
      distance: undefined, 
      notes: '' 
    });
    setSearchExercise('');
  };

  const handleRemoveExercise = (index: number) => {
    setCurrentExercises(currentExercises.filter((_, i) => i !== index));
  };

  // Filter exercises from the database based on search input
  const filteredExerciseOptions = dbExercises
    .filter(ex => ex.name.toLowerCase().includes(searchExercise.toLowerCase()))
    .map(ex => ex.name);

  const handleSave = async () => {
    // Validation for required fields
    if (!name || !type || !date || !duration || currentExercises.length === 0) {
      toast({ 
        title: 'Please fill all required fields', 
        description: 'Name, Type, Date, Duration, and at least one Exercise are required.', 
        status: 'error' 
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare workout data - match the database schema fields
      const workoutData = {
        name,
        type,
        date,
        duration,
        description: notes || '', // Use description field for notes (matches DB schema)
        exercises: currentExercises,
        time: time || undefined,
        location: locationValue || undefined
      };
      
      // Create the workout
      const newWorkout = await api.workouts.create(workoutData);
      
      // Assign to athletes in a separate call if needed
      if (assignedAthletes && assignedAthletes.length > 0 && newWorkout?.id) {
        await api.athleteWorkouts.assign(newWorkout.id, assignedAthletes);
      }
      
      toast({
        title: 'Workout created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Navigate back to workouts page
      navigate('/coach/workouts');
    } catch (err: any) {
      console.error("Error saving workout:", err);
      // Show more detailed error message
      toast({ 
        title: 'Error creating workout', 
        description: err.message || 'Please try again or check console for details.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box py={8}>
      <Container maxW="container.lg">
        {/* Breadcrumb navigation */}
        <Breadcrumb 
          spacing="8px" 
          separator={<ChevronRightIcon color="gray.500" />}
          mb={6}
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/coach/workouts">
              Workouts
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Create New Workout</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <HStack mb={6} spacing={4} align="center">
          <Button 
            leftIcon={<FaArrowLeft />} 
            variant="outline" 
            onClick={() => navigate('/coach/workouts')}
          >
            Back to Workouts
          </Button>
          <Heading size="lg">Create New Workout</Heading>
        </HStack>
        
        {/* Show an alert if this workout was imported from a file */}
        {isImported && (
          <Alert status="info" mb={6} borderRadius="md">
            <AlertIcon />
            <Text>
              This workout was imported from a file. Please review and adjust the details as needed before saving.
            </Text>
          </Alert>
        )}

        <VStack spacing={8} align="stretch">
          {/* Basic workout details section */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>Workout Details</Heading>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Workout Name</FormLabel>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., Morning Run, Leg Day"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  placeholder="Select workout type"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Select>
              </FormControl>
              
              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Date</FormLabel>
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                  />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Time (Optional)</FormLabel>
                  <Input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                  />
                </FormControl>
              </HStack>
              
              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Duration</FormLabel>
                  <Input 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 45 minutes, 1 hour" 
                  />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Location (Optional)</FormLabel>
                  <Input 
                    value={locationValue} 
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="e.g., Gym, Home, Track" 
                  />
                </FormControl>
              </HStack>
            </VStack>
          </Box>

          {/* Exercises Section */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4} display="flex" justifyContent="space-between" alignItems="center">
              <span>Exercises</span>
              <Badge colorScheme="blue">Total: {currentExercises.length}</Badge>
            </Heading>
            
            {/* List of added exercises */}
            {currentExercises.length > 0 ? (
              <Box mb={6}>
                <Heading size="sm" mb={3}>Workout Exercise List</Heading>
                <VStack 
                  spacing={4} 
                  align="stretch" 
                  maxHeight="400px" 
                  overflowY="auto"
                  borderWidth="1px"
                  borderRadius="md"
                  p={3}
                >
                  {currentExercises.map((ex, index) => (
                    <HStack 
                      key={index} 
                      justify="space-between" 
                      p={3} 
                      borderWidth="1px"
                      borderRadius="md"
                      _hover={{ bg: "gray.50" }}
                    >
                      <Box>
                        <HStack mb={1}>
                          <Badge colorScheme="blue">{index + 1}</Badge>
                          <Text fontWeight="bold">{ex.name}</Text>
                        </HStack>
                        <HStack spacing={4} fontSize="sm" color="gray.600">
                          <Text>{ex.sets} sets × {ex.reps} reps</Text>
                          {ex.weight && <Text>{ex.weight} kg</Text>}
                          {ex.distance && <Text>{ex.distance} m</Text>}
                          {ex.rest && <Text>Rest: {ex.rest}s</Text>}
                        </HStack>
                        {ex.notes && (
                          <Text fontSize="xs" color="gray.500" mt={1} fontStyle="italic">
                            Note: {ex.notes}
                          </Text>
                        )}
                      </Box>
                      <IconButton 
                        icon={<FaTrash />} 
                        size="sm" 
                        aria-label="Remove exercise" 
                        onClick={() => handleRemoveExercise(index)}
                        colorScheme="red"
                        variant="ghost"
                      />
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ) : (
              <Box 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                borderStyle="dashed" 
                borderColor="gray.300" 
                bg="gray.50" 
                textAlign="center"
                mb={6}
              >
                <Text color="gray.500">
                  No exercises added yet. Use the form below to add exercises to your workout.
                </Text>
              </Box>
            )}
            
            {/* Add Exercise Form */}
            <Box 
              borderWidth="1px" 
              borderRadius="md" 
              p={4} 
              bg="gray.50"
            >
              <Heading size="sm" mb={4}>Add a New Exercise</Heading>
              
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>1. Search or select an exercise</FormLabel>
                  <Input 
                    placeholder="Type to search exercises or enter your own..." 
                    value={currentExerciseInput.name || searchExercise}
                    onChange={e => {
                      const value = e.target.value;
                      setSearchExercise(value);
                      setCurrentExerciseInput(prev => ({ ...prev, name: value }));
                    }}
                    bg="white"
                  />
                  {searchExercise && searchExercise.length > 0 && filteredExerciseOptions.length > 0 && (
                    <Box 
                      borderWidth="1px" 
                      borderRadius="md" 
                      mt={1} 
                      maxHeight="200px" 
                      overflowY="auto" 
                      boxShadow="sm"
                      bg="white"
                    >
                      {filteredExerciseOptions.map(opt => (
                        <Box 
                          key={opt} 
                          p={2} 
                          _hover={{ bg: "blue.50"}} 
                          cursor="pointer" 
                          onClick={() => {
                            setCurrentExerciseInput(prev => ({ ...prev, name: opt }));
                            setSearchExercise(opt);
                            setTimeout(() => {
                              setSearchExercise("");
                              setCurrentExerciseInput(prev => ({ ...prev, name: opt }));
                            }, 10);
                          }}
                          bg={currentExerciseInput.name === opt ? "blue.50" : "white"}
                        >
                          {opt}
                        </Box>
                      ))}
                    </Box>
                  )}
                </FormControl>
                
                <Divider />
                
                <Heading size="xs">2. Set details</Heading>
                
                <HStack spacing={6}>
                  <FormControl flex={1}>
                    <FormLabel>Sets</FormLabel>
                    <Input 
                      type="number" 
                      value={currentExerciseInput.sets} 
                      onChange={e => setCurrentExerciseInput(prev => ({ 
                        ...prev, 
                        sets: parseInt(e.target.value) || 1 
                      }))}
                      bg="white"
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Reps</FormLabel>
                    <Input 
                      type="number" 
                      value={currentExerciseInput.reps} 
                      onChange={e => setCurrentExerciseInput(prev => ({ 
                        ...prev, 
                        reps: parseInt(e.target.value) || 1 
                      }))}
                      bg="white"
                    />
                  </FormControl>
                </HStack>
                
                <HStack spacing={6}>
                  <FormControl flex={1}>
                    <FormLabel>Weight (kg) - Optional</FormLabel>
                    <Input 
                      type="number" 
                      placeholder="Optional" 
                      value={currentExerciseInput.weight || ''} 
                      onChange={e => setCurrentExerciseInput(prev => ({ 
                        ...prev, 
                        weight: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      bg="white"
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Rest (sec) - Optional</FormLabel>
                    <Input 
                      type="number" 
                      placeholder="Optional" 
                      value={currentExerciseInput.rest || ''} 
                      onChange={e => setCurrentExerciseInput(prev => ({ 
                        ...prev, 
                        rest: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      bg="white"
                    />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormLabel>Distance (m) - Optional</FormLabel>
                  <Input 
                    type="number" 
                    placeholder="Optional" 
                    value={currentExerciseInput.distance || ''} 
                    onChange={e => setCurrentExerciseInput(prev => ({ 
                      ...prev, 
                      distance: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    bg="white"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>3. Notes (optional)</FormLabel>
                  <Textarea 
                    placeholder="Any specific instructions for this exercise..." 
                    value={currentExerciseInput.notes || ''} 
                    onChange={e => setCurrentExerciseInput(prev => ({
                      ...prev, 
                      notes: e.target.value
                    }))}
                    rows={2}
                    bg="white"
                  />
                </FormControl>
                
                <Button 
                  colorScheme="teal" 
                  onClick={handleAddExercise} 
                  leftIcon={<FaPlus />}
                  isDisabled={!currentExerciseInput.name}
                  isLoading={isLoadingExercises}
                  size="lg"
                  mt={2}
                >
                  ADD THIS EXERCISE TO WORKOUT
                </Button>
              </VStack>
            </Box>
          </Box>

          {/* Athlete Assignments & Notes Section */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="md"
          >
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel fontWeight="medium">Assign to Athlete(s)</FormLabel>
                {/* Using CheckboxGroup for multi-select of athletes */}
                <CheckboxGroup value={assignedAthletes} onChange={(values: string[]) => setAssignedAthletes(values)}>
                  <Stack 
                    direction="column" 
                    spacing={2} 
                    maxHeight="300px" 
                    overflowY="auto" 
                    borderWidth="1px" 
                    borderRadius="md" 
                    p={3}
                  >
                    {athletesLoading ? (
                      <Text>Loading athletes...</Text>
                    ) : coachAthletes && coachAthletes.length > 0 ? (
                      coachAthletes.map((a) => (
                        <Checkbox key={a.id} value={a.id}>
                          {a.full_name || a.name}
                        </Checkbox>
                      ))
                    ) : (
                      <Text color="gray.500">No athletes available for assignment.</Text>
                    )}
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium">Workout Notes</FormLabel>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Overall workout notes, instructions or comments..." 
                  rows={4}
                />
              </FormControl>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <HStack spacing={4} justify="flex-end" mt={6}>
            <Button 
              variant="outline" 
              onClick={() => navigate('/coach/workouts')}
              size="lg"
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSave} 
              isLoading={isSaving}
              loadingText="Creating Workout..."
              size="lg"
            >
              Create Workout
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}

export default CreateWorkout; 