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
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { CheckIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'

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
  const [completed, setCompleted] = useState<{ [workoutId: string]: Set<number> }>({})
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [editModal, setEditModal] = useState({ isOpen: false, workout: null as any })

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
    setCompleted(prev => {
      const prevSet = prev[workoutId] ? new Set(prev[workoutId]) : new Set()
      prevSet.add(exIdx)
      return { ...prev, [workoutId]: prevSet }
    })
    const nextIdx = exIdx + 1
    if (nextIdx < execModal.workout.exercises.length) {
      setExecModal({
        ...execModal,
        exerciseIdx: nextIdx,
        timer: 0,
        running: true,
      })
    } else {
      setExecModal({
        isOpen: false,
        workout: null,
        exerciseIdx: 0,
        timer: 0,
        running: false,
      })
    }
  }

  return (
    <Box py={8}>
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
            const completedCount = completed[workout.id]?.size || 0;
            const totalCount = workout.exercises?.length || 0;
            return (
              <Box
                key={workout.id}
                p={4}
                borderWidth={1}
                borderRadius="md"
                bg="white"
                h="100%"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <VStack align="start" spacing={1} flex={1}>
                  <HStack w="100%" justify="space-between">
                    <Heading size="md">{workout.name}</Heading>
                    <HStack>
                      <Tooltip label="Edit" aria-label="Edit">
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="yellow"
                          variant="ghost"
                          onClick={() => setEditModal({ isOpen: true, workout })}
                          aria-label="Edit"
                        />
                      </Tooltip>
                      <Tooltip label="Delete" aria-label="Delete">
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => deleteWorkout(workout.id)}
                          aria-label="Delete"
                        />
                      </Tooltip>
                    </HStack>
                  </HStack>
                  <Text color="gray.600">
                    {workout.type} • {workout.duration}
                  </Text>
                  <Text fontSize="sm">{workout.date}</Text>
                  <Text fontSize="sm">{workout.time ? `Time: ${workout.time}` : 'Time: Not set'}</Text>
                  <Text>{workout.notes}</Text>
                  {/* Progress Bar */}
                  {totalCount > 0 && (
                    <Box w="100%" mt={2} mb={1}>
                      <Progress value={(completedCount / totalCount) * 100} size="sm" colorScheme="blue" borderRadius="md" />
                      <Text fontSize="xs" textAlign="center" mt={1}>
                        {`Exercise ${Math.min(completedCount + 1, totalCount)} of ${totalCount}`}
                      </Text>
                    </Box>
                  )}
                  {/* --- Exercises List --- */}
                  {workout.exercises && workout.exercises.length > 0 && (
                    <VStack align="start" mt={2}>
                      <Text fontWeight="bold">Exercises:</Text>
                      {workout.exercises.map((ex: any, idx: number) => (
                        <HStack key={idx} spacing={2}>
                          <Text>
                            {ex.name} ({ex.sets} x {ex.reps})
                          </Text>
                          {completed[workout.id]?.has(idx) && (
                            <CheckIcon color="green.400" />
                          )}
                          <Button
                            size="xs"
                            colorScheme="blue"
                            onClick={() => handleGo(workout, idx)}
                          >
                            GO
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                  {/* --- End Exercises List --- */}
                </VStack>
              </Box>
            )
          })}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Workout</ModalHeader>
          <ModalCloseButton />
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

                <Button type="submit" colorScheme="brand" width="full">
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
        <ModalContent>
          <ModalHeader>Exercise Execution</ModalHeader>
          <ModalCloseButton onClick={() => setExecModal({ ...execModal, isOpen: false, running: false })} />
          <ModalBody pb={6}>
            {execModal.workout && (
              <VStack spacing={4} align="center">
                <Heading size="md">
                  {execModal.workout.exercises[execModal.exerciseIdx]?.name}
                </Heading>
                <Text>
                  Sets: {execModal.workout.exercises[execModal.exerciseIdx]?.sets} &nbsp;|
                  Reps: {execModal.workout.exercises[execModal.exerciseIdx]?.reps}
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {Math.floor(execModal.timer / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(execModal.timer % 60).toString().padStart(2, '0')}
                </Text>
                <HStack>
                  {execModal.running ? (
                    <Button colorScheme="yellow" onClick={() => setExecModal({ ...execModal, running: false })}>
                      Stop
                    </Button>
                  ) : (
                    <Button colorScheme="blue" onClick={() => setExecModal({ ...execModal, running: true })}>
                      Start
                    </Button>
                  )}
                  <Button colorScheme="green" size="lg" onClick={handleDone}>
                    {execModal.exerciseIdx + 1 < execModal.workout.exercises.length ? 'DONE (Next)' : 'DONE (Finish)'}
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* --- End Exercise Execution Modal --- */}

      {/* Edit Workout Modal */}
      <Modal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, workout: null })}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Workout</ModalHeader>
          <ModalCloseButton />
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
                  <Button type="submit" colorScheme="brand" width="full">
                    Save Changes
                  </Button>
                </VStack>
              </form>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
} 