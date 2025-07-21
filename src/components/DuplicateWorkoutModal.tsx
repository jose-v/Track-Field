import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  useColorModeValue,
  useToast,
  Badge,
  Box,
  Divider
} from '@chakra-ui/react';
import { FaCopy } from 'react-icons/fa';
import { AssignmentService } from '../services/assignmentService';

interface DuplicateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: any; // For assignment cards
  workout?: any; // For workout cards
  onSuccess?: () => void;
  currentUserId?: string;
}

const DuplicateWorkoutModal: React.FC<DuplicateWorkoutModalProps> = ({
  isOpen,
  onClose,
  assignment,
  workout,
  onSuccess,
  currentUserId
}) => {
  const [newName, setNewName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Helper to determine if we're duplicating a template
  const isTemplate = workout?.is_template || false;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const baseName = assignment?.exercise_block?.workout_name || workout?.name || 'Workout';
      setNewName(`${baseName} - Copy`);
    } else {
      setNewName('');
      setIsDuplicating(false);
    }
  }, [isOpen, assignment, workout]);

  const handleDuplicate = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the duplicated workout',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsDuplicating(true);
    
    try {
      const assignmentService = new AssignmentService();
      
      if (assignment) {
        // Duplicating from assignment - create unassigned workout
        await assignmentService.duplicateAsWorkout(assignment.id, newName.trim());
        
        toast({
          title: 'Workout Duplicated',
          description: `"${newName.trim()}" has been created as an unassigned workout`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (workout) {
        // Duplicating from workout - create new unassigned workout
        await assignmentService.duplicateWorkoutAsNewWorkout(workout.id, newName.trim());
        
        toast({
          title: 'Workout Duplicated',
          description: `"${newName.trim()}" has been created as an unassigned workout`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error duplicating workout:', error);
      toast({
        title: 'Duplication Failed',
        description: 'There was an error duplicating the workout. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  // Get display data for the original workout
  const getWorkoutDisplayData = () => {
    if (assignment) {
      const exerciseBlock = assignment.exercise_block;
      return {
        name: exerciseBlock?.workout_name || 'Workout',
        type: exerciseBlock?.workout_type || 'Strength',
        duration: exerciseBlock?.estimated_duration || 'N/A',
        exerciseCount: exerciseBlock?.exercises?.length || 0,
        assignmentType: assignment.assignment_type
      };
    } else if (workout) {
      return {
        name: workout.name || 'Workout',
        type: workout.type || 'Strength',
        duration: workout.duration || 'N/A',
        exerciseCount: workout.exercises?.length || 0,
        assignmentType: workout.template_type || 'single'
      };
    }
    return null;
  };

  const displayData = getWorkoutDisplayData();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isTemplate ? 'Duplicate Template' : 'Duplicate Workout'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Original Workout Info */}
            {displayData && (
              <Box p={4} bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg">
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.500">
                    Original Workout
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {displayData.name}
                  </Text>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" size="sm">
                      {displayData.type.toUpperCase()}
                    </Badge>
                    <Badge colorScheme="purple" size="sm">
                      {displayData.assignmentType.toUpperCase()}
                    </Badge>
                  </HStack>
                  <HStack spacing={4}>
                    <Text fontSize="sm" color="gray.600">
                      Duration: {displayData.duration}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Exercises: {displayData.exerciseCount}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            )}

            <Divider />

            {/* New Workout Name */}
            <FormControl>
              <FormLabel>New Workout Name</FormLabel>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name for duplicated workout"
              />
              <FormHelperText>
                This will create a new unassigned workout that you can assign to athletes later.
              </FormHelperText>
            </FormControl>

            {/* Action Buttons */}
            <HStack spacing={3} justify="flex-end">
              <Button
                onClick={onClose}
                variant="ghost"
                disabled={isDuplicating}
              >
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                leftIcon={<FaCopy />}
                onClick={handleDuplicate}
                isLoading={isDuplicating}
                loadingText="Duplicating..."
              >
                {isTemplate ? 'Duplicate Template' : 'Duplicate Workout'}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DuplicateWorkoutModal; 