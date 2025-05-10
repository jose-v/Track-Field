import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  Progress,
  Tooltip,
  IconButton,
  Image,
  Flex,
  Icon,
  Card,
  CardBody,
  Container,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { CheckIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { useWorkoutStore } from '../lib/workoutStore'
import { FaRunning, FaDumbbell, FaRegClock, FaCalendarAlt, FaListUl, FaPlayCircle } from 'react-icons/fa'

// Add Exercise type for local state
type Exercise = {
  name: string
  sets: number
  reps: number
  weight?: number
  rest?: number
  distance?: number
  notes?: string
}

export function Workouts() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { workouts, createWorkout, deleteWorkout, updateWorkout } = useWorkouts()
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: '',
    date: '',
    duration: '',
    time: '',
    notes: '',
  })
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseInput, setExerciseInput] = useState<Exercise>({
    name: '',
    sets: 1,
    reps: 1,
    weight: undefined,
    rest: undefined,
    distance: undefined,
    notes: '',
  })
  // --- Exercise Execution State ---
  const [execModal, setExecModal] = useState({
    isOpen: false,
    workout: null as any,
    exerciseIdx: 0,
    timer: 0,
    running: false,
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [editModal, setEditModal] = useState({ isOpen: false, workout: null as any })
  // Video modal state for exercise tutorials
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' })

  // Find today's workout for progress tracking
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWorkout = workouts.find(workout => {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);
    return workoutDate.getTime() === today.getTime();
  });
  
  // Use our centralized workout store
  const workoutStore = useWorkoutStore();
  
  // Function to get completion count for a workout
  const getCompletionCount = (workoutId: string): number => {
    const progress = workoutStore.getProgress(workoutId);
    return progress?.completedExercises?.length || 0;
  };
  
  // Initialize all workouts in the store if needed
  useEffect(() => {
    if (workouts.length > 0) {
      // Debug current store state
      workoutStore.debugStore();
      
      // Initialize workouts that don't exist in the store yet
      workouts.forEach(workout => {
        if (workout.exercises && workout.exercises.length > 0) {
          const progress = workoutStore.getProgress(workout.id);
          if (!progress) {
            console.log(`Initializing workout ${workout.id} in store with ${workout.exercises.length} exercises`);
            workoutStore.updateProgress(workout.id, 0, workout.exercises.length);
          }
        }
      });
    }
  }, [workouts, workoutStore]);
  
  // Debug workouts when they change
  useEffect(() => {
    console.log('Workouts page - All workouts:', workouts);
    console.log('Workouts page - Today is:', today.toISOString().slice(0, 10));
    console.log('Workouts page - Today workout:', todayWorkout);
  }, [workouts, today, todayWorkout]);

  // Helper: get video URL for an exercise based on its name
  function getVideoUrl(exerciseName: string) {
    // Convert to lowercase for case-insensitive matching
    const exercise = exerciseName.toLowerCase();
    
    // Track & Field specific exercises
    if (exercise.includes('sprint') || exercise.includes('dash')) {
      return 'https://www.youtube.com/embed/6kNvYDTT-NU' // Sprint technique
    }
    if (exercise.includes('hurdle')) {
      return 'https://www.youtube.com/embed/6Wk65Jf_qSc' // Hurdle technique
    }
    if (exercise.includes('jump') || exercise.includes('leap')) {
      return 'https://www.youtube.com/embed/7O454Z8efs0' // Long jump technique
    }
    if (exercise.includes('shot put') || exercise.includes('throw')) {
      return 'https://www.youtube.com/embed/axc0FXuTdI8' // Shot put technique
    }
    if (exercise.includes('javelin')) {
      return 'https://www.youtube.com/embed/ZG3_Rfo6_VE' // Javelin technique
    }
    
    // Common strength exercises
    if (exercise.includes('squat')) {
      return 'https://www.youtube.com/embed/aclHkVaku9U' // Squats
    }
    if (exercise.includes('push') || exercise.includes('pushup')) {
      return 'https://www.youtube.com/embed/_l3ySVKYVJ8' // Pushups
    }
    if (exercise.includes('lunge')) {
      return 'https://www.youtube.com/embed/QOVaHwm-Q6U' // Lunges
    }
    if (exercise.includes('plank')) {
      return 'https://www.youtube.com/embed/pSHjTRCQxIw' // Planks
    }
    if (exercise.includes('deadlift')) {
      return 'https://www.youtube.com/embed/r4MzxtBKyNE' // Deadlifts
    }
    if (exercise.includes('bench press')) {
      return 'https://www.youtube.com/embed/SCVCLChPQFY' // Bench press
    }
    
    // Warmup/mobility exercises
    if (exercise.includes('stretch') || exercise.includes('dynamic')) {
      return 'https://www.youtube.com/embed/nPHfEnZD1Wk' // Dynamic stretching
    }
    if (exercise.includes('warm up') || exercise.includes('warmup')) {
      return 'https://www.youtube.com/embed/R0mMyV5OtcM' // Track warmup
    }
    
    // Default video if no match is found
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ' // General workout video
  }

  const handleAddExercise = () => {
    if (!exerciseInput.name) return
    setExercises([...exercises, exerciseInput])
    setExerciseInput({
      name: '',
      sets: 1,
      reps: 1,
      weight: undefined,
      rest: undefined,
      distance: undefined,
      notes: '',
    })
  }

  const handleRemoveExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createWorkout({ ...newWorkout, exercises })
    onClose()
    setNewWorkout({
      name: '',
      type: '',
      date: '',
      duration: '',
      time: '',
      notes: '',
    })
    setExercises([])
  }

  // Start execution modal for a workout/exercise
  const handleGo = (workout: any, idx: number) => {
    setExecModal({
      isOpen: true,
      workout,
      exerciseIdx: idx,
      timer: 0,
      running: true,
    })
  }

  // Timer logic
  useEffect(() => {
    if (execModal.isOpen && execModal.running) {
      timerRef.current = setInterval(() => {
        setExecModal((prev) => ({ ...prev, timer: prev.timer + 1 }))
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [execModal.isOpen, execModal.running])

  // Handle DONE button
  const handleDone = () => {
    if (!execModal.workout) return
    const workoutId = execModal.workout.id
    const exIdx = execModal.exerciseIdx
    
    // Mark current exercise as completed
    workoutStore.markExerciseCompleted(workoutId, exIdx);
    
    // Move to next exercise
    if (exIdx + 1 < execModal.workout.exercises.length) {
      // Update progress in store
      workoutStore.updateProgress(workoutId, exIdx + 1, execModal.workout.exercises.length, true);
      
      // Update modal state
      setExecModal({
        ...execModal,
        exerciseIdx: exIdx + 1,
        timer: 0,
        running: true,
      });
    } else {
      // Workout completed
      workoutStore.updateProgress(workoutId, execModal.workout.exercises.length, execModal.workout.exercises.length);
      
      // Close modal
      setExecModal({
        isOpen: false,
        workout: null,
        exerciseIdx: 0,
        timer: 0,
        running: false,
      });
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading>Workouts</Heading>
        <Button colorScheme="brand" onClick={onOpen}>
          Add Workout
        </Button>
      </HStack>

      {workouts.length === 0 ? (
        <Text>No workouts logged yet. Add your first workout!</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} alignItems="stretch">
          {workouts.map((workout) => {
            const completedCount = getCompletionCount(workout.id) || 0;
            const totalCount = workout.exercises?.length || 0;
            
            // Determine gradient color based on workout type
            let gradientColors = "linear-gradient(135deg, #3182CE 0%, #63B3ED 100%)";
            let iconColor = "blue.500";
            let cardIcon = FaRunning;
            
            if (workout.type === "Running") {
              gradientColors = "linear-gradient(135deg, #38A169 0%, #68D391 100%)";
              iconColor = "green.500";
              cardIcon = FaRunning;
            } else if (workout.type === "Strength") {
              gradientColors = "linear-gradient(135deg, #E53E3E 0%, #FC8181 100%)";
              iconColor = "red.500";
              cardIcon = FaDumbbell;
            } else if (workout.type === "Flexibility") {
              gradientColors = "linear-gradient(135deg, #805AD5 0%, #B794F4 100%)";
              iconColor = "purple.500";
              cardIcon = FaRunning;
            } else if (workout.type === "Recovery") {
              gradientColors = "linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)";
              iconColor = "orange.500";
              cardIcon = FaRegClock;
            }
            
            return (
              <Card 
                key={workout.id}
                borderRadius="lg" 
                overflow="hidden" 
                boxShadow="md"
                border={todayWorkout && workout.id === todayWorkout.id ? "2px solid" : "none"}
                borderColor={todayWorkout && workout.id === todayWorkout.id ? "brand.500" : "transparent"}
                h="100%"
              >
                {/* Hero Background */}
                <Box 
                  h="80px" 
                  bg={gradientColors}
                  position="relative"
                >
                  {/* Today's workout badge */}
                  {todayWorkout && workout.id === todayWorkout.id && (
                    <Box 
                      position="absolute" 
                      top="8px" 
                      right="8px" 
                      bg="white" 
                      color="brand.500" 
                      fontSize="xs" 
                      fontWeight="bold" 
                      px={2} 
                      py={1} 
                      borderRadius="md"
                      boxShadow="sm"
                    >
                      TODAY
                    </Box>
                  )}
                  
                  <Flex 
                    position="absolute" 
                    top="50%" 
                    left="50%" 
                    transform="translate(-50%, -50%)"
                    bg="white" 
                    borderRadius="full" 
                    w="50px" 
                    h="50px" 
                    justifyContent="center" 
                    alignItems="center"
                    boxShadow="md"
                  >
                    <Icon as={cardIcon} w={6} h={6} color={iconColor} />
                  </Flex>
                  
                  {/* Edit/Delete buttons moved to top-right */}
                  <HStack position="absolute" top="8px" left="8px">
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="whiteAlpha"
                      variant="solid"
                      onClick={() => setEditModal({ isOpen: true, workout })}
                      aria-label="Edit"
                      borderRadius="full"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="whiteAlpha"
                      variant="solid"
                      onClick={() => deleteWorkout(workout.id)}
                      aria-label="Delete"
                      borderRadius="full"
                    />
                  </HStack>
                </Box>
                
                <CardBody pt={6}>
                  <VStack spacing={3} align="stretch">
                    <Heading size="md" textAlign="center" mb={1}>{workout.name}</Heading>
                    
                    <HStack justify="center" spacing={3}>
                      <HStack spacing={1}>
                        <Icon as={FaRegClock} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">{workout.duration}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FaCalendarAlt} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">{workout.date}</Text>
                      </HStack>
                    </HStack>
                    
                    {workout.time && (
                      <Text fontSize="sm" textAlign="center">Time: {workout.time}</Text>
                    )}
                    
                    {workout.notes && (
                      <Text fontSize="sm" color="gray.600" textAlign="center" mt={1} noOfLines={2}>{workout.notes}</Text>
                    )}
                    
                    {/* Progress Bar */}
                    {totalCount > 0 && (
                      <Box w="100%" mt={2} mb={1}>
                        <Progress 
                          value={(completedCount / totalCount) * 100} 
                          size="sm" 
                          colorScheme={completedCount === totalCount ? "green" : "blue"} 
                          borderRadius="md" 
                        />
                        <Text fontSize="xs" textAlign="center" mt={1}>
                          {completedCount === totalCount 
                            ? "Completed" 
                            : `${completedCount}/${totalCount} exercises completed`}
                        </Text>
                      </Box>
                    )}
                    
                    {/* Exercises Section */}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <Box p={3} bg="gray.50" borderRadius="md" mt={2}>
                        <HStack mb={2}>
                          <Icon as={FaListUl} color="gray.600" />
                          <Text fontWeight="medium">Exercises</Text>
                        </HStack>
                        <VStack align="stretch" spacing={2}>
                          {workout.exercises.map((ex: any, idx: number) => (
                            <HStack key={idx} justify="space-between" py={1} px={2} bg="white" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                              <Text fontSize="sm">
                                {ex.name} ({ex.sets} x {ex.reps})
                              </Text>
                              <IconButton
                                icon={<FaPlayCircle />}
                                size="xs"
                                colorScheme="blue"
                                onClick={() => handleGo(workout, idx)}
                                aria-label="Start exercise"
                                variant="ghost"
                              />
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}
                    
                    {/* Start Workout Button */}
                    {totalCount > 0 && (
                      <Button 
                        mt={3} 
                        w="full" 
                        colorScheme={completedCount === totalCount ? "green" : "blue"}
                        leftIcon={<Icon as={FaPlayCircle} />}
                        onClick={() => handleGo(workout, completedCount === totalCount ? 0 : completedCount)}
                        size="sm"
                      >
                        {completedCount === totalCount ? "Restart Workout" : completedCount > 0 ? "Continue Workout" : "Start Workout"}
                      </Button>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )
          })}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius="lg" overflow="hidden">
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg="linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)" 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={FaDumbbell} w={6} h={6} color="blue.500" />
            </Flex>
          </Box>
          
          <ModalHeader textAlign="center" pt={8}>Add New Workout</ModalHeader>
          <ModalCloseButton top="85px" />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Workout Name</FormLabel>
                  <Input
                    value={newWorkout.name}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, name: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={newWorkout.type}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, type: e.target.value })
                    }
                  >
                    <option value="">Select type</option>
                    <option value="Running">Running</option>
                    <option value="Strength">Strength</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="Recovery">Recovery</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={newWorkout.date}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, date: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Duration</FormLabel>
                  <Input
                    value={newWorkout.duration}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, duration: e.target.value })
                    }
                    placeholder="e.g., 45 minutes"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Time</FormLabel>
                  <Input
                    type="time"
                    value={newWorkout.time}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, time: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={newWorkout.notes}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, notes: e.target.value })
                    }
                    placeholder="Add any notes about your workout..."
                  />
                </FormControl>

                {/* --- Exercises Section --- */}
                <Box w="100%" p={2} borderWidth={1} borderRadius="md" bg="gray.50">
                  <Heading size="sm" mb={2}>Exercises</Heading>
                  <HStack>
                    <Input
                      placeholder="Exercise name"
                      value={exerciseInput.name}
                      onChange={e => setExerciseInput({ ...exerciseInput, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Sets"
                      value={exerciseInput.sets}
                      min={1}
                      onChange={e => setExerciseInput({ ...exerciseInput, sets: Number(e.target.value) })}
                      w="80px"
                    />
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exerciseInput.reps}
                      min={1}
                      onChange={e => setExerciseInput({ ...exerciseInput, reps: Number(e.target.value) })}
                      w="80px"
                    />
                    <Button onClick={handleAddExercise} type="button">Add</Button>
                  </HStack>
                  <VStack mt={2} align="stretch">
                    {exercises.map((ex, idx) => (
                      <HStack key={idx} justify="space-between" p={2} bg="white" borderWidth={1} borderRadius="md">
                        <Box>
                          <Text fontWeight="bold">{ex.name}</Text>
                          <Text fontSize="sm">{ex.sets} x {ex.reps}</Text>
                        </Box>
                        <Button size="xs" colorScheme="red" onClick={() => handleRemoveExercise(idx)}>Remove</Button>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
                {/* --- End Exercises Section --- */}

                <Button type="submit" colorScheme="blue" width="full">
                  Save Workout
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* --- Exercise Execution Modal --- */}
      <Modal isOpen={execModal.isOpen} onClose={() => setExecModal({ ...execModal, isOpen: false, running: false })} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="lg" overflow="hidden">
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg={execModal.running ? "linear-gradient(135deg, #38A169 0%, #68D391 100%)" : "linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)"} 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={execModal.running ? FaRunning : FaRegClock} w={6} h={6} color={execModal.running ? "green.500" : "blue.500"} />
            </Flex>
            
            {/* Progress indicator */}
            {execModal.workout && (
              <Box position="absolute" bottom="0" left="0" right="0">
                <Progress 
                  value={((execModal.exerciseIdx + 1) / execModal.workout.exercises.length) * 100} 
                  size="xs" 
                  colorScheme={execModal.running ? "green" : "blue"} 
                  backgroundColor="rgba(255,255,255,0.3)"
                />
              </Box>
            )}
          </Box>
          
          <ModalHeader textAlign="center" pt={8}>Exercise Execution</ModalHeader>
          <ModalCloseButton top="85px" onClick={() => setExecModal({ ...execModal, isOpen: false, running: false })} />
          <ModalBody pb={6}>
            {execModal.workout && (
              <VStack spacing={4} align="center">
                <Heading size="md">
                  {execModal.workout.exercises[execModal.exerciseIdx]?.name}
                </Heading>
                
                <HStack 
                  spacing={4} 
                  p={3} 
                  bg="gray.50" 
                  w="100%" 
                  borderRadius="md" 
                  justify="center"
                >
                  <VStack>
                    <Text color="gray.500" fontSize="sm">Sets</Text>
                    <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.sets}</Text>
                  </VStack>
                  <VStack>
                    <Text color="gray.500" fontSize="sm">Reps</Text>
                    <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.reps}</Text>
                  </VStack>
                  {execModal.workout.exercises[execModal.exerciseIdx]?.weight && (
                    <VStack>
                      <Text color="gray.500" fontSize="sm">Weight</Text>
                      <Text fontWeight="bold">{execModal.workout.exercises[execModal.exerciseIdx]?.weight} kg</Text>
                    </VStack>
                  )}
                </HStack>
                
                <Box 
                  bg={execModal.running ? "green.50" : "blue.50"} 
                  p={4} 
                  borderRadius="full" 
                  boxShadow="sm" 
                  mb={2}
                >
                  <Text fontSize="2xl" fontWeight="bold" color={execModal.running ? "green.500" : "blue.500"}>
                    {Math.floor(execModal.timer / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(execModal.timer % 60).toString().padStart(2, '0')}
                  </Text>
                </Box>
                
                {/* Exercise control buttons - all in a single row with equal sizing */}
                <HStack spacing={3} width="100%" justifyContent="center">
                  {execModal.running ? (
                    <Button 
                      colorScheme="yellow" 
                      flex="1" 
                      maxW="120px"
                      leftIcon={<Icon as={FaRegClock} />}
                      onClick={() => setExecModal({ ...execModal, running: false })}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button 
                      colorScheme="blue" 
                      flex="1" 
                      maxW="120px"
                      leftIcon={<Icon as={FaRunning} />}
                      onClick={() => setExecModal({ ...execModal, running: true })}
                    >
                      Start
                    </Button>
                  )}
                  <Button 
                    colorScheme="green" 
                    flex="1" 
                    maxW="120px"
                    leftIcon={<Icon as={CheckIcon} />}
                    onClick={handleDone}
                  >
                    {execModal.exerciseIdx + 1 < execModal.workout.exercises.length ? 'Next' : 'Finish'}
                  </Button>
                  <Button
                    colorScheme="purple"
                    flex="1"
                    maxW="120px"
                    leftIcon={<Icon as={FaPlayCircle} />}
                    onClick={() => setVideoModal({
                      isOpen: true,
                      videoUrl: getVideoUrl(execModal.workout.exercises[execModal.exerciseIdx]?.name),
                      exerciseName: execModal.workout.exercises[execModal.exerciseIdx]?.name || '',
                    })}
                  >
                    How to
                  </Button>
                </HStack>
                
                <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
                  Exercise {execModal.exerciseIdx + 1} of {execModal.workout.exercises.length}
                </Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* --- End Exercise Execution Modal --- */}

      {/* Edit Workout Modal */}
      <Modal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, workout: null })}>
        <ModalOverlay />
        <ModalContent borderRadius="lg" overflow="hidden">
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg="linear-gradient(135deg, #805AD5 0%, #B794F4 100%)" 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={EditIcon} w={6} h={6} color="purple.500" />
            </Flex>
          </Box>
          
          <ModalHeader textAlign="center" pt={8}>Edit Workout</ModalHeader>
          <ModalCloseButton top="85px" />
          <ModalBody pb={6}>
            {editModal.workout && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  updateWorkout({
                    id: editModal.workout.id,
                    workout: {
                      name: editModal.workout.name,
                      type: editModal.workout.type,
                      date: editModal.workout.date,
                      duration: editModal.workout.duration,
                      time: editModal.workout.time,
                      notes: editModal.workout.notes,
                    },
                  })
                  setEditModal({ isOpen: false, workout: null })
                }}
              >
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Workout Name</FormLabel>
                    <Input
                      value={editModal.workout.name}
                      onChange={e => setEditModal(m => ({ ...m, workout: { ...m.workout, name: e.target.value } }))}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={editModal.workout.type}
                      onChange={e => setEditModal(m => ({ ...m, workout: { ...m.workout, type: e.target.value } }))}
                    >
                      <option value="">Select type</option>
                      <option value="Running">Running</option>
                      <option value="Strength">Strength</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="Recovery">Recovery</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={editModal.workout.date}
                      onChange={e => setEditModal(m => ({ ...m, workout: { ...m.workout, date: e.target.value } }))}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Duration</FormLabel>
                    <Input
                      value={editModal.workout.duration}
                      onChange={e => setEditModal(m => ({ ...m, workout: { ...m.workout, duration: e.target.value } }))}
                      placeholder="e.g., 45 minutes"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Time</FormLabel>
                    <Input
                      type="time"
                      value={editModal.workout.time || ''}
                      onChange={e => setEditModal(m => ({ ...m, workout: { ...m.workout, time: e.target.value } }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={editModal.workout.notes}
                      onChange={e => setEditModal(m => ({ ...m, workout: { ...m.workout, notes: e.target.value } }))}
                      placeholder="Add any notes about your workout..."
                    />
                  </FormControl>
                  <Button type="submit" colorScheme="purple" width="full" mt={6}>
                    Update Workout
                  </Button>
                </VStack>
              </form>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* --- Exercise Video Modal --- */}
      <Modal isOpen={videoModal.isOpen} onClose={() => setVideoModal({ ...videoModal, isOpen: false })} isCentered size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="lg" overflow="hidden">
          {/* Hero Background */}
          <Box 
            h="80px" 
            bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" 
            position="relative"
          >
            <Flex 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              bg="white" 
              borderRadius="full" 
              w="50px" 
              h="50px" 
              justifyContent="center" 
              alignItems="center"
              boxShadow="md"
            >
              <Icon as={FaPlayCircle} w={6} h={6} color="orange.500" />
            </Flex>
          </Box>
          
          <ModalHeader textAlign="center" pt={8}>How to: {videoModal.exerciseName}</ModalHeader>
          <ModalCloseButton top="85px" onClick={() => setVideoModal({ ...videoModal, isOpen: false })} />
          <ModalBody pb={6} display="flex" flexDirection="column" alignItems="center">
            <Box w="100%" h="0" pb="56.25%" position="relative" borderRadius="md" overflow="hidden" boxShadow="md">
              <iframe
                src={videoModal.videoUrl}
                title={videoModal.exerciseName}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* --- End Exercise Video Modal --- */}
    </Container>
  )
} 