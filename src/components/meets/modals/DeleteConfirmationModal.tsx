/**
 * Modal component for confirming meet deletion
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
  Button,
  Text
} from '@chakra-ui/react';
import { useMyMeets } from '../../../hooks/meets';
import type { TrackMeet } from '../../../types/meetTypes';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meet: TrackMeet | null;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  meet
}) => {
  const { handleDeleteMeet } = useMyMeets();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirmDelete = async () => {
    if (!meet?.id) return;
    
    try {
      setIsDeleting(true);
      await handleDeleteMeet(meet.id);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Deletion</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Are you sure you want to delete "{meet?.name}"? This will also delete all events
            associated with this meet and cannot be undone.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose} isDisabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 