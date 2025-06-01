/**
 * Reusable modal component for run time input
 */

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Box,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import type { MeetEvent } from '../../types/meetTypes';

interface RunTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: MeetEvent | null;
  runTime: string;
  setRunTime: (value: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export const RunTimeModal: React.FC<RunTimeModalProps> = ({
  isOpen,
  onClose,
  event,
  runTime,
  setRunTime,
  onSubmit,
  isSubmitting
}) => {
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const runTimeBoxBg = useColorModeValue('blue.50', 'blue.900');
  const runTimeBoxText = useColorModeValue('blue.700', 'blue.200');

  const handleSubmit = async () => {
    await onSubmit();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && runTime.trim()) {
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {event?.run_time ? 'Update' : 'Add'} Run Time
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Event: {event?.event_name}
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                Enter your completion time for this event
              </Text>
            </Box>
            
            <FormControl isRequired>
              <FormLabel>Run Time</FormLabel>
              <Input
                placeholder="e.g., 10.85, 2:05.43, 15:30.12"
                value={runTime}
                onChange={(e) => setRunTime(e.target.value)}
                onKeyPress={handleKeyPress}
                size="lg"
                autoFocus
              />
              <Text fontSize="xs" color={mutedTextColor} mt={1}>
                Format examples: 10.85 (seconds), 2:05.43 (minutes:seconds), 15:30.12 (minutes:seconds)
              </Text>
            </FormControl>
            
            {event?.run_time && (
              <Box 
                p={3} 
                bg={runTimeBoxBg} 
                borderRadius="md" 
                borderLeft="4px solid" 
                borderLeftColor="blue.400"
              >
                <Text fontSize="sm" color={runTimeBoxText}>
                  <strong>Current time:</strong> {event.run_time}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!runTime.trim()}
          >
            {event?.run_time ? 'Update' : 'Save'} Time
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 