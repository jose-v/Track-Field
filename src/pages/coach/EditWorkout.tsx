import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, VStack, FormControl, FormLabel, Input, Select, 
  Button, useToast, HStack, IconButton, useDisclosure, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Switch, Checkbox, Flex, Divider, Textarea, Tag, Spinner, Progress,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Alert, AlertIcon, AlertTitle, AlertDescription,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  List, ListItem, Center
} from '@chakra-ui/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaPlus, FaTrash, FaArrowLeft, FaSave, FaSync, FaCheck } from 'react-icons/fa';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import type { Workout as ApiWorkout, Exercise } from '../../services/api';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workoutStore';
import { ProgressBar } from '../../components/ProgressBar';

// Type representing an athlete assignment with their progress
interface AthleteAssignment {
  athlete_id: string;
  workout_id: string;
  status: string;
  assigned_at?: string;
  athlete_name?: string;
}

// Extended Exercise type with optional ID field
interface ExtendedExercise extends Exercise {
  id?: string;
}

// Interface for exercises from the database
interface DbExercise {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

export function EditWorkout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { updateWorkout, isLoading: isWorkoutLoading } = useWorkouts();
  const { athletes, isLoading: isAthletesLoading } = useCoachAthletes();
  const workoutStore = useWorkoutStore();
  
  // State for the workout form
  const [workout, setWorkout] = useState<ApiWorkout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // State for exercises
  const [exercises, setExercises] = useState<ExtendedExercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<ExtendedExercise | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  // Add new state for database exercises
  const [dbExercises, setDbExercises] = useState<DbExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [searchExercise, setSearchExercise] = useState<string>('');
  
