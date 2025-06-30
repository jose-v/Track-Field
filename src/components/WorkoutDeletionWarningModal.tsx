import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Spinner,
  Box
} from '@chakra-ui/react';
import { FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

interface WorkoutDeletionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  monthlyPlans: { id: string; name: string }[];
  onRemoveFromPlans: () => void;
  onProceedWithDeletion: () => void;
  isRemoving: boolean;
}

export const WorkoutDeletionWarningModal: React.FC<WorkoutDeletionWarningModalProps> = ({
  isOpen,
  onClose,
  workoutName,
  monthlyPlans,
  onRemoveFromPlans,
  onProceedWithDeletion,
  isRemoving
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!isRemoving}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={headingColor}>
          <HStack spacing={3}>
            <FaExclamationTriangle color="orange" />
            <Text>Cannot Delete Workout</Text>
          </HStack>
        </ModalHeader>
        {!isRemoving && <ModalCloseButton />}
        
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Warning Alert */}
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium" mb={1}>
                  Workout is currently in use
                </Text>
                <Text fontSize="sm">
                  The workout "<strong>{workoutName}</strong>" cannot be deleted because it's being used in the following monthly plans.
                </Text>
              </Box>
            </Alert>

            {/* Monthly Plans List */}
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              p={4}
            >
              <Text fontWeight="medium" color={headingColor} mb={3}>
                Used in {monthlyPlans.length} Monthly Plan{monthlyPlans.length !== 1 ? 's' : ''}:
              </Text>
              <List spacing={2}>
                {monthlyPlans.map((plan) => (
                  <ListItem key={plan.id} display="flex" alignItems="center">
                    <ListIcon as={FaCalendarAlt} color="blue.500" />
                    <Text color={textColor}>{plan.name}</Text>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Instructions */}
            <Text color={textColor} fontSize="sm">
              To delete this workout, you must first remove it from the monthly plans above. 
              This will replace the workout with rest weeks in those plans.
            </Text>

            {/* Action Buttons */}
            <VStack spacing={3} pt={2}>
              <Button
                colorScheme="orange"
                onClick={onRemoveFromPlans}
                isLoading={isRemoving}
                loadingText="Removing from Plans..."
                isDisabled={isRemoving}
                width="100%"
                leftIcon={isRemoving ? <Spinner size="sm" /> : undefined}
              >
                Remove from Monthly Plans
              </Button>
              
              <HStack width="100%" spacing={3}>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  isDisabled={isRemoving}
                  flex={1}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={onProceedWithDeletion}
                  isDisabled={monthlyPlans.length > 0 || isRemoving}
                  flex={1}
                >
                  Delete Workout
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 