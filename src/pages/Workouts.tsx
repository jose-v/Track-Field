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
} from '@chakra-ui/react'
import { useState } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'

export function Workouts() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { workouts, createWorkout } = useWorkouts()
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: '',
    date: '',
    duration: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createWorkout(newWorkout)
    onClose()
    setNewWorkout({
      name: '',
      type: '',
      date: '',
      duration: '',
      notes: '',
    })
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
        <VStack spacing={4} align="stretch">
          {workouts.map((workout) => (
            <Box
              key={workout.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="white"
            >
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md">{workout.name}</Heading>
                  <Text color="gray.600">
                    {workout.type} • {workout.duration}
                  </Text>
                  <Text fontSize="sm">{workout.date}</Text>
                </VStack>
                <Text>{workout.notes}</Text>
              </HStack>
            </Box>
          ))}
        </VStack>
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
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={newWorkout.notes}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, notes: e.target.value })
                    }
                    placeholder="Add any notes about your workout..."
                  />
                </FormControl>

                <Button type="submit" colorScheme="brand" width="full">
                  Save Workout
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
} 