  // State for assignments and progress
  const [assignments, setAssignments] = useState<AthleteAssignment[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  
  // Check if user is accessing from athlete route
  const isAthleteRoute = location.pathname.startsWith('/athlete/');
  
  // Fetch the workout data on component mount
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) {
        toast({
          title: 'Error',
          description: 'No workout ID provided',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/coach/workouts');
        return;
      }
      
      try {
        setIsFetching(true);
        
        // Get workout details
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (workoutError) {
          throw workoutError;
        }
        
        if (!workoutData) {
          throw new Error('Workout not found');
        }
        
        setWorkout(workoutData as ApiWorkout);
        setExercises(workoutData.exercises || []);
        
        // Get assignments for this workout
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('athlete_workouts')
          .select('*')
          .eq('workout_id', id);
          
        if (assignmentError) {
          throw assignmentError;
        }
        
        // If we have athlete data, add names to assignments
        if (athletes && athletes.length > 0) {
          const assignmentsWithNames = (assignmentData || []).map(assignment => {
            const athlete = athletes.find(a => a.id === assignment.athlete_id);
            return {
              ...assignment,
              athlete_name: athlete ? (athlete.full_name || athlete.name) : 'Unknown Athlete'
            };
          });
          
          setAssignments(assignmentsWithNames);
          setSelectedAthletes(assignmentsWithNames.map(a => a.athlete_id));
        } else {
          setAssignments(assignmentData || []);
          setSelectedAthletes((assignmentData || []).map(a => a.athlete_id));
        }
        
        // Sync workout progress to make sure UI is consistent
        syncWorkoutProgress(id);
      } catch (error) {
        console.error('Error fetching workout:', error);
        toast({
          title: 'Error fetching workout',
          description: 'There was an error loading the workout. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/coach/workouts');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchWorkout();
  }, [id, navigate, toast, athletes]);
  
  // Function to sync workout progress between DB and workoutStore
  const syncWorkoutProgress = async (workoutId: string) => {
    try {
      if (!workout) return;

      const totalExercises = exercises.length;
      
      // Get assignments with progress data
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('athlete_workouts')
        .select('athlete_id, status')
        .eq('workout_id', workoutId);
        
      if (assignmentError) throw assignmentError;
      if (!assignmentData || assignmentData.length === 0) return;
      
      // Reset the workoutStore for this workout
      workoutStore.resetProgress(workoutId);
      
      // Update the workoutStore with the database progress data
      for (const assignment of assignmentData) {
        // If workout is completed, we need to check if exercises were added
        if (assignment.status === 'completed') {
          // Update the status to account for new exercises if they were added
          if (workout.exercises && workout.exercises.length !== exercises.length) {
            // Update the database assignment status to in_progress if exercises were added
            const { error } = await supabase
              .from('athlete_workouts')
              .update({ status: 'in_progress' })
              .eq('workout_id', workoutId)
              .eq('athlete_id', assignment.athlete_id);
              
            if (error) {
              console.error('Error updating assignment status:', error);
            }
            
            // Mark all original exercises as completed in the workoutStore
            const originalExerciseCount = workout.exercises?.length || 0;
            for (let i = 0; i < originalExerciseCount; i++) {
              workoutStore.markExerciseCompleted(workoutId, i);
            }
            
            // Update progress ratio
            workoutStore.updateProgress(workoutId, originalExerciseCount, totalExercises);
          } else {
            // If no exercises were added/removed, keep original completed status
            for (let i = 0; i < totalExercises; i++) {
              workoutStore.markExerciseCompleted(workoutId, i);
            }
            workoutStore.updateProgress(workoutId, totalExercises, totalExercises);
          }
        }
        // Just initialize with zero completed for non-completed workouts
        else {
          workoutStore.updateProgress(workoutId, 0, totalExercises);
        }
      }
    } catch (error) {
      console.error('Error syncing workout progress:', error);
    }
  };
  
  // Function to handle updating progress for added exercises
  const updateProgressForAddedExercises = async () => {
    if (!workout || !id) return;
    
    // Compare original and current exercise counts
    const originalExerciseCount = workout.exercises?.length || 0;
    const currentExerciseCount = exercises.length;
    
    // If exercises were added to a completed workout, update assignments
    if (currentExerciseCount > originalExerciseCount) {
      try {
        console.log(`Exercises added: ${currentExerciseCount - originalExerciseCount}`);
        
        // Get assignments for this workout
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('athlete_workouts')
          .select('athlete_id, status')
          .eq('workout_id', id)
          .eq('status', 'completed');
          
        if (assignmentError) throw assignmentError;
        if (!assignmentData || assignmentData.length === 0) return;
        
        console.log(`Found ${assignmentData.length} completed assignments to update`);
        
        // Update assignments to 'in_progress' since exercises were added
        for (const assignment of assignmentData) {
          const { error } = await supabase
            .from('athlete_workouts')
            .update({ 
              status: 'in_progress',
              updated_at: new Date().toISOString() 
            })
            .eq('athlete_id', assignment.athlete_id)
            .eq('workout_id', id);
            
          if (error) {
            console.error(`Error updating assignment for athlete ${assignment.athlete_id}:`, error);
          }
        }
        
        // Update the workout store to reflect the new exercises
        await syncWorkoutProgress(id);
      } catch (error) {
        console.error('Error updating progress for added exercises:', error);
      }
    }
  };
  
  // Handle save
  const handleSave = async () => {
    if (!workout || !id) return;
    
    try {
      setIsSaving(true);
      
      // Prepare updated workout data
      const updatedWorkout: Partial<ApiWorkout> = {
        ...workout,
        exercises
      };
      
      // Save workout changes
      await updateWorkout({ id, workout: updatedWorkout });
      
      // Check if exercises were added to a completed workout and update progress accordingly
      await updateProgressForAddedExercises();
      
      // Update athlete assignments
      const currentAssignedAthletes = assignments.map(a => a.athlete_id);
      
      // Determine athletes to add or remove
      const athletesToAdd = selectedAthletes.filter(id => !currentAssignedAthletes.includes(id));
      const athletesToRemove = currentAssignedAthletes.filter(id => !selectedAthletes.includes(id));
      
      // Add new athletes
      if (athletesToAdd.length > 0) {
        await api.athleteWorkouts.assign(id, athletesToAdd);
      }
      
      // Remove athletes (no bulk remove endpoint, so do one by one)
      for (const athleteId of athletesToRemove) {
        // Delete the assignment
        const { error } = await supabase
          .from('athlete_workouts')
          .delete()
          .eq('workout_id', id)
          .eq('athlete_id', athleteId);
          
        if (error) {
          console.error(`Error removing athlete ${athleteId}:`, error);
        }
      }
      
      // Sync the workout progress after updating assignments
      await syncWorkoutProgress(id);
      
      toast({
        title: 'Workout updated',
        description: 'The workout has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Navigate back to workouts list
      navigate('/coach/workouts');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast({
        title: 'Error updating workout',
        description: 'There was an error updating the workout. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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

  // Load exercises when the modal opens
  useEffect(() => {
    if (showExerciseModal) {
      fetchExercises();
    }
  }, [showExerciseModal]);

  // Filter exercises from the database based on search input
  const filteredExerciseOptions = dbExercises
    .filter(ex => ex.name.toLowerCase().includes((searchExercise || '').toLowerCase()))
    .map(ex => ex.name);

  // Handle adding a new exercise
  const handleAddExercise = async () => {
    if (isAthleteRoute) {
      // If they're an athlete, redirect to coach portal
      toast({
        title: "Coach Portal Required",
        description: "Please use the coach portal to add exercises",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to coach portal
      navigate(`/coach/workouts/edit/${id}`);
      return;
    }
    
    // For coaches, fetch exercises from database and show the exercise modal
    try {
      // Fetch the latest exercises from the database
      await fetchExercises();
      
      // Open the exercise modal with empty values to select from database
      setCurrentExercise({ name: '', sets: 1, reps: 1 });
      setCurrentExerciseIndex(null);
      setSearchExercise('');
      setShowExerciseModal(true);
      
      toast({
        title: "Exercise List Updated",
        description: "The exercise database has been refreshed",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exercise list from database",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index: number) => {
    if (isAthleteRoute) {
      // If they're an athlete, redirect to coach portal
      toast({
        title: "Coach Portal Required",
        description: "Please use the coach portal to edit exercises",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to coach portal
      navigate(`/coach/workouts/edit/${id}`);
      return;
    }
    
    // Original behavior for coaches
    setCurrentExercise({ ...exercises[index] });
    setCurrentExerciseIndex(index);
    setShowExerciseModal(true);
  };
  
  // Handle removing an exercise
  const handleRemoveExercise = (index: number) => {
    if (isAthleteRoute) {
      // If they're an athlete, redirect to coach portal
      toast({
        title: "Coach Portal Required",
        description: "Please use the coach portal to remove exercises",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to coach portal
      navigate(`/coach/workouts/edit/${id}`);
      return;
    }
    
    // Original behavior for coaches
    setExercises(exercises.filter((_, i) => i !== index));
  };
  
  // Handle saving an exercise
  const handleSaveExercise = () => {
    if (!currentExercise) return;
    
    const newExercises = [...exercises];
    
    if (currentExerciseIndex !== null) {
      // Update existing exercise
      newExercises[currentExerciseIndex] = currentExercise;
    } else {
      // Add new exercise
      newExercises.push(currentExercise);
    }
    
    setExercises(newExercises);
    setShowExerciseModal(false);
  };
  
  // Function to estimate completion progress based on status only
  const getEstimatedCompletion = (assignment: AthleteAssignment, totalExercises: number): number => {
    if (assignment.status === 'completed') {
      return totalExercises; // All exercises completed
    } else if (assignment.status === 'in_progress') {
      // For in-progress status, use existing workoutStore data if available
      const progress = workoutStore.getProgress(assignment.workout_id);
      return progress ? progress.completedExercises.length : 0;
    }
    return 0; // For assigned status
  };
  
  if (isFetching) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" align="center" justify="center" minH="50vh">
          <Spinner size="xl" mb={4} />
          <Text>Loading workout details...</Text>
        </Flex>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <HStack mb={6} spacing={4}>
        <Button leftIcon={<FaArrowLeft />} onClick={() => navigate('/coach/workouts')}>
          Back to Workouts
        </Button>
        <Heading flex="1">Edit Workout</Heading>
        <Button 
          colorScheme="blue" 
          leftIcon={<FaSave />} 
          isLoading={isSaving}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </HStack>
      
      <VStack spacing={8} align="stretch">
        {/* Basic Workout Information */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Workout Information</Heading>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Workout Name</FormLabel>
              <Input 
                value={workout?.name || ''} 
                onChange={(e) => setWorkout(prev => prev ? { ...prev, name: e.target.value } : null)} 
                placeholder="e.g., Morning Run, Leg Day"
              />
            </FormControl>
            
            <HStack width="100%" spacing={4}>
              <FormControl isRequired flex={1}>
                <FormLabel>Type</FormLabel>
                <Select 
                  value={workout?.type || ''} 
                  onChange={(e) => setWorkout(prev => prev ? { ...prev, type: e.target.value } : null)}
                >
                  <option value="Strength">Strength</option>
                  <option value="Running">Running</option>
                  <option value="Flexibility">Flexibility</option>
                  <option value="Recovery">Recovery</option>
                  <option value="Custom">Custom</option>
                </Select>
              </FormControl>
              
              <FormControl flex={1}>
                <FormLabel>Duration</FormLabel>
                <Input 
                  value={workout?.duration || ''} 
                  onChange={(e) => setWorkout(prev => prev ? { ...prev, duration: e.target.value } : null)} 
                  placeholder="e.g., 45 minutes, 1 hour"
                />
              </FormControl>
            </HStack>
            
            <HStack width="100%" spacing={4}>
              <FormControl flex={1}>
                <FormLabel>Date</FormLabel>
                <Input 
                  type="date" 
                  value={workout?.date || ''}
                  onChange={(e) => setWorkout(prev => prev ? { ...prev, date: e.target.value } : null)}
                />
              </FormControl>
              
              <FormControl flex={1}>
                <FormLabel>Time (Optional)</FormLabel>
                <Input 
                  type="time" 
                  value={workout?.time || ''}
                  onChange={(e) => setWorkout(prev => prev ? { ...prev, time: e.target.value } : null)}
                />
              </FormControl>
            </HStack>
            
            <FormControl>
              <FormLabel>Location (Optional)</FormLabel>
              <Input 
                value={(workout as any)?.location || ''} 
                onChange={(e) => setWorkout(prev => prev ? { ...prev, location: e.target.value } : null)} 
                placeholder="e.g., Gym, Home, Track"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea 
                value={workout?.notes || ''} 
                onChange={(e) => setWorkout(prev => prev ? { ...prev, notes: e.target.value } : null)} 
                placeholder="Additional notes about this workout..."
              />
            </FormControl>
          </VStack>
        </Box>
        
        {/* Exercises */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Exercises</Heading>
            <Button 
              colorScheme="green" 
              leftIcon={<FaPlus />} 
              onClick={handleAddExercise}
            >
              Add Exercise
            </Button>
          </Flex>
          
          {isAthleteRoute && (
            <Alert status="info" mb={4}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Coach Portal Required</Text>
                <Text>Exercise management is available in the coach portal. Click "Add Exercise" to be redirected.</Text>
              </Box>
            </Alert>
          )}
          
          {exercises.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Text>No exercises added yet. Use the button above to add exercises to your workout.</Text>
            </Alert>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th isNumeric>Sets</Th>
                  <Th isNumeric>Reps</Th>
                  <Th isNumeric>Weight</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {exercises.map((exercise, index) => (
                  <Tr key={index}>
                    <Td>{exercise.name}</Td>
                    <Td isNumeric>{exercise.sets}</Td>
                    <Td isNumeric>{exercise.reps}</Td>
                    <Td isNumeric>{exercise.weight ? `${exercise.weight} kg` : '-'}</Td>
                    <Td>{exercise.notes || '-'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit exercise"
                          icon={<FaSync />}
                          size="sm"
                          onClick={() => handleEditExercise(index)}
                        />
                        <IconButton
                          aria-label="Remove exercise"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleRemoveExercise(index)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
        
        {/* Assigned Athletes */}
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Assigned Athletes</Heading>
          
          <Accordion allowMultiple defaultIndex={[0]} mb={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Flex align="center">
                      <Text fontWeight="bold">Progress Details</Text>
                      <Badge ml={2} colorScheme="blue">
                        {assignments.length} Athletes
                      </Badge>
                    </Flex>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                {assignments.length === 0 ? (
                  <Text>No athletes assigned yet.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Athlete</Th>
                        <Th>Status</Th>
                        <Th>Progress</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {assignments.map((assignment, index) => {
                        const totalExercises = workout?.exercises?.length || 0;
                        const completedCount = getEstimatedCompletion(assignment, totalExercises);
                        const percentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
                        
                        return (
                          <Tr key={index}>
                            <Td>{assignment.athlete_name || assignment.athlete_id}</Td>
                            <Td>
                              <Badge colorScheme={assignment.status === 'completed' ? 'green' : 'blue'}>
                                {assignment.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Box>
                                <ProgressBar
                                  completed={completedCount}
                                  total={totalExercises}
                                  percentage={percentage}
                                  colorScheme={percentage >= 100 ? "green" : "blue"}
                                  itemLabel="exercises"
                                />
                              </Box>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          
          <Divider my={4} />
          
          <Heading size="sm" mb={4}>Manage Assignments</Heading>
          {isAthletesLoading ? (
            <Spinner />
          ) : athletes.length === 0 ? (
            <Text>No athletes available to assign.</Text>
          ) : (
            <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
              {athletes.map(athlete => (
                <Checkbox 
                  key={athlete.id} 
                  isChecked={selectedAthletes.includes(athlete.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAthletes([...selectedAthletes, athlete.id]);
                    } else {
                      setSelectedAthletes(selectedAthletes.filter(id => id !== athlete.id));
                    }
                  }}
                >
                  {athlete.full_name || athlete.name}
                </Checkbox>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
      
      {/* Exercise Modal */}
      <Modal isOpen={showExerciseModal} onClose={() => setShowExerciseModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{currentExerciseIndex !== null ? 'Edit Exercise' : 'Select Exercise from Database'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Database Exercise List */}
              <Box>
                <Heading size="sm" mb={2}>Database Exercises</Heading>
                <FormControl mb={4}>
                  <Input 
                    placeholder="Search exercises..." 
                    value={searchExercise} 
                    onChange={(e) => setSearchExercise(e.target.value)}
                    mb={2}
                  />
                </FormControl>
                
                {isLoadingExercises ? (
                  <Center p={4}>
                    <Spinner />
                  </Center>
                ) : dbExercises.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    <Text>No exercises found in the database.</Text>
                  </Alert>
                ) : (
                  <Box 
                    borderWidth="1px" 
                    borderRadius="md"
                    maxH="200px" 
                    overflowY="auto"
                  >
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Category</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dbExercises
                          .filter(ex => ex.name.toLowerCase().includes(searchExercise.toLowerCase()))
                          .map((exercise) => (
                            <Tr key={exercise.id}>
                              <Td>{exercise.name}</Td>
                              <Td>{exercise.category || '-'}</Td>
                              <Td>
                                <Button 
                                  size="xs" 
                                  colorScheme="blue"
                                  onClick={() => {
                                    setCurrentExercise(prev => ({
                                      ...prev,
                                      id: exercise.id,
                                      name: exercise.name,
                                      sets: prev?.sets || 1,
                                      reps: prev?.reps || 1
                                    }));
                                  }}
                                >
                                  Select
                                </Button>
                              </Td>
                            </Tr>
                          ))
                        }
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
              
              <Divider my={2} />
              
              {/* Exercise Details */}
              <Box>
                <Heading size="sm" mb={2}>Exercise Details</Heading>
                <FormControl isRequired>
                  <FormLabel>Exercise Name</FormLabel>
                  <Input 
                    value={currentExercise?.name || ''} 
                    onChange={(e) => {
                      setCurrentExercise(prev => prev ? { ...prev, name: e.target.value } : null);
                    }}
                    placeholder="e.g., Squats, Push-ups, 400m sprint"
                  />
                </FormControl>
                
                <HStack width="100%" spacing={4} mt={4}>
                  <FormControl isRequired flex={1}>
                    <FormLabel>Sets</FormLabel>
                    <Input 
                      type="number" 
                      value={currentExercise?.sets || 0} 
                      onChange={(e) => setCurrentExercise(prev => prev ? { ...prev, sets: parseInt(e.target.value) } : null)} 
                    />
                  </FormControl>
                  
                  <FormControl isRequired flex={1}>
                    <FormLabel>Reps</FormLabel>
                    <Input 
                      type="number" 
                      value={currentExercise?.reps || 0} 
                      onChange={(e) => setCurrentExercise(prev => prev ? { ...prev, reps: parseInt(e.target.value) } : null)} 
                    />
                  </FormControl>
                </HStack>
                
                <HStack width="100%" spacing={4} mt={4}>
                  <FormControl flex={1}>
                    <FormLabel>Weight (kg)</FormLabel>
                    <Input 
                      type="number" 
                      value={currentExercise?.weight || ''} 
                      onChange={(e) => setCurrentExercise(prev => prev ? { ...prev, weight: e.target.value ? parseInt(e.target.value) : undefined } : null)} 
                      placeholder="Optional"
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Rest (seconds)</FormLabel>
                    <Input 
                      type="number" 
                      value={currentExercise?.rest || ''} 
                      onChange={(e) => setCurrentExercise(prev => prev ? { ...prev, rest: e.target.value ? parseInt(e.target.value) : undefined } : null)} 
                      placeholder="Optional"
                    />
                  </FormControl>
                </HStack>
                
                <FormControl mt={4}>
                  <FormLabel>Distance (meters)</FormLabel>
                  <Input 
                    type="number" 
                    value={currentExercise?.distance || ''} 
                    onChange={(e) => setCurrentExercise(prev => prev ? { ...prev, distance: e.target.value ? parseInt(e.target.value) : undefined } : null)} 
                    placeholder="Optional"
                  />
                </FormControl>
                
                <FormControl mt={4}>
                  <FormLabel>Notes</FormLabel>
                  <Textarea 
                    value={currentExercise?.notes || ''} 
                    onChange={(e) => setCurrentExercise(prev => prev ? { ...prev, notes: e.target.value } : null)} 
                    placeholder="Additional notes about this exercise..."
                  />
                </FormControl>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowExerciseModal(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveExercise}>
              Add to Workout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 