import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Input, Select, Checkbox, CheckboxGroup, Stack, Button, Textarea, useToast, Text, VStack, HStack, IconButton, Box, Heading
} from '@chakra-ui/react';
import type { Workout, Exercise } from '../services/api'; // Import shared types
import { FaPlus, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabase'; // Import supabase client

const TYPE_OPTIONS = ['Strength', 'Running', 'Flexibility', 'Recovery', 'Custom'];

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

// This is the type of data the modal will work with internally and pass to onSave
// It should include all fields necessary for creating/editing a workout, including optional id.
// It aligns with the fields defined in the shared Workout type from api.ts but makes some optional for form handling.
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

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorkout?: Workout | null; // Use imported Workout type for initial data
  athletes: Athlete[];
  onSave: (workoutData: WorkoutFormData) => void; // onSave provides WorkoutFormData
}

export function WorkoutModal({ isOpen, onClose, initialWorkout, athletes, onSave }: WorkoutModalProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // New state for database exercises
  const [dbExercises, setDbExercises] = useState<DbExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  
  // State for form fields
  const [id, setId] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string>('');
  const [assignedAthletes, setAssignedAthletes] = useState<string[]>([]);
  const [type, setType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // State for managing exercises within the modal
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [currentExerciseInput, setCurrentExerciseInput] = useState<Omit<Exercise, 'id'>>({
    name: '', sets: 1, reps: 1, weight: undefined, rest: undefined, distance: undefined, notes: ''
  });
  const [searchExercise, setSearchExercise] = useState<string>('');

  // Fetch exercises from database when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (isOpen && initialWorkout) {
      setId(initialWorkout.id);
      setName(initialWorkout.name || '');
      setAssignedAthletes((initialWorkout as any).assignedAthletes || []);
      setType(initialWorkout.type || '');
      setCurrentExercises(initialWorkout.exercises || []);
      setDuration(initialWorkout.duration || '');
      setDate(initialWorkout.date || '');
      setTime(initialWorkout.time || '');
      setLocation((initialWorkout as any).location || '');
      setNotes(initialWorkout.notes || '');
      setFile(null);
    } else if (isOpen) {
      setId(undefined);
      setName('');
      setAssignedAthletes([]);
      setType('');
      setCurrentExercises([]);
      setDuration('');
      setDate('');
      setTime('');
      setLocation('');
      setNotes('');
      setFile(null);
    }
  }, [initialWorkout, isOpen]);

  const handleAddExercise = () => {
    if (!currentExerciseInput.name || currentExerciseInput.sets <= 0 || currentExerciseInput.reps <= 0) {
      toast({ title: 'Invalid exercise data', description: 'Exercise name, sets, and reps are required.', status: 'warning' });
      return;
    }
    
    // Find the selected exercise ID if it exists in our database
    const selectedExercise = dbExercises.find(ex => ex.name === currentExerciseInput.name);
    
    setCurrentExercises([...currentExercises, { 
      ...currentExerciseInput,
      id: selectedExercise?.id // Add the exercise ID if it exists in our database
    } as Exercise]);
    
    setCurrentExerciseInput({ name: '', sets: 1, reps: 1, weight: undefined, rest: undefined, distance: undefined, notes: '' });
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
    // Validation for required fields (as per WorkoutFormData and api.ts create expectation)
    if (!name || !type || !date || !duration || currentExercises.length === 0) {
      toast({ title: 'Please fill all required fields', description: 'Name, Type, Date, Duration, and at least one Exercise are required.', status: 'error' });
      return;
    }

    setIsSaving(true);
    const workoutOutput: WorkoutFormData = {
      id,
      name,
      type,
      date,
      duration,
      notes: notes || '', // This will be mapped to description in the API
      exercises: currentExercises,
      time: time || undefined,
      location: location || undefined,
      assignedAthletes: assignedAthletes.length > 0 ? assignedAthletes : undefined,
      file: file || undefined,
    };
    
    try {
      // Wrap onSave in a Promise.resolve to handle both synchronous and asynchronous onSave implementations
      await Promise.resolve(onSave(workoutOutput));
      // Success - modal will be closed by parent component
    } catch (err) {
      console.error("Error in handleSave:", err);
      toast({ 
        title: 'Error saving workout', 
        description: 'Please try again or check console for details.',
        status: 'error'
      });
    } finally {
      // Always set saving to false after completion or error
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{initialWorkout && id ? 'Edit Workout' : 'Create Workout'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody maxHeight="70vh" overflowY="auto" pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Workout Name</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Morning Run, Leg Day" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Type</FormLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} placeholder="Select workout type">
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
            </FormControl>
            <HStack>
                <FormControl isRequired flex={1}>
                    <FormLabel>Date</FormLabel>
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={(e) => {
                        // Store the date string directly from the input
                        // This ensures ISO format (YYYY-MM-DD) is preserved without timezone adjustments
                        setDate(e.target.value);
                      }} 
                    />
                </FormControl>
                <FormControl flex={1}>
                    <FormLabel>Time (Optional)</FormLabel>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </FormControl>
            </HStack>
            <FormControl isRequired>
                <FormLabel>Duration</FormLabel>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 45 minutes, 1 hour"/>
            </FormControl>
            <FormControl>
              <FormLabel>Location (Optional)</FormLabel>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Gym, Home, Track" />
            </FormControl>

            {/* Exercises Management */}
            <Box borderWidth="1px" borderRadius="md" p={4}>
                <Heading size="sm" mb={3} display="flex" justifyContent="space-between" alignItems="center">
                  <span>Exercises</span>
                  <Text fontSize="xs" color="gray.500">Total: {currentExercises.length}</Text>
                </Heading>
                
                {/* List of added exercises */}
                {currentExercises.length > 0 ? (
                  <Box borderWidth="1px" borderRadius="md" overflow="hidden" mb={4}>
                    <Box bg="gray.50" px={3} py={2} borderBottomWidth="1px">
                      <Text fontWeight="medium" fontSize="sm">Workout Exercise List</Text>
                    </Box>
                    <VStack spacing={0} align="stretch" maxHeight="200px" overflowY="auto">
                      {currentExercises.map((ex, index) => (
                        <HStack 
                          key={index} 
                          justify="space-between" 
                          p={3} 
                          borderBottomWidth={index < currentExercises.length - 1 ? "1px" : "0"}
                          _hover={{ bg: "gray.50" }}
                        >
                          <Box>
                            <Text fontWeight="bold">{index + 1}. {ex.name}</Text>
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
                    mb={4}
                  >
                    <Text color="gray.500" fontSize="sm">
                      No exercises added yet. Use the form below to add exercises to your workout.
                    </Text>
                  </Box>
                )}
                
                {/* Exercise input form section */}
                <VStack spacing={3} mt={5} align="stretch" borderTop="1px solid" borderColor="gray.200" pt={4}>
                    <Text fontWeight="medium" fontSize="sm" color="blue.600">Add a New Exercise:</Text>
                    
                    <FormControl>
                        <FormLabel fontSize="sm">1. Search or select an exercise</FormLabel>
                        <Input 
                            placeholder="Type to search exercises or enter your own..." 
                            value={searchExercise}
                            onChange={e => {
                                setSearchExercise(e.target.value);
                                // Auto-update the exercise name field as user types
                                setCurrentExerciseInput(prev => ({ ...prev, name: e.target.value }));
                            }}
                        />
                        {searchExercise && filteredExerciseOptions.length > 0 && (
                            <Box borderWidth="1px" borderRadius="md" mt={1} maxHeight="150px" overflowY="auto" boxShadow="sm">
                                {filteredExerciseOptions.map(opt => (
                                    <Box 
                                        key={opt} 
                                        p={2} 
                                        _hover={{ bg: "blue.50"}} 
                                        cursor="pointer" 
                                        onClick={() => {
                                            setCurrentExerciseInput(prev => ({ ...prev, name: opt }));
                                            setSearchExercise(opt);
                                        }}
                                        bg={currentExerciseInput.name === opt ? "blue.50" : "white"}
                                    >
                                        {opt}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </FormControl>
                    
                    <HStack mt={2}>
                        <FormLabel fontSize="sm" width="100px" mb={0}>2. Set details:</FormLabel>
                        <Box flex={1}>
                            <HStack spacing={4} mb={2}>
                                <FormControl size="sm" flex={1}>
                                    <FormLabel fontSize="xs">Sets</FormLabel>
                                    <Input size="sm" type="number" value={currentExerciseInput.sets} onChange={e => setCurrentExerciseInput(prev => ({ ...prev, sets: parseInt(e.target.value) || 1 }))} />
                                </FormControl>
                                <FormControl size="sm" flex={1}>
                                    <FormLabel fontSize="xs">Reps</FormLabel>
                                    <Input size="sm" type="number" value={currentExerciseInput.reps} onChange={e => setCurrentExerciseInput(prev => ({ ...prev, reps: parseInt(e.target.value) || 1 }))} />
                                </FormControl>
                            </HStack>
                            
                            <HStack spacing={4} mb={2}>
                                <FormControl size="sm" flex={1}>
                                    <FormLabel fontSize="xs">Weight (kg)</FormLabel>
                                    <Input size="sm" type="number" placeholder="Optional" value={currentExerciseInput.weight || ''} onChange={e => setCurrentExerciseInput(prev => ({ ...prev, weight: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                                </FormControl>
                                <FormControl size="sm" flex={1}>
                                    <FormLabel fontSize="xs">Rest (sec)</FormLabel>
                                    <Input size="sm" type="number" placeholder="Optional" value={currentExerciseInput.rest || ''} onChange={e => setCurrentExerciseInput(prev => ({ ...prev, rest: e.target.value ? parseInt(e.target.value) : undefined }))} />
                                </FormControl>
                            </HStack>
                            
                            <FormControl size="sm" mb={2}>
                                <FormLabel fontSize="xs">Distance (m)</FormLabel>
                                <Input size="sm" type="number" placeholder="Optional" value={currentExerciseInput.distance || ''} onChange={e => setCurrentExerciseInput(prev => ({ ...prev, distance: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                            </FormControl>
                        </Box>
                    </HStack>
                    
                    <FormControl>
                        <FormLabel fontSize="sm">3. Notes (optional):</FormLabel>
                        <Textarea 
                            size="sm" 
                            placeholder="Any specific instructions for this exercise..." 
                            value={currentExerciseInput.notes || ''} 
                            onChange={e => setCurrentExerciseInput(prev => ({...prev, notes: e.target.value}))}
                            rows={2}
                        />
                    </FormControl>
                    
                    <Button 
                        size="md" 
                        colorScheme="teal" 
                        onClick={handleAddExercise} 
                        leftIcon={<FaPlus />}
                        width="100%"
                        mt={2}
                        isDisabled={!currentExerciseInput.name}
                        isLoading={isLoadingExercises}
                    >
                        ADD THIS EXERCISE TO WORKOUT
                    </Button>
                </VStack>
            </Box>

            <FormControl>
              <FormLabel>Assign to Athlete(s) (Optional)</FormLabel>
              {/* Using CheckboxGroup for multi-select of athletes */}
              <CheckboxGroup value={assignedAthletes} onChange={(values: string[]) => setAssignedAthletes(values)}>
                <Stack direction="column" spacing={2} maxHeight="150px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
                  {(athletes || []).map((a) => (
                    <Checkbox key={a.id} value={a.id}>{a.full_name || a.name}</Checkbox>
                  ))}
                  {(!athletes || athletes.length === 0) && <Text color="gray.500" fontSize="sm">No athletes available for assignment.</Text>}
                </Stack>
              </CheckboxGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Overall workout notes..." />
            </FormControl>

            {/* File upload kept for now, can be removed if not used */}
            {/* <FormControl>
              <FormLabel>Upload File (PDF, Text, Image)</FormLabel>
              <Input type="file" accept=".pdf,.txt,image/*" onChange={(e) => setFile(e.target.files && e.target.files[0])} />
              {file && <Text fontSize="sm" mt={1}>Selected: {file.name}</Text>}
            </FormControl> */}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleSave} 
            isLoading={isSaving}
            loadingText="Saving..."
          >
            {initialWorkout && id ? 'Save Changes' : 'Create Workout'}
          </Button>
          <Button variant="ghost" onClick={onClose} isDisabled={isSaving}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